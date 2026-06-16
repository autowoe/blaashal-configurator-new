"""Toon retrieval-scores per chunk voor een query. Gebruik voor diagnose."""

import math

from django.core.management.base import BaseCommand

from knowledge_base.models import KbChunk
from knowledge_base.rag import (
    HYBRID_BM25_WEIGHT,
    HYBRID_SEMANTIC_WEIGHT,
    bm25_score,
    compute_idf,
    embed_query,
    tokenize,
)


class Command(BaseCommand):
    help = 'Debug: toon top-N chunks + scores voor een query'

    def add_arguments(self, parser):
        parser.add_argument("query", type=str, help="De zoekopdracht")
        parser.add_argument("--top", type=int, default=20, help="Aantal resultaten")

    def handle(self, *args, **options):
        import numpy as np

        query = options["query"]
        top = options["top"]

        self.stdout.write(f'\nQuery: "{query}"\n')

        chunks = list(KbChunk.objects.select_related("document").all())
        total = len(chunks)
        self.stdout.write(f"Totaal chunks: {total}\n")

        emb_chunks = [c for c in chunks if c.embedding]
        self.stdout.write(f"Chunks met embedding: {len(emb_chunks)}\n\n")

        # BM25
        idf = compute_idf(chunks)
        avg_wc = sum(c.word_count for c in chunks) / max(len(chunks), 1)
        query_tokens = tokenize(query)
        self.stdout.write(f"Query tokens: {query_tokens}\n\n")

        bm25_raw = {
            c.id: bm25_score(query_tokens, c.term_frequencies, c.word_count, avg_wc, idf)
            for c in emb_chunks
        }
        max_bm25 = max(bm25_raw.values()) if bm25_raw else 1.0

        # Semantic
        query_emb = np.array(embed_query(query), dtype=np.float32)
        matrix = np.array([c.embedding for c in emb_chunks], dtype=np.float32)
        norms = np.linalg.norm(matrix, axis=1)
        query_norm = float(np.linalg.norm(query_emb))
        sem_scores = (matrix @ query_emb) / (norms * query_norm + 1e-8)

        results = []
        for idx, chunk in enumerate(emb_chunks):
            b = bm25_raw[chunk.id]
            b_norm = b / max_bm25 if max_bm25 > 0 else 0.0
            s = float(sem_scores[idx])
            hybrid = HYBRID_SEMANTIC_WEIGHT * s + HYBRID_BM25_WEIGHT * b_norm
            results.append((hybrid, s, b, chunk))

        results.sort(key=lambda x: x[0], reverse=True)

        self.stdout.write(f"{'#':<4} {'Hybrid':>7} {'Sem':>7} {'BM25':>7}  Document — chunk\n")
        self.stdout.write("-" * 80 + "\n")
        for rank, (hybrid, sem, bm25_val, chunk) in enumerate(results[:top], 1):
            doc_name = chunk.document.name[:45]
            preview = chunk.text[:60].replace("\n", " ").replace("\t", " ")
            self.stdout.write(
                f"{rank:<4} {hybrid:>7.4f} {sem:>7.4f} {bm25_val:>7.3f}  {doc_name}\n"
                f"     └ {preview}…\n"
            )

        # Zoek de Excel specifiek
        self.stdout.write("\n--- Excel-chunks in ranking ---\n")
        for rank, (hybrid, sem, bm25_val, chunk) in enumerate(results, 1):
            if chunk.document.file_ext in (".xlsx", ".xls", ".xlsm"):
                self.stdout.write(
                    f"  Rank {rank}: hybrid={hybrid:.4f} sem={sem:.4f} bm25={bm25_val:.3f} "
                    f"— {chunk.document.name} [{chunk.chunk_label}]\n"
                )
