from __future__ import annotations

import json
import os
import threading
import time
import uuid
from dataclasses import dataclass
from typing import AsyncGenerator

import redis as redis_lib
import tiktoken
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel

from semantic_cache import SemanticCache
from semantic_cache.backends import RedisBackend
from semantic_cache.embedders import OpenAIEmbedder

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
REDIS_URL      = os.environ["REDIS_URL"]
INDEX_NAME     = "semantic_cache"

EMBEDDING_MODEL    = "text-embedding-3-small"
CHAT_MODEL         = "gpt-4o-mini"
EMBED_DIM          = 1536
THRESHOLD          = 0.90
EMBED_PRICE_PER_1M = 0.02
INPUT_PRICE_PER_1M = 0.150
OUTPUT_PRICE_PER_1M = 0.600

oai          = OpenAI(api_key=OPENAI_API_KEY)
enc          = tiktoken.encoding_for_model("gpt-4o")
redis_client = redis_lib.from_url(REDIS_URL, decode_responses=True)

embedder = OpenAIEmbedder(api_key=OPENAI_API_KEY, model=EMBEDDING_MODEL)
backend  = RedisBackend(url=REDIS_URL, vector_dim=EMBED_DIM, index_name=INDEX_NAME)

SYSTEM_PROMPT = "You are a helpful assistant. Answer concisely in 2-3 sentences."


# ── Session stats ──────────────────────────────────────────────────

@dataclass
class Stats:
    total: int = 0
    hits: int = 0
    latency_saved_ms: float = 0.0
    cost_saved: float = 0.0
    avg_miss_latency_ms: float = 1500.0


_stats = Stats()
_lock  = threading.Lock()


# ── Cost helpers ───────────────────────────────────────────────────

def embed_cost(text: str) -> float:
    return (len(enc.encode(text)) / 1_000_000) * EMBED_PRICE_PER_1M

def llm_cost(prompt: str, response: str) -> float:
    i = len(enc.encode(prompt))
    o = len(enc.encode(response))
    return (i / 1_000_000) * INPUT_PRICE_PER_1M + (o / 1_000_000) * OUTPUT_PRICE_PER_1M

def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# ──────────────────────────────────────────────────────────────────
# PATTERN 1 — @cache decorator
#
# The simplest way to use semantic-cache-lib: just decorate any
# function that calls an LLM. The library embeds the first argument,
# searches the cache, and only calls the underlying function on a miss.
#
# Works on both sync and async functions. No other changes needed.
# ──────────────────────────────────────────────────────────────────

cache = SemanticCache(
    embedder=embedder,
    backend=backend,
    threshold=THRESHOLD,
    ttl=86400,
)

@cache
def ask_llm(prompt: str) -> str:
    """Standard LLM call — @cache handles embedding, search, and storage."""
    resp = oai.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return resp.choices[0].message.content


# ──────────────────────────────────────────────────────────────────
# PATTERN 2 — Manual probe (used by the streaming SSE endpoint)
#
# The decorator is perfect for standard request/response flows.
# When you need token-by-token streaming on a cache miss, probe the
# cache manually: check for a hit first, then stream the LLM call
# yourself on a miss. The library's backend and embedder are still
# doing all the heavy lifting — just without the decorator wrapper.
# ──────────────────────────────────────────────────────────────────

