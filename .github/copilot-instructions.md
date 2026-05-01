# GitHub Copilot instructions for @hanieldaniel/img-marker

This repository is the source for `@hanieldaniel/img-marker`, a framework-agnostic TypeScript image annotation library. Use the context below when suggesting code in this repo or in consuming apps.

## Library overview

- Opens a **Shadow DOM modal** containing a `<canvas>` and a toolbar.
- User draws annotations on a captured/uploaded image.
- On save, emits a flat **PNG `Blob`** — the caller handles download/upload.
- The modal **never closes itself** — the caller must call `annotator.close()`.
- No framework dependencies. Works with React, Vue, Svelte, Angular, or vanilla JS.

## Module responsibilities

| File | Role |
|---|---|
| `src/core/Annotator.ts` | Orchestrates everything: Shadow DOM, modal lifecycle, event emitter, keyboard shortcuts |
| `src/core/CanvasRenderer.ts` | Single place responsible for drawing all 6 annotation types |
| `src/core/ToolManager.ts` | Translates mouse/touch events into `Annotation` objects; calls `onPreview` during drag, `onCommit` when done |
| `src/core/History.ts` | Immutable undo/redo stack; only committed states are pushed |
| `src/core/Export.ts` | `canvas.toBlob()` wrapper returning a `Promise<Blob>` |
| `src/sources/DomCapture.ts` | html2canvas wrapper |
| `src/sources/FileUpload.ts` | FileReader + optional file picker |
| `src/sources/CameraCapture.ts` | getUserMedia video capture |
| `src/ui/toolbar.ts` | Generates default toolbar HTML from `ToolbarItem[]` config |
| `src/ui/styles/styles.ts` | All CSS as a template string injected into Shadow DOM |
| `src/types.ts` | All shared TypeScript interfaces — edit here first |

## Key design invariants

1. All CSS lives in `src/ui/styles/styles.ts` and is injected into Shadow DOM — never use `document.head` for styles.
2. `ToolManager` distinguishes preview (drag in progress) from commit (pointer up / text confirmed). History is only updated on commit.
3. `CanvasRenderer.render()` always redraws the full image + all annotations from scratch — no partial updates.
4. `Annotator` is instantiated once and reused across sessions. Each `open()` call resets annotations and history.
5. The six annotation types are: `rect`, `arrow`, `text`, `blur`, `ellipse`, `callout` — in that canonical order.

## Annotation type shapes

```ts
RectAnnotation   { x, y, width, height }
ArrowAnnotation  { from: Point, to: Point }
TextAnnotation   { x, y, text }
BlurAnnotation   { x, y, width, height, radius }
EllipseAnnotation { cx, cy, rx, ry }
CalloutAnnotation { x, y, width, height, text, tailX, tailY }
```

All extend `BaseAnnotation` which includes `id`, `type`, and `style: ToolStyle`.

## When suggesting changes

- Adding a new annotation type: add to `types.ts` → `CanvasRenderer.draw()` switch → `ToolManager.createInitial()` → `icons.ts` → `toolbar.ts` labels.
- Changing style options: update `ToolStyle` in `types.ts` and all four `Annotator.set*()` methods.
- Changing toolbar layout: edit `src/ui/toolbar.ts` only — not `Annotator.ts`.
- Adding an image source: add a new file under `src/sources/`, export from `src/index.ts`, add a case to `Annotator.open()`.
