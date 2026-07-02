# Proposal: Add User Public Profile

## Intent

Create the minimal public identity foundation needed before shareable lists: a public username and avatar, with email and private account data kept out of public surfaces.

## Scope

### In Scope
- Public profile identity model with username and public avatar representation only; UI contracts may call the derived representation `avatarUrl`, but it must not expose private file metadata.
- Settings-based profile card showing centered avatar with username underneath.
- PocketBase-backed avatar file field with client and PocketBase-side validation.
- Avatar normalization before storage: accept original `jpg`, `jpeg`, `png`, `gif`, `webp` inputs up to 5 MB; store static `200x200` WebP up to 200 KB.

### Out of Scope
- Public shareable lists or public list pages.
- Bio, extra display name, or additional public profile fields.
- Dedicated public profile route.
- Any public exposure of email or private account fields.

## Capabilities

### New Capabilities
- `user-public-profile`: Public username/avatar identity, privacy boundaries, and avatar upload constraints.

### Modified Capabilities
- None; no existing OpenSpec capabilities are present.

## Approach

Extend authenticated settings with a small public-profile card. Model a public-profile subset so UI and persistence code never treat the full auth record as public. Store avatars in PocketBase after client-side normalization from an original input capped at 5 MB to a static `200x200` WebP capped at 200 KB, with matching PocketBase validation for stored type and size.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/pocketbase.ts` | Modified | Type public vs private fields. |
| `src/features/auth/pocketbase-auth-provider.tsx` | Modified | Expose profile-safe user boundaries. |
| `src/features/settings/settings-screen.tsx` | Modified | Add identity card and controls. |
| `src/i18n/*` | Modified | Add profile/avatar labels and validation copy. |
| PocketBase schema/rules | Modified | Add username/avatar fields and privacy validation. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Private fields leak into public UI | Medium | Use an explicit public-profile type; never render raw auth records publicly. |
| Avatar processing differs by browser | Medium | Test the client path and reject unsupported files clearly. |
| PocketBase validation drifts | Medium | Mirror exact input and stored-avatar type, size, and normalization constraints in spec/design. |

## Rollback Plan

Remove the settings profile card and public-profile fields from app code. Keep or ignore existing avatar files until cleanup is approved; list sharing does not depend on this slice.

## Dependencies

- PocketBase user/profile collection schema and file validation support.
- Browser image processing capable of producing static `200x200` WebP.

## Success Criteria

- [ ] Authenticated users can define a username and avatar for public identity.
- [ ] Public-facing UI only displays centered avatar and username.
- [ ] Email and private account fields are never exposed through profile UI/types.
- [ ] Avatar uploads accept only approved formats up to 5 MB and store normalized static WebP at `200x200` up to 200 KB.
