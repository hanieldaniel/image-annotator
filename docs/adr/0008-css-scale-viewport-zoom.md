# ADR 0008: CSS transform scale for viewport zoom

**Status:** Accepted  
**Date:** 2026-05-02

## Context

Large images overflow the modal. Users need zoom. Two approaches: (1) shrink canvas dimensions and store a viewport scale factor, applying it to all coordinate math; (2) keep canvas at full image resolution, wrap in a scrollable container, apply CSS `transform: scale()` for zoom.

## Decision

Option 2: canvas stays full-resolution. `im-canvas-wrap` becomes `overflow: auto`. Zoom controls adjust CSS `transform: scale()` on the canvas element only. No coordinate transformation is applied to stored annotation data.

## Consequences

**Good**
- Export quality unchanged — canvas always contains full-res pixels.
- No coordinate scaling math throughout ToolManager, CanvasRenderer, or hit-testing.
- Scrollable container handles pan naturally.

**Bad**
- CSS scale + scrollable container requires careful overflow and transform-origin handling.
- `canvas.getBoundingClientRect()` used in `ToolManager.point()` already accounts for CSS scale — this remains correct as-is.
