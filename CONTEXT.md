---
name: img-marker domain glossary
---

# img-marker — Domain Glossary

## Annotation
A single user-placed mark on the canvas. Has a type, geometry, and style. Treated as an immutable value after commit — editing geometry or style produces a new annotation that replaces the old one on the history stack (replace-on-edit). Types: `rect`, `arrow`, `text`, `blur`, `ellipse`.

## Commit
The moment an annotation enters the history stack and becomes part of the annotation array. Triggered by pointer-up (shape tools) or Enter/blur (text tools). After commit, the active tool is deselected and the annotator enters select mode. Escape before commit discards the in-progress annotation.

## Preview
The transient render of an in-progress annotation during a drag. Not in history. Shown via `onPreview` callback; discarded on Escape or replaced by commit on pointer-up.

## Select Mode
The interaction state when no tool is active (`activeTool === null`). Pointer clicks run hit-tests against committed annotations. Entered by: (1) clicking the active tool button again (toggle off), (2) after every annotation commit, or (3) pressing Escape when no annotation is in progress. In select mode, pressing Escape when an annotation is selected deselects it (one state per press).

## Selected Annotation
The single annotation currently focused in select mode. Rendered with resize handles. Can be moved, resized, deleted (Delete/Backspace key), have its style updated via toolbar controls (replace-on-edit), or have its text content re-edited (double-click on text annotations). Style controls in the toolbar reflect the selected annotation's current values. Deselected by clicking outside any annotation or pressing Escape; both actions also clear the toolbar controls back to the empty state.

## Resize Handle
One of the draggable control points rendered around a selected annotation. 8 handles (corners + midpoints) for rect/ellipse/blur. 2 endpoint handles for arrow. Drag-anywhere for text.

## Active Tool
The currently selected drawing tool (`ToolType | null`). `null` means select mode. Toggling the active tool button sets it to `null`.

## ToolStyle
Per-annotation style bag. Fields: `color` (fill hex), `fillAlpha` (0–1, fill opacity for rect/ellipse only), `strokeColor`, `strokeWidth`, `opacity` (global annotation opacity), `fontSize`, `radius`.

## Viewport
The visible area of the canvas inside the scrollable `im-canvas-wrap`. Zoom changes the CSS `width` and `height` of the canvas element — the drawing buffer stays at full native resolution for export quality. Zoom does not affect stored annotation coordinates. On open, the initial zoom is auto-calculated to fit images larger than the modal (zoom-out only); small images start at zoom 1.

## Screenshot Source
An `ImageSource` of type `'screenshot'`. Opens a fullscreen transparent overlay; user drags a region; the selected area is captured via html2canvas and loaded into the annotator. Replaces the former `'dom'` source type.

## Textarea Overlay
A temporary `<textarea>` shown during text/callout creation. Positioned in CSS space (not canvas pixel space). Draggable before commit. Removed on commit or Escape. Position converted back to canvas coordinates on commit.
