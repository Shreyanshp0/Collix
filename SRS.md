# Software Requirements Specification (SRS) — v2

## 1. Introduction

### 1.1 Purpose

The purpose of this project is to develop a **Collaborative Chat
Platform with Context-Aware AI**, where every group has an AI assistant
capable of answering questions based solely on that group's uploaded
documents and chat history. The platform enables efficient collaboration
while demonstrating AI integration using Retrieval-Augmented Generation
(RAG).

### 1.2 Scope

The application allows users to:
- Register and log in securely.
- Create and join chat groups.
- Exchange real-time text messages.
- Upload PDF documents within a group.
- Interact with a group-specific AI chatbot that answers questions using
  only that group's uploaded PDFs and message history.
- Deploy the application using a Docker + CI/CD pipeline to AWS.

Future versions may include voice/video calling, multi-format document
support, and advanced personalization (see Section 8).

### 1.3 Assumptions and Constraints

- Single developer, ~1 week implementation timeline.
- Deployment target is a single AWS EC2 instance (not a multi-instance
  or load-balanced setup).
- No formal load testing is performed; performance targets (Section 4)
  are informal goals validated manually, not benchmarked SLAs.
- Assumes a stable internet connection for real-time chat and AI calls.
- LLM/embedding calls depend on a third-party API; availability and
  latency are bounded by that provider.

------------------------------------------------------------------------

# 2. Overall Description

## 2.1 Product Perspective

The system is a single web-based collaboration platform built using the
MERN stack, deployed as one backend service (not a microservices
architecture). AI capabilities are powered through LangChain's RAG
pipeline, called in-process from the same Express backend. Real-time
communication uses Socket.IO.

## 2.2 Product Functions

- User Authentication
- Group Management
- Real-Time Group Chat
- PDF Upload (with validation)
- AI Question Answering (group-isolated RAG)
- Message History Storage
- Dockerized Deployment
- CI/CD Pipeline
- AWS Hosting

## 2.3 User Classes

### Registered User
- Create groups
- Join groups
- Chat with members
- Upload PDFs
- Ask AI questions

### AI Assistant
- Retrieve relevant information from the current group's documents/chat
  history only
- Generate contextual responses
- Explicitly decline to answer when no relevant context is found,
  rather than falling back to general knowledge

> **Note:** An Admin role was considered but is out of scope for this
> version — no admin functionality is implemented. See Section 8.

------------------------------------------------------------------------

# 3. Functional Requirements

## FR1 User Authentication
- Register account
- Login
- Logout
- JWT-based authentication
- Passwords stored using hashing (bcrypt)

## FR2 Group Management
- Create group
- Join existing group
- View group members
- Enter group chat

## FR3 Real-Time Chat & Message History
- Send messages instantly (Socket.IO)
- Receive messages instantly for all group members
- Display timestamps
- Persist all messages in MongoDB, scoped to their group, in
  chronological order
- Persisted history is retrievable both for display and as input to
  the AI's retrieval context

## FR4 PDF Upload
- Upload PDF (single file per request)
- Validate file type (PDF only) and enforce a max file size (e.g. 10MB)
- Reject and return a clear error for invalid or oversized files
- Store the original document, scoped to its group
- Process document into text chunks
- Generate embeddings per chunk
- Save vector representations, tagged with the owning `groupId`

## FR5 Context-Aware AI (Group-Isolated RAG)
The AI shall:
- Accept user questions from within a group
- Retrieve relevant chunks **filtered strictly by that group's `groupId`**
  — vector search must never return another group's documents
- Use only the current group's documents and chat history as context
- Generate a contextual answer grounded in retrieved content
- If no relevant context is found, respond that it doesn't have enough
  information, rather than answering from general/unrelated knowledge
- Respect a per-user/per-group rate limit on AI requests to control
  API cost

## FR6 Deployment
- Docker containerization of the application
- CI/CD automation (Jenkins or GitHub Actions — decided based on setup
  time; see project timeline)
- AWS EC2 deployment

------------------------------------------------------------------------

# 4. Non-Functional Requirements

## Performance (informal targets, not benchmarked SLAs)
- Chat message delivery target: under ~2 seconds under normal conditions
- AI response target: ~5–10 seconds per query
- Manually tested with a small number of concurrent users (not
  load-tested at scale)

## Security
- JWT authentication on protected routes
- Password hashing (bcrypt)
- Group-based authorization: users can only access groups they belong
  to; documents and messages are scoped by `groupId` at the query level
- Vector retrieval is namespaced by `groupId` to prevent cross-group
  data leakage
- File upload validation (type and size) to reduce abuse/DoS risk

## Reliability
- Socket.IO client reconnection handling
- Persistent message storage (MongoDB)
- Deployment pipeline produces a repeatable, testable build

## Scalability
- Backend organized into clear route/service/model layers to support
  future extension (not a distributed/microservices system in this
  version)
- RAG logic isolated in its own module to allow easier extraction into
  a separate service later, if needed

## Maintainability
- RESTful API structure
- Modular codebase (routes/controllers/models/services separated)
- Documented environment variables and setup steps

------------------------------------------------------------------------

# 5. System Requirements

## Frontend
- React.js, HTML5, CSS, JavaScript

