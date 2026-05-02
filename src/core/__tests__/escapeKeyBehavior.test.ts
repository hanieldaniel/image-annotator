import { describe, it, expect, vi } from 'vitest'
import { ToolManager } from '../ToolManager'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

const fakeCanvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as unknown as HTMLCanvasElement

function makeManager() {
  return new ToolManager(fakeCanvas, () => 'rect', () => style, () => null, vi.fn(), vi.fn(), vi.fn(), [])
}

describe('cancelInProgress — return value', () => {
  it('returns true when a draw is in progress', () => {
    const manager = makeManager()
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.onPointerMove(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }))
    expect(manager.cancelInProgress()).toBe(true)
  })

  it('returns false when nothing is in progress', () => {
    const manager = makeManager()
    expect(manager.cancelInProgress()).toBe(false)
  })

  it('returns false after already cancelling', () => {
    const manager = makeManager()
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.cancelInProgress()
    expect(manager.cancelInProgress()).toBe(false)
  })
})
