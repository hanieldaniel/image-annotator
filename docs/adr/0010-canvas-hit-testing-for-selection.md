# ADR 0010: Manual hit-testing for annotation selection

**Status:** Accepted  
**Date:** 2026-05-02

## Context

ADR 0002 chose a single canvas over SVG, accepting that annotations would not be individually selectable. Users now require move, resize, edit, and delete of committed annotations. Selection must be added without abandoning the canvas approach.

## Decision

Hit-testing is implemented manually in `ToolManager` against stored annotation geometry. Each annotation type has a geometric test (AABB for rect/blur/ellipse bounding box, line proximity for arrow, bounding box for text/callout). The selected annotation is tracked as `selectedId: string | null` in `Annotator`. Resize handles are rendered by `CanvasRenderer` on top of the selected annotation as a separate pass after all annotations are drawn.

## Consequences

**Good**
- Canvas approach retained — export via `canvas.toBlob()` unchanged.
- No SVG layer or DOM node per annotation.
- Hit-testing is O(n) per pointer event — acceptable for annotation counts in practice.

**Bad**
- Hit-testing must be kept in sync with renderer geometry — two places define each shape's bounds.
- Resize handle interaction requires distinguishing handle-hit vs body-hit on pointer-down.
