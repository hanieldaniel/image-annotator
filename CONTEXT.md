---
name: img-marker domain glossary
---

# img-marker — Domain Glossary

## Annotation
A single user-placed mark on the canvas. Has a type, geometry, and style. Immutable after commit — mutations go through undo/redo. Types: `rect`, `arrow`, `text`, `blur`, `ellipse`, `callout`.

## Commit
The moment an annotation enters the history stack and becomes part of the annotation array. Triggered by pointer-up (shape tools) or Enter/blur (text tools). Escape before commit discards the in-progress annotation.

## Preview
The transient render of an in-progress annotation during a drag. Not in history. Shown via `onPreview` callback; discarded on Escape or replaced by commit on pointer-up.

## Select Mode
The interaction state when no tool is active (`activeTool === null`). Pointer clicks run hit-tests against committed annotations. Entered by clicking the active tool button again (toggle off).

## Selected Annotation
The single annotation currently focused in select mode. Rendered with resize handles. Can be moved, resized, or deleted (Delete/Backspace key).

## Resize Handle
One of the draggable control points rendered around a selected annotation. 8 handles (corners + midpoints) for rect/ellipse/blur/callout. 2 endpoint handles for arrow. Drag-anywhere for text.

## Active Tool
The currently selected drawing tool (`ToolType | null`). `null` means select mode. Toggling the active tool button sets it to `null`.

## ToolStyle
Per-annotation style bag. Fields: `color` (fill hex), `fillAlpha` (0–1, fill opacity for rect/ellipse only), `strokeColor`, `strokeWidth`, `opacity` (global annotation opacity), `fontSize`, `radius`.

## Viewport
The visible area of the canvas inside the scrollable `im-canvas-wrap`. Zoom changes CSS `transform: scale()` on the canvas — canvas resolution stays full-res for export quality. Zoom does not affect stored annotation coordinates.

## Screenshot Source
An `ImageSource` of type `'screenshot'`. Opens a fullscreen transparent overlay; user drags a region; the selected area is captured via html2canvas and loaded into the annotator. Replaces the former `'dom'` source type.

## Callout
An annotation combining a rounded-rect bubble, inner text, and a comic-book style curved bezier tail pointing to a target. Tail tip position (`tailX`, `tailY`) is draggable in select mode.

## Textarea Overlay
A temporary `<textarea>` shown during text/callout creation. Positioned in CSS space (not canvas pixel space). Draggable before commit. Removed on commit or Escape. Position converted back to canvas coordinates on commit.
