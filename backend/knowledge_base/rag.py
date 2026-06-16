"""Hybrid RAG: BM25 kandidaatselectie + semantische herranking via Voyage AI."""

import math
import os
import re

CHUNK_WORDS = 400
CHUNK_OVERLAP = 40
ROWS_PER_CHUNK = 25
RETRIEVAL_K = 8
SCORE_THRESHOLD = 1.0

VOYAGE_MODEL = "voyage-3"
EMBED_BATCH = 128
SEMANTIC_CANDIDATE_K = 50
HYBRID_SEMANTIC_WEIGHT = 0.7
HYBRID_BM25_WEIGHT = 0.3

STOPWORDS = {
    # NL
    "de", "het", "een", "en", "van", "in", "is", "dat", "op", "te", "zijn",
    "voor", "met", "aan", "er", "maar", "als", "bij", "om", "uit", "ook",
    "nog", "tot", "door", "we", "ze", "ik", "je", "hij", "of", "dit", "die",
    "worden", "heeft", "hebben", "werd", "waren", "kan", "moet", "niet", "zo",
    "al", "toch", "meer", "nu", "hier", "dan", "wat", "wie", "alle", "naar",
    "over", "welke",
    # EN
    "the", "a", "an", "and", "or", "in", "is", "it", "to", "for", "with",
    "on", "at", "by", "from", "not", "be", "are", "was", "were", "has",
    "have", "had", "this", "that", "these", "those", "will", "which",
    # DE
    "der", "die", "das", "ein", "eine", "und", "oder", "ist", "von", "im",
    "an", "am", "bei", "mit", "auf", "fur", "zu", "nach", "als", "auch",
    "sich", "aus", "um", "so", "noch", "werden", "sind", "hat", "haben",
    "war", "wurde", "kann", "dem", "den", "des", "einer", "eines", "nicht",
    "mehr",
}


# ── Tokenization ──────────────────────────────────────────────────────────────

def tokenize(text: str) -> list[str]:
    text = (
        text.lower()
        .replace("ä", "a")
        .replace("ö", "o")
        .replace("ü", "u")
        .replace("ß", "ss")
    )
    tokens = re.findall(r"[a-z0-9]{2,}", text)
    return [t for t in tokens if t not in STOPWORDS]


def build_term_freq(tokens: list[str]) -> dict[str, int]:
    freq: dict[str, int] = {}
    for t in tokens:
        freq[t] = freq.get(t, 0) + 1
    return freq


# ── Chunking ─────────────────────────────────────────────────────────────────

def chunk_text(text: str, doc_name: str) -> list[dict]:
    """Return list of chunk dicts with text, label, term_frequencies, word_count."""
    words = text.split()
    if not words:
        return []

    chunks = []
    step = CHUNK_WORDS - CHUNK_OVERLAP
    i = 0
    while i < len(words):
        chunk_words = words[i : i + CHUNK_WORDS]
        chunk_text_str = " ".join(chunk_words)
        tokens = tokenize(chunk_text_str)
        name_tokens = tokenize(doc_name)
        for t in name_tokens:
            tokens.extend([t] * 3)

        label = f"Woorden {i + 1}–{i + len(chunk_words)}"
        chunks.append(
            {
                "chunk_index": len(chunks),
                "chunk_label": label,
                "text": chunk_text_str,
                "term_frequencies": build_term_freq(tokens),
                "word_count": len(chunk_words),
            }
        )
        if i + CHUNK_WORDS >= len(words):
            break
        i += step

    return chunks


# ── Embeddings via Voyage AI ──────────────────────────────────────────────────

