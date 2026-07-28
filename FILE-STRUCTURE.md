# Project File Structure

## Backend

```
Server/
├── src/
│   ├── config/
│   │   ├── database.js          → MongoDB connection setup
│   │   └── socket.js            → Socket.IO server setup + auth middleware
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js   → JWT verification for REST routes
│   │   └── rateLimit.middleware.js → rate limiting (chat + AI endpoints)
│   │
│   ├── socket/
│   │   ├── index.js             → socket connection lifecycle, auth
│   │   └── chat.socket.js       → join-group, send-message, typing, presence, read receipts
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   → register, login, logout
│   │   ├── group.controller.js  → create, list, join, add member, leave
│   │   ├── message.controller.js→ message history, pagination
│   │   ├── document.controller.js → PDF upload, validation
│   │   └── ai.controller.js     → ask-AI endpoint
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── message.routes.js
│   │   ├── document.routes.js
│   │   └── ai.routes.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Message.js
│   │   ├── Document.js
│   │   └── EmbeddingChunk.js     → metadata store for FAISS vectors (MongoDB)
│   │
│   ├── services/
│   │   ├── rag/
│   │   │   ├── loader.js         → PDF → raw text
│   │   │   ├── splitter.js       → text → chunks
│   │   │   ├── embeddings.js     → text → normalized vector (MiniLM/Transformers.js)
│   │   │   ├── vectorStore.js    → FAISS create/load/save/add/search + in-memory cache
│   │   │   ├── metadataStore.js  → MongoDB CRUD for EmbeddingChunk
│   │   │   ├── chatIndexer.js    → embeds + stores each new message (async, background)
│   │   │   └── qa.js             → retrieval + threshold filter + prompt assembly + Groq call
│   │   │
│   │   └── auth.service.js       → password hashing, JWT signing/verification helpers
│   │
│   ├── utils/
│   │   ├── validators.js         → message length/emptiness, file type/size checks
│   │   └── errorResponse.js      → structured { success: false, message } helper
│   │
│   ├── vectorstores/             → persisted FAISS index files, one per group (gitignored)
│   │
│   └── app.js                    → Express app setup, route mounting, Socket.IO init
│
├── uploads/                      → temporary/raw PDF storage before processing (gitignored)
├── .env                           → JWT_SECRET, MONGODB_URI, GROQ_API_KEY (gitignored)
├── .env.example                   → template with empty values, committed
├── .gitignore
├── Dockerfile
├── package.json
└── server.js                      → entry point (starts Express + Socket.IO)
```

---

## Frontend

```
Client/
├── public/
│   └── index.html
│
├── src/
│   ├── api/
│   │   ├── axiosClient.js        → configured axios instance, attaches JWT
│   │   ├── auth.api.js
│   │   ├── groups.api.js
│   │   ├── messages.api.js
│   │   ├── documents.api.js
│   │   └── ai.api.js
│   │
│   ├── socket/
│   │   └── socketClient.js       → Socket.IO client setup, auth handshake, reconnect handling
│   │
│   ├── context/
│   │   ├── AuthContext.js        → current user, JWT, login/logout state
│   │   └── SocketContext.js      → shared socket instance across components
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── MessageList.js
│   │   │   ├── MessageInput.js
│   │   │   ├── TypingIndicator.js
│   │   │   ├── SystemMessage.js
│   │   │   └── ReadReceipt.js
│   │   │
│   │   ├── groups/
│   │   │   ├── GroupList.js       → browse/join open groups
│   │   │   ├── GroupCard.js
│   │   │   ├── CreateGroupForm.js
│   │   │   ├── AddMemberForm.js   → creator-only manual add
│   │   │   └── MemberList.js
│   │   │
│   │   ├── documents/
│   │   │   ├── DocumentUpload.js
│   │   │   └── DocumentList.js
│   │   │
│   │   ├── ai/
│   │   │   ├── AskAIBox.js
│   │   │   └── AIResponse.js
│   │   │
│   │   └── common/
│   │       ├── Navbar.js
│   │       ├── PrivateRoute.js
│   │       └── LoadingSpinner.js
│   │
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── GroupsPage.js          → browse/join/create groups
│   │   └── GroupChatPage.js       → chat + documents + AI ask, for one group
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   └── useMessages.js         → pagination/infinite scroll logic
│   │
│   ├── App.js
│   └── index.js
│
├── .env                            → REACT_APP_API_URL, REACT_APP_SOCKET_URL (gitignored)
├── .gitignore
├── Dockerfile
└── package.json
```

---

## Notes

- `EmbeddingChunk.js` (backend model) is the MongoDB-backed metadata
  store paired with the FAISS vector index — see `RAG-IMPLEMENTATION.md`
  Section 4 for the exact position-alignment mechanics.
- `vectorstores/` holds the actual FAISS index files (one per group),
  loaded lazily and cached in memory — see `RAG-IMPLEMENTATION.md`
  Section 6.
- Backend `Dockerfile` should use a full (non-slim) Node base image —
  see `RAG-IMPLEMENTATION.md` Section 9 for the `faiss-node` native
  binary caveat.
- `services/auth.service.js` centralizes hashing/JWT logic so both
  REST auth routes and the Socket.IO auth middleware use the same
  verification logic, avoiding duplication.
