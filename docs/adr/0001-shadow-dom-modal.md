# ADR 0001: Shadow DOM modal as the rendering boundary

**Status:** Accepted  
**Date:** 2026-04-19

## Context

The library must work inside any web app without its styles conflicting with the host app's CSS. It also needs to be framework-agnostic — no React portals, no Vue teleport, no Svelte actions.

## Decision

All library UI (canvas, toolbar, modal overlay) renders inside a `ShadowRoot` attached to a host `<div>` appended to `document.body`. Styles are injected as a `<style>` element inside the shadow root using a CSS template string.

## Consequences

**Good**
- Complete CSS isolation — host app styles cannot leak in; library styles cannot leak out.
- No framework dependency for mounting or unmounting UI.
- Single host element is easy to inspect in DevTools.

**Bad**
- External theming requires using CSS custom properties (variables) on the host element, not arbitrary selectors.
- `z-index` stacking must be managed carefully — the shadow root does not create a new stacking context on its own.
- `html2canvas` captures the light DOM, not shadow DOM content, so the annotator modal itself cannot be screenshot-annotated.

---

# ADR 0002: Canvas as the annotation surface (no SVG overlay)

**Status:** Accepted  
**Date:** 2026-04-19

## Context

Annotation libraries commonly use either SVG overlays (where each annotation is a DOM element) or a canvas approach (where annotations are painted pixels). Both are viable.

## Decision

A single `<canvas>` element is used for both the image and all annotations. `CanvasRenderer` redraws the full canvas on every state change.

## Consequences

**Good**
- Export to PNG is trivial — `canvas.toBlob()` gives the merged result directly.
- No per-annotation DOM nodes; large annotation counts stay performant.
- Blur/redact is straightforward: sample the existing canvas pixels, apply `ctx.filter: blur()`, composite back.

**Bad**
- Annotations are not individually selectable after commit (no hit-testing on individual shapes without rebuilding it manually).
- Text rendering depends on browser font stack — no font embedding in the exported PNG.
- Undo/redo requires storing full annotation arrays rather than mutating DOM nodes.

---

# ADR 0003: Dual ESM + CJS build via tsup

**Status:** Accepted  
**Date:** 2026-04-19

## Context

The library needs to work in both modern ESM-first bundlers (Vite, esbuild, Rollup) and legacy CommonJS environments (Jest, older Next.js configs, Node scripts).

## Decision

`tsup` is used to produce dual `dist/index.js` (ESM) and `dist/index.cjs` (CJS) outputs from the same TypeScript source. The `package.json` `exports` map routes each resolver to the correct format.

## Consequences

**Good**
- Single build tool, minimal config.
- Tree-shaking works in ESM consumers.
- CJS consumers (testing environments, older bundlers) continue to work without configuration.

**Bad**
- Bundle size is not shared between formats — html2canvas is inlined into both.
- `injectStyle: true` in tsup embeds CSS in the JS bundle, which means no separate CSS file to override.

---

# ADR 0004: Caller-owned modal lifecycle

**Status:** Accepted  
**Date:** 2026-04-19

## Context

Modal close behavior is application-specific. Some apps want to close immediately on save; others want to show a loading spinner while uploading the blob before closing.

## Decision

The annotator emits `'save'` with the blob and `'cancel'` with no payload. It never calls `close()` on itself. The caller is responsible for calling `annotator.close()` when appropriate.

## Consequences

**Good**
- Caller can show a loading state, upload the blob, and only close the modal on success.
- No surprise modal dismissals during async operations.
- Consistent with common modal patterns in React (controlled components) and vanilla JS.

**Bad**
- Every integration must explicitly wire `annotator.on('cancel', () => annotator.close())` — forgetting it leaves the modal stuck open.
- Slightly more boilerplate for the simple download-only case.

---

# ADR 0005: onPreview / onCommit separation in ToolManager

**Status:** Accepted  
**Date:** 2026-04-19

## Context

During a drag operation the canvas needs to repaint every frame to show the shape being drawn. At the same time, the undo/redo history should only record completed annotations, not every intermediate pixel.

## Decision

`ToolManager` calls two separate callbacks:
- `onPreview(annotations)` — called on every `pointermove` with the in-progress annotation appended. Does not push to history.
- `onCommit(annotations)` — called on `pointerup` and on text/callout confirmation. Pushes to `History`.

## Consequences

**Good**
- History stack stays clean — undo steps correspond to discrete user actions, not animation frames.
- Smooth live preview without history pollution.

**Bad**
- Callers must handle both callbacks; wiring only one will either miss previews or miss commits.
- Text and callout tools bypass the drag lifecycle entirely and always call `onCommit` directly.

---

# ADR 0006: Label-driven patch/minor/major version bumps on merge to main

**Status:** Accepted  
**Date:** 2026-04-20

## Context

The package is published to npm and version numbers must follow semver. Version bumps need to be automated to avoid manual errors, but not every merge warrants the same bump type — a typo fix is a patch, a new annotation tool is a minor, a breaking API change is a major.

## Decision

A GitHub Actions workflow (`.github/workflows/version-bump.yml`) fires on `pull_request: closed` when `merged == true`. It reads the PR labels to determine bump type:

- `release:major` → `npm version major`
- `release:minor` → `npm version minor`
- no label (default) → `npm version patch`

The workflow runs lint, tests, and build before bumping. The bot commits `chore: bump version to X.Y.Z [skip ci]` and pushes the tag.

## Consequences

**Good**
- Bump intent is declared at PR author time, not after merge.
- Lint + test + build gate prevents a broken version from being tagged.
- No external tooling (semantic-release, changesets) — just npm and GitHub Actions.
- `[skip ci]` in the commit message prevents the bump commit from re-triggering the workflow.

**Bad**
- Forgetting to add a label always results in a patch bump — no warning.
- The bot push requires `contents: write` permission on `GITHUB_TOKEN`; orgs with restrictive branch protection rules may need a PAT instead.
