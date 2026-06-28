# Design Brief: "MeInteresa" UI/UX Spec (Tokyo Night Edition)

This document establishes the visual direction, component layout, and design system tokens for the **MeInteresa** mock-only MVP. Persistence, authentication, backend calls, and real Gemini integration are intentionally out of scope until a later spec adds them.

---

## 1. Aesthetic Direction: Tokyo Night

To capture a premium, developer-centric, and cozy nocturnal vibe, we adopt the popular **Tokyo Night** color scheme. This theme pairs deep, dark blues and purples with high-contrast, neon accents.

### Color Palette (Tailwind CSS v4 Configuration)

| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| **bg-night** | `#16161e` | Main page background (deepest dark) |
| **bg-storm** | `#1a1b26` | Card and component backgrounds |
| **bg-terminal** | `#24283b` | Hover states, active dropdowns, inner panels |
| **text-primary** | `#c0caf5` | Primary text and labels |
| **text-muted** | `#565f89` | Secondary text, placeholders, dates |
| **accent-cyan** | `#7dcfff` | Web / Links category accent |
| **accent-blue** | `#7aa2f7` | Movies & Series category accent |
| **accent-purple** | `#bb9af7` | Books category accent |
| **accent-red** | `#f7768e` | Video Games category accent |
| **accent-green** | `#9ece6a` | Completed state, success indicators |
| **accent-yellow** | `#e0af68` | Smart Suggester active state, highlights |

---

## 2. Layout & Interface Architecture

The app uses a dual layout structure optimized for both desktop and mobile screens.

### A. Sidebar / Bottom Navigation
- **Desktop (Sidebar):** Left navigation panel featuring the "MeInteresa" brand, filter views (All, Webs, Movies, Books, Games, Archive), and user profile.
- **Mobile (Bottom Navigation Bar):** Fills the bottom viewport with custom-styled tabs (Backlog, Suggester, Archive) and a **large, glowing central "+" button** that floats above the bar.

### B. The Quick Add Action & Adaptive Bottom Sheet
- **Floating "+" Trigger:** Styled with a neon bloom gradient (`#bb9af7` to `#7dcfff`). Pressing it slides a **Bottom Sheet (Mobile)** or opens a **Modal (Desktop)**.
- **Adaptive Form Fields:** The modal begins with a Category selector. Changing the category dynamically replaces the input fields:
  - **Webs/Links:** URL, Title, and Custom Tags.
  - **Movies/Series:** Title, Streaming Platform (dropdown), and Genre.
  - **Books:** Title, Author, Pages (optional).
  - **Video Games:** Title, Platform (console/PC), and Estimated Length (hours).
  - **All Categories:** Optional notes block.
- **Save Action:** Clicking "Añadir" stores the item in the local mock repository in a `pending` state. No database persistence is part of the MVP.

### C. The Grid: Reminder Cards
Each item is rendered as a stylized card with:
- **Left Border Accent:** 4px solid border colored by category (e.g., Purple for books, Cyan for webs).
- **Glassmorphism:** A subtle backdrop-filter blur over `bg-storm` with a thin border (`#24283b`).
- **Semantic Action Button:** Adapts depending on the category. Instead of a generic checkbox, the button transitions:
  - Web/Book -> *"Marcar como leído / Leído"*
  - Movie/Series -> *"Marcar como visto / Visto"*
  - Video Game -> *"Marcar como jugado / Jugado"*
- **Item Progression:** Support for three states: `pending` (to consume), `in_progress` (started, dynamic badge), and `completed` (archived).


---

## 3. The "Smart Suggester" Panel (Mock Recommendation View - Secondary Feature)

This is a complementary, secondary tool. Instead of taking over the main dashboard, it is kept separate within its own view (a tab on mobile, or sidebar route on desktop) as a helpful extra when you are undecided on what to consume next.

```
+--------------------------------------------------------------+
| 🧠 Smart Suggester                                           |
| "What should I focus on next?"                               |
|                                                              |
| I have: [ 15 min ]  [ 1 hour ]  [ 2+ hours ]                 |
| My mood is: [ Light ]  [ Intellectual ]  [ Energetic ]       |
|                                                              |
|  [ Recommend from mock backlog ]                             |
+--------------------------------------------------------------+
```

