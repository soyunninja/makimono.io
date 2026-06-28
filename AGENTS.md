# MeInteresa Coding Standards

Use this file as the project-level review contract for automated and human checks.

## TypeScript

- Keep `strict` TypeScript enabled.
- Prefer explicit domain types for shared data structures.
- Avoid `any`; use `unknown` plus narrowing when a value is genuinely dynamic.
- Keep generated route files generated; do not hand-edit `src/routeTree.gen.ts` except through the router tooling.

## React

- Use function components and named exports for reusable UI.
- Keep feature components close to their feature folder.
- Keep route files thin; move behavior into feature components.
- Test visible behavior, not implementation details.

## Styling

- Use Tailwind CSS v4 tokens and shadcn-compatible CSS variables.
- Reuse primitives from `src/components/ui/` before adding custom controls.
- Keep responsive behavior explicit and covered by tests or documented manual checks.

## Architecture

- Keep the MVP mock-only: no persistence, authentication, backend calls, or Gemini integration unless a later spec explicitly adds them.
- Keep item-domain logic under `src/features/items/` and localization under `src/i18n/`.
- Preserve small review slices; do not mix dashboard, add-flow, suggester, and verification work in one change without explicit approval.
- The initial repository baseline may contain multiple previously approved SDD slices when `openspec/changes/*/tasks.md` and `apply-progress.md` document the slice boundaries, verification, and remaining work.

## Verification

- Run `npx pnpm typecheck`, `npx pnpm test`, and `npx pnpm build` before review-ready commits.
- Document any manual mobile/desktop inspection limitations instead of claiming unsupported QA.
- Automated review hooks may exclude test files from the reviewed code list; when they do, verify behavior evidence in committed `*.test.*` files and OpenSpec/apply-progress artifacts before treating UI behavior as untested.
