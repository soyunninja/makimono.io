# Proposal: Add cover metadata cache

## Intent

Add optional client-side cover artwork lookup for interest items so dashboard and archive cards can reuse cached artwork without introducing any backend, auth, sync, or database layer.

## Scope

- Extend `InterestItem` with optional cached cover metadata.
- Keep persistence behind `InterestRepository` and browser localStorage.
- Allow optional external lookups only during add/edit flows and only when provider configuration is present.
- Fall back to the existing category-colored cards when lookups are skipped, fail, or return no match.

## Approval notes

This change is the explicit later spec approval required by the MVP architecture rule for a narrow external integration slice:

- External requests are client-side only.
- No secrets are committed.
- No server, auth, sync, or database work is introduced.
- Lookups are cached on the item record to avoid repeated provider calls.
