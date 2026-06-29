# Design: PocketBase auth repository

## Technical approach

1. Add a small PocketBase client module under `src/lib/` that:
   - reads `VITE_POCKETBASE_URL`
   - returns `null` when the URL is missing
   - exposes shared error helpers for auth/repository code
2. Add `PocketBaseAuthProvider` under `src/features/auth/`:
   - subscribes to `pb.authStore.onChange(..., true)`
   - exposes `enabled`, `isLoading`, `isAuthenticated`, `user`, `login`, `register`, and `logout`
   - wraps the app through `AppProviders`
3. Add `PocketBaseAuthGate` under `src/features/auth/`:
   - renders children unchanged when PocketBase is disabled
   - renders a minimal localized login/register form when enabled but unauthenticated
   - renders a localized loading state while `authStore` rehydrates
4. Add `createPocketBaseInterestRepository` under `src/features/items/`:
   - uses `getFullList({ sort: '-created' })`
   - maps PocketBase records into `InterestItem`
   - creates records with `user`, `category`, `title`, `status`, `notes`, `tags`, and cover metadata
   - preserves soft delete semantics with `deletedAt` updates instead of hard deletes
5. Add `useAppInterestRepository()` under `src/features/items/`:
   - returns localStorage fallback when PocketBase is disabled or no user is authenticated
   - returns the PocketBase repository when auth is active
6. Pass the resolved repository through dashboard/archive/add/edit route boundaries so authenticated flows stay on the same backend repository without mutating the existing local repository defaults used by tests.

## Constraints

- Existing localStorage tests and direct component tests must keep working.
- Generated route files remain untouched.
- No migration from localStorage is introduced in this slice.
- Archive behavior keeps the current soft-delete UX.

## Risks

- Route tests and direct component tests can break if auth context becomes mandatory everywhere, so auth access must stay optional outside the real app root.
- PocketBase field clearing must be explicit (`null`) so optional metadata can be removed reliably.
