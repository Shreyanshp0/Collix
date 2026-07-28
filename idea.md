# Project Idea: Collaborative Chat Platform with Context-Aware AI

## Context
- MERN + DevOps class project (PBL), solo build
- Deadline: August 3
- Long-term goal: expand into capstone project

## Core Concept
A group chat platform where each group has its own AI assistant that is
**grounded in that group's actual content** — not a generic chatbot with a
different personality per group, but one that retrieves and answers from
what the group has actually shared (messages, uploaded documents).

Example: an esports group uploads strategy notes → their bot answers
using those notes. A music/movies group uploads playlists/reviews →
their bot answers from that context instead. Same underlying system,
different retrieved context per group.

This RAG-based grounding is the differentiator — it's what separates
this from "Discord + ChatGPT," which is the comparison this idea needs
to beat.

## Why This Scope (v1 vs. Full Vision)
The original idea included group voice calls, 1:1 video, and generic
multi-format file sharing. For a solo build in ~1 week, that scope
doesn't ship reliably — and a shaky app undermines the DevOps pipeline
built around it, since there needs to be something stable to build,
test, and deploy repeatedly.

**v1 (this submission)** cuts to the core differentiator and ships it well.
**Future scope (capstone)** reintroduces the rest deliberately, see below.

## v1 Feature Scope
- Auth, create/join groups
- Real-time group text chat (Socket.IO)
- Per-group PDF upload → chunk + embed → LangChain RAG chatbot scoped
  to that group's uploaded content and message history
- Chatbot answers pull only from that group's own context

## Tech Stack
- **App:** MongoDB, Express, React, Node (MERN)
- **AI:** LangChain (RAG pipeline — embeddings + retrieval + LLM response)
- **Real-time:** Socket.IO for chat
- **DevOps:** GitHub → CI/CD (Jenkins, or GitHub Actions if time pressure
  requires the swap) → Docker → AWS deploy

## Explicitly Out of Scope for v1 (Future / Capstone Roadmap)
- Group voice calling sessions
- One-on-one video chat (WebRTC)
- Multi-format document support beyond PDF
- Deeper personalization (tone/persona tuning per group, not just retrieval)
- Security/privacy hardening (e2e considerations for chat and shared docs)

## Rough Build Timeline (1 week)
| Days | Focus |
|------|-------|
| 1–2  | Core MERN app: auth, groups, Socket.IO chat, basic UI. Manual deploy to AWS once to validate the path. |
| 3–4  | LangChain RAG chatbot: PDF upload, embedding, per-group scoped retrieval + response. |
| 5–6  | Dockerize app, wire up CI/CD (Jenkins or Actions), automate AWS deploy. |
| 7    | Buffer for pipeline breakage — no new features scheduled. |

**Jenkins vs. GitHub Actions checkpoint:** if Jenkins isn't cleanly
running a build by day 4, switch to GitHub Actions rather than losing
more time to setup.
