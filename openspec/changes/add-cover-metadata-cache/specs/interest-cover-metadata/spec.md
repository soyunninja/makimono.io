# Spec: Interest cover metadata

## Requirement: Cached cover metadata is optional item state

The system MUST allow interest items to persist optional cached cover artwork metadata without invalidating older saved items.

### Scenario: older items remain valid without cover fields

Given a stored item payload without any cover metadata
When the repository loads persisted items
Then the item remains valid
And the app keeps the existing category-colored fallback card style

## Requirement: External lookup is optional and local-first

The system MUST keep add/edit flows functional when provider credentials are absent, lookups fail, or no match is found.

### Scenario: missing provider credentials skips lookup

Given the relevant lookup env vars are not configured
When a user creates or edits an item
Then the item is still saved locally
And no external cover metadata is required for success

### Scenario: successful lookup is cached on the item

Given a provider returns a cover match for a submitted title and category
When the user saves the item
Then the repository stores the returned cover metadata on the item
And later dashboard or archive renders reuse the cached metadata without repeating the provider call

## Requirement: Cover artwork stays decorative

The system MUST render cached cover artwork as a decorative background that preserves readable category-colored cards.

### Scenario: cached cover artwork decorates a card

Given an item includes `coverImageUrl`
When the dashboard or archive renders the item card
Then the card shows a decorative background image layer
And the category color remains visible through translucent overlays
And the text content stays readable
