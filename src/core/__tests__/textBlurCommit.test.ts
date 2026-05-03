import { describe, it, expect, vi, afterEach } from 'vitest'
import { ToolManager } from '../ToolManager'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

function makeCanvasWithParent() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 500
  container.appendChild(canvas)
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {} } as DOMRect)
  container.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {} } as DOMRect)
  return canvas
}

describe('text tool: click-outside behavior', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('does not open a new text box at the new click position when text entry is active', () => {
    const canvas = makeCanvasWithParent()
    const manager = new ToolManager(canvas, () => 'text', () => style, () => null, vi.fn(), vi.fn(), vi.fn(), [])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }))
    const wrapper = document.querySelector('div[style*="position: absolute"]') as HTMLElement
    const originalLeft = wrapper?.style.left

    // Click at a different position while text entry is active
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 300, clientY: 300 }))

    const wrapper2 = document.querySelector('div[style*="position: absolute"]') as HTMLElement
    // Should still be the original wrapper, not a new one at x=300
    expect(wrapper2?.style.left).toBe(originalLeft)
  })

  it('commits typed text when textarea loses focus (blur fires on click-outside)', async () => {
    const canvas = makeCanvasWithParent()
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => 'text', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }))
    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    ta.value = 'typed text'

    // In the browser, clicking elsewhere moves focus → blur fires on textarea
    ta.dispatchEvent(new Event('blur'))

    await new Promise((r) => setTimeout(r, 200))

    expect(onCommit).toHaveBeenCalled()
    const committed = onCommit.mock.calls[0][0]
    expect(committed.some((a: { text: string }) => a.text === 'typed text')).toBe(true)
  })
})
