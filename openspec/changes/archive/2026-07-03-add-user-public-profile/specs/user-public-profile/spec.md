# User Public Profile Specification

## Purpose

Define the minimal public identity slice for authenticated users: username and avatar only, with explicit privacy boundaries and avatar validation/normalization before storage.

## Requirements

### Requirement: Public Profile Fields

The system MUST expose only `username` and `avatar` as public profile fields in this slice. UI contracts MAY represent the public avatar as `avatarUrl`, but that value MUST be only the public avatar representation and MUST NOT include private file metadata. Email, account identifiers, authentication metadata, private settings, and future profile fields MUST NOT be exposed through public profile models, UI, or API responses.

#### Scenario: Public profile contains only allowed fields

- GIVEN a user has account data, email, username, avatar, and private settings
- WHEN the public profile is read or rendered
- THEN only username and the public avatar representation (`avatar` or derived `avatarUrl`) are available
- AND email, private account fields, and avatar file metadata are absent

#### Scenario: Future fields are not implicitly public

- GIVEN a user record contains bio, display name, or list-sharing data
- WHEN this slice builds a public profile
- THEN those fields MUST NOT be included

### Requirement: Public Profile Presentation

Public-facing profile presentation MUST show a centered avatar with the username underneath. This slice MUST NOT add a bio, display name, shared-list presentation, or dedicated public profile route.

#### Scenario: Profile card layout

- GIVEN a user has a public username and avatar
- WHEN the profile card is displayed
- THEN the avatar is centered
- AND the username appears underneath the avatar

#### Scenario: No dedicated public route

- GIVEN the user profile slice is available
- WHEN routes are inspected or navigated
- THEN no standalone public profile route exists for this slice

### Requirement: Avatar Input Validation

Avatar uploads MUST accept only `jpg`, `jpeg`, `png`, `gif`, and `webp` image inputs, and the original user-selected input MUST be capped at 5 MB. Validation MUST exist both client-side and server/PocketBase-side where applicable, and invalid files MUST be rejected before becoming a stored public avatar.

#### Scenario: Accepted avatar input formats

- GIVEN a user selects a jpg, jpeg, png, gif, or webp image up to 5 MB
- WHEN avatar validation runs
- THEN the file is accepted for normalization

#### Scenario: Rejected oversized avatar input

- GIVEN a user selects an image larger than 5 MB
- WHEN avatar validation runs
- THEN the upload is rejected
- AND the current avatar remains unchanged

#### Scenario: Rejected avatar input format

- GIVEN a user selects an unsupported file type
- WHEN avatar validation runs client-side or server/PocketBase-side
- THEN the upload is rejected
- AND the current avatar remains unchanged

### Requirement: Avatar Storage Format

Avatar output MUST be normalized to a static `200x200` WebP image up to 200 KB before PocketBase storage. Animated GIF inputs MUST become static avatar images, not animated public avatars.

#### Scenario: Normalized avatar storage

- GIVEN a user selects a valid image with any supported dimensions
- WHEN the avatar is prepared for storage
- THEN the stored avatar is a static WebP image
- AND its dimensions are 200 by 200 pixels
- AND its file size is at most 200 KB

#### Scenario: Rejected oversized normalized avatar

- GIVEN avatar normalization produces a WebP larger than 200 KB
- WHEN the avatar would be stored
- THEN storage is rejected
- AND the current avatar remains unchanged

#### Scenario: Animated GIF becomes static

- GIVEN a user selects an animated GIF avatar
- WHEN the avatar is normalized and stored
- THEN the stored avatar is a static 200x200 WebP image
- AND animation is not preserved