def _voyage_client():
    import voyageai
    return voyageai.Client(api_key=os.environ["VOYAGE_API_KEY"])


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of document texts in batches. Returns list of vectors."""
    client = _voyage_client()
    all_embeddings: list[list[float]] = []
    for i in range(0, len(texts), EMBED_BATCH):
        batch = texts[i : i + EMBED_BATCH]
        result = client.embed(batch, model=VOYAGE_MODEL, input_type="document")
        all_embeddings.extend(result.embeddings)
    return all_embeddings


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    client = _voyage_client()
    result = client.embed([query], model=VOYAGE_MODEL, input_type="query")
    return result.embeddings[0]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0


# ── BM25 ──────────────────────────────────────────────────────────────────────

def compute_idf(all_chunks) -> dict[str, float]:
    n = len(all_chunks)
    if n == 0:
        return {}
    df: dict[str, int] = {}
    for chunk in all_chunks:
        tf = (
            chunk.term_frequencies
            if hasattr(chunk, "term_frequencies")
            else chunk.get("term_frequencies", {})
        )
        for term in tf:
            df[term] = df.get(term, 0) + 1
    return {term: math.log((n - f + 0.5) / (f + 0.5) + 1) for term, f in df.items()}


def bm25_score(
    query_tokens: list[str],
    chunk_tf: dict[str, int],
    word_count: int,
    avg_word_count: float,
    idf: dict[str, float],
    k1: float = 1.5,
    b: float = 0.75,
) -> float:
    score = 0.0
    for term in query_tokens:
        if term not in idf or term not in chunk_tf:
            continue
        tf = chunk_tf[term]
        norm = k1 * (1 - b + b * word_count / max(avg_word_count, 1))
        score += idf[term] * (tf * (k1 + 1)) / (tf + norm)
    return score


# ── Hybrid retrieval ──────────────────────────────────────────────────────────

def retrieve(query: str, chunks_qs, top_k: int = RETRIEVAL_K) -> list:
    """
    Hybrid retrieval:
    1. BM25 over all chunks (embedding column deferred) to find candidates.
    2. Load embeddings only for the top candidates.
    3. Semantic reranking with Voyage AI query embedding.
    Falls back to pure BM25 if no embeddings exist yet.
    """
    # Phase 1: BM25 — load without embedding column for speed
    chunks_light = list(
        chunks_qs.defer("embedding").select_related("document__folder")
    )
    if not chunks_light:
        return []

    idf = compute_idf(chunks_light)
    avg_wc = sum(c.word_count for c in chunks_light) / len(chunks_light)
    query_tokens = tokenize(query)

    bm25_scored = sorted(
        [
            (
                bm25_score(query_tokens, c.term_frequencies, c.word_count, avg_wc, idf),
                c,
            )
            for c in chunks_light
        ],
        key=lambda x: x[0],
        reverse=True,
    )

    # Phase 2: select candidates for semantic reranking
    has_bm25_signal = bm25_scored and bm25_scored[0][0] >= SCORE_THRESHOLD
    if has_bm25_signal:
        # Rerank the top BM25 candidates semantically
        candidate_pairs = bm25_scored[:SEMANTIC_CANDIDATE_K]
    else:
        # No keyword signal — use all chunks for pure semantic search
        candidate_pairs = bm25_scored

    candidate_ids = [c.id for _, c in candidate_pairs]

    # Load embeddings for candidates only
    chunks_with_emb = list(
        chunks_qs.filter(id__in=candidate_ids).select_related("document__folder")
    )
    has_embeddings = any(bool(c.embedding) for c in chunks_with_emb)

    if not has_embeddings:
        # No embeddings yet — pure BM25 fallback
        return [c for score, c in bm25_scored[:top_k] if score >= SCORE_THRESHOLD]

    # Phase 3: semantic reranking
    query_emb = embed_query(query)
    max_bm25 = candidate_pairs[0][0] if candidate_pairs[0][0] > 0 else 1.0
    id_to_bm25 = {c.id: score for score, c in candidate_pairs}

    combined = []
    for chunk in chunks_with_emb:
        bm25_norm = id_to_bm25.get(chunk.id, 0.0) / max_bm25
        sem = cosine_similarity(query_emb, chunk.embedding) if chunk.embedding else 0.0
        score = HYBRID_SEMANTIC_WEIGHT * sem + HYBRID_BM25_WEIGHT * bm25_norm
        combined.append((score, chunk))

    combined.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in combined[:top_k]]
