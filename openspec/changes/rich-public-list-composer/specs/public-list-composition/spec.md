# Delta for Public List Composition

## ADDED Requirements

### Requirement: Rich List-Only Item Snapshots

Public-list owners MUST be able to compose list-only item snapshots with the same visible fields as the dashboard interest drawer: title, category, cover, notes, and tags. Creating a list-only item MUST update only the public-list membership snapshot and MUST NOT create a private dashboard interest.

#### Scenario: Create rich list-only item

- GIVEN an authenticated owner is editing a public list
- WHEN they submit title, category, cover, notes, and tags for a new item
- THEN the public list contains a snapshot with those fields
- AND no dashboard/private interest record is created.

### Requirement: Public List Display Modes

Public list pages MUST support the same `cards`, `list`, and `covers` display modes available on the dashboard.

#### Scenario: Switch public display mode

- GIVEN any visitor is viewing a public list
- WHEN they select `cards`, `list`, or `covers`
- THEN the same committed public-list items render in the selected mode.

### Requirement: Copy Public Item To Dashboard

Each public-list item MUST expose an add/copy-to-dashboard action. Authenticated copies MUST create a personal dashboard interest with status `pending`; unauthenticated visitors MUST be prompted or gated before copying.

#### Scenario: Authenticated visitor copies item

- GIVEN an authenticated visitor views a public-list item
- WHEN they copy it to their dashboard
- THEN a personal dashboard interest is created with status `pending`.

#### Scenario: Unauthenticated visitor is gated

- GIVEN an unauthenticated visitor views a public-list item
- WHEN they choose copy-to-dashboard
- THEN the system prompts for authentication
- AND does not create a dashboard interest before authentication.

### Requirement: Public Projection Privacy And Empty Items

Public list models and UI MUST NOT expose raw owner IDs, full email values, or private authentication fields. The PocketBase `items` JSON field MUST allow an empty array by being non-required.

#### Scenario: Public data omits private fields

- GIVEN a public list is loaded
- WHEN its model is projected to UI
- THEN raw owner IDs and private auth fields are absent.

#### Scenario: Empty items array is valid

- GIVEN a persisted public list has `items: []`
- WHEN the list is saved or loaded
- THEN validation accepts the empty array.

### Requirement: Copy Failure Safety

Copy and save failures MUST preserve committed public-list membership and MUST NOT duplicate existing dashboard interests for the same copied public item.

#### Scenario: Copy failure does not mutate list

- GIVEN a visitor copies a public-list item
- WHEN dashboard persistence fails
- THEN the committed public-list membership remains unchanged.

#### Scenario: Duplicate copy is prevented

- GIVEN a matching dashboard interest already exists from a copied public item
- WHEN the visitor repeats the copy action
- THEN the system MUST NOT create a duplicate dashboard interest.

## MODIFIED Requirements

### Requirement: Interest Membership Composition

Owners MUST be able to add existing current-user interests and rich list-only item snapshots to a managed public list through the editor/detail surface. Owners MUST be able to remove saved public-list item snapshots from the managed public list. Removal MUST persist only the next public-list membership through `updateManagedList({ items: nextItems })` and MUST NOT delete or mutate any private dashboard interest. The system MUST NOT require or perform wholesale dashboard sharing as the primary way to compose the list.
(Previously: Owners could add eligible interests/items, but rich list-only snapshots and existing-current-user parity were not specified.)

#### Scenario: Add owned or available interest through editor

- GIVEN an authenticated owner is in their list editor
- WHEN they add an eligible existing current-user interest
- THEN the list membership is persisted
- AND the editor reflects the added interest/item.

#### Scenario: Add interest failure preserves state

- GIVEN an authenticated owner is adding an interest/item
- WHEN the update fails
- THEN the system MUST show an error state
- AND MUST preserve the prior committed list membership.

#### Scenario: Remove saved public-list item

- GIVEN an authenticated owner is editing a public list with a saved public-list item snapshot
- WHEN they remove that saved item from the list
- THEN the next public-list membership is persisted through `updateManagedList({ items: nextItems })`
- AND the removed snapshot no longer appears in the public list
- AND no private dashboard interest is deleted or mutated.

#### Scenario: Remove saved public-list item failure preserves state

- GIVEN an authenticated owner is editing a public list with a saved public-list item snapshot
- WHEN removal persistence fails
- THEN the system MUST show an error state
- AND MUST preserve the prior committed list membership
- AND no private dashboard interest is deleted or mutated.

### Requirement: Explicit Slice Exclusions

This slice MUST NOT add social features, collaboration, comments, likes, follows, reactions, feeds, discovery mechanics, analytics, public-list deletion/unpublishing, private dashboard interest deletion, or permissions beyond current owner management and auth-gated copy-to-dashboard.
(Previously: Import/copy from other users was excluded; this change permits only per-item copy from public lists into the viewer's dashboard.)

#### Scenario: Other-user list remains read-only except copy

- GIVEN a user views another user's public list
- WHEN the page renders
- THEN editor controls MUST be absent
- AND copy-to-dashboard MAY be available behind the auth gate.

#### Scenario: Social actions are absent

- GIVEN a user views editor or public list surfaces
- WHEN the surfaces render
- THEN comments, likes, follows, and collaboration controls MUST be absent.
