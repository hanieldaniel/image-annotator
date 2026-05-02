# @hanieldaniel/img-marker

A framework-agnostic TypeScript library for image annotation. Capture screenshots, annotate with drawing tools, and export the result as a PNG blob — all inside a Shadow DOM modal that works in any web app.

---

## Install

```bash
npm install @hanieldaniel/img-marker
```

---

## Quick start

```ts
import { Annotator } from '@hanieldaniel/img-marker'

const annotator = new Annotator()

annotator.on('save', (blob) => {
  // flat PNG blob — do whatever you need
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'annotated.png'
  a.click()
  annotator.close()
})

annotator.on('cancel', () => {
  annotator.close()
})

// open from a file input
document.querySelector('#file-input').addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files![0]
  annotator.open({ type: 'file', file })
})
```

---

## Image sources

### From a file

```ts
import { Annotator, openFilePicker } from '@hanieldaniel/img-marker'

const file = await openFilePicker()
annotator.open({ type: 'file', file })
```

### From a screenshot

```ts
annotator.open({ type: 'screenshot' })
```

Opens a fullscreen overlay; the user drags a region to capture. Internally uses html2canvas. Cross-origin content may not capture.

### From camera

```ts
annotator.open({ type: 'camera' })
```

Requests `getUserMedia` video permission, shows a preview, and lets the user capture a frame.

---

## Annotation tools

Tools appear in the toolbar in this order:

| Tool | Description |
|---|---|
| `rect` | Rectangle / bounding box |
| `arrow` | Arrow with filled head |
| `text` | Text label (click to place, Enter to commit) |
| `blur` | Pixel blur / redact region |
| `ellipse` | Ellipse / circle |

---

## Tool style options

Each annotation uses the currently active style:

| Property | Type | Description |
|---|---|---|
| `color` | `string` | Fill color (CSS color string) |
| `fillAlpha` | `number` | Fill opacity (0–1, applies to rect and ellipse) |
| `strokeColor` | `string` | Stroke / border color |
| `strokeWidth` | `number` | Stroke width in pixels (1–20) |
| `opacity` | `number` | Global annotation opacity (0–1) |
| `fontSize` | `number` | Font size in pixels (text tool) |
| `radius` | `number` | Blur radius in pixels (blur tool) |

---

## Events

```ts
annotator.on('save', (blob: Blob) => { })      // user clicked Save
annotator.on('cancel', () => { })              // user clicked Cancel
annotator.on('tool-change', (tool) => { })     // active tool changed
annotator.on('style-change', (style) => { })   // any style property changed

annotator.off('save', handler)                 // remove a specific listener
```

The modal **does not close itself** — call `annotator.close()` inside your `save` / `cancel` handlers.

---

## Configuration

```ts
const annotator = new Annotator({
  // show only a subset of tools, in your preferred order
  toolbar: [
    { tool: 'rect' },
    { tool: 'arrow' },
    { tool: 'text' },
    { tool: 'blur', hidden: true },  // hidden but still accessible via selectTool()
  ],

  // override default style values
  defaultStyle: {
    strokeColor: '#facc15',
    strokeWidth: 3,
    opacity: 0.9,
  },

  // set true when providing your own toolbar HTML
  customToolbar: true,
})
```

---

## Custom toolbar

When `customToolbar: true` the built-in toolbar is not rendered. Build your own UI and bind it to the annotator's imperative API:

