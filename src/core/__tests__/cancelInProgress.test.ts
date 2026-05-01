import { describe, it, expect, vi } from 'vitest'
import { ToolManager } from '../ToolManager'
import type { Annotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 1, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

const fakeCanvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as unknown as HTMLCanvasElement

function makeManager(onPreview = vi.fn(), onCommit = vi.fn(), initial: Annotation[] = []) {
  return new ToolManager(fakeCanvas, () => 'rect', () => style, () => null, onPreview, onCommit, vi.fn(), initial)
}

describe('cancelInProgress', () => {
  it('calls onPreview with committed annotations only (drops in-progress)', () => {
    const onPreview = vi.fn()
    const manager = makeManager(onPreview)

    const committed: Annotation = { id: 'r1', type: 'rect', style, x: 0, y: 0, width: 50, height: 50 }
    manager.setAnnotations([committed])

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.onPointerMove(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }))

    manager.cancelInProgress()

    const lastCall = onPreview.mock.calls.at(-1)?.[0] as Annotation[]
    expect(lastCall).toHaveLength(1)
    expect(lastCall[0].id).toBe('r1')
  })

  it('does not commit when cancelled', () => {
    const onCommit = vi.fn()
    const manager = makeManager(vi.fn(), onCommit)

    manager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))
    manager.onPointerMove(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }))
    manager.cancelInProgress()

    expect(onCommit).not.toHaveBeenCalled()
  })
})
