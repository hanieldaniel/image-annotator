import { describe, it, expect } from 'vitest'
import { History } from '../History'
import type { RectAnnotation } from '../../types'

const style = {
  color: '#f00', fillAlpha: 1, strokeColor: '#f00',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

function makeRect(x: number, y: number): RectAnnotation {
  return { id: 'r1', type: 'rect', style, x, y, width: 50, height: 50 }
}

describe('undo after move restores position', () => {
  it('undo after move returns annotation to original position', () => {
    const history = new History()

    const original = makeRect(10, 20)
    history.push([original])

    const moved = makeRect(100, 200)
    history.push([moved])

    const restored = history.undo()
    expect(restored[0]).toMatchObject({ x: 10, y: 20 })
  })

  it('redo after undo returns annotation to moved position', () => {
    const history = new History()
    history.push([makeRect(10, 20)])
    history.push([makeRect(100, 200)])
    history.undo()

    const redone = history.redo()
    expect(redone[0]).toMatchObject({ x: 100, y: 200 })
  })

  it('move after undo discards redo stack', () => {
    const history = new History()
    history.push([makeRect(10, 20)])
    history.push([makeRect(100, 200)])
    history.undo()

    history.push([makeRect(50, 50)])
    expect(history.canRedo()).toBe(false)
    expect(history.current[0]).toMatchObject({ x: 50, y: 50 })
  })

  it('history stores deep copy — mutating returned array does not corrupt stack', () => {
    const history = new History()
    const rect = makeRect(10, 20)
    history.push([rect])

    const result = history.current
    ;(result[0] as RectAnnotation).x = 999

    expect(history.current[0]).toMatchObject({ x: 10, y: 20 })
  })
})
