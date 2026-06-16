"""Genereer embeddings voor bestaande KbChunks die nog geen embedding hebben."""

from django.core.management.base import BaseCommand

from knowledge_base.models import KbChunk
from knowledge_base.rag import EMBED_BATCH, embed_texts


class Command(BaseCommand):
    help = "Embed bestaande chunks via Voyage AI (run na het instellen van VOYAGE_API_KEY)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Herembedden ook al hebben chunks al een embedding",
        )

    def handle(self, *args, **options):
        qs = KbChunk.objects.all() if options["force"] else KbChunk.objects.filter(embedding=[])
        chunks = list(qs)
        total = len(chunks)

        if total == 0:
            self.stdout.write("Alle chunks hebben al een embedding.")
            return

        self.stdout.write(f"{total} chunks embedden in batches van {EMBED_BATCH}...")

        for i in range(0, total, EMBED_BATCH):
            batch = chunks[i : i + EMBED_BATCH]
            texts = [c.text for c in batch]
            embeddings = embed_texts(texts)
            for chunk, emb in zip(batch, embeddings):
                chunk.embedding = emb
            KbChunk.objects.bulk_update(batch, ["embedding"])
            done = min(i + EMBED_BATCH, total)
            self.stdout.write(f"  {done}/{total} klaar")

        self.stdout.write(self.style.SUCCESS("Embeddings gegenereerd."))
