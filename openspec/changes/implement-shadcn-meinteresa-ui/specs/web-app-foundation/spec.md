# web-app-foundation Specification

## Purpose

Provide the initial React/TypeScript UI foundation for Kyoumi so the mock app can ship with shadcn/ui, local data, and a clean boundary for future services.

## Requirements

### Requirement: Local mock app boundary

The system SHALL render the MVP from local mock data behind a replaceable data boundary.

#### Scenario: First load uses local data

- GIVEN a fresh app launch
- WHEN the dashboard renders
- THEN the UI appears without authentication, server persistence, or real Gemini calls

#### Scenario: Future service adapter

- GIVEN a future API adapter exists
- WHEN the data boundary is swapped
- THEN the UI contract remains stable for screens and actions

### Requirement: Mock-only MVP constraints

The system SHALL keep the MVP free of sign-in flows, server-backed data dependencies, and external AI requests while allowing approved browser-local persistence.

#### Scenario: User actions stay local

- GIVEN a user opens add or suggester flows
- WHEN the user completes the flow
- THEN no server write, login step, or Gemini network call is required

#### Scenario: Reload restores only browser-local state

- GIVEN the app reloads
- WHEN the page opens again
- THEN previously entered mock changes are restored only from browser-local storage, not from a backend service