```ts
const annotator = new Annotator({ customToolbar: true })

// tool selection
document.querySelector('#btn-rect').addEventListener('click', () => annotator.selectTool('rect'))
document.querySelector('#btn-arrow').addEventListener('click', () => annotator.selectTool('arrow'))
document.querySelector('#btn-text').addEventListener('click', () => annotator.selectTool('text'))
document.querySelector('#btn-blur').addEventListener('click', () => annotator.selectTool('blur'))
document.querySelector('#btn-ellipse').addEventListener('click', () => annotator.selectTool('ellipse'))

// style controls
document.querySelector('#color').addEventListener('input', (e) =>
  annotator.setColor((e.target as HTMLInputElement).value))

document.querySelector('#stroke-color').addEventListener('input', (e) =>
  annotator.setStrokeColor((e.target as HTMLInputElement).value))

document.querySelector('#stroke-width').addEventListener('input', (e) =>
  annotator.setStrokeWidth(Number((e.target as HTMLInputElement).value)))

document.querySelector('#opacity').addEventListener('input', (e) =>
  annotator.setOpacity(Number((e.target as HTMLInputElement).value)))

// undo / redo
document.querySelector('#undo').addEventListener('click', () => annotator.undo())
document.querySelector('#redo').addEventListener('click', () => annotator.redo())

// react to state changes to keep your UI in sync
annotator.on('tool-change', (tool) => {
  document.querySelectorAll('[data-tool]').forEach((el) =>
    el.classList.toggle('active', el.dataset.tool === tool))
})
```

---

## Imperative API

```ts
annotator.open(source)           // open modal and load image
annotator.close()                // close modal (call from save/cancel handlers)
annotator.selectTool(tool)       // 'rect' | 'arrow' | 'text' | 'blur' | 'ellipse'
annotator.setColor(color)        // fill color
annotator.setFillAlpha(alpha)    // fill opacity (0–1)
annotator.setStrokeColor(color)  // stroke color
annotator.setStrokeWidth(n)      // stroke width (px)
annotator.setOpacity(n)          // global opacity (0–1)
annotator.setFontSize(n)         // font size in px (text tool)
annotator.setRadius(n)           // blur radius in px (blur tool)
annotator.getSelected()          // returns selected annotation id or null
annotator.setSelected(id)        // programmatically select an annotation
annotator.deleteSelected()       // delete the currently selected annotation
annotator.undo()                 // undo last annotation
annotator.redo()                 // redo
annotator.zoomIn()               // increase zoom by 0.25
annotator.zoomOut()              // decrease zoom by 0.25
annotator.on(event, handler)
annotator.off(event, handler)
```

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` / `⌘Z` | Undo |
| `Ctrl+Y` / `⌘⇧Z` | Redo |
| `Enter` | Commit text input |
| `Escape` | Cancel in-progress annotation / deselect tool / deselect annotation |
| `Delete` / `Backspace` | Delete selected annotation |

---

## Zoom behaviour

When an image is opened, the initial zoom is automatically calculated so that images larger than the modal fit within view (zoom-out only). Small images display at their natural size (zoom = 1). The user can then zoom in or out using the toolbar buttons (range: 0.25×–4×).

---

## Framework examples

### React

```tsx
import { useEffect, useRef } from 'react'
import { Annotator } from '@hanieldaniel/img-marker'

export function AnnotateButton({ file }: { file: File }) {
  const annotatorRef = useRef<Annotator | null>(null)

  useEffect(() => {
    const annotator = new Annotator()
    annotator.on('save', (blob) => {
      console.log('got blob', blob)
      annotator.close()
    })
    annotator.on('cancel', () => annotator.close())
    annotatorRef.current = annotator
    return () => annotator.close()
  }, [])

  return (
    <button onClick={() => annotatorRef.current?.open({ type: 'file', file })}>
      Annotate
    </button>
  )
}
```

### Vue

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Annotator } from '@hanieldaniel/img-marker'

const annotator = new Annotator()

onMounted(() => {
  annotator.on('save', (blob) => { console.log(blob); annotator.close() })
  annotator.on('cancel', () => annotator.close())
})
onUnmounted(() => annotator.close())
</script>

<template>
  <button @click="annotator.open({ type: 'screenshot' })">Capture & Annotate</button>
</template>
```

### Vanilla JS (CDN, coming soon)

```html
<script type="module">
  import { Annotator } from 'https://cdn.jsdelivr.net/npm/@hanieldaniel/img-marker/dist/index.js'
  const annotator = new Annotator()
  // ...
</script>
```

---

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). No IE11. Client-side only — does not run in SSR/Node.

---

## License

MIT
