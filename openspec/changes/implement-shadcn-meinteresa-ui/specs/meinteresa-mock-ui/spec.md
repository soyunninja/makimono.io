# meinteresa-mock-ui Specification

## Purpose

Define the user-facing mock dashboard, add flow, language switching, and Smart Suggester behavior for the Kyoumi MVP.

## Requirements

### Requirement: Responsive mock dashboard

The system SHALL present a responsive dashboard with equal desktop and mobile priority.

#### Scenario: Desktop layout

- GIVEN a wide viewport
- WHEN the dashboard loads
- THEN category cards and actions are arranged for efficient scanning

#### Scenario: Mobile layout

- GIVEN a narrow viewport
- WHEN the dashboard loads
- THEN the same content is usable in a stacked touch-friendly layout

### Requirement: First-class categories

The system SHALL treat series, movies/películas, games/juegos, books/libros, music/música, and podcasts/podcasts as first-class categories with localized labels.

#### Scenario: Category coverage

- GIVEN the dashboard is open
- WHEN the user switches categories
- THEN each of the six categories is available and visually distinct

#### Scenario: Localized labels

- GIVEN the UI language is Spanish or English
- WHEN category labels render
- THEN the labels match the active language while preserving the same category set

### Requirement: ES/EN UI text switching

The system SHALL switch visible UI text between Spanish and English without routing or persistence.

#### Scenario: Switch to Spanish

- GIVEN the UI is in English
- WHEN the user selects Spanish
- THEN visible controls, headings, and helper text update to Spanish

#### Scenario: Switch to English

- GIVEN the UI is in Spanish
- WHEN the user selects English
- THEN visible controls, headings, and helper text update to English

### Requirement: Adaptive add flow

The system SHALL adapt the add flow to the selected category and viewport.

#### Scenario: Category-specific fields

- GIVEN the user chooses a category
- WHEN the add form opens
- THEN the form shows fields relevant to that category

#### Scenario: Mobile and desktop presentation

- GIVEN a mobile viewport or desktop viewport
- WHEN the add flow opens
- THEN the presentation matches the screen size while keeping the same form behavior

### Requirement: Smart Suggester mock flow

The system SHALL show exactly 3 mock recommendations after the user chooses time and mood.

#### Scenario: Three recommendations

- GIVEN the user selects time and mood
- WHEN suggestions are generated
- THEN exactly 3 recommendations are displayed
- AND each recommendation includes a reason and call to action

### Requirement: Card height and content behavior

The system SHALL let content cards grow with content while keeping controls usable.

#### Scenario: Long content

- GIVEN a card contains a long title or description
- WHEN the dashboard renders
- THEN text wraps and the card expands instead of clipping content

#### Scenario: Fixed controls

- GIVEN a card has action buttons or status chips
- WHEN the card content changes length
- THEN the controls remain readable and touch-friendly
