## Exploration: Implement shadcn/ui MeInteresa web app

### Current State
The repository has OpenSpec scaffolding, `docs/design_brief.md`, and `untitled.op`, but no application scaffold, package manifest, source code, routing, styling setup, or test tooling. `openspec/config.yaml` confirms strict TDD is disabled because no runner, linter, type checker, formatter, or coverage tooling exists yet.

This means the first implementation slice must establish the app foundation before UI screens can be built safely. The proposal/spec should treat stack bootstrap, quality commands, and shadcn/ui setup as part of the change, not as pre-existing infrastructure.

Existing design inputs establish:
- Visual system: shadcn dark neutral tokens with Tokyo Night category accents.
- Primary categories: `series`, `movies`, `games`, `books`, `webs`.
- MVP screens/behaviors: dashboard, responsive mobile dashboard behavior, insert-series flow, and ES/EN language toggle.
- Component mapping: `Card`, `Button`, `Input`, `Label`, `Select`, `Textarea`, `Tabs` or `ToggleGroup`, `Sheet` or `Dialog`, and `Badge`.
- Layout rule: content cards/previews adapt height to content; inputs and buttons keep fixed accessible tap-target heights.

### Affected Areas
- `openspec/config.yaml` — current baseline says no stack or test tooling exists; later phases should update assumptions when a stack is introduced.
- `docs/design_brief.md` — source design brief for Tokyo Night UI direction, dashboard behavior, quick-add flow, category accents, and card states.
- `untitled.op` — OpenPencil design source already adapted toward shadcn/ui and mobile insert-series flow.
- `openspec/changes/implement-shadcn-meinteresa-ui/` — active SDD change folder for this implementation track.
- Future app scaffold, likely root package files and `src`/`app` structure — no such files exist yet.

### Approaches
1. **Bootstrap a modern React app with shadcn/ui first** — Create the web foundation, shadcn/ui configuration, styling tokens, and static MVP UI using local mock data.
   - Pros: Fastest path from current empty repo to reviewable UI; aligns directly with shadcn/ui; keeps backend/auth/AI out of the first slice.
   - Cons: Requires choosing the framework, package manager, and test/quality tools before feature work; persistence remains mocked.
   - Effort: Medium

2. **Build full product vertical slice immediately** — Scaffold app plus real persistence, auth, dashboard state transitions, insert flow, and language support in one change.
   - Pros: More end-to-end value if decisions are already final.
   - Cons: Too broad for an empty repo; high review risk; mixes infrastructure, UI, state, and persistence decisions before specs are clear.
   - Effort: High

3. **Prototype only static HTML/CSS from the design** — Build a minimal static page without committing to a framework or shadcn/ui integration.
   - Pros: Lowest setup complexity.
   - Cons: Conflicts with the shadcn/ui decision; likely throwaway work; delays real app architecture.
   - Effort: Low

### Recommendation
Use approach 1: bootstrap a modern React-based web app with shadcn/ui and deliver the first MVP UI slice with mock data. The recommended first slice is the dashboard shell plus category cards, responsive mobile navigation, ES/EN toggle, and an insert-series form surfaced through a `Sheet` on mobile and `Dialog` or routed form on desktop.

Recommended stack assumptions for proposal/spec:
- Next.js or Vite + React are the plausible shadcn/ui-compatible choices; Next.js is preferable if routing, future auth, and server-side persistence are expected soon.
- TypeScript should be part of the scaffold because shadcn/ui and category-specific form models benefit from typed discriminated unions.
- Tailwind CSS and shadcn/ui should provide the component and token layer; Tokyo Night colors should be semantic category accents, not a custom component library.
- Initial data should be local mock data with a clean boundary so later persistence can replace it.
- First quality baseline should add at least lint/typecheck/build commands; tests can be introduced once the framework is selected.

Category model and taxonomy for the first spec:
- Category IDs: `series`, `movies`, `games`, `books`, `webs`.
- Shared fields: `id`, `category`, `title`, `notes`, `status`, `createdAt`, optional `tags`.
- Status values: `pending`, `in_progress`, `completed`.
- Series-specific insert fields for the MVP example: `platform`, `season`, `episode`.
- Category actions should map to content semantics, e.g. watched for series/movies, read for books/webs, played for games.

### Risks
- Framework/package-manager choice is still unstated; proposal must make this explicit before implementation.
- shadcn/ui currently assumes project setup that does not exist; bootstrap and component installation are required first-class tasks.
- No current test/quality tooling exists, so verification cannot rely on existing commands.
- Language toggle scope is unclear: UI-only ES/EN strings now, or full i18n routing/persistence later.
- Backend, auth, database, and Gemini Smart Suggester are described in the design brief but should stay out of the first UI slice unless the user explicitly expands scope.
- The OpenPencil design is available as `untitled.op`, but there is no exported app-ready component spec in the repository; design translation will require judgment.

### Ready for Proposal
Yes. The next phase should create a proposal for `implement-shadcn-meinteresa-ui` that scopes the first change to app scaffold + shadcn/ui + static/mock-data MVP UI for dashboard, mobile dashboard behavior, insert-series flow, category taxonomy, and ES/EN toggle. The proposal should explicitly defer auth, database persistence, archive analytics, and Gemini recommendations unless the user chooses to include them.
