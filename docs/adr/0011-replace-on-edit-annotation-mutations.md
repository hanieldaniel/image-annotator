# ADR 0011: Replace-on-edit for annotation mutations

**Status:** Accepted  
**Date:** 2026-05-02

## Context

Users need to edit committed annotations — changing style (color, stroke, font size, etc.) and re-editing text content after placement. The history stack already treats annotations as immutable values (each commit pushes a new entry). Allowing in-place mutation after commit would create two inconsistent patterns: immutable for move/resize, mutable for style/text.

## Decision

All annotation edits — style changes via toolbar, text re-edit via double-click, move, and resize — produce a new annotation value that replaces the old entry on the history stack. No annotation object is mutated after commit. This is replace-on-edit.

## Consequences

**Good**
- Single consistent pattern: the history stack is always a sequence of immutable snapshots.
- Undo/redo works identically for all edit types — no special handling for style vs geometry.
- Easier to reason about: the annotation array is append/replace only.

**Bad**
- Each style control change (e.g. dragging a slider) must be debounced or committed on pointer-up to avoid flooding the history stack with one entry per pixel of slider drag.
