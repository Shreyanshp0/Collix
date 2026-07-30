# UI-IMPLEMENTATION.md

# Collaborative RAG Workspace — Neo-Brutalist Design System

> **Design Principles**
>
> -   Neo-Brutalism first: hard borders, flat fills, offset shadows.
> -   Every accent color has **one semantic responsibility**.
> -   RAG responses must visibly prove their source ("show retrieval,
>     don't hide it").
> -   Chat remains linear; Bento layout is reserved for supporting
>     information.
> -   This is a chat app first — fast messaging is the priority. The
>     browser window itself never scrolls; only specific inner panels do.

------------------------------------------------------------------------

# 1. Design Language

-   **Style:** Neo-Brutalism + Dark Bento Dashboard
-   **Framework:** React + Vite
-   **Styling:** Tailwind CSS
-   **Icons:** Lucide React (`strokeWidth={2.25}`)
-   **Animation:** Framer Motion (150--200 ms spring)
-   **Typography:** Geist

------------------------------------------------------------------------

# 2. Color Tokens

  Token            Hex         Purpose
  ---------------- ----------- ----------------------
  Background       `#090A0F`   Main canvas
  Surface          `#14161D`   Cards/Panels
  Border           `#F4F4F6`   2px borders
  Primary Text     `#FFFFFF`   Headings
  Secondary Text   `#94A3B8`   Metadata
  AI Accent        `#8B5CF6`   AI cards/actions
  Group Accent     `#3B82F6`   Active group/channel
  Presence         `#22C55E`   Online/Enforced
  Warning          `#F59E0B`   Away
  Offline          `#6B7280`   Offline

## Accent Discipline

-   Purple → AI only
-   Blue → Group identity only
-   Green → Presence only

------------------------------------------------------------------------

# 3. Layout

Three-column layout:

1.  Groups
2.  Real-Time Chat
3.  Active Members

The chat column occupies roughly **70–75% of available width**; the
Groups sidebar and Members panel share the remainder.

The chat occupies the visual focus.

Do **not** place analytics or upload widgets in the primary chat view.
No dedicated "Upload PDF" or "Tracked PDFs" bento cards — see Section 15.

------------------------------------------------------------------------

# 4. RAG Signature Card

Every AI answer retrieved from knowledge base must render differently
from chat.

Required elements:

-   AI ASSISTANT
-   RAG GROUNDED badge
-   Source citation
-   File name
-   Section reference

Example:

``` text
AI ASSISTANT      [RAG GROUNDED]

Yes...

Source: q3_specs.pdf
Section 8.2
```

Never display grounded answers as ordinary chat bubbles.

------------------------------------------------------------------------

# 5. Neo-Brutalist Rules

## Borders

-   `border-2`
-   `border-[#F4F4F6]`

## Radius

-   Cards: `rounded-none` or `rounded-md`
-   Chat bubbles: `rounded-md`

Never exceed 6px radius.

## Hard Shadows

AI card:

``` css
box-shadow:4px 4px 0 #8B5CF6;
```

Group card:

``` css
box-shadow:4px 4px 0 #3B82F6;
```

Buttons:

``` css
box-shadow:3px 3px 0 #FFFFFF;
```

Never use blurred shadows.

------------------------------------------------------------------------

# 6. Spacing

Grid gap

``` text
gap-4
```

Card padding

``` text
p-5
```

Button active state

``` html
active:translate-x-[2px]
active:translate-y-[2px]
active:shadow-[1px_1px_0px_0px_#fff]
```

------------------------------------------------------------------------

# 7. Typography

Headings

``` text
uppercase
tracking-wider
font-bold
```

Body

``` text
font-normal
```

Metadata

``` text
font-mono
text-slate-400
```

Examples:

-   01 GROUPS
-   RAG GROUNDED
-   10:14 AM

------------------------------------------------------------------------

# 8. Sidebar

Sections:

-   Groups
-   Workspace Isolation

Remove:

-   Engine metrics
-   Latency
-   Chunk count

Group identity is communicated with the blue accent.

The Groups list scrolls internally if it grows long — see Section 15.

------------------------------------------------------------------------

# 9. Chat

Normal messages

-   White border
-   No glow

AI grounded message

-   Purple border
-   Purple hard shadow
-   Citation footer

Typing indicator

Green only.

------------------------------------------------------------------------

# 10. Members

Status colors:

-   Online → Green
-   Away → Amber
-   Offline → Gray

Use high contrast for names and roles.

The Members list scrolls internally if it grows long — see Section 15.

------------------------------------------------------------------------

# 11. Accessibility

Minimum contrast:

-   Body text ≥ WCAG AA
-   Metadata ≥ 4.5:1

Avoid low-contrast gray on dark backgrounds.

------------------------------------------------------------------------

# 12. Motion

Framer Motion

-   Duration: 150--200ms
-   Spring
-   Minimal overshoot

Avoid slow fades.

------------------------------------------------------------------------

# 13. Tailwind Utilities

``` text
bg-[#090A0F]
bg-[#14161D]
border-2
border-[#F4F4F6]
shadow-[4px_4px_0px_0px_#8B5CF6]
shadow-[4px_4px_0px_0px_#3B82F6]
rounded-md
uppercase
tracking-wider
font-mono
gap-4
p-5
overflow-y-auto
h-screen
```

------------------------------------------------------------------------

# 14. Dashboard Structure

``` text
+-----------------------------------------------------------+
| Header (fixed)                                            |
+-----------------------------------------------------------+
| Groups   | Chat Header (fixed)          | Members          |
| (scroll) | ------------------------------| (scroll)        |
|          | Messages (scroll, flex-grow)  |                 |
|          | AI Grounded Source Card       |                 |
|          | ------------------------------|                 |
|          | Message Composer (fixed)      |                 |
+-----------------------------------------------------------+
```

The design should prioritize trust, readability, and information
hierarchy over decorative effects.

------------------------------------------------------------------------

# 15. Layout & Scroll Behavior

This is a real-time chat app first — it must behave like Slack,
Discord, or WhatsApp Web. Fast messaging is the priority, not a
feature-showcase dashboard.

## 15.1 Single Viewport, No Page Scroll

The browser window must **never** scroll — there should be no
page-level vertical scrollbar under any circumstance.

```css
html, body, #root {
  height: 100vh;
  overflow: hidden;
}
```

Implement with Flexbox:

```text
Viewport (100vh)
Header (fixed)
────────────────────────────
Main (flex row)
├── Groups sidebar
├── Chat column
│     ├── Chat header (fixed)
│     ├── Messages (flex-grow — this scrolls)
│     └── Message composer (fixed at bottom, always visible)
└── Members panel
```

The user should never need to scroll the browser page to reach the
message input or any core action.

## 15.2 Only These Panels Scroll Internally

Each uses its own `overflow-y-auto` within a fixed-height flex
container. Nothing outside this list scrolls:

-   Groups sidebar list
-   Chat message list (primary scroll area — header and composer
    never move; new messages append here)
-   Members panel list
-   Tracked PDFs modal body (Section 15.4)

## 15.3 No Upload/Tracked-PDF Bento Cards

Do not use dedicated "Upload PDF" or "Tracked PDFs" cards in the main
layout — they consume vertical space that should go to the chat area.

PDF upload flow, via the message composer's existing attachment icon:

```text
Click attachment → choose PDF → upload → show progress →
file reference appears in chat → backend indexes it → AI can use it
```

## 15.4 Tracked PDFs — Toolbar Icon + Modal

Add a single icon (document/file icon) in the chat header, next to
the group name. Clicking it opens a modal showing:

-   Filename
-   Uploaded by / date
-   Status (`processing` / `ready` — matches the Document model's
    `status` field)

The modal body scrolls independently if the list is long. This
replaces any inline "Tracked PDFs" panel entirely.

## 15.5 Explicitly Out of Scope for This Pass

-   Search (not a v1 feature)
-   Settings icon (not a v1 feature)
-   Any additional header icon beyond the single Tracked PDFs icon —
    the Members panel is already its own column; no duplicate Members
    icon in the header.

## 16. Global Application Shell

All authenticated pages (Chat, Groups, future Profile, Settings, etc.) must use a shared application shell.

The AppShell is responsible for:

Fixed viewport (100vh)
Fixed top navigation
Global content width
Responsive spacing
Scroll containment
Theme consistency

Structure:

Viewport (100vh)

┌───────────────────────────────────────────────┐
│ Top Navigation (fixed)                        │
├───────────────────────────────────────────────┤
│                                               │
│               Page Container                  │
│                                               │
└───────────────────────────────────────────────┘

Every authenticated page must render inside this shell.

Pages should never implement their own viewport logic.

## 17. Global Page Container

Every page should share the same content width.

max-width: 1600px;
width: 100%;
margin-inline: auto;
padding-inline: 24px;
padding-block: 16px;

This keeps Chat, Groups, and future pages visually aligned.

Do not allow different pages to use different container widths.

## 18. Global Spacing System

Adopt an 8px spacing system.

Space-1 = 4px

Space-2 = 8px

Space-3 = 12px

Space-4 = 16px

Space-5 = 24px

Space-6 = 32px

Space-7 = 40px

Do not use arbitrary spacing values unless absolutely necessary.

All page layouts should be built from these spacing tokens.

## 19. Shared Layout Components

Create reusable layout primitives.

Examples:

<AppShell>

<PageContainer>

<PageHeader>

<PageSection>

<Panel>

<ScrollablePanel>

<Sidebar>

<ContentArea>

<Modal>

Pages should compose these primitives instead of recreating layouts.

## 20. Shared Panel Rules

Every panel should inherit the same base appearance.

Default:

2px border
Surface background
Hard shadow
Consistent padding
Consistent radius

Variants:

Standard Panel
AI Panel
Group Panel
Modal Panel

Never redefine these styles inside individual pages.

## 21. Responsive Grid System

Desktop

Groups

20%

Chat

60%

Members

20%

Pages without sidebars

Centered Container

Maximum Width

Tablet

Collapse secondary panels into drawers.

Mobile

Single-column navigation.

## 22. Global Typography Tokens

Standardize typography.

Page Title

Large uppercase heading.

Section Label

Small uppercase blue label.

Card Title

Medium bold uppercase.

Body

Normal weight.

Metadata

Monospace secondary text.

Every page should reuse these tokens.

## 23. Global Scroll Rules

The following elements may scroll:

Groups list
Chat messages
Members list
Modal bodies
Long lists

Everything else remains fixed.

Never introduce browser-level scrolling.

## 24. Message Composer Standards

The composer behaves like Slack or Discord.

Default height:

Approximately 60–70px.

Auto-expands:

Multi-line text
Attachments

Maximum height:

Approximately 180px.

Only the textarea grows.

Toolbar remains fixed.

The composer participates in Flexbox layout.

It must never overlay messages.

As the composer grows:

Messages area shrinks naturally.
Latest messages remain visible.
No message disappears beneath the composer.
## 25. Chat Behaviour Standards

Messages remain in chronological order.

When a conversation opens:

Automatically scroll to the newest message.
Composer immediately visible.

If the user is reading history:

Preserve scroll position.
Never force-scroll.

If the user is already at the bottom:

Keep the viewport pinned to the latest messages.
## 26. Global Scrollbar Style

No native operating-system scrollbars.

Use custom scrollbars.

Width

4px

Track

#000000

Thumb

Group Blue

Sharp edges

Apply consistently to every internal scrolling container.

## 27. Design Consistency Rules

Before adding any new page or component, verify:

Uses AppShell.
Uses PageContainer.
Uses spacing tokens.
Uses typography tokens.
Uses shared panel styles.
Uses semantic colors.
Respects viewport rules.
Does not introduce browser scrolling.
Uses shared scroll behavior.
Matches existing Neo-Brutalist language.

No page should invent its own layout system.