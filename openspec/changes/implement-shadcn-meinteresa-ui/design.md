# Design: Implement shadcn/ui Kyoumi UI

Build a TanStack Start + React + TypeScript mock UI with Tailwind CSS v4, shadcn/ui primitives, browser-local mock data, and replaceable service boundaries. This keeps the MVP aligned with `web-app-foundation` and `meinteresa-mock-ui` while explicitly deferring server-side persistence, auth, database, and real Gemini calls.

## Technical Approach

Use TanStack Start because the intended future stack is TanStack-based, it provides typed file-based routing, Vite integration, SSR/server-function paths for later work, and avoids designing around Next.js-only assumptions. The current change remains mock-first: user actions stay inside the browser-local repository boundary and avoid server-side dependencies.

## Architecture Decisions

| Area | Alternatives considered | Decision and rationale |
|------|-------------------------|------------------------|
| App stack | Next.js, Vite SPA, static HTML | TanStack Start + React + TypeScript. It fits the confirmed future stack while still supporting fast mock UI delivery. |
| Styling | Tailwind v3 config, custom CSS system | Tailwind CSS v4 CSS-first setup with `@import "tailwindcss"`, `@theme`, and shadcn CSS variables. This matches current Tailwind/shadcn direction. |
| UI system | Custom primitives, shadcn/ui | Compose shadcn/ui components copied into `src/components/ui`; product components stay separate. |
| Data | Inline arrays, global store, repository boundary | Mock repositories/services behind interfaces so Turso/Drizzle/Auth/Gemini can replace adapters later. |
| i18n | Route locales, i18n library | Lightweight ES/EN dictionaries and React provider; no locale routing or persistence in MVP. |

## Routing

TanStack Start routes live under `src/routes`:

| Route file | URL | Purpose |
|------------|-----|---------|
| `src/routes/__root.tsx` | layout | Root document, app shell, CSS import, providers. |
| `src/routes/index.tsx` | `/` | Redirect/render dashboard entry. |
| `src/routes/dashboard.tsx` | `/dashboard` | Backlog dashboard with filters and cards. |
| `src/routes/dashboard.add.tsx` | `/dashboard/add` | Routed add flow fallback/deep link; dashboard trigger may present Sheet/Dialog. |
| `src/routes/dashboard.archive.tsx` | `/dashboard/archive` | Mock completed/history view. |
| `src/routes/dashboard.suggest.tsx` | `/dashboard/suggest` | Smart Suggester mock flow. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json`, lockfile | Create | Scripts, TanStack Start, React, TypeScript, Tailwind, shadcn deps. |
| `vite.config.ts`, `tsconfig.json`, `components.json` | Create | Vite/TanStack, path aliases, shadcn `style: "new-york"`, `baseColor: "neutral"`, `rsc: false`, `cssVariables: true`. |
| `src/routes/*` | Create | Typed routes and shell. |
| `src/styles/app.css` | Create | Tailwind v4 import, `@theme`, shadcn variables, Tokyo Night accents. |
| `src/components/ui/*` | Create | shadcn primitives. |
| `src/components/app/*` | Create | App shell, nav, language toggle. |
| `src/features/items/*` | Create | Types, mock repository, cards, filters, adaptive add flow. |
| `src/features/suggester/*` | Create | Mock time/mood suggestions, exactly 3 results. |
| `src/i18n/*`, `src/lib/*` | Create | Dictionaries, provider, helpers. |
| `vitest.config.ts`, `src/test/*` | Create | Test setup. |

## Data Flow

```text
mock repositories/services -> feature hooks/state -> TanStack routes -> shadcn-composed UI
             |                         |                    |
       future adapters            local-only mutations      ES/EN provider
```

## Interfaces / Contracts

```ts
type Category = "series" | "movies" | "games" | "books" | "music" | "podcasts";
type Status = "pending" | "in_progress" | "completed";
type Locale = "es" | "en";

type InterestItem = {
  id: string;
  category: Category;
  title: string;
  status: Status;
  notes?: string;
  tags?: string[];
  createdAt: string;
};
```

Category metadata drives labels, accent color, completion verb, and add-field groups. The add flow shares submit/cancel behavior while swapping fields per category. Cards grow with content; controls keep accessible fixed heights.

## Deferred Future Integrations

- Turso + Drizzle: replace mock repositories with typed database adapters and migrations.
- Auth.js/NextAuth-style auth: add session provider, protected routes, user ownership, and Turso-backed auth tables.
- Vercel AI SDK + Gemini API: replace mock suggester service with streamed/generated recommendations, prompt safety, and error states.
- Server-backed persistence and archive analytics: add durable cross-device status transitions, restore behavior, and history summaries.

## Testing Strategy

| Layer | What to test | Approach |
|-------|--------------|----------|
| Unit | category metadata, i18n lookup, mock service contracts | Vitest. |
| Component | language toggle, filters, adaptive add fields, exactly 3 suggester cards | Testing Library + jsdom. |
| Build/quality | routes compile and app builds | `pnpm typecheck`, `pnpm test`, `pnpm build`; lint if scaffold adds it. |
| Responsive/visual | desktop/mobile shell, wrapping cards | Manual MVP verification against OpenPencil/design brief; Playwright deferred. |

## Migration / Rollout

No migration required. The existing browser-local repository and storage namespace remain in place.

## Risks and Tradeoffs

- TanStack Start is less shadcn-documented than Next.js, so setup must follow Vite-compatible shadcn conventions.
- Mock boundaries add a little structure now but reduce replacement cost for Turso/Auth/Gemini later.
- Lightweight i18n is intentionally limited; pluralization, locale routing, and saved language preference are deferred.
- Future Auth.js naming may differ outside Next.js; validate the exact TanStack Start integration in the later auth change.

## Open Questions

- [ ] None blocking.
