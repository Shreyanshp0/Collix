# RAG Implementation Plan

Group-isolated, context-aware AI assistant for the Collaborative Chat
Platform. This document describes the exact pipeline, storage format,
retrieval mechanics, and deployment considerations for the RAG system.

------------------------------------------------------------------------

## 1. Providers / Models

| Component | Choice | Notes |
|---|---|---|
| LLM (answer generation) | Groq — `llama-3.1-8b-instant` | Free tier, fast, sufficient for grounded Q&A |
| Embeddings | `all-MiniLM-L6-v2` via `@xenova/transformers` (Transformers.js) | Runs in-process in Node, CPU-only, no external API cost, 384-dim vectors |
| Vector store | FAISS (`faiss-node`), `IndexFlatIP` (cosine similarity via normalized vectors) | In-process, exact search, one index per group |
| Metadata store | MongoDB collection (`EmbeddingChunk`) | Same DB already used elsewhere in the app — no separate persistence mechanism |
| PDF parsing | `pdf-parse` or LangChain `PDFLoader` | Extracts raw text from uploaded PDFs |
| Text splitting | LangChain `RecursiveCharacterTextSplitter` | ~1000 char chunks, ~200 overlap |

**Why this stack:** everything runs inside the single Node/Express
backend — no separate Python microservice, no extra container, no
additional networking. Matches the "single backend service"
architecture in the SRS. A standard `t2.micro`/`t3.micro` EC2 instance
is sufficient — no GPU needed.

------------------------------------------------------------------------

## 2. What FAISS Is and Is Not

FAISS (Facebook AI Similarity Search) is a library for fast
nearest-neighbor search over vectors. It is **not** a database:

- It stores **only vectors**, each at a sequential integer position
  (0, 1, 2, ...) assigned in insertion order.
- It has **no concept of metadata** — no `groupId`, no text, no
  timestamps. That must be tracked separately by the application.
- `IndexFlatIP` (Inner Product) is used instead of `IndexFlatL2`: MiniLM
  embeddings are normalized before storage and before search, so inner
  product is equivalent to cosine similarity — this retrieves
  noticeably better semantic matches than raw L2 distance for this
  model. No training step is required (exact search, appropriate for a
  class project's scale: a handful of groups, each with dozens to a
  few hundred chunks).

**Consequence:** every add/search operation must be paired with a
metadata lookup, kept in sync by position. This is detailed in Section 4.

------------------------------------------------------------------------

## 3. What the AI Is Aware Of

Two complementary sources of context, both stored in the same
group-isolated vector store, distinguished by a `sourceType` field:

### a) Uploaded documents (long-term reference material)
- PDF → text → chunks → embeddings → FAISS
- Metadata: `groupId`, `documentId`, `sourceType: "document"`, `filename`, `page`

