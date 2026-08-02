# UI Payloads Reference

This document lists the public props / payloads accepted by major UI components in the workspace. It is intended as a quick developer reference (prop name, type, required, and short description).

---

## `AskAIBox` (Client/src/components/ai/AskAIBox.jsx)
- `onAddDocuments: Function(documentArray)` — optional
  - Called when one or more documents are attached / indexed. Payload: array of document objects: `{ id, name, size, uploadedBy, uploadedAt (ISO), status, groupId? }`.
- `onOpenDocuments: Function()` — optional
  - Called to open the documents modal or list.
- `activeGroupId: string` — optional
  - ID of the active group to associate uploaded documents with.

---

## `MessageList` (Client/src/components/chat/MessageList.jsx)
- `documents: Array` — optional
  - Array of document objects (used for inline references).
- `activeGroupKey: string` — optional
  - Identifier/key for the current group/channel (used for scroll/updates).
- (Rendering uses an internal message model: `{ id, author, message, ts, meta? }`)

---

## `MessageInput` (Client/src/components/chat/MessageInput.jsx)
- `value: string` — optional
- `onChange: Function(newValue)` — required when controlled
- `onSend: Function(payload)` — required
  - Payload typically `{ text, attachments }` where `attachments` is an array of document-like objects.

---

## `DocumentList` (Client/src/components/documents/DocumentList.jsx)
- `documents: Array<{ id, name, uploadedBy, uploadedAt, status, groupId? }>` — required
  - Renders each document and exposes the `View` / `Remove` actions (buttons).

---

## `DocumentUpload` (Client/src/components/documents/DocumentUpload.jsx)
- `onUpload: Function(document)` — required
  - Called after a successful upload with a document object similar to the above.
- `accept: string` — optional
  - File types accepted (e.g. `.pdf`).

---

## `GroupDetailsPanel` (Client/src/components/groups/GroupDetailsPanel.jsx)
- `activeGroupId: string` — required
  - The id of the current group to show details for.
- `onCollapse: Function()` — optional
  - Called when user collapses the panel to the icon rail.
- `loading: boolean` — optional
  - If true, shows a loading/joining state.
- `documents: Array` — optional
  - Document records from the client state/API; used to compute counts and recent uploads.
- `members: Array` — optional
  - Member records to compute `memberCount` and list members.

Notes: The panel only displays schema-backed values: `group.name`, `group.description` (optional), `memberCount` (derived from `members`), `createdAt` (ISO), `documentCount` (derived from `documents`).

---

## `MemberList` (Client/src/components/groups/MemberList.jsx)
- `members: Array<{ id, name, role, status }>` — required
  - Renders each member card. `status` expected values: `online|away|offline`.

---

## `AddMemberForm` (Client/src/components/groups/AddMemberForm.jsx)
- `onAdd: Function(memberObj)` — required
  - Called with `{ id?, name, role }` when a new member is added.
- `initialValues: Object` — optional

---

## `GroupList` / `GroupCard` (Client/src/components/groups/GroupList.jsx, GroupCard.jsx)
- `groups: Array<{ id, name, description?, members?, docs?, createdAt? }>` — required
- `onSelect: Function(groupId)` — optional
- `renderMode: 'grid' | 'list'` — optional

---

## `CurrentGroupDropdown` (Client/src/components/common/CurrentGroupDropdown.jsx)
- `groups: Array` — optional (if not provided component reads mock store)
- `onChange: Function(groupId)` — optional
- `value: string` — optional

---

## `UserDropdown` (Client/src/components/common/UserDropdown.jsx)
- `user: { id, name, avatar? }` — optional
- `onSignOut: Function()` — optional

---

## `Modal` (Client/src/components/shared/Modal.jsx)
- `isOpen: boolean` — required
- `onClose: Function()` — required
- `size: 'sm'|'md'|'lg'|'xl'` — optional (default `lg`)
- `sectionLabel: string` — optional
- `title: string` — optional
- `subtitle: string` — optional
- `children: ReactNode` — optional (modal body)
- `footer: ReactNode` — optional

Behavior: the modal traps focus while open and restores the previous active element on close.

---

## `Navbar` (Client/src/components/common/Navbar.jsx)
- `isAuthenticated` is consumed via `useAuth()` internally rather than via props.
- Internal composition: uses `CurrentGroupDropdown`, `UserDropdown` and notification button.

---

## `LoadingSpinner` / `PrivateRoute` (Client/src/components/common)
- Minimal or no public props; `PrivateRoute` consumes auth context and forwards `children`.

---

## `AIResponse` (Client/src/components/ai/AIResponse.jsx)
- Renders AI answer bubbles. Expected payload: `{ id, author, message, sources?: Array, ts }`.

---

## `TypingIndicator`, `ReadReceipt`, `SystemMessage`
- Small presentational components. Typical props:
  - `TypingIndicator`: `users: Array<{ id, name }>`
  - `ReadReceipt`: `readBy: Array<{ id, name }>`
  - `SystemMessage`: `text: string`

---

# Empty-state & Data Guidelines
- Components must only render values that come from one of:
  - the database / API layer
  - derived values from real records (length, counts, latest timestamps)
  - user actions in the session
- Do not fabricate metrics ("AI READY", "Knowledge Healthy", "Qs today") unless persisted by the backend.

---

# How to extend
- Add required fields to the backend `Group` schema and the API responses (for example: `description?: string`, `createdAt?: ISOString`).
- Ensure `documents` returned by the Documents API include `groupId` and `uploadedAt` (ISO). Frontend will use those to populate `GroupDetailsPanel`.

---

If you'd like, I can also:
- generate a TypeScript `d.ts` or `PropTypes` file for these payloads, or
- create a `UIpayload.json` machine-readable spec for automated validation.

Tell me which next step you prefer.