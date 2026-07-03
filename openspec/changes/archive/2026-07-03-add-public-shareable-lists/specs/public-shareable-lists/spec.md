# Public Shareable Lists Specification

## Purpose

Define the first public-list slice: authenticated publishing, username-and-slug public reads, privacy-safe owner display, and read-only list rendering. Import, copy, social, collaboration, and public editing behavior remain outside this capability.

## Requirements

### Requirement: Authenticated Public Publishing

Authenticated users MUST be able to publish a read-only public list with an owner, slug, title, date, optional description, and read-only item display data.

#### Scenario: Publish list

- GIVEN an authenticated user with valid list content
- WHEN the user publishes the list with a slug
- THEN the list is available as a public read-only projection
- AND the private editable source remains private.

#### Scenario: Reject unauthenticated publishing

- GIVEN no authenticated user
- WHEN a publish action is requested
- THEN no public list is created.

### Requirement: Public URL Identity

Public lists MUST be readable through a stable route containing owner username and list slug, such as `/u/{username}/lista/{slug}` or an equivalent username-plus-slug route. Slugs MUST be unique for the public owner namespace and read behavior MUST be deterministic.

#### Scenario: Read published list by username and slug

- GIVEN a published list for username `ana` and slug `summer-books`
- WHEN `/u/ana/lista/summer-books` is opened
- THEN that exact published list is rendered.

#### Scenario: Slug collision is scoped to owner

- GIVEN two owners publish lists with the same slug
- WHEN each owner's username-plus-slug URL is opened
- THEN each URL resolves only to that owner's list.

#### Scenario: Missing public list

- GIVEN no published list matches the username and slug
- WHEN the public URL is opened
- THEN a not-found state is shown without private data.

### Requirement: Public List Presentation

The public page MUST show owner avatar or fallback, public owner name, list title, list date, optional description, and read-only list items. It MUST NOT expose controls that edit, import, copy, comment on, like, follow, or collaborate on the list.

#### Scenario: Render public list content

- GIVEN a published list with title, date, description, and items
- WHEN the public page renders
- THEN those fields and read-only items are visible.

#### Scenario: Out-of-scope actions absent

- GIVEN a visitor views a public list
- WHEN the page renders
- THEN no import, copy, edit, comment, like, follow, or collaboration action is available.

### Requirement: Privacy-Safe Owner Projection

The public projection MUST include only fields needed for public rendering. Raw auth/private fields, including full email, auth identifiers not meant for display, provider metadata, sessions, tokens, and private profile fields, MUST NOT render or be exposed through public list data.

#### Scenario: Username preferred for public name

- GIVEN an owner with username `ana` and an email address
- WHEN the public list renders
- THEN `ana` is used as the public owner name
- AND the full email is not rendered.

#### Scenario: Email prefix fallback only

- GIVEN an owner without username or public name and email `sam@example.com`
- WHEN the public list renders
- THEN `sam` MAY be used as the fallback public name
- AND `sam@example.com` MUST NOT render.

#### Scenario: Private fields excluded

- GIVEN the public projection is loaded
- WHEN public list data is inspected by the UI
- THEN raw auth/private fields are unavailable to render.

### Requirement: Avatar Fallback

The public page MUST show the owner avatar when present. If no avatar exists, it MUST show a large initial derived from the public display name on a gradient background.

#### Scenario: Avatar image exists

- GIVEN the owner has a public avatar
- WHEN the public list renders
- THEN the avatar image is displayed.

#### Scenario: Avatar fallback exists

- GIVEN the owner has no avatar and public name `Sam`
- WHEN the public list renders
- THEN a large `S` appears on a gradient background.
