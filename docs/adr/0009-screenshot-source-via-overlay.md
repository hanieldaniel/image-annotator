# ADR 0009: Screenshot source via fullscreen overlay + html2canvas crop

**Status:** Accepted  
**Date:** 2026-05-02

## Context

The former `'dom'` ImageSource required callers to pre-select a DOM element. Users want a snipping-tool experience — drag to select any region of the current page. Two options: (1) fullscreen overlay + html2canvas crop; (2) `getDisplayMedia` screen capture API.

## Decision

Option 1: a fullscreen transparent overlay is rendered over the page. User drags a selection rectangle. On release, html2canvas captures `document.body` and the result is cropped to the selection rect. The `'dom'` source type is removed entirely and replaced by `'screenshot'`.

## Consequences

**Good**
- No browser permissions prompt.
- Works within the current tab — no window/tab picker dialog.
- Reuses existing html2canvas dependency.

**Bad**
- html2canvas on the full body is slower than a targeted element capture, especially on complex pages.
- Cannot capture content outside the current browser tab (other apps, other tabs).
- Breaking change: `{ type: 'dom', element }` removed from `ImageSource`.
