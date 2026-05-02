import { describe, it, expect, vi, afterEach } from 'vitest'
import { ToolManager } from '../ToolManager'
import type { TextAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

function makeCanvas(cssLeft = 0, cssTop = 0, cssW = 500, cssH = 500) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const canvas = document.createElement('canvas')
  canvas.width = cssW
  canvas.height = cssH
  container.appendChild(canvas)

  // Make container look like it's positioned in the viewport
  container.getBoundingClientRect = () =>
    ({ left: cssLeft, top: cssTop, width: cssW, height: cssH, right: cssLeft + cssW, bottom: cssTop + cssH, x: cssLeft, y: cssTop, toJSON: () => {} } as DOMRect)
  canvas.getBoundingClientRect = () =>
    ({ left: cssLeft, top: cssTop, width: cssW, height: cssH, right: cssLeft + cssW, bottom: cssTop + cssH, x: cssLeft, y: cssTop, toJSON: () => {} } as DOMRect)

  return canvas
}

describe('text tool placement coordinates', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('places text annotation at the click position (canvas coords)', async () => {
    // Canvas at viewport (100, 50), 500x500 (1:1 scale)
    const canvas = makeCanvas(100, 50, 500, 500)
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => 'text', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    // Click at viewport (350, 200) = canvas CSS (250, 150) relative to container
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 350, clientY: 200 }))

    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    expect(ta).not.toBeNull()

    // Mock the wrapper's offsetLeft/offsetTop to simulate correct browser layout
    // (jsdom doesn't compute layout; real browsers return the CSS left/top value)
    const wrapper = ta.parentElement!
    Object.defineProperty(wrapper, 'offsetLeft', { get: () => parseFloat(wrapper.style.left) || 0 })
    Object.defineProperty(wrapper, 'offsetTop', { get: () => parseFloat(wrapper.style.top) || 0 })

    ta.value = 'hello'
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(onCommit).toHaveBeenCalledOnce()
    const committed = onCommit.mock.calls[0][0] as TextAnnotation[]
    expect(committed).toHaveLength(1)
    const ann = committed[0]

    // Click at (350, 200) viewport, container at (100, 50) → CSS (250, 150) within container
    // Canvas is 500px intrinsic, 500px CSS (1:1 scale), so canvas coords = CSS coords
    expect(ann.x).toBeCloseTo(250, 0)
    expect(ann.y).toBeCloseTo(150 + style.fontSize, 0)
  })

  it('text annotation x/y are NOT zero when clicking away from origin', async () => {
    const canvas = makeCanvas(100, 50, 500, 500)
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => 'text', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 350, clientY: 250 }))

    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    // Do NOT mock offsetLeft — this is the failing case in jsdom (returns 0)
    ta.value = 'hello'
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(onCommit).toHaveBeenCalledOnce()
    const ann = onCommit.mock.calls[0][0][0] as TextAnnotation
    // Without the fix, x = 0 because jsdom offsetLeft = 0
    // This test documents the bug: x should be 250, not 0
    expect(ann.x).toBeGreaterThan(0)
  })
})
