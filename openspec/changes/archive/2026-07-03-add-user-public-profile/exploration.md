## Exploration: Add user public profile

### Current State
The app already has authenticated users through PocketBase, but the auth layer only treats the current user as a loose `PocketBaseAuthRecord` with `id` and optional `email`. The only authenticated user-facing settings surface is `src/features/settings/settings-screen.tsx`, which currently offers language toggle, logout, and version info.

There is no public profile model, no avatar/handle UI, and no dedicated profile route. The dashboard chrome already has a settings entry, so the existing `/dashboard/settings` route is the natural insertion point for the first slice. Public sharing is not implemented yet, and email is only present in the private auth record.

### Affected Areas
- `src/lib/pocketbase.ts` — current auth record typing is too loose for a public/private profile split.
- `src/features/auth/pocketbase-auth-provider.tsx` — exposes the current user object and will need a clearer profile boundary.
- `src/features/settings/settings-screen.tsx` — best existing surface for an initial public profile card.
- `src/routes/dashboard.settings.tsx` — route entry point for the settings/profile experience.
- `src/components/app/dashboard-overflow-menu.tsx` — already links to settings; no new nav likely needed for slice 1.
- `src/i18n/*` — new labels for handle/avatar/profile copy will be needed.
- `src/routeTree.gen.ts` — generated; only relevant if a future dedicated profile route is added.

### Approaches
1. **Extend settings with a public profile card** — add a profile section inside the existing settings screen, backed by a typed public-profile subset (handle/username, avatar, optional display name), while keeping email private.
   - Pros: smallest reviewable slice; reuses existing authenticated route; sets the identity foundation before list sharing.
   - Cons: mixes account settings and profile concerns in one screen; public profile page still absent.
   - Effort: Low

2. **Create a dedicated profile feature and route** — add `src/features/profile/*` plus a separate profile page, then link it from settings.
   - Pros: cleaner long-term separation between account settings and public identity.
   - Cons: more routing/UI work up front; larger first slice; unnecessary before list sharing exists.
   - Effort: Medium

### Recommendation
Use approach 1 for the first slice. Add a public-profile card to the existing settings screen and model the public identity explicitly so only approved fields can be displayed publicly. Keep the initial scope to identity foundation: username/handle requirement, avatar, and private/public field separation. Do **not** build list sharing, public list pages, or any public exposure of email yet.

### Risks
- The current auth record type is permissive, so missing explicit public/private modeling could leak email or other private fields later.
- Avatar and handle rules need validation constraints early, or the first slice may bake in weak data shapes.
- A future public profile route may be needed for sharing, but adding it now would expand scope beyond the requested foundation slice.

### Ready for Proposal
Yes. The next phase should turn this into a proposal focused on a minimal profile foundation in settings, with explicit private/public field boundaries and no list-sharing behavior.
