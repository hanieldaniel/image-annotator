import { describe, it, expect, vi } from 'vitest'
import { ToolManager } from '../ToolManager'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

const fakeCanvas = {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
  width: 500,
  height: 500,
} as unknown as HTMLCanvasElement

describe('commit after draw', () => {
  it('onCommit is called with the new annotation after a successful draw', () => {
    const onCommit = vi.fn()
    const manager = new ToolManager(fakeCanvas, () => 'rect', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 60, clientY: 60 }))

    expect(onCommit).toHaveBeenCalledOnce()
    expect(onCommit.mock.calls[0][0]).toHaveLength(1)
  })

  it('onCommit is NOT called for degenerate shapes', () => {
    const onCommit = vi.fn()
    const manager = new ToolManager(fakeCanvas, () => 'rect', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 11, clientY: 11 }))

    expect(onCommit).not.toHaveBeenCalled()
  })
})
