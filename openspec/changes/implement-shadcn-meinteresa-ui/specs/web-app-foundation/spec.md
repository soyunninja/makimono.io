# web-app-foundation Specification

## Purpose

Provide the initial React/TypeScript UI foundation for MeInteresa so the mock app can ship with shadcn/ui, local data, and a clean boundary for future services.

## Requirements

### Requirement: Local mock app boundary

The system SHALL render the MVP from local mock data behind a replaceable data boundary.

#### Scenario: First load uses local data

- GIVEN a fresh app launch
- WHEN the dashboard renders
- THEN the UI appears without persistence, authentication, or real Gemini calls

#### Scenario: Future service adapter

- GIVEN a future API adapter exists
- WHEN the data boundary is swapped
- THEN the UI contract remains stable for screens and actions

### Requirement: Mock-only MVP constraints

The system SHALL keep the MVP free of persisted state, sign-in flows, and external AI requests.

#### Scenario: User actions stay local

- GIVEN a user opens add or suggester flows
- WHEN the user completes the flow
- THEN no server write, login step, or Gemini network call is required

#### Scenario: Reload does not imply persistence

- GIVEN the app reloads
- WHEN the page opens again
- THEN previously entered mock changes are not treated as persisted data