### b) Group chat history (long-term conversational memory)
- Every message, once saved, is embedded in the background (async, so
  it doesn't block chat delivery) and stored the same way
- Metadata: `groupId`, `messageId`, `sourceType: "message"`, `timestamp`

### c) Recent conversation (short-term continuity)
- The last N messages (e.g. 15–20) are pulled directly from MongoDB
  (NOT via vector search) and included in the prompt verbatim, so the
  AI has immediate continuity with what was just said

**Group isolation:** enforced structurally — one FAISS index per group,
stored as a separate file, so there is no query path that could ever
return another group's vectors.

------------------------------------------------------------------------

## 4. Exact Storage Design

Two parallel stores, kept in sync by position, per group:

### 4a. The FAISS index file
- Path: `vectorstores/{groupId}.index`
- Contains only the raw, L2-normalized vectors, in insertion order

### 4b. The metadata store — MongoDB collection `EmbeddingChunk`
Rather than a flat JSON file, metadata is stored in MongoDB (already
part of the stack), one document per vector, with `position` matching
the FAISS insertion order:

```json
{
  "position": 0,
  "text": "chunk text here...",
  "groupId": "665f1a...",
  "sourceType": "document",
  "sourceId": "665f22...",
  "filename": "strategy-notes.pdf",
  "page": 3,
  "timestamp": "2026-07-28T10:00:00Z"
}
```

Using MongoDB instead of a JSON file avoids manual file I/O for
metadata and keeps a single persistence technology across the app.

### 4c. Exact steps to add a new chunk (document chunk or chat message)

1. Generate the embedding: `const vector = await embed(text);`
   → returns a 384-length float array (MiniLM output)
2. **Normalize the vector** (L2 normalize) so inner product = cosine
   similarity: `const normalized = normalizeL2(vector);`
3. Get the next position: `const position = faissIndex.ntotal();`
4. Add the normalized vector to FAISS: `faissIndex.add(normalized);`
5. Insert the matching metadata document into MongoDB, using the same
   `position`, `filename`, and `page` where applicable
6. Persist the FAISS index to disk (Section 6):
   `faissIndex.write(`vectorstores/${groupId}.index`);`
7. **Update the in-memory cache immediately** (Section 6) — do not wait
   for the next lazy-load to pick up the new vector

**Critical invariant:** never delete or reorder entries independently
of the FAISS index — position alignment is the only link between a
vector and its metadata. If a chunk needs to be removed, rebuild both
stores together rather than editing one in place.

------------------------------------------------------------------------

## 5. Exact Retrieval Steps

Given a user's question in a specific group:

1. Load that group's index + metadata (from cache, or from disk/DB if
   not yet cached — see Section 6)
2. Embed the question and normalize it the same way as stored vectors:
   `const qVector = normalizeL2(await embed(question));`
3. Search FAISS for the k nearest vectors by inner product (k = 10
   recommended as an initial candidate set):
   ```js
   const { scores, positions } = faissIndex.search(qVector, 10);
   ```
4. **Apply a similarity threshold** — discard any result below a chosen
   cosine-similarity cutoff (e.g. 0.5, tune during testing):
   ```js
   const passing = positions.filter((_, i) => scores[i] >= THRESHOLD);
   ```
5. Take the top 4 of the passing results. **If none pass the
   threshold, skip the LLM call and return directly:**
   *"I couldn't find that information in this group's documents or
   previous conversations."*
6. Map the remaining positions to their metadata via MongoDB lookup
7. Separately, fetch the last N (15–20) raw messages for this group
   directly from MongoDB (chronological order, most recent last)
8. Assemble the prompt (Section 7) using both retrieved chunks and the
   recent raw messages
9. Send the assembled prompt to Groq (`llama-3.1-8b-instant`)
10. Return the generated answer to the user

------------------------------------------------------------------------

## 6. Persistence and Caching

- **Lazy load per group:** load a group's FAISS index into memory only
  on first access (not all groups at server startup), and cache it in
  memory afterward — keeps memory usage proportional to active groups,
  not total groups
