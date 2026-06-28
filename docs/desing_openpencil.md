# Design System: Untitled

## 1. Visual Theme & Atmosphere

A dark, focused, neon-accented dashboard with a polished personal productivity feel. The atmosphere is cinematic and slightly futuristic, using deep charcoal surfaces, bright anime-inspired accent colors, and compact spacing. The interface feels organized, energetic, and personalized, with a strong sense of hierarchy between navigation, content, and recommendation areas.

## 2. Color Palette & Roles

- **Midnight Canvas** (#09090b) — Main application background.
- **Charcoal Surface** (#18181b) — Sidebar, cards, inactive navigation items, and main panels.
- **Elevated Slate** (#27272a) — Active states, user profile block, language toggle, pills, and secondary panels.
- **Muted Border** (#3f3f46) — Subtle control border for compact UI elements.
- **Panel Border** (#27272a) — Default divider and card border.
- **Bright Text** (#fafafa) — Primary text, headings, active labels, and high-emphasis content.
- **Muted Text** (#a1a1aa) — Secondary descriptions, metadata, and helper text.
- **Dark Button Text** (#16161e) — Text and icon color over bright gradient buttons.
- **Lavender Signal** (#bb9af7) — Active navigation highlight, book category, selected filters, and brand accent.
- **Cyan Signal** (#7dcfff) — Web category, secondary language emphasis, and cool icon accents.
- **Blue Signal** (#7aa2f7) — Movie category and related icon/filter accents.
- **Rose Signal** (#f7768e) — Games category and high-energy category accents.
- **Amber Signal** (#e0af68) — Series category, Gemini/suggester emphasis, and recommendation accents.

## 3. Typography Rules

Use **Outfit** for expressive brand and section headings, with heavy weights for confident hierarchy. Use **Inter** for interface labels, buttons, body copy, and metadata. Use **JetBrains Mono** for compact filter pills and categorical controls.

Headings are large and bold, around 34px for main page titles and 23–28px for brand or panel titles. Navigation labels and buttons sit around 14–15px with strong weight. Supporting text uses 12–13px with medium weight and muted color. Line height should feel compact but readable, especially inside cards and side panels.

## 4. Component Stylings

- **Buttons**: Subtly rounded rectangles with strong contrast. Primary actions use a bright gradient with dark text and a soft shadow. Secondary buttons use elevated charcoal surfaces with colored borders for emphasis.
- **Cards**: Dark charcoal surfaces with thin muted borders, subtly rounded corners, and generous internal padding. Category cards use a narrow colored accent strip on the left to communicate type quickly.
- **Inputs**: Not directly shown, but should follow the same language as secondary controls: dark filled backgrounds, muted borders, compact height, and bright focus accents.
- **Navigation**: Vertical sidebar navigation with compact rounded rows, icon-first labels, and category-specific icon colors. Active navigation uses a stronger surface, lavender border, and bright text.
- **Pills**: Fully rounded capsules with compact padding. Active pills use stronger borders and bright text; inactive category pills use dark surfaces and category-colored labels.
- **Recommendation Panel**: A dedicated elevated card with amber emphasis, soft shadow, compact controls, and a nested recommendation card for output.

## 5. Layout Principles

The layout uses a two-column desktop structure: a fixed sidebar on the left and a flexible main workspace on the right. Spacing is deliberate and rhythmic, with 24px gaps between major regions, 16px gaps inside content groups, and compact 8–10px spacing inside controls.

The main content uses a header-first hierarchy, followed by quick filters, then a horizontal content grid. Cards align in vertical stacks, while the suggester panel remains a fixed-width companion area. Whitespace should feel calm and structured, not sparse. Responsive behavior should collapse the sidebar and stack the grid on smaller screens while preserving the strong category-color system.

## 6. Design System Notes

Use language that feels personal, curated, and backlog-oriented: “personal backlog,” “active items,” “quick filters,” “smart suggester,” and “recommendation.” New designs should preserve the dark cinematic base, compact dashboard density, bright category accents, rounded interactive elements, and clear separation between navigation, content, and AI-assisted suggestions.