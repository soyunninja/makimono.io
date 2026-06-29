# Tasks: Implement shadcn/ui Kyoumi UI

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~1,200-1,800 |
| 400-line budget risk | High |
| 2500-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 scaffold/tooling → PR 2 tokens/data/i18n → PR 3 dashboard/add/suggester → PR 4 verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Scaffold TanStack Start + TS + Tailwind v4 + shadcn baseline | PR 1 | `package.json`, lockfile, `vite.config.ts`, `tsconfig.json`, `components.json`, app shell, CSS tokens |
| 2 | Define mock item boundary and ES/EN provider | PR 2 | item types, mock repo, dictionaries/provider, category metadata |
| 3 | Build dashboard, adaptive add flow, and suggester | PR 3 | responsive cards, Sheet/Dialog form, exactly 3 recommendations, route wiring |
| 4 | Verify app behavior and clean up | PR 4 | Vitest/Testing Library, build/typecheck, responsive manual checklist |

## Phase 1: Foundation

- [x] 1.1 Create `package.json`, lockfile, `vite.config.ts`, `tsconfig.json`, and `components.json` for TanStack Start + React + TypeScript + Vite.
- [x] 1.2 Add `src/styles/app.css` with Tailwind CSS v4 import, `@theme` tokens, and shadcn-neutral variables mapped to Tokyo Night accents.
- [x] 1.3 Scaffold `src/routes/__root.tsx` and `src/routes/index.tsx` with the app shell and CSS/provider wiring.

## Phase 2: Shared UI and Mock Boundaries

- [x] 2.1 Copy the shadcn/ui primitives needed for cards, buttons, inputs, labels, selects, textareas, tabs/toggle, sheet/dialog, and badges into `src/components/ui/`.
- [x] 2.2 Add `src/features/items/*` with category/status types, category metadata, and a local mock repository interface.
- [x] 2.3 Add `src/i18n/*` for ES/EN dictionaries plus a lightweight provider and `useLocale` helper.

## Phase 3: Product Screens

- [x] 3.1 Build `src/routes/dashboard.tsx` plus feature components for responsive category cards, filters, and status actions.
- [x] 3.2 Implement the adaptive add flow in `src/routes/dashboard.add.tsx` and `src/features/items/add-*` using mobile Sheet / desktop Dialog behavior.
- [x] 3.3 Implement `src/routes/dashboard.suggest.tsx` and `src/features/suggester/*` to return exactly 3 mock recommendations with reason + CTA.
- [x] 3.4 Wire language toggle and archive fallback routes so visible UI text switches without routing or persistence.

## Phase 4: Verification / Commit Units

- [x] 4.1 Add Vitest + Testing Library setup and tests for i18n lookup, mock repository contract, and category metadata.
- [x] 4.2 Add component tests for language toggle, adaptive add fields, and exactly 3 suggester cards.
- [x] 4.3 Verify `pnpm typecheck`, `pnpm test`, `pnpm build`, and a manual mobile/desktop pass against the spec scenarios.
- [x] 4.4 Keep each phase aligned to work-unit commits so PRs stay reviewable and test-backed.

Current local evidence is now aligned to reviewable work units. The local stack is:

1. `chore: scaffold TanStack Start baseline`
2. `feat: add mock item domain`
3. `feat: add shadcn UI primitives`
4. `feat: add dashboard backlog flow`
5. `feat: add adaptive item creation flow`
6. `feat: add mock suggester flow`
7. `feat: add language toggle and archive fallback`
8. `docs: add SDD evidence and README`

No remote/base branch is configured, so stacked PR cleanliness against a real compare target still cannot be proven, but the local history now matches the documented work-unit slices and keeps verification with each unit.
