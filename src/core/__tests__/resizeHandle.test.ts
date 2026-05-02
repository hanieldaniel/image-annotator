import { describe, it, expect, vi } from 'vitest'
import { ToolManager } from '../ToolManager'
import type { RectAnnotation, ArrowAnnotation, EllipseAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

// 1:1 scale so client coords == canvas coords
const fakeCanvas = {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
  width: 500,
  height: 500,
} as unknown as HTMLCanvasElement

describe('resize — rect', () => {
  it('dragging BR corner handle increases width and height', () => {
    const onCommit = vi.fn()
    const rect: RectAnnotation = { id: 'r1', type: 'rect', style, x: 100, y: 100, width: 100, height: 80 }
    const manager = new ToolManager(fakeCanvas, () => null, () => style, () => 'r1', vi.fn(), onCommit, vi.fn(), [rect])

    // BR handle at (200, 180), drag to (250, 230)
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 200, clientY: 180 }))
    manager.onPointerMove(new MouseEvent('mousemove', { clientX: 250, clientY: 230 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 250, clientY: 230 }))

    expect(onCommit).toHaveBeenCalledOnce()
    const result = onCommit.mock.calls[0][0][0] as RectAnnotation
    expect(result).toMatchObject({ x: 100, y: 100, width: 150, height: 130 })
  })

  it('dragging TL corner handle moves origin and shrinks dimensions', () => {
    const onCommit = vi.fn()
    const rect: RectAnnotation = { id: 'r1', type: 'rect', style, x: 100, y: 100, width: 100, height: 80 }
    const manager = new ToolManager(fakeCanvas, () => null, () => style, () => 'r1', vi.fn(), onCommit, vi.fn(), [rect])

    // TL handle at (100, 100), drag to (120, 120)
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 120, clientY: 120 }))

    const result = onCommit.mock.calls[0][0][0] as RectAnnotation
    expect(result).toMatchObject({ x: 120, y: 120, width: 80, height: 60 })
  })
})

describe('resize — arrow', () => {
  it('dragging the "to" endpoint moves it', () => {
    const onCommit = vi.fn()
    const arrow: ArrowAnnotation = { id: 'a1', type: 'arrow', style, from: { x: 50, y: 50 }, to: { x: 200, y: 200 } }
    const manager = new ToolManager(fakeCanvas, () => null, () => style, () => 'a1', vi.fn(), onCommit, vi.fn(), [arrow])

    // "to" handle at (200, 200), drag to (250, 150)
    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 200, clientY: 200 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 250, clientY: 150 }))

    const result = onCommit.mock.calls[0][0][0] as ArrowAnnotation
    expect(result).toMatchObject({ from: { x: 50, y: 50 }, to: { x: 250, y: 150 } })
  })
})

describe('resize — ellipse', () => {
  it('dragging BR handle of selected ellipse increases radii', () => {
    const onCommit = vi.fn()
    // cx:150, cy:150, rx:50, ry:40 → bounding box: x:100, y:110, w:100, h:80
    // BR handle at (200, 190)
    const ellipse: EllipseAnnotation = { id: 'e1', type: 'ellipse', style, cx: 150, cy: 150, rx: 50, ry: 40 }
    const manager = new ToolManager(fakeCanvas, () => null, () => style, () => 'e1', vi.fn(), onCommit, vi.fn(), [ellipse])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 200, clientY: 190 }))
    manager.onPointerUp(new MouseEvent('mouseup', { clientX: 220, clientY: 210 }))

    const result = onCommit.mock.calls[0][0][0] as EllipseAnnotation
    expect(result.rx).toBeGreaterThan(50)
    expect(result.ry).toBeGreaterThan(40)
  })
})
