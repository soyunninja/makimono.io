# Proposal: Rich Public List Composer

## Intent

Bring public-list composition and viewing to dashboard parity while preserving boundaries: list-only items stay in the list snapshot, and copying creates a new personal dashboard interest with status `pending`.

## Scope

### In Scope
- Use the full dashboard drawer/form fields: title, category, cover, notes, and tags.
- Keep new editor-created items scoped only to that public list.
- Support `cards`, `list`, and `covers` on public pages.
- Add a per-item copy action from public list to authenticated user's dashboard.
- Keep public reads login-free; auth-gate only copy.

### Out of Scope
- Social features: collaboration, comments, likes, follows, feeds, discovery, analytics.
- Automatic sync from public-list-only items into the owner's dashboard.
- Dashboard lifecycle changes beyond copied items starting as `pending`.
- New collections, broad schema redesign, or unrelated list-management work.

## Impacted Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `public-list-composition`: rich list-only composition, public display modes, and copy-to-dashboard behavior.

## Delivery Approach

Treat the dashboard drawer/form as the product baseline with target-specific submits: dashboard flows affect private interests; public-list flows update only the list snapshot. Reuse the display-mode model through public read-only renderers. Copying maps public item fields into a new personal `pending` interest and prompts login when needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/items/add-flow.tsx` | Modified | Drawer/form baseline. |
| `src/features/items/public-list-editor-screen.tsx` | Modified | Rich list-only composition. |
| `src/features/items/public-list-page.tsx` | Modified | Display modes and copy. |
| `src/features/items/public-list-types.ts` | Modified | Snapshot mapping. |
| `src/features/items/*repository*` | Modified | Snapshot persistence and dashboard copy. |
| `src/routes/u.$username.lista.$slug.tsx` | Modified | Public read; auth-gated copy. |

## Acceptance Criteria

- [ ] Owners can create public-list-only items with dashboard-equivalent visible fields.
- [ ] Public-list-only items stay out of private dashboard interests unless copied.
- [ ] Public list pages support cards, list, and covers displays.
- [ ] Each public item offers copy-to-dashboard.
- [ ] Copy creates a personal `pending` interest or prompts login.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Drawer reuse regresses dashboard. | Medium | Slice changes; preserve dashboard tests. |
| Public pages expose private actions. | Medium | Public renderers stay read-only except copy. |
| Working tree is already dirty with unrelated changes. | High | Modify only this proposal. |

## Rollback Plan

Before implementation, remove this proposal. After implementation, revert the affected slice so public reads and dashboard flows return to prior behavior.

## Open Questions

- Should public display preference be per-session, per-user, or default-only?
- Should copy preserve cover metadata exactly or allow edit-before-save?
