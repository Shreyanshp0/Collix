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

The chat occupies the visual focus.

Do **not** place analytics or upload widgets in the primary chat view.

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
| Header                                                    |
+-----------------------------------------------------------+
| Sidebar | Chat (Primary) | Members                        |
|         |                |                                |
|         | AI Grounded    |                                |
|         | Source Card    |                                |
+-----------------------------------------------------------+
```

The design should prioritize trust, readability, and information
hierarchy over decorative effects.