# Design: Cover metadata cache

## Technical approach

1. Extend the item domain with optional `coverImageUrl`, `coverProvider`, and `coverMatchedTitle` fields.
2. Keep repository writes local by storing those fields directly on `InterestItem` in localStorage.
3. Add a dedicated cover lookup module under `src/features/items/`:
   - TMDB for `series` and `movies` using `VITE_TMDB_ACCESS_TOKEN` or `VITE_TMDB_API_KEY`
   - RAWG for `games` using `VITE_RAWG_API_KEY`
   - Open Library Search + Covers for `books` without secrets
   - MusicBrainz + Cover Art Archive for `music` without secrets
4. Resolve cover metadata only when the user explicitly requests a cover search during add/edit, show the result before save, and swallow failures so local item writes still complete.
5. Render cover art as a decorative background layer under translucent category color overlays in dashboard and archive item cards.

## Constraints

- Local/mock-first remains intact because the repository stays browser-local and the feature degrades cleanly when lookups are unavailable.
- Persisted items without cover fields remain valid.
- Invalid stored cover fields are sanitized instead of breaking item hydration.

## Risks

- Third-party rate limits or outages may skip artwork for some saves.
- Music matching is best-effort because titles may combine artist and release names.
