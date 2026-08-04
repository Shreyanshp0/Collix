# Collaborative Chat Platform with Context-Aware AI

A group chat platform where every group has its own AI assistant —
grounded only in that group's uploaded documents and past
conversation, so an esports group's bot knows their strategy notes and
a music group's bot knows their playlist debates, without either
crossing over into the other's context.

Built as a MERN + DevOps project, with plans to extend into a
capstone project.

---

## Core Idea

Most group chat tools bolt on a generic AI assistant that answers from
general knowledge. This platform's AI is **retrieval-grounded per
group** — it only answers using:
- That group's uploaded PDF documents
- That group's own chat history (recent + long-term, via embeddings)

If a question isn't covered by either, the AI says so explicitly
rather than guessing — see `RAG-IMPLEMENTATION.md` for how this is
enforced.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js, Express |
| Real-time | Socket.IO |
| Database | MongoDB |
| AI orchestration | LangChain |
| LLM | Groq (`llama-3.1-8b-instant`) |
| Embeddings | `all-MiniLM-L6-v2` via `@xenova/transformers` (in-process, no external API cost) |
| Vector store | FAISS (`faiss-node`, `IndexFlatIP` / cosine similarity), one index per group |
| Auth | JWT, bcrypt |
| DevOps | Docker, GitHub, CI/CD (Jenkins or GitHub Actions), AWS EC2 |

---

## v1 Features

- User authentication (register/login/logout, JWT-based)
- Group creation; joining via open browsing **or** creator-added members
- Real-time group text chat (Socket.IO, group-isolated rooms)
- Message history with pagination
- Typing indicators, online/offline presence, read receipts
- System messages (e.g. "X joined the group")
- PDF upload per group, validated (type + size)
- Group-isolated, context-aware AI chatbot (RAG over documents + chat history)
- Dockerized deployment with a CI/CD pipeline to AWS

### Explicitly out of scope for v1 (planned for capstone)
- Voice calls, video calling (WebRTC)
- Multi-format document support beyond PDF, image OCR
- Message reactions, threads, file attachments beyond PDF
- End-to-end encryption
- Admin role / application management tools
- Hybrid (keyword + vector) retrieval, reranking, alternate embedding models

---

## Project Documentation

| File | Purpose |
|---|---|
| `Collaborative_Chat_Platform_SRS_v2.md` | Full requirements spec — functional/non-functional requirements, data model, API list, architecture, use cases |
| `RAG-IMPLEMENTATION.md` | Exact RAG pipeline — storage/retrieval mechanics, prompt template, deployment considerations |
| `CHAT-IMPLEMENTATION.md` | Chat + grouping logic — socket events, auth flow, membership validation, REST endpoints |
| `Rule.md` | Coding discipline rules for AI coding assistants used during development (scope control, anti-bloat) |

---

## Project Structure

```
backend/
  src/
    config/         → socket.js, database.js
    middleware/      → auth.middleware.js
    socket/          → chat socket handlers
    controllers/     → group.controller.js, message.controller.js
    routes/          → group.routes.js, message.routes.js
    models/          → User.js, Group.js, Message.js
    services/
      rag/            → loader, splitter, embeddings, vectorStore, chatIndexer, qa
    app.js

client/
  → React frontend
```

---

## Group Isolation

Group data isolation is enforced at two levels:
- **Chat:** membership is validated against MongoDB on every sensitive
  socket event (`join-group`, `send-message`) — never trusted from the
  client alone
- **AI retrieval:** each group has its own FAISS vector index, so a
  group's assistant can structurally never retrieve another group's
  documents or messages

---

## Deployment

- Containerized with Docker (backend + client)
- CI/CD pipeline builds, tests, and deploys to a single AWS EC2 instance
- Note: `faiss-node` is a native binary — use a full (non-slim) Node
  base image unless build tools are confirmed present

### Production URL secrets

Configure these GitHub Actions secrets with the public EC2 origin (replace
`54.xx.xx.xx` with the real host):

```text
CLIENT_URL=http://54.xx.xx.xx
VITE_API_URL=http://54.xx.xx.xx/api/v1
VITE_SOCKET_URL=http://54.xx.xx.xx
```

`CLIENT_URL` is the browser origin allowed by backend CORS, and
`VITE_SOCKET_URL` is the Socket.IO server origin. Neither may include
`/api/v1`: Socket.IO interprets a path in its connection URL as a namespace,
so `http://54.xx.xx.xx/api/v1` requests the `/api/v1` namespace rather than
the default `/` namespace. Only `VITE_API_URL` includes `/api/v1`, because it
is used as the REST API base URL.

---

## Development Timeline (v1)

| Phase | Duration |
|---|---|
| Auth, groups, real-time chat | Days 1–2 |
| LangChain RAG integration | Days 3–4 |
| Docker + CI/CD + AWS deployment | Days 5–6 |
| Testing & bug fixes | Day 7 |

---

## Roadmap (Capstone)

- Voice/video calling (WebRTC)
- Multi-format document support, image OCR
- Hybrid retrieval (BM25 + vector), reranking
- Group analytics, AI meeting summaries
- End-to-end encryption
- Admin role and management tools
