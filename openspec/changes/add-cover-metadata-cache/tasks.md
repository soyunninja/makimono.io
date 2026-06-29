# Tasks: Add cover metadata cache

## Phase 1: Domain and persistence

- [x] Extend item types with optional cached cover metadata.
- [x] Sanitize persisted cover metadata while keeping older items valid.

## Phase 2: Lookup integration

- [x] Add provider-backed cover lookup helpers for supported categories.
- [x] Integrate lookup into add and edit flows with graceful fallback behavior.

## Phase 3: Visuals and verification

- [x] Render decorative card backgrounds from cached cover metadata on dashboard and archive cards.
- [x] Add tests for fallback rendering, cached metadata persistence, and lookup success/failure behavior.
- [x] Document optional environment variables for supported providers.