- **On server start (for a given group's first request):**
  ```js
  const faissIndex = IndexFlatIP.read(`vectorstores/${groupId}.index`);
  ```
  Metadata is queried from MongoDB directly per lookup (no separate
  metadata cache file needed).
- **Cache invalidation:** the in-memory FAISS index for a group must be
  updated the moment a new vector is added for that group (Section 4c,
  step 7) — never rely solely on the next lazy-load, or a user could
  ask about a document they just uploaded and get a stale answer that
  ignores it.
- If a group has no existing index file yet (first document/message),
  create a new empty `IndexFlatIP` sized to the embedding dimension
  (384 for MiniLM)

------------------------------------------------------------------------

## 7. Prompt Template

```
You are the assistant for this group. Answer using ONLY the information
provided below.

- If the context is insufficient, say exactly: "I couldn't find that
  information in this group's documents or previous conversations."
- Never invent facts.
- Never use outside knowledge.
- Quote the source document or message where possible.

Recent conversation:
{last N raw messages, chronological}

Relevant context from group documents and past discussion:
{retrieved chunks text, joined}

Question: {user question}
```

This template enforces the no-hallucination requirement (SRS FR5) and
is what makes each group's AI feel grounded in that group's own
material rather than a generic assistant.

------------------------------------------------------------------------

## 8. File Layout

```
/server/services/rag/
  loader.js       → PDF → raw text
  splitter.js     → text → chunks
  embeddings.js   → text (chunk or message) → normalized 384-dim vector via MiniLM/Transformers.js
  vectorStore.js  → create/load/save/add/search FAISS index (IndexFlatIP) + cache management, per group
  metadataStore.js → MongoDB CRUD for EmbeddingChunk documents
  chatIndexer.js  → embeds + stores each new message in the background after it's saved
  qa.js           → orchestrates: retrieve chunks + threshold filter + fetch recent messages + assemble prompt + call Groq
```

------------------------------------------------------------------------

## 9. Deployment / Docker Considerations

- `faiss-node` is a **native C++ binary** (Node binding to Meta's FAISS
  library), not pure JavaScript.
- Prebuilt binaries cover Linux x64 — which matches a standard AWS EC2
  instance, so no issue there.
- **Docker base image:** use a non-slim Node image (e.g. `node:20`
  rather than `node:20-slim`/`alpine`) unless you've confirmed the slim
  image has the necessary build tools — slim/alpine images can lack
  `node-gyp`/C++ build essentials needed if `faiss-node` falls back to
  compiling from source.
- **Test this early** — during initial local Docker builds, not for
  the first time during the Days 5–6 CI/CD phase, since a broken native
  module install is a harder failure to debug under deadline pressure.

------------------------------------------------------------------------

## 10. Cost / Performance Notes

- Embeddings run locally (MiniLM/Transformers.js) — no per-call API
  cost, safe to embed every chat message without budget concerns
- Groq free tier is rate-limited per model (requests/min and
  requests/day, applied at the organization level) — sufficient for
  class-project demo traffic, but avoid rapid-fire repeated requests
  during a live demo
- Keep retrieval small (candidate set of 10, filtered down to top ~4 by
  threshold, plus last ~15–20 messages) to stay within the ~5–10s AI
  response target (SRS Section 4, Performance)

------------------------------------------------------------------------

## 11. Considered but Deferred to Capstone

These were suggested during review and are technically valid
improvements, but add complexity disproportionate to this project's
scale (a solo build, ~1 week, a handful of groups with modest document
counts). Revisit if/when this becomes the capstone project:

- **Alternative embedding models** (e.g. BGE-small, BGE-M3, Nomic
  Embed v2) — marginal retrieval-quality gains over MiniLM at the cost
  of slower CPU inference and larger memory footprint; not worth it at
  this scale.
- **Hybrid retrieval (BM25 keyword search + vector search, merged and
  deduplicated)** — valuable when exact terms, IDs, or filenames matter
  across large/diverse document sets; adds a second index and merge
  logic for a problem unlikely to surface in this project's demo.
- **Reranking stage** (retrieve top 10 → rerank → top 3–5) — solves
  noise in large candidate sets (thousands of chunks); at this scale
  (tens to low hundreds of chunks total) the threshold filter already
  achieves similar precision without an extra model/dependency.
- **Token-based chunking** (vs. character-based) — modest quality gain,
  requires adding a tokenizer dependency; character-based chunking is
  simpler and sufficient at current document sizes.
- **Extended document metadata** (`author`, `documentVersion`) — no
  current feature consumes these fields; add only if/when versioning
  or citation-by-author becomes an actual requirement.

------------------------------------------------------------------------

## 12. Other Open / Future Items

- Recency weighting (favor newer similar chunks over older ones) —
  cheap to add later since `timestamp` is already stored in metadata
- Swapping FAISS for a hosted vector DB if scale grows beyond a solo
  class project
- Extracting the RAG module into a separate service if the project
  grows into the capstone version
