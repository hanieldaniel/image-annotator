import { describe, it, expect } from 'vitest'
import { hitTest } from '../hitTest'
import type { Annotation } from '../../types'

const style = {
  color: '#ff0000',
  fillAlpha: 1,
  strokeColor: '#ff0000',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 14,
  radius: 12,
}

describe('hitTest — rect', () => {
  const rect: Annotation = { id: 'r1', type: 'rect', style, x: 10, y: 10, width: 100, height: 80 }

  it('returns id when point is inside rect', () => {
    expect(hitTest({ x: 50, y: 50 }, [rect])).toBe('r1')
  })

  it('returns null when point is outside rect', () => {
    expect(hitTest({ x: 200, y: 200 }, [rect])).toBeNull()
  })

  it('hits on corner', () => {
    expect(hitTest({ x: 10, y: 10 }, [rect])).toBe('r1')
  })
})

describe('hitTest — ellipse', () => {
  const ellipse: Annotation = { id: 'e1', type: 'ellipse', style, cx: 100, cy: 100, rx: 50, ry: 30 }

  it('returns id when point is inside ellipse', () => {
    expect(hitTest({ x: 100, y: 100 }, [ellipse])).toBe('e1')
  })

  it('returns null when point is outside ellipse but inside bounding box', () => {
    expect(hitTest({ x: 145, y: 125 }, [ellipse])).toBeNull()
  })
})

describe('hitTest — arrow', () => {
  const arrow: Annotation = { id: 'a1', type: 'arrow', style, from: { x: 0, y: 0 }, to: { x: 100, y: 0 } }

  it('returns id when point is near arrow line', () => {
    expect(hitTest({ x: 50, y: 4 }, [arrow])).toBe('a1')
  })

  it('returns null when point is far from arrow line', () => {
    expect(hitTest({ x: 50, y: 20 }, [arrow])).toBeNull()
  })
})

describe('hitTest — blur', () => {
  const blur: Annotation = { id: 'b1', type: 'blur', style, x: 20, y: 20, width: 60, height: 40, radius: 12 }

  it('returns id when point is inside blur region', () => {
    expect(hitTest({ x: 40, y: 35 }, [blur])).toBe('b1')
  })
})

describe('hitTest — stacking order', () => {
  const bottom: Annotation = { id: 'bottom', type: 'rect', style, x: 0, y: 0, width: 100, height: 100 }
  const top: Annotation = { id: 'top', type: 'rect', style, x: 0, y: 0, width: 100, height: 100 }

  it('returns topmost annotation (last in array) when overlapping', () => {
    expect(hitTest({ x: 50, y: 50 }, [bottom, top])).toBe('top')
  })
})
