# ADR 0007: null activeTool as select mode

**Status:** Accepted  
**Date:** 2026-05-02

## Context

Selection must always be available without a dedicated toolbar button cluttering the tool list. Users need to move, resize, and delete committed annotations.

## Decision

`activeTool` changes type from `ToolType` to `ToolType | null`. `null` means select mode. Clicking the currently active tool button toggles it off, setting `activeTool` to `null`. Pointer events in select mode run hit-tests instead of creating annotations.

## Consequences

**Good**
- No extra toolbar button — select mode is implicit.
- Clean state machine: draw mode vs select mode, no overlap.

**Bad**
- Breaking change to `AnnotatorAPI` and `AnnotatorConfig` types.
- `selectTool()` must accept `null`; callers using custom toolbars must handle the toggle.
