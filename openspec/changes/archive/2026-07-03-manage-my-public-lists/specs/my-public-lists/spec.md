# My Public Lists Specification

## Purpose

Authenticated users need a dedicated owner-scoped section for viewing their published public lists and opening or copying the existing public route for each list.

## Requirements

### Requirement: Dedicated Authenticated Section

The system MUST provide an authenticated `My public lists` section that is separate from the main dashboard list view.

#### Scenario: Authenticated user opens section

- GIVEN an authenticated user is in the app
- WHEN they navigate to `My public lists`
- THEN the section is shown as a dedicated management surface
- AND it is not presented as the dashboard item list itself

#### Scenario: Unauthenticated user cannot open section

- GIVEN no authenticated user session exists
- WHEN the `My public lists` route is requested
- THEN the user is blocked from owner-list management

### Requirement: Owner-Scoped Published List Retrieval

The system MUST list only public lists whose stored owner relation is the current authenticated user and whose published state is active. It MUST NOT scope management retrieval by username namespace.

#### Scenario: Current owner sees their published lists

- GIVEN the current user owns published public lists
- WHEN `My public lists` loads
- THEN only those published lists are shown

#### Scenario: Username namespace does not grant access

- GIVEN another user has public lists under a matching or previous username namespace
- WHEN the current user loads `My public lists`
- THEN those lists are excluded unless the stored owner relation matches the current user

#### Scenario: Unpublished lists are excluded

- GIVEN the current user owns unpublished or draft-like list records
- WHEN `My public lists` loads
- THEN those records are not shown

### Requirement: Public Route Target Exposure

Each listed public list MUST expose its public URL or route target using the existing username-plus-slug public route.

#### Scenario: User sees existing public route target

- GIVEN a published list has a public username and slug
- WHEN it appears in `My public lists`
- THEN the row exposes the route target for `/u/{username}/lista/{slug}`

### Requirement: Section States

The section MUST provide testable loading, empty, and error states.

#### Scenario: Loading state appears during retrieval

- GIVEN the owner-scoped public-list request is pending
- WHEN the section renders
- THEN a loading state is visible

#### Scenario: Empty state appears with no published lists

- GIVEN the current user has no published public lists
- WHEN retrieval succeeds
- THEN an empty state explains that no public lists are published yet

#### Scenario: Error state appears after retrieval failure

- GIVEN owner-scoped retrieval fails
- WHEN the section renders the failure
- THEN an error state is visible without exposing private diagnostic data

### Requirement: Privacy Boundary

Management and public-list display data MUST exclude full email addresses, private auth fields, provider metadata, sessions, tokens, and private profile fields.

#### Scenario: Management payload excludes private auth fields

- GIVEN published lists are returned for the owner
- WHEN the section renders list owner or route details
- THEN full email and private auth fields are absent from displayed and consumed list data

### Requirement: Slice Scope Boundaries

This slice MUST NOT add composer, import, copy-from-list, item copying, editing, social, drafts, unpublish, delete, or schema-change behavior. Dashboard publish MUST remain a temporary, de-emphasized bridge and MUST NOT become the primary public-list management surface.

#### Scenario: Management actions remain absent

- GIVEN a user views `My public lists`
- WHEN they inspect available list actions
- THEN composer, import, editing, social, draft, unpublish, delete, and schema-change flows are absent

#### Scenario: Dashboard publish is not primary management

- GIVEN the dashboard publish bridge still exists
- WHEN the user needs to manage published lists
- THEN `My public lists` is presented as the primary section for published-list visibility
