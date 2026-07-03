# Design: Add User Public Profile

## Technical Approach

Add a minimal authenticated profile editor in Settings that derives a safe public-profile model from the PocketBase auth record. The UI will render only the centered avatar and username, while edit controls remain inside the settings/account area. Avatar uploads accept original user-selected images up to 5 MB, then normalize in the browser to a static 200x200 WebP up to 200 KB before updating the PocketBase `users` record.

Non-goals for this slice: bio, display name, list sharing, and a dedicated public profile route.

## Architecture Decisions

| Topic | Choice | Alternatives considered | Rationale |
|------|--------|-------------------------|-----------|
| Public/private boundary | Add an explicit `UserPublicProfile` derived from the auth record with only `username` and `avatarUrl`/avatar state. Keep `id`, `email`, auth metadata, and future fields out of public-profile props. | Passing `PocketBaseAuthRecord` into profile UI. | Prevents accidental private-field rendering and makes future fields non-public by default. |
| Feature placement | Keep profile-safe types/helpers under `src/features/auth/`; keep the settings-only card under `src/features/settings/`. | New top-level profile route/feature. | This slice edits the authenticated account only and explicitly does not add a public route. |
| Avatar processing | Use browser image APIs (`createImageBitmap`/image element + canvas) to validate input <=5 MB, crop/resize to 200x200, and output WebP <=200 KB. | Store originals or add a new image dependency. | Meets exact size/format budgets with no new runtime dependency; animated GIFs become a first-frame static image. |
| PocketBase storage | Store `username` on `users` as a unique handle-like text field and `avatar` as a single file field accepting stored WebP only. | Separate profile collection. | The current app already authenticates against `users`; a separate collection adds join/rule complexity before sharing exists. |

## Data Flow

```text
SettingsScreen
  -> PublicProfileCard
  -> validate selected file: jpg/jpeg/png/gif/webp, <=5 MB
  -> normalize to 200x200 static avatar.webp, <=200 KB
  -> PocketBase users/{authUser.id} PATCH FormData(username, avatar)
  -> auth store refreshes derived UserPublicProfile
```

If no avatar exists, render a deterministic local fallback avatar (initial/placeholder surface) instead of storing a generated file.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/features/auth/public-profile.ts` | Create | Safe profile types, auth-record mapper, username normalization/validation. |
| `src/features/auth/avatar-normalization.ts` | Create | Client-side input validation, image decode, center-crop resize, WebP output size/type checks. |
| `src/features/auth/pocketbase-auth-provider.tsx` | Modify | Expose `publicProfile` and `updatePublicProfile`; refresh auth store after profile update without exposing raw records to settings UI. |
| `src/lib/pocketbase.ts` | Modify | Narrow auth record typing, add FormData request support, and add a file URL helper for avatar files. |
| `src/features/settings/settings-screen.tsx` | Modify | Add account/profile card with centered avatar, username below, and edit/upload controls only in settings. |
| `src/i18n/dictionaries.ts` | Modify | Add EN/ES labels and validation/error copy. |
| `docs/pocketbase-collections.json` | Modify | Document required `users.username` and `users.avatar` schema/rules after PocketBase export. |
| `*.test.*` near changed files | Modify/Create | Cover mapper, avatar pipeline, provider update, and settings card behavior. |

## Interfaces / Contracts

```ts
type UserPublicProfile = {
  username: string
  avatarUrl: string | null
}

type UpdatePublicProfileInput = {
  username: string
  avatarFile?: File | null
}
```

`avatarUrl` is the UI-facing representation of the public `avatar` field. It is a URL/string contract only and must not carry PocketBase file metadata or private account fields.

PocketBase rules, high level: only the authenticated owner may update their `users` record profile fields; username is trimmed/lowercased, unique, 3-30 chars, and matches a safe handle pattern; avatar is optional, single-file, WebP-only, and capped to 200 KB. PocketBase rejects direct unsupported stored uploads; the client accepts jpg/jpeg/png/gif/webp inputs up to 5 MB and stores only normalized WebP.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | Public mapper excludes email/id/bio/displayName/list fields. | Vitest table cases against unknown auth records. |
| Unit | Avatar validation rejects unsupported files and outputs static 200x200 WebP. | Mock browser image/canvas APIs in jsdom. |
| Integration | Profile update sends FormData and refreshes derived public profile. | Provider tests with mocked MinimalPocketBase client. |
| Component | Settings card layout, fallback avatar, localized errors, no private copy. | Testing Library assertions in `settings-screen.test.tsx`. |
| Verification | Full project safety. | Run `npx pnpm test`, `npx pnpm typecheck`, and `npx pnpm build`; manually verify PocketBase schema/rules. |

## Migration / Rollout

PocketBase schema/rules must be updated before UI rollout. No application data migration is required; existing users can keep an empty avatar and set username through Settings.

## Review Budget

First slice should target the 400 changed-line budget by keeping only settings UI, auth/profile helpers, and focused tests. If avatar pipeline tests or PocketBase docs push the forecast over budget, split schema/docs plus type boundaries before UI polish.

## Open Questions

None.
