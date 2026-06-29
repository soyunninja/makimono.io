# Proposal: Implement shadcn/ui Kyoumi UI

## Intent

Build the first reviewable Kyoumi web UI: a responsive, bilingual, mock-data-only app that translates the OpenPencil/design brief direction into shadcn/ui components. The repo has no app scaffold, so this change must establish the UI foundation before server persistence, auth, or real AI work.

## Scope

### In Scope
- Bootstrap a React/TypeScript UI foundation with Tailwind and shadcn/ui.
- Mock dashboard for `series`, `movies`, `games`, `books`, `music`, and `podcasts` with adaptive content cards and status actions.
- Add flow with category selector and category-specific fields.
- Real ES/EN text toggle within the mock app.
- Smart Suggester mock with time/mood controls and exactly 3 mock recommendations.
- Equal desktop and mobile priority.

### Out of Scope
- Server-side persistence, auth, backend APIs, real Gemini calls, analytics, archive reporting, deployment.

## Capabilities

### New Capabilities
- `web-app-foundation`: App scaffold, Tailwind/shadcn setup, semantic tokens, and quality commands.
- `meinteresa-mock-ui`: Mock dashboard, category cards, add flow, language toggle, and suggester behavior.

### Modified Capabilities
- None; no existing `openspec/specs/` capabilities exist.

## Approach

Use local mock data behind a replaceable boundary. Map shadcn dark neutral tokens to Tokyo Night category accents instead of creating a custom component library. Prefer shadcn `Card`, `Button`, `Input`, `Label`, `Select`, `Textarea`, `Tabs`/`ToggleGroup`, `Sheet`/`Dialog`, and `Badge`. Cards/previews grow with content; inputs/buttons keep fixed accessible tap-target height.

## User-Facing Behavior

- Users see a backlog dashboard with category filters and status-aware action labels: read, watched, played, listened, or in-progress.
- The add trigger opens a mobile Sheet and desktop Dialog or routed modal; fields adapt after category selection.
- ES/EN toggle switches visible mock UI text without routing or persistence.
- Smart Suggester lets users choose time and mood, then displays exactly 3 mock recommendations with a reason and CTA.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, app source | New | App foundation and commands |
| `components/`, `app/` or `src/` | New | shadcn UI screens/components |
| `openspec/changes/implement-shadcn-meinteresa-ui/` | Modified | SDD artifacts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Framework/package manager not chosen | Medium | Resolve in design before tasks |
| Empty repo lacks quality baseline | Medium | Add lint/typecheck/build commands with scaffold |
| Mock UI overbuilds future backend | Medium | Keep data boundary local and replaceable |
| Design translation drift | Low | Use `docs/design_brief.md` and OpenPencil decisions as source |

## Rollback Plan

Remove the generated app scaffold, shadcn files, package manifests, and this change's OpenSpec artifacts; any browser-local data can be cleared by removing the existing storage entry.

## Dependencies

- shadcn/ui-compatible React + TypeScript stack decision in design phase.
- Existing `docs/design_brief.md` and OpenPencil UI decisions.

## Success Criteria

- [ ] Mock UI covers all six categories on desktop and mobile.
- [ ] Add form adapts per category while keeping saves browser-local only.
- [ ] ES/EN toggle changes visible copy.
- [ ] Smart Suggester returns exactly 3 mock recommendations.
- [ ] shadcn components/tokens are used consistently.

## Recommended Next Phase

Run `sdd-spec` to formalize `web-app-foundation` and `meinteresa-mock-ui` behavior.
