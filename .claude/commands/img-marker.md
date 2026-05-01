# img-marker integration skill

You are helping a developer integrate `@hanieldaniel/img-marker` into a web app. This is a framework-agnostic TypeScript image annotation library that opens a Shadow DOM modal, lets users draw annotations, and returns a flat PNG blob via an event.

## Library facts

**Import**
```ts
import { Annotator, openFilePicker } from '@hanieldaniel/img-marker'
```

**6 annotation tools (in toolbar order):** `rect`, `arrow`, `text`, `blur`, `ellipse`, `callout`

**3 image sources:**
- `{ type: 'file', file: File }` — from a File object or file input
- `{ type: 'dom', element: HTMLElement }` — screenshot via html2canvas
- `{ type: 'camera' }` — getUserMedia capture

**Output:** a `Blob` (PNG) delivered via the `'save'` event. The caller is responsible for closing the modal and handling the blob.

**Key constraint:** The modal never closes itself. Always call `annotator.close()` inside `'save'` and `'cancel'` handlers.

**Events:** `save(blob)`, `cancel()`, `tool-change(tool)`, `style-change(style)`

**Imperative API:** `open(source)`, `close()`, `selectTool(tool)`, `setColor()`, `setStrokeColor()`, `setStrokeWidth()`, `setOpacity()`, `undo()`, `redo()`, `on()`, `off()`

**Keyboard shortcuts:** Ctrl+Z undo, Ctrl+Y redo, Enter commits text/callout, Escape discards.

**Toolbar config:** pass `toolbar: ToolbarItem[]` to reorder or hide tools. Pass `customToolbar: true` to suppress the built-in toolbar entirely and bind your own UI to the API above.

## How to help

When the user asks you to integrate this library, follow this checklist:

1. **Identify the framework** (React, Vue, Svelte, vanilla, etc.) and adapt lifecycle management accordingly.
2. **Identify the image source** the user needs (`file`, `dom`, or `camera`).
3. **Instantiate once** — `new Annotator()` should not be called on every render or click. Use a ref, singleton, or module-level instance.
4. **Always wire both events** — `save` and `cancel` — and call `annotator.close()` in both.
5. **Ask about toolbar customization** if not specified — default toolbar is fine for most cases.
6. **Ask about style defaults** if the user has brand colors.

## Common patterns

### React hook

```tsx
import { useEffect, useRef } from 'react'
import { Annotator } from '@hanieldaniel/img-marker'
import type { ImageSource } from '@hanieldaniel/img-marker'

export function useAnnotator(onSave: (blob: Blob) => void) {
  const ref = useRef<Annotator | null>(null)

  useEffect(() => {
    const annotator = new Annotator()
    annotator.on('save', (blob) => { onSave(blob); annotator.close() })
    annotator.on('cancel', () => annotator.close())
    ref.current = annotator
    return () => annotator.close()
  }, [])

  return (source: ImageSource) => ref.current?.open(source)
}
```

### Vue composable

```ts
import { onUnmounted } from 'vue'
import { Annotator } from '@hanieldaniel/img-marker'

export function useAnnotator(onSave: (blob: Blob) => void) {
  const annotator = new Annotator()
  annotator.on('save', (blob) => { onSave(blob); annotator.close() })
  annotator.on('cancel', () => annotator.close())
  onUnmounted(() => annotator.close())
  return annotator
}
```

### Angular service

```ts
import { Injectable, OnDestroy } from '@angular/core'
import { Subject } from 'rxjs'
import { Annotator } from '@hanieldaniel/img-marker'
import type { ImageSource } from '@hanieldaniel/img-marker'

@Injectable({ providedIn: 'root' })
export class AnnotatorService implements OnDestroy {
  private annotator = new Annotator()
  readonly save$ = new Subject<Blob>()
  readonly cancel$ = new Subject<void>()

  constructor() {
    this.annotator.on('save', (blob) => { this.save$.next(blob); this.annotator.close() })
    this.annotator.on('cancel', () => { this.cancel$.next(); this.annotator.close() })
  }

  open(source: ImageSource): void {
    this.annotator.open(source)
  }

  ngOnDestroy(): void {
    this.annotator.close()
  }
}
```

Usage in a component:

```ts
import { Component, ElementRef, ViewChild } from '@angular/core'
import { AnnotatorService } from './annotator.service'

@Component({
  selector: 'app-screenshot',
  template: `
    <div #target><!-- content to screenshot --></div>
    <button (click)="annotate()">Annotate</button>
  `,
})
export class ScreenshotComponent {
  @ViewChild('target') target!: ElementRef<HTMLElement>

  constructor(private annotatorService: AnnotatorService) {
    this.annotatorService.save$.subscribe((blob) => {
      // handle blob — upload, download, etc.
    })
  }

  annotate(): void {
    this.annotatorService.open({ type: 'dom', element: this.target.nativeElement })
  }
}
```

### DOM screenshot flow

```ts
const annotator = new Annotator()
annotator.on('save', (blob) => { /* ... */; annotator.close() })
annotator.on('cancel', () => annotator.close())

document.querySelector('#report-btn').addEventListener('click', () => {
  const target = document.querySelector('#dashboard') as HTMLElement
  annotator.open({ type: 'dom', element: target })
})
```

### Custom toolbar

```ts
const annotator = new Annotator({ customToolbar: true })
// bind your UI to annotator.selectTool(), setColor(), setStrokeColor(), setStrokeWidth(), setOpacity(), undo(), redo()
// use annotator.on('tool-change') and annotator.on('style-change') to keep UI in sync
```

## Mistakes to avoid

- Do not call `new Annotator()` inside a click handler — it creates a new Shadow DOM host on every click.
- Do not forget `annotator.close()` — the modal will stay open forever.
- Do not push `annotator.open()` calls before the previous session closes — call `close()` first.
- `fromDom` uses html2canvas and may not capture cross-origin iframes or WebGL content.
