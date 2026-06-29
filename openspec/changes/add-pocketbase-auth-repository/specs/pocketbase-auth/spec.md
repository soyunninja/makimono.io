# Spec: PocketBase auth repository

## Requirement: PocketBase auth gates dashboard routes when enabled

The system MUST require PocketBase authentication for dashboard and archive routes when `VITE_POCKETBASE_URL` is configured.

### Scenario: PocketBase disabled keeps local mode

Given `VITE_POCKETBASE_URL` is not configured
When a user opens `/dashboard`
Then the dashboard renders without an auth gate
And item persistence stays on the existing localStorage-backed repository

### Scenario: PocketBase enabled shows login/register gate until auth succeeds

Given `VITE_POCKETBASE_URL` is configured
And no PocketBase user session is currently valid
When a user opens `/dashboard`
Then the app shows a localized login/register form before dashboard content
And the form can authenticate or register the user through PocketBase

## Requirement: Authenticated item persistence uses PocketBase interests

The system MUST use PocketBase-backed item persistence for authenticated users when PocketBase is enabled.

### Scenario: authenticated dashboard uses the remote repository

Given `VITE_POCKETBASE_URL` is configured
And the PocketBase auth store has a valid user session
When the user opens dashboard, add, edit, or archive flows
Then the app reads and writes items through the PocketBase `interests` collection
And local component defaults used by existing tests remain unchanged outside the authenticated route flow

## Requirement: Remote delete behavior stays soft-delete compatible

The system MUST preserve the current archive UX by storing deletions as `deletedAt` updates instead of hard deletes.

### Scenario: deleting an item moves it to archive state remotely

Given an authenticated user has an interest record in PocketBase
When the user deletes that item from the edit flow
Then the repository updates `deletedAt` on the record instead of hard deleting it
And archive restore clears `deletedAt` to reactivate the item
