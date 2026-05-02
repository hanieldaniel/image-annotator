import { describe, it, expect, vi, afterEach } from 'vitest'
import { ToolManager } from '../ToolManager'
import type { TextAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
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
  return canvas
}

describe('text re-edit on double-click', () => {
  afterEach(() => { document.body.innerHTML = '' })
  it('opens a textarea pre-filled with existing text when double-clicking a text annotation', () => {
    const canvas = makeCanvasWithParent()
    // Text annotation at (100, 100) — hit area covers (100, 86) to (220, 106)
    const text: TextAnnotation = { id: 't1', type: 'text', style, x: 100, y: 100, text: 'hello world' }
    const manager = new ToolManager(canvas, () => null, () => style, () => 't1', vi.fn(), vi.fn(), vi.fn(), [text])

    manager.onDblClick(new MouseEvent('dblclick', { clientX: 150, clientY: 95 }))

    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    expect(ta).not.toBeNull()
    expect(ta.value).toBe('hello world')
  })

  it('commits updated text as a replacement annotation (replace-on-edit)', async () => {
    const canvas = makeCanvasWithParent()
    const text: TextAnnotation = { id: 't1', type: 'text', style, x: 100, y: 100, text: 'original' }
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => null, () => style, () => 't1', vi.fn(), onCommit, vi.fn(), [text])

    manager.onDblClick(new MouseEvent('dblclick', { clientX: 150, clientY: 95 }))

    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    ta.value = 'updated'
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(onCommit).toHaveBeenCalledOnce()
    const committed = onCommit.mock.calls[0][0] as TextAnnotation[]
    expect(committed).toHaveLength(1)
    expect(committed[0]).toMatchObject({ id: 't1', text: 'updated' })
  })
})
