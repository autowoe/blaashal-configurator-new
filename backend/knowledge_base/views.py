import os
import re

import anthropic
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.response import Response

from knowledge_base.extraction import extract_text
from knowledge_base.models import KbChunk, KbDocument, KbFolder, KbMessage, KbSession
from knowledge_base.rag import chunk_text, embed_texts, retrieve, tokenize
from knowledge_base.serializers import (
    KbDocumentSerializer,
    KbDocumentUploadSerializer,
    KbFolderSerializer,
    KbSessionDetailSerializer,
    KbSessionSerializer,
)

MAX_DOC_CHARS = 80_000


def _safe_embed(texts: list[str]) -> list[list[float]]:
    """Embed texts; returns empty list if VOYAGE_API_KEY is missing or call fails."""
    if not os.environ.get("VOYAGE_API_KEY"):
        return []
    try:
        return embed_texts(texts)
    except Exception:
        return []


def _auto_title(question: str) -> str:
    words = question.split()[:8]
    return " ".join(words) + ("…" if len(question.split()) > 8 else "")


class KbFolderViewSet(viewsets.ModelViewSet):
    queryset = KbFolder.objects.all().order_by("name")
    serializer_class = KbFolderSerializer


class KbDocumentViewSet(viewsets.ModelViewSet):
    queryset = KbDocument.objects.all().order_by("-created_at")
    serializer_class = KbDocumentSerializer
    parser_classes = [MultiPartParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        folder_id = self.request.query_params.get("folder")
        if folder_id:
            qs = qs.filter(folder_id=folder_id)
        return qs

    def create(self, request, *args, **kwargs):
        upload_serializer = KbDocumentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)

        uploaded_file = upload_serializer.validated_data["file"]
        folder = upload_serializer.validated_data.get("folder")
        name = uploaded_file.name
        ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""

        text, doc_status = extract_text(uploaded_file, ext)

        if text and len(text) > MAX_DOC_CHARS:
            text = text[:MAX_DOC_CHARS] + f"\n[... ingekort tot {MAX_DOC_CHARS} tekens]"

        with transaction.atomic():
            doc = KbDocument(
                name=name,
                folder=folder,
                file_ext=ext,
                file_size=uploaded_file.size,
                extracted_text=text or "",
                status=doc_status,
                uploaded_by=request.user if request.user.is_authenticated else None,
            )
            # Reset file pointer after extraction read
            uploaded_file.seek(0)
            doc.file.save(name, uploaded_file, save=False)
            doc.save()

            if doc_status == "indexed" and text:
                chunks = chunk_text(text, name)
                embeddings = _safe_embed([f"Document: {name}\n{c['text']}" for c in chunks])
                KbChunk.objects.bulk_create(
                    [
                        KbChunk(
                            document=doc,
                            chunk_index=c["chunk_index"],
                            chunk_label=c["chunk_label"],
                            text=c["text"],
                            term_frequencies=c["term_frequencies"],
                            word_count=c["word_count"],
                            embedding=embeddings[i] if embeddings else [],
                        )
                        for i, c in enumerate(chunks)
                    ]
                )
                doc.chunk_count = len(chunks)
                doc.save(update_fields=["chunk_count"])

        serializer = KbDocumentSerializer(doc, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        doc = self.get_object()
        doc.file.delete(save=False)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="reindex")
    def reindex(self, request, pk=None):
        doc = self.get_object()
        if not doc.extracted_text:
            return Response(
                {"detail": "Geen tekst beschikbaar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc.chunks.all().delete()
        chunks = chunk_text(doc.extracted_text, doc.name)
        embeddings = _safe_embed([f"Document: {doc.name}\n{c['text']}" for c in chunks])
        KbChunk.objects.bulk_create(
            [
                KbChunk(
                    document=doc,
                    chunk_index=c["chunk_index"],
                    chunk_label=c["chunk_label"],
                    text=c["text"],
                    term_frequencies=c["term_frequencies"],
                    word_count=c["word_count"],
                    embedding=embeddings[i] if embeddings else [],
                )
                for i, c in enumerate(chunks)
            ]
        )
        doc.chunk_count = len(chunks)
        doc.status = "indexed"
        doc.save(update_fields=["chunk_count", "status"])

        serializer = KbDocumentSerializer(doc, context={"request": request})
        return Response(serializer.data)


class KbSessionViewSet(viewsets.ModelViewSet):
    serializer_class = KbSessionSerializer

    def get_queryset(self):
        return KbSession.objects.filter(
            created_by=self.request.user if self.request.user.is_authenticated else None
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return KbSessionDetailSerializer
        return KbSessionSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None
        )

    @action(detail=True, methods=["post"], url_path="chat")
    def chat(self, request, pk=None):
        session = self.get_object()
        question = (request.data.get("question") or "").strip()
        if not question:
            return Response(
                {"detail": "Vraag is vereist."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Auto-title on first message
        if not session.title and not session.messages.exists():
            session.title = _auto_title(question)
            session.save(update_fields=["title"])

        # Rewrite query for retrieval so synonym mismatches don't bury relevant docs
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        search_query = _rewrite_query_for_retrieval(question, client)

        # Retrieve relevant chunks
        all_chunks = KbChunk.objects.all()
        relevant = retrieve(search_query, all_chunks)

        # Build system prompt
        system_prompt = _build_system_prompt(relevant)

        # Build message history (last 20 messages to stay within context)
        history = list(session.messages.order_by("-created_at")[:20])[::-1]
        messages = [{"role": m.role, "content": m.content} for m in history]
        messages.append({"role": "user", "content": question})

        # Call Claude
        try:
            ai_response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                system=system_prompt,
                messages=messages,
            )
            answer = ai_response.content[0].text
        except Exception as exc:
            return Response(
                {"detail": f"AI-fout: {exc}"}, status=status.HTTP_502_BAD_GATEWAY
            )

        # Only include sources that Claude actually cited ([1], [2], …)
        cited_indices = {int(m) - 1 for m in re.findall(r"\[(\d+)\]", answer)}
        sources = [
            {
                "doc_name": c.document.name,
                "chunk_label": c.chunk_label,
                "doc_id": c.document_id,
            }
            for i, c in enumerate(relevant)
            if i in cited_indices
        ]

        # Save messages
        KbMessage.objects.create(session=session, role="user", content=question)
        KbMessage.objects.create(
            session=session, role="assistant", content=answer, sources=sources
        )

        return Response(
            {
                "answer": answer,
                "sources": sources,
                "session_title": session.title,
            }
        )


def _rewrite_query_for_retrieval(question: str, client) -> str:
    """Rewrite a natural language question into search-optimised keywords.

    Falls back to the original question if the API call fails.
    """
    try:
        result = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=60,
            system=(
                "Je bent een zoekopdracht-optimizer voor een kennisbank over luchthallen "
                "en bouwprojecten van Poly-Nederland. "
                "Herschrijf de gebruikersvraag als een compacte zoekzin van maximaal 10 woorden "
                "met domeinspecifieke trefwoorden en synoniemen (bijv. lijst→overzicht, "
                "projecten→klanten/opdrachten, recent→nieuw/datum). "
                "Geef alleen de zoekzin terug, geen uitleg."
            ),
            messages=[{"role": "user", "content": question}],
        )
        rewritten = result.content[0].text.strip()
        return rewritten or question
    except Exception:
        return question


def _build_system_prompt(chunks) -> str:
    base = (
        "Je bent een interne kennisassistent. "
        "Beantwoord vragen uitsluitend op basis van de onderstaande CONTEXT-fragmenten. "
        "Verzin geen informatie en gebruik geen externe kennis. "
        "Als er onvoldoende context is, zeg dat dan eerlijk. "
        "Antwoord altijd in het Nederlands.\n\n"
        "Structureer elk antwoord als volgt:\n"
        "**Antwoord:** [concreet antwoord, verwijs naar gebruikte fragmenten als [1], [2] etc.]\n"
        "**Gebaseerd op:** [documentnaam en locatie]\n"
        "**Onzekerheid:** [wat ontbreekt — weglaten als niet van toepassing]\n\n"
        "Belangrijk: verwijs in je antwoord altijd naar de fragmentnummers die je hebt gebruikt, bijvoorbeeld [1] of [2]. "
        "Gebruik alleen nummers van fragmenten die je daadwerkelijk hebt gebruikt.\n\n"
    )

    if not chunks:
        return base + "KENNISBANK: Geen relevante fragmenten gevonden voor deze vraag."

    context_lines = [
        f"CONTEXT ({len(chunks)} fragment{'en' if len(chunks) != 1 else ''}):"
    ]
    for i, chunk in enumerate(chunks, 1):
        context_lines.append(
            f"\n[{i}] BRON: {chunk.document.name} — {chunk.chunk_label}\n{chunk.text}"
        )

    return base + "\n".join(context_lines)
