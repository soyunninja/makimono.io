# Public List Composition Specification

## Purpose

Define owner-managed public-list composition: authenticated list creation, dedicated editing, interest membership updates, public read-only separation, and privacy boundaries.

## Requirements

### Requirement: Managed Public List Creation

Authenticated users MUST be able to create a managed public list from `My public lists`. Creation MUST persist an owner-scoped list without making dashboard publishing the primary composition model.

#### Scenario: Create list from My public lists

- GIVEN an authenticated user is on `My public lists`
- WHEN they submit valid public-list details
- THEN a new owner-scoped public list is persisted
- AND the list appears in that user's managed public lists.

#### Scenario: Creation failure is recoverable

- GIVEN an authenticated user submits a new public list
- WHEN creation fails
- THEN the system MUST show a recoverable error state
- AND MUST NOT show a successful or editable list for the failed operation.

### Requirement: Dedicated Owner Editor Surface

After creation, authenticated owners MUST be able to enter a dedicated list editor/detail surface for that list. The editor MUST be separate from the public read-only route.

#### Scenario: Owner enters editor after creation

- GIVEN an authenticated user creates a public list
- WHEN creation succeeds
- THEN the user can navigate to a dedicated owner editor/detail surface for that list.

#### Scenario: Public route remains read-only

- GIVEN any visitor opens the public list route
- WHEN the page renders
- THEN it MUST expose only read-only public list information
- AND MUST NOT expose editing controls.

### Requirement: Interest Membership Composition

Owners MUST be able to add interests/items to a managed public list through the editor/detail surface. The system MUST NOT require or perform wholesale dashboard sharing as the primary way to compose the list.

#### Scenario: Add owned or available interest through editor

- GIVEN an authenticated owner is in their list editor
- WHEN they add an eligible interest/item
- THEN the list membership is persisted
- AND the editor reflects the added interest/item.

#### Scenario: Add interest failure preserves state

- GIVEN an authenticated owner is adding an interest/item
- WHEN the update fails
- THEN the system MUST show an error state
- AND MUST preserve the prior committed list membership.

### Requirement: Owner-Only Editing and Safe Projections

Only the owner MUST be able to load and mutate editor data for a managed list. Editor and public projections MUST NOT expose full email values or private authentication fields.

#### Scenario: Non-owner cannot edit

- GIVEN an authenticated user does not own a public list
- WHEN they attempt to open or update that list's editor surface
- THEN the system MUST deny owner editing access
- AND MUST NOT mutate the list.

#### Scenario: Private fields are omitted

- GIVEN editor or public list data is loaded
- WHEN the data is projected to UI state
- THEN full email values and private authentication fields MUST be absent.

### Requirement: Update State Handling

Create, update, and add-interest operations MUST expose testable loading, success, empty, and error states appropriate to the action.

#### Scenario: Update success is visible

- GIVEN an authenticated owner updates managed list details
- WHEN the update succeeds
- THEN the editor MUST show the saved state
- AND MUST clear the pending operation state.

#### Scenario: Empty managed list is actionable

- GIVEN an authenticated owner opens a managed list with no interests/items
- WHEN the editor loads
- THEN the system SHOULD show an empty state with an add-interest path.

### Requirement: Explicit Slice Exclusions

This slice MUST NOT add import/copy from other users, social features, collaboration, comments, likes, follows, reactions, feeds, discovery mechanics, analytics, delete/unpublish, or permissions beyond current owner management.

#### Scenario: Other-user content is not imported

- GIVEN a user views another user's public read-only list
- WHEN they manage their own lists
- THEN the system MUST NOT offer import or copy from that other user's list.

#### Scenario: Social actions are absent

- GIVEN a user views editor or public list surfaces
- WHEN the surfaces render
- THEN comments, likes, follows, and collaboration controls MUST be absent.
