# Apply progress: Add cover metadata cache

## Completed

- Extended the item domain and repository helpers with optional cached cover metadata.
- Sanitized localStorage hydration so invalid cover fields are dropped while older items remain valid.
- Added optional provider lookups for TMDB, RAWG, and MusicBrainz/Cover Art Archive.
- Wired cover resolution into add/edit cover search controls with timeout-based graceful fallback.
- Switched cover selection to an explicit preview-and-keep/remove workflow in add/edit so users decide whether a found cover should be persisted.
- Added decorative cover background layers to dashboard and archive item cards.
- Added automated tests for rendering, persistence, and lookup success/failure paths.

## Verification

- `npx pnpm typecheck`
- `npx pnpm test`
- `npx pnpm build`
