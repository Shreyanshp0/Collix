# Backend Development Phases

Ordered so each phase only depends on what's already built — no phase
requires something from a later one. Matches the scope defined in
`Collaborative_Chat_Platform_SRS_v2.md`, `CHAT-IMPLEMENTATION.md`, and
`RAG-IMPLEMENTATION.md`.

------------------------------------------------------------------------

## Phase 1 — Schema & Authentication

**Goal:** users can register, log in, and get a valid JWT. Every other
phase depends on this working correctly.

**Build:**
- MongoDB connection setup (`config/database.js`)
- Models: `User`, `Group`, `Message`, `Document`, `EmbeddingChunk`
  (full schema up front, even though only `User`/`Group` are used yet
  — avoids reworking references later)
- `auth.service.js` — password hashing (bcrypt), JWT sign/verify helpers
- `auth.middleware.js` — JWT verification for protected REST routes
- Endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout` (client-side token discard is enough for JWT;
    only add a server-side step if you introduce refresh tokens later)

**Done when:** a user can register, log in, receive a JWT, and hit a
protected test route successfully with it (and get rejected without one).

------------------------------------------------------------------------

## Phase 2 — Group Logic

**Goal:** groups exist, can be created, browsed, joined, and populated
with members — all the plumbing chat and RAG will attach to.

**Build:**
- `group.controller.js` + `group.routes.js`
- Endpoints:
  - `POST /api/groups` — create group (creator auto-added to `members`)
  - `GET /api/groups` — list all groups (for the open browse/join list)
  - `GET /api/groups/mine` — list groups the current user belongs to
    (for the navbar group switcher)
  - `GET /api/groups/:id` — group details + members
  - `POST /api/groups/:id/join` — self-join (open list)
  - `POST /api/groups/:id/members` — creator manually adds a member
    (403 if requester isn't the creator)
  - `DELETE /api/groups/:id/leave`
  - `GET /api/users?search=` — user lookup by username, used by the
    creator's "Add Member" search box

**Done when:** a user can create a group, browse/join others, a
creator can search-and-add a specific user, and membership is
correctly enforced (non-members get rejected from group-scoped routes).

------------------------------------------------------------------------

## Phase 3 — Real-Time Chat

**Goal:** group-isolated real-time messaging, with persistence and the
supporting chat features already scoped for v1.

**Build (per `CHAT-IMPLEMENTATION.md`):**
- `config/socket.js` — Socket.IO server + JWT auth middleware on connection
- `socket/index.js` — connection lifecycle
- `socket/chat.socket.js` — events:
  - `join-group` (re-validates membership server-side, never trusts client)
  - `send-message` (validates membership + message content, persists,
    broadcasts, triggers async embedding — stubbed until Phase 4)
  - `leave-group`
  - `typing-start` / `typing-stop`
  - `message-read`
- `message.controller.js` + `message.routes.js`:
  - `GET /api/groups/:id/messages` — paginated history
- Rate limiting on `send-message` (e.g. 20 messages / 10 seconds)
- Message validation: trim, non-empty, max length (2000 chars)
- System messages (e.g. "X joined the group") stored as regular
  messages with `type: "system"`

**Done when:** two users in the same group see each other's messages
live, membership isolation holds (a non-member can't join the room or
send messages), history loads with pagination, and typing/presence/
read-receipts work.

------------------------------------------------------------------------

## Phase 4 — RAG AI System

**Goal:** the group-isolated, grounded AI assistant — the project's
core differentiator.

**Build (per `RAG-IMPLEMENTATION.md`):**
- `services/rag/loader.js` — PDF → raw text
- `services/rag/splitter.js` — chunking (~1000 chars / ~200 overlap)
- `services/rag/embeddings.js` — MiniLM via Transformers.js, normalized
  vectors
- `services/rag/vectorStore.js` — FAISS (`IndexFlatIP`), per-group index,
  create/load/save/add/search + in-memory cache with invalidation
- `services/rag/metadataStore.js` — MongoDB CRUD for `EmbeddingChunk`
- `services/rag/chatIndexer.js` — embeds + stores each new message
  (wire this into Phase 3's `send-message` handler now that it's ready)
- `services/rag/qa.js` — retrieval + similarity threshold + prompt
  assembly + Groq call
- `document.controller.js` + `document.routes.js`:
  - `POST /api/groups/:id/documents` — PDF upload (validated: type,
    max size), triggers loader → splitter → embeddings → vector store
- `ai.controller.js` + `ai.routes.js`:
  - `POST /api/groups/:id/ask` — runs the full qa.js pipeline, rate-limited

**Done when:** uploading a PDF to a group makes it queryable, asking a
question returns a grounded answer with source citation, questions
outside the group's context get the "I couldn't find that information"
response, and one group's AI never surfaces another group's data.

------------------------------------------------------------------------

## Sequencing Notes

- Phase 3's `chatIndexer.embedAndStore()` call can be a no-op stub
  during Phase 3 itself — wire the real implementation in Phase 4
  without needing to revisit Phase 3's socket handler logic.
- Phase 2 must be solid before Phase 3 — every chat/RAG operation
  depends on correct group membership checks.
- Don't start Docker/CI-CD until Phase 3 is working end-to-end locally
  — containerizing an incomplete backend just adds debugging friction
  (per the SRS Days 5–6 timeline, this comes after the phases above).
