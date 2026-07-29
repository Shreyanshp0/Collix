# FLOW.md — v1 User Flow

## Purpose

This document defines the end-to-end user flow for v1 of the
Collaborative Chat Platform with Context-Aware AI. It reflects the
scope already defined in `Collaborative_Chat_Platform_SRS_v2.md`,
`RAG-IMPLEMENTATION.md`, and `CHAT-IMPLEMENTATION.md` — a single-tier
**Group** model (no workspaces/channels), PDF-only uploads, JWT
authentication, and no meetings/OAuth/global search. See
`FLOW-IMPLEMENTATION.md` for the separately-filed capstone vision —
not part of this build.

------------------------------------------------------------------------

## User Roles (v1)

- **Group Creator** — created the group; can manually add members
- **Group Member** — can chat, upload PDFs, ask the group's AI
- **AI Assistant** — retrieves and answers from that group's own
  documents and chat history only

No Admin/Guest tiers, no permission matrix beyond creator vs. member —
see SRS Section 2.3.

------------------------------------------------------------------------

## High-Level Journey

```text
Landing / Auth
      │
      ▼
  Groups Page
      │
 ┌────┼────┐
 ▼         ▼
Create    Browse & Join
Group     (or be added by creator)
      │
      ▼
  Group Chat Page
      │
 ┌────┼─────────┐
 ▼    ▼         ▼
Chat  Upload   Ask AI
      PDF
```

------------------------------------------------------------------------

## 1. Landing Page

Primary actions:
- Login
- Register

No third-party OAuth in v1 — email/password only (SRS FR1).

------------------------------------------------------------------------

## 2. Authentication

```text
Register / Login
      │
      ▼
JWT Issued
      │
      ▼
Client Stores Token
      │
      ▼
Socket Connection Authenticated
```

Every socket connection verifies the JWT — no anonymous sockets
(CHAT-IMPLEMENTATION.md, Authentication Flow).

------------------------------------------------------------------------

## 3. Groups Page (post-login landing)

Lists:
- All groups the user is a member of
- All groups available to browse/join (open list)

Actions available:
- Create Group
- Join Group (self-join from the open list)
- Open an existing group's chat

------------------------------------------------------------------------

## 4. Group Creation

Required information:
- Group Name

Creator is automatically added to `members` and becomes the group's
Creator (SRS Data Model — Group).

------------------------------------------------------------------------

## 5. Joining a Group

Two supported methods only:

```text
Method 1: Self-Join            Method 2: Creator Adds Member
Browse open group list          Creator searches user by username
      │                                │
      ▼                                ▼
POST /groups/:id/join          POST /groups/:id/members
      │                                │
      ▼                                ▼
Added to members[]              Added to members[]
```

No invite links, no OAuth-based invites in v1.

------------------------------------------------------------------------

## 6. Group Chat Page (group home)

Two-pane layout (per current design direction):
1. **Chat** — real-time messages, primary focus
2. **AI & Documents panel** — uploaded PDFs + ask-AI box, visible
   alongside chat, not buried in a modal

------------------------------------------------------------------------

## 7. Channel / Room Mapping

```text
Group
  │
  ▼
Socket.IO Room (one room per group)
```

No workspace/channel hierarchy in v1 — a Group is the single unit of
chat, storage, and AI context isolation (CHAT-IMPLEMENTATION.md,
Socket Rooms).

------------------------------------------------------------------------

## 8. Chat Flow

```text
User types message
      │
      ▼
Validate (trim, non-empty, max length)
      │
      ▼
Validate group membership
      │
      ▼
Store in MongoDB
      │
      ▼
Broadcast to group's Socket.IO room
      │
      ▼
Background: embed + store in group's vector index (async, non-blocking)
```

Also included in v1 chat: typing indicators, online/offline presence,
read receipts, system messages (e.g. "X joined the group"), message
history with pagination.

------------------------------------------------------------------------

## 9. AI Flow

```text
User asks a question (ask-AI box)
      │
      ▼
Embed question, normalize vector
      │
      ▼
Search group's FAISS index (top-10 candidates)
      │
      ▼
Apply similarity threshold
      │
   ┌──┴──┐
   ▼     ▼
 Below   At/above
threshold threshold
   │        │
   ▼        ▼
"I couldn't  Take top ~4 +
find that    last 15–20
information  raw messages
in this      │
group's..."  ▼
          Assemble prompt
                │
                ▼
          Call Groq (llama-3.1-8b-instant)
                │
                ▼
          Grounded response + source citation
          (e.g. "Source: strategy-notes.pdf, p.3")
```

Full mechanics in `RAG-IMPLEMENTATION.md`.

------------------------------------------------------------------------

## 10. File Upload Flow

Supported files in v1: **PDF only.**

```text
Select PDF
      │
      ▼
Validate type + size (max ~10MB)
      │
   ┌──┴──┐
   ▼     ▼
Reject  Store document (scoped to groupId)
(clear         │
 error)        ▼
          Extract text (loader.js)
                │
                ▼
          Chunk (splitter.js, ~1000 chars / ~200 overlap)
                │
                ▼
          Embed each chunk (MiniLM, in-process)
                │
                ▼
          Store in group's FAISS index + MongoDB metadata
                │
                ▼
          Update in-memory cache immediately (no stale reads)
```

No OCR, no DOCX/TXT/Markdown support in v1 — see SRS Section 8,
Future Enhancements.

------------------------------------------------------------------------

## 11. Complete End-to-End Flow (v1)

```text
Register / Login
      │
      ▼
Groups Page
      │
      ▼
Create Group  ──or──  Join Group (browse / added by creator)
      │
      ▼
Group Chat Page
      │
      ├────────► Real-time Chat
      ├────────► Upload PDF
      └────────► Ask Group AI (grounded, cited response)
```

------------------------------------------------------------------------

## Core Principle (v1)

A group's chat and documents form a self-contained, isolated context.

- Messages are persisted and become part of that group's searchable
  memory.
- Uploaded PDFs are chunked, embedded, and indexed per group.
- The AI never answers from outside its group's own data, and says so
  explicitly when it can't find an answer.
- Group isolation is enforced structurally (one FAISS index per group,
  membership checked on every sensitive action) — not just assumed.

------------------------------------------------------------------------

## Explicitly Not in v1

- Workspaces/Channels (single-tier Group only)
- OAuth login (Google/GitHub)
- Invite links
- Admin/Guest roles, permission matrix
- DOCX/TXT/Markdown/Image(OCR) uploads
- Meetings, WebRTC, transcription, AI summaries
- Global search across messages/files/meetings
- Notifications system beyond in-chat system messages

See `FLOW-IMPLEMENTATION.md` for the full capstone-scale vision these
items belong to.
