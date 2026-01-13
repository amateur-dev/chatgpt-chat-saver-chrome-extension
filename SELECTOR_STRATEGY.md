# Selector Strategy & DOM Resilience

This document outlines the extension's strategy for extracting messages from ChatGPT and Gemini, ensuring resilience against DOM changes.

## extraction Strategy (4-Tier Fallback)

The extension uses a waterfall approach to extract content. We try the most structured method first and fall back to broader methods if needed.

### 1. `[data-message-id]` (Primary)
- **Target**: Elements with specific data attributes used by ChatGPT.
- **Reliability**: High (Official markers).
- **Structure**: Preserves User/Assistant role perfectly.
- **Selector**: `document.querySelectorAll('[data-message-id]')`

### 2. `.group` Class (Secondary)
- **Target**: Wrapper divs commonly used to group message blocks.
- **Reliability**: Medium (Class names change frequently).
- **Structure**: Identifying role is harder; we infer from inner classes or attributes.
- **Selector**: `document.querySelectorAll('.group')`

### 3. Main Content Area (Semantic)
- **Target**: The `<main>` or `[role="main"]` container.
- **Reliability**: High for getting *text*, Low for separation.
- **Structure**: Returns the entire conversation as one block if individual messages fail.
- **Selector**: `[role="main"]`, `main`, `.prose`

### 4. Visible Text Fallback (Last Resort)
- **Target**: `document.body.innerText`.
- **Reliability**: 100% (Getting *something*).
- **Structure**: None. We filter out navigation/UI text (e.g., "Regenerate", "Settings").
- **Logic**: Splits text by lines and removes known UI patterns.

## Gemini Strategy

Gemini uses Custom Elements:
- `<user-query>`: Contains user messages.
- `<model-response>`: Contains AI responses.
- **Fallback**: `<infinite-scroller>` or `main`.

## Hardening & Debugging

- **Logging**: The extension logs which strategy was used to the console:
  - `ChatGPT Chat Saver: [Strategy 1] Found X messages...`
- **Updates**: When ChatGPT updates its UI:
  1. Check if "No conversation found" errors increase.
  2. Inspect the new DOM.
  3. Update `content.js` to add a new strategy or update selectors.
  4. Run manual verification on both platforms.

## Contributing

If you find the extension breaking on a new layout:
1. Open a PR.
2. Update `extractMessages()` in `content.js`.
3. Add the confusing DOM snippet to `tests/dom_mocks.js` (planned).