async def _stream_query(q: str) -> AsyncGenerator[str, None]:
    yield sse({"type": "status", "message": "Embedding query…"})
    t0 = time.time()

    try:
        vector = embedder.embed(q)
        e_cost = embed_cost(q)
        yield sse({"type": "status", "message": "Searching cache…"})
        candidates = backend.search(vector, top_k=1)
    except Exception as ex:
        yield sse({"type": "error", "message": str(ex)})
        return

    if candidates and candidates[0][1] >= THRESHOLD:
        # ── Cache HIT ──────────────────────────────────────────────
        # Equivalent to what @cache returns when it finds a match.
        cached_response, similarity = candidates[0]
        latency_ms   = (time.time() - t0) * 1000
        cost_avoided = llm_cost(SYSTEM_PROMPT + q, cached_response)

        with _lock:
            _stats.total += 1
            _stats.hits  += 1
            _stats.latency_saved_ms += max(0.0, _stats.avg_miss_latency_ms - latency_ms)
            _stats.cost_saved       += cost_avoided

        cache._tracker.record_hit(similarity)

        yield sse({
            "type":         "hit",
            "response":     cached_response,
            "similarity":   round(similarity, 4),
            "latency_ms":   round(latency_ms),
            "cost":         round(e_cost, 6),
            "cost_avoided": round(cost_avoided, 6),
        })

    else:
        # ── Cache MISS — stream tokens, then store ─────────────────
        # @cache would call ask_llm() here and store the result,
        # but without streaming. We do the same steps manually so
        # the client sees tokens as they arrive.
        yield sse({"type": "status", "message": "Cache miss — calling GPT-4o-mini…"})

        try:
            stream_resp = oai.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": q},
                ],
                max_tokens=300,
                stream=True,
            )

            full_response = ""
            for chunk in stream_resp:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_response += token
                    yield sse({"type": "token", "token": token,
                               "elapsed_ms": round((time.time() - t0) * 1000)})

        except Exception as ex:
            yield sse({"type": "error", "message": str(ex)})
            return

        latency_ms = (time.time() - t0) * 1000
        total_cost = e_cost + llm_cost(SYSTEM_PROMPT + q, full_response)

        # Store — same thing @cache does internally on a miss
        backend.store(key=str(uuid.uuid4()), vector=vector,
                      response=full_response, ttl=86400)
        cache._tracker.record_miss()

        with _lock:
            _stats.total += 1
            _stats.avg_miss_latency_ms = (
                0.8 * _stats.avg_miss_latency_ms + 0.2 * latency_ms
            )

        yield sse({
            "type":       "miss",
            "response":   full_response,
            "latency_ms": round(latency_ms),
            "cost":       round(total_cost, 6),
        })

    yield sse({"type": "done"})


# ── FastAPI ────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str


@app.post("/api/query")
async def query_stream(req: QueryRequest):
    """Streaming SSE endpoint — Pattern 2 (manual probe for token streaming)."""
    q = req.query.strip()
    if not q:
        async def _err():
            yield sse({"type": "error", "message": "Empty query"})
        return StreamingResponse(_err(), media_type="text/event-stream")

    return StreamingResponse(_stream_query(q), media_type="text/event-stream")


@app.post("/api/query/simple")
def query_simple(req: QueryRequest):
    """
    Non-streaming endpoint — Pattern 1 (@cache decorator).

    ask_llm() is decorated with @cache. Calling it is all you need:
    the library handles embedding, cache lookup, LLM fallback, and storage.
    """
    q = req.query.strip()
    if not q:
        return {"error": "Empty query"}

    t0       = time.time()
    response = ask_llm(q)          # ← one line; @cache does everything
    latency  = round((time.time() - t0) * 1000)

    lib_stats = cache.stats()
    return {
        "response":   response,
        "latency_ms": latency,
        "cache_stats": {
            "hits":     lib_stats.hits,
            "misses":   lib_stats.misses,
            "hit_rate": f"{lib_stats.hit_rate:.0%}",
        },
    }


@app.get("/api/entries")
def get_entries():
    """Return up to 10 existing cache entries from Redis."""
    try:
        keys    = redis_client.keys(f"{INDEX_NAME}:*")
        entries = []
        for key in keys[:10]:
            try:
                # Use hget for the specific field — hgetall fails because
                # the vector field contains raw binary bytes (not valid UTF-8)
                response = redis_client.hget(key, "response")
                if response:
                    entries.append({"id": key, "response": response})
            except Exception:
                continue
        return {"entries": entries}
    except Exception as e:
        return {"entries": [], "error": str(e)}


@app.get("/api/stats")
def get_stats():
    with _lock:
        s = _stats
        return {
            "total":            s.total,
            "hits":             s.hits,
            "misses":           s.total - s.hits,
            "hit_rate":         round(s.hits / s.total, 4) if s.total else 0,
            "latency_saved_ms": round(s.latency_saved_ms),
            "cost_saved":       round(s.cost_saved, 6),
        }


@app.delete("/api/reset")
def reset():
    global _stats
    with _lock:
        _stats = Stats()
    cache.reset_stats()
    return {"ok": True}


# Serve React build in production
_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
