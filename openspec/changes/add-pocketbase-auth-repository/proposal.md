# Proposal: Add PocketBase auth repository

## Intent

Add an explicit PocketBase-backed auth and `interests` persistence slice for the current MeInteresa setup while preserving browser-local fallback behavior when PocketBase is not configured.

## Scope

- Add a PocketBase client wrapper keyed by `VITE_POCKETBASE_URL`.
- Add login/register/logout session handling through PocketBase `authStore`.
- Gate dashboard/archive routes behind auth only when PocketBase is enabled.
- Implement a PocketBase `InterestRepository` that stores authenticated users' `interests` records with soft-delete semantics.
- Keep localStorage behavior unchanged when PocketBase is disabled.
- Document the required environment variable and collection import JSON.

## Approval notes

This change is the explicit later spec approval required by the architecture rule for a narrow backend slice:

- Auth is limited to PocketBase users.
- Database writes are limited to the `interests` collection already imported by the user.
- Recommendation/AI work remains deferred.
- No secrets are committed; only the public PocketBase URL is read from Vite env.
