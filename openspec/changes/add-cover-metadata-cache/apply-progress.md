# Apply progress: Add cover metadata cache

## Completed

- Extended the item domain and repository helpers with optional cached cover metadata.
- Sanitized localStorage hydration so invalid cover fields are dropped while older items remain valid.
- Added optional provider lookups for TMDB, RAWG, and MusicBrainz/Cover Art Archive.
- Wired cover resolution into add/edit submit flows with timeout-based graceful fallback.
- Added decorative cover background layers to dashboard and archive item cards.
- Added automated tests for rendering, persistence, and lookup success/failure paths.

## Verification

- `npx pnpm typecheck`
- `npx pnpm test`
- `npx pnpm build`
