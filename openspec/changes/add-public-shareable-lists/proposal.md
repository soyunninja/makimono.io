# Proposal: Add Public Shareable Lists

## Intent

Create the first public-list foundation so authenticated users can publish a read-only list and share it through a stable public URL without exposing private auth data or enabling copy/import behavior yet.

## Scope

### In Scope
- Public list aggregate with publish state, owner reference, slug, title, date, description, and read-only item display data.
- Public route using username plus slug, for example `/u/{username}/lista/{slug}`.
- Owner identity display with avatar, username/name fallback, email-prefix public-name fallback, and initial-on-gradient avatar fallback.
- Privacy boundary that never renders email publicly, only the derived prefix when no username exists.

### Out of Scope
- Import/copy of full public lists.
- Import/copy of selected items or events.
- Editing from the public page.
- Comments, likes, follows, social graph, or collaboration.

## Capabilities

### New Capabilities
- `public-shareable-lists`: Published list URLs, read-only public list rendering, owner identity fallback behavior, and public/private privacy boundaries.

### Modified Capabilities
- None.

## Approach

Add a dedicated public-list model and repository path instead of reusing the private `InterestRepository`. Keep authenticated publishing separate from public read access. Resolve the public owner identity from the existing safe public profile boundary, deriving only a display prefix from email when username is unavailable and never exposing the full email.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/items/` | New | Public list types, repository boundary, and publish-state behavior. |
| `src/routes/` | New | Username-and-slug public list route. |
| `src/features/auth/` | Modified | Safe owner identity projection for public display fallbacks. |
| `src/i18n/` | Modified | Public list labels, empty states, and privacy-safe copy. |
| `src/test/` | Modified | Behavior coverage for public access, fallbacks, and privacy boundaries. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Private data leaks through public rendering | Medium | Use a dedicated public projection; test that email is never rendered. |
| Slug collisions break public URLs | Medium | Define username-scoped slug uniqueness. |
| First slice grows into import UX | Medium | Keep copy/import explicitly deferred. |

## Rollback Plan

Disable or remove the public route and publish entry point, leaving private dashboard item behavior untouched because the public aggregate is separate from private interests.

## Dependencies

- Existing PocketBase auth and public profile fields for username/avatar.
- Future PocketBase schema/rules for public list persistence and read access.

## Success Criteria

- [ ] A published list can be viewed read-only at a username-and-slug public URL.
- [ ] Public page shows owner avatar/fallback, public name fallback, title, date, and description.
- [ ] No public UI renders full email or private authenticated user data.
- [ ] Import, copy, editing, social, and collaboration features remain absent.