### Recommendation Cards (Mock Recommendation UX)
When recommendations are generated, the layout transforms to present exactly 3 options.
- **The "Why" Hook:** Instead of just showing the item, the card leads with a local mock reason:
  > *"Because you have 30 minutes and want something light, you should finish reading the article on WebUSB. It only takes 10 minutes and you left it at 80%."*
- **Call to Action:** An direct "Open link" or "Mark as in-progress" button that glows dynamically.

---

## 4. Typography & Visual Accents
- **Font Family:** `Outfit` (for headings/headers) and `Inter` (for content text) loaded from Google Fonts. Monospace font for tags: `JetBrains Mono`.
- **Glow Effects:** The primary floating "+" Add button at the center of the mobile navigation holds the highest visual weight with a prominent neon glow shadow (`box-shadow: 0 0 20px rgba(187, 154, 247, 0.5)`). Other key interaction points, like active category pills, use a more subtle neon bloom.
- **Scrollbars:** Styled to match Tokyo Night colors, ultra-thin, fading out when inactive.

---

## 5. Micro-interactions & Transitions

- **Card Hover:** Scale `1.02x` with a transition of `cubic-bezier(0.16, 1, 0.3, 1) 300ms` and a border color shift from `bg-terminal` to the category's accent color.
- **Item Archiving:** When marked as completed, the card animates with a slight skew and slides downwards, fading to `opacity: 0` before removal.
- **Suggester Loading:** A customized skeleton loading animation with a neon pulse wave traversing the card blocks while mock recommendations are prepared.

---

## 6. Screen Flows & Screen Specifications

Here are the details for the specific screens required in the initial MVP build:

### Screen A: Gateway / Foundation Screen (`/`)
* **Goal:** Introduce the application concept and route users into the mock UI without authentication.
* **Layout:** Centered, screen-height card layout.
* **UI Elements:**
  * **Brand Typography:** Large glowing header "MeInteresa" with a CSS gradient animation.
  * **Subtitle:** "Your bilingual personal backlog. Never forget that book, game, or link again."
  * **Navigation CTA:** A primary action that opens `/dashboard`.
* **State Variant:** No session handling or authentication redirects exist in the MVP.

### Screen B: Main Dashboard (`/dashboard`)
* **Goal:** Manage active reminders and track progression.
* **Layout:** Desktop Sidebar + Main Content / Mobile Bottom Navigation with Floating "+" Central Button.
* **UI Elements (Mobile Viewport):**
  * **Bottom Navigation Bar:** Dark background (`bg-storm`), thin top border (`bg-terminal`), containing tabs: "Pendientes" (Backlog), "Recomendador" (Suggester), "Archivo" (Archive).
  * **Floating Central Button:** Large glowing circular "+" button overlapping the bottom bar.
* **UI Elements (Main Content View):**
  * **Reminder Cards List:** Categorized items with left color borders. Each card has a progression action button:
    * Click once -> Moves from `pending` to `in_progress` (button text changes to "En Curso").
    * Click twice -> Moves to `completed` (fades out and moves to Archive).
  * **Quick Filters:** Fast category selector chips at the top of the dashboard.

### Screen C: Smart Suggester Tab (`/dashboard/suggest` or Dashboard Tab)
* **Goal:** Quick, low-friction mock recommendations based on user constraints.
* **Layout:** Centered card interface integrated seamlessly into the navigation flow.
* **UI Elements:**
  * **Time Selector Pills:** Options for 15 min, 30 min, 1 hour, or 2+ hours.
  * **Mood Selector Pills:** Options for "Ligero" (light), "Intelectual" (deep), or "Enérgico" (active).
  * **Action Button:** "Recommend from backlog" featuring a pulsing neon outline.
  * **Response Area:** Displays exactly 3 curated mock cards from the user's backlog with localized reasoning.

### Screen D: Archive Tab (`/dashboard/archive` or Dashboard Tab)
* **Goal:** History of completed content and visual feedback on accomplishments.
* **Layout:** Clean scrollable grid.
* **UI Elements:**
  * **Summary Indicators:** Grid showing total counters (e.g., "7 libros leídos", "4 juegos completados").
  * **History List:** Completed items showing a green checkmark and the completion action button labeled with its corresponding finished status (e.g., "Leído", "Visto", "Jugado").
  * **Restore Action:** Small option on each card to revert the status back to `pending`.