## Backend
- Node.js, Express.js

## Database
- MongoDB (documents, messages, users, groups)
- Vector store for embeddings — FAISS (in-process, simplest for a
  solo/short-timeline build) or a hosted vector DB if time allows

## AI
- LangChain (RAG orchestration)
- Embedding model: to be finalized (e.g. OpenAI embeddings or a local
  sentence-transformer model)
- LLM API: to be finalized (subject to cost/rate-limit constraints)

## DevOps
- Docker
- Jenkins or GitHub Actions (decision point: switch to GitHub Actions
  if Jenkins setup is not working cleanly by the mid-point of the
  timeline)
- AWS EC2
- GitHub

------------------------------------------------------------------------

# 6. Data Model (New)

## User
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| username | String | unique |
| email | String | unique |
| passwordHash | String | |
| createdAt | Date | |

## Group
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| name | String | |
| members | [ObjectId] | ref: User |
| createdBy | ObjectId | ref: User |
| createdAt | Date | |

## Message
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| groupId | ObjectId | ref: Group — used to scope chat + AI context |
| senderId | ObjectId | ref: User |
| content | String | |
| timestamp | Date | |

## Document
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | |
| groupId | ObjectId | ref: Group |
| uploadedBy | ObjectId | ref: User |
| filename | String | |
| storagePath | String | |
| status | String | e.g. `processing`, `ready`, `failed` |
| createdAt | Date | |

## EmbeddingChunk (vector store metadata)
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId / vector ID | |
| groupId | ObjectId | **used to enforce retrieval isolation** |
| documentId | ObjectId | ref: Document |
| chunkText | String | |
| vector | Float[] | embedding |

------------------------------------------------------------------------

# 7. API Endpoints (New)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/groups | Create a group |
| POST | /api/groups/:id/join | Join an existing group |
| GET | /api/groups/:id | Get group details/members |
| GET | /api/groups/:id/messages | Fetch chat history |
| POST | /api/groups/:id/documents | Upload a PDF (validated) |
| POST | /api/groups/:id/ask | Ask the group's AI a question |

Real-time message send/receive is handled over a Socket.IO connection,
scoped to a group room (`groupId`), rather than a REST endpoint.

------------------------------------------------------------------------

# 8. System Architecture

```text
Users
  │
React Frontend
  │
Express REST API ── Socket.IO (group-scoped rooms)
  │
Node Backend (single service)
  │
  ├── MongoDB (users, groups, messages, documents)
  │
  └── RAG Module (in-process, called by backend)
         │
   PDF Upload → Chunking → Embeddings → Vector Store (namespaced by groupId)
         │
      Retrieval (filtered by groupId) → LLM → Answer
```

The RAG module is logically separated in code but runs within the same
backend service in this version — not a separate deployed microservice.

------------------------------------------------------------------------

# 9. Use Cases

## UC-1 Register User
**Actor:** User
**Flow:** 1. Open registration page 2. Enter details 3. Account created

## UC-2 Create Group
**Actor:** User
**Flow:** 1. Click Create Group 2. Enter group name 3. Group created

## UC-3 Join Group
**Actor:** User
**Flow:** 1. Select group 2. Join group 3. Access chat

## UC-4 Chat
**Actor:** User
**Flow:** 1. Type message 2. Send 3. All members receive message
4. Message persisted with `groupId` and timestamp

## UC-5 Upload PDF
**Actor:** User
**Flow:** 1. Select PDF 2. System validates type/size 3. Upload
4. System processes document into chunks 5. Embeddings generated and
tagged with `groupId`

## UC-6 Ask AI
**Actor:** User
**Flow:** 1. Ask question 2. System retrieves relevant chunks filtered
by `groupId` 3. If relevant context found, AI generates a grounded
response; if not, AI states it lacks sufficient information 4. Display
answer

------------------------------------------------------------------------

# 10. Future Enhancements

- Voice Calls
- Video Calling (WebRTC)
- Multi-format Document Support (beyond PDF)
- Image OCR
- AI Memory across sessions
- Group Analytics
- AI Meeting Summaries
- End-to-End Encryption
- Admin role and application management tools

------------------------------------------------------------------------

# 11. Development Timeline

| Phase | Duration |
|---|---|
| MERN Backend + Frontend (auth, groups, chat) | Days 1–2 |
| LangChain RAG Integration (upload, embeddings, group-isolated retrieval) | Days 3–4 |
| Docker + CI/CD + AWS Deployment | Days 5–6 |
| Testing & Bug Fixes | Day 7 |

**Checkpoint:** if the Jenkins pipeline is not cleanly building by the
midpoint of Days 5–6, switch to GitHub Actions rather than losing
further time to CI setup.

------------------------------------------------------------------------

# 12. Conclusion

The proposed **Collaborative Chat Platform with Context-Aware AI**
combines real-time collaboration with Retrieval-Augmented Generation to
provide accurate, group-specific AI assistance. By integrating MERN,
Socket.IO, LangChain, Docker, CI/CD, and AWS — with explicit group-level
data isolation and grounded (non-hallucinating) AI responses — the
project demonstrates modern full-stack development, AI integration, and
DevOps practices while remaining honestly scoped to what is feasible for
a solo developer within the planned timeline.
