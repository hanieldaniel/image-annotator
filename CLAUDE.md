# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm install          # install dependencies
npm run build        # dual ESM + CJS build via tsup
npm run dev          # watch mode (if configured in tsup.config.ts)
npm run lint         # ESLint
npm test             # run tests
```

## Architecture

This is a TypeScript image annotation library with a dual ESM/CJS build (tsup). It exposes a modal-based annotator UI with Shadow DOM scoped styles.

### Module layout

- **`src/index.ts`** — public API and all exports
- **`src/types.ts`** — all TypeScript interfaces shared across modules
- **`src/core/`** — annotation engine
  - `Annotator.ts` — main orchestration class; owns the modal and toolbar
  - `CanvasRenderer.ts` — draws all annotation types onto a `<canvas>`
  - `ToolManager.ts` — translates mouse/touch events into annotation objects
  - `History.ts` — undo/redo stack
  - `Export.ts` — serializes canvas to PNG/JPEG as blob, dataUrl, or triggers download
- **`src/sources/`** — image input methods
  - `DomCapture.ts` — `fromDom()` using html2canvas
  - `FileUpload.ts` — `fromFile()` and clipboard paste
  - `CameraCapture.ts` — `fromCamera()` via `getUserMedia`
- **`src/ui/`**
  - `icons.ts` — SVG icon strings for toolbar tools
  - `styles/annotator.css` — all styles, scoped inside Shadow DOM

### Key design points

- The annotator renders inside a Shadow DOM to prevent style leakage.
- Six annotation types are supported; `CanvasRenderer` is the single place responsible for drawing all of them.
- `ToolManager` is the boundary between raw DOM events and the annotation data model defined in `types.ts`.
- Build output is dual-format (ESM + CJS) configured in `tsup.config.ts` and declared in `package.json` exports map.
