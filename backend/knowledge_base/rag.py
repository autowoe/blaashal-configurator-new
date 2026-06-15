"""BM25-based RAG: chunking, indexing, retrieval."""

import math
import re

CHUNK_WORDS = 400
CHUNK_OVERLAP = 40
ROWS_PER_CHUNK = 25
RETRIEVAL_K = 8
SCORE_THRESHOLD = 1.0

STOPWORDS = {
    # NL
    "de",
    "het",
    "een",
    "en",
    "van",
    "in",
    "is",
    "dat",
    "op",
    "te",
    "zijn",
    "voor",
    "met",
    "aan",
    "er",
    "maar",
    "als",
    "bij",
    "om",
    "uit",
    "ook",
    "nog",
    "tot",
    "door",
    "we",
    "ze",
    "ik",
    "je",
    "hij",
    "of",
    "dit",
    "die",
    "worden",
    "heeft",
    "hebben",
    "werd",
    "waren",
    "kan",
    "moet",
    "niet",
    "zo",
    "al",
    "toch",
    "meer",
    "nu",
    "hier",
    "dan",
    "wat",
    "wie",
    "alle",
    "naar",
    "over",
    "welke",
    # EN
    "the",
    "a",
    "an",
    "and",
    "or",
    "in",
    "is",
    "it",
    "to",
    "for",
    "with",
    "on",
    "at",
    "by",
    "from",
    "not",
    "be",
    "are",
    "was",
    "were",
    "has",
    "have",
    "had",
    "this",
    "that",
    "these",
    "those",
    "will",
    "which",
    # DE
    "der",
    "die",
    "das",
    "ein",
    "eine",
    "und",
    "oder",
    "ist",
    "von",
    "im",
    "an",
    "am",
    "bei",
    "mit",
    "auf",
    "fur",
    "zu",
    "nach",
    "als",
    "auch",
    "sich",
    "aus",
    "um",
    "so",
    "noch",
    "werden",
    "sind",
    "hat",
    "haben",
    "war",
    "wurde",
    "kann",
    "dem",
    "den",
    "des",
    "einer",
    "eines",
    "nicht",
    "mehr",
}


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
        # Boost document name tokens
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


def compute_idf(all_chunks) -> dict[str, float]:
    """Compute IDF over all KbChunk objects (queryset or list)."""
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


def retrieve(query: str, chunks_qs, top_k: int = RETRIEVAL_K) -> list:
    """
    chunks_qs: Django QuerySet of KbChunk with select_related('document').
    Returns list of KbChunk objects sorted by BM25 score, above threshold.
    """
    chunks = list(chunks_qs.select_related("document__folder"))
    if not chunks:
        return []

    idf = compute_idf(chunks)
    avg_wc = sum(c.word_count for c in chunks) / len(chunks)
    query_tokens = tokenize(query)

    scored = []
    for chunk in chunks:
        score = bm25_score(
            query_tokens, chunk.term_frequencies, chunk.word_count, avg_wc, idf
        )
        if score >= SCORE_THRESHOLD:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]
