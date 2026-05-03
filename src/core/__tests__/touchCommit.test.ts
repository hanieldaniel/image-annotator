import { describe, it, expect, vi, afterEach } from 'vitest'
import { ToolManager } from '../ToolManager'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

function makeCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 500
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 500, height: 500, right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {} } as DOMRect)
  return canvas
}

function makeTouch(clientX: number, clientY: number): Touch {
  return { clientX, clientY, identifier: 0, target: document.body, screenX: 0, screenY: 0, pageX: clientX, pageY: clientY, radiusX: 0, radiusY: 0, rotationAngle: 0, force: 0 } as Touch
}

function touchEvent(type: string, active: Touch[], changed: Touch[]): TouchEvent {
  return { type, touches: active, changedTouches: changed, preventDefault: vi.fn() } as unknown as TouchEvent
}

describe('touch: annotation commits on touchend', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('commits rect annotation when touchend fires with empty touches array', () => {
    const canvas = makeCanvas()
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => 'rect', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    const t1 = makeTouch(50, 50)
    manager.onPointerDown(touchEvent('touchstart', [t1], [t1]))

    const t2 = makeTouch(150, 150)
    manager.onPointerMove(touchEvent('touchmove', [t2], [t2]))

    // touchend: touches is empty, position only in changedTouches
    manager.onPointerUp(touchEvent('touchend', [], [t2]))

    expect(onCommit).toHaveBeenCalledOnce()
    const committed = onCommit.mock.calls[0][0]
    expect(committed).toHaveLength(1)
    expect(committed[0].type).toBe('rect')
  })

  it('uses changedTouches position for final annotation dimensions on touchend', () => {
    const canvas = makeCanvas()
    const onCommit = vi.fn()
    const manager = new ToolManager(canvas, () => 'rect', () => style, () => null, vi.fn(), onCommit, vi.fn(), [])

    const t1 = makeTouch(100, 100)
    manager.onPointerDown(touchEvent('touchstart', [t1], [t1]))

    const t2 = makeTouch(200, 200)
    manager.onPointerUp(touchEvent('touchend', [], [t2]))

    expect(onCommit).toHaveBeenCalledOnce()
    const [rect] = onCommit.mock.calls[0][0]
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
  })
})
