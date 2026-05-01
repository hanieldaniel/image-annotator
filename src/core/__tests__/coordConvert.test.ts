import { describe, it, expect } from 'vitest'
import { canvasToCss, cssToCanvas } from '../coordConvert'

describe('canvasToCss', () => {
  it('converts 1:1 when canvas and CSS sizes match', () => {
    expect(canvasToCss({ x: 50, y: 80 }, 400, 300, 400, 300)).toEqual({ x: 50, y: 80 })
  })

  it('scales down when canvas is 2x larger than CSS display', () => {
    expect(canvasToCss({ x: 100, y: 60 }, 400, 300, 200, 150)).toEqual({ x: 50, y: 30 })
  })

  it('scales up when canvas is smaller than CSS display', () => {
    expect(canvasToCss({ x: 50, y: 30 }, 200, 150, 400, 300)).toEqual({ x: 100, y: 60 })
  })
})

describe('cssToCanvas', () => {
  it('converts 1:1 when sizes match', () => {
    expect(cssToCanvas({ x: 50, y: 80 }, 400, 300, 400, 300)).toEqual({ x: 50, y: 80 })
  })

  it('scales up when canvas is 2x larger than CSS display', () => {
    expect(cssToCanvas({ x: 50, y: 30 }, 400, 300, 200, 150)).toEqual({ x: 100, y: 60 })
  })

  it('round-trips cleanly: cssToCanvas(canvasToCss(p)) === p', () => {
    const original = { x: 123, y: 456 }
    const css = canvasToCss(original, 1920, 1080, 640, 360)
    const back = cssToCanvas(css, 1920, 1080, 640, 360)
    expect(back.x).toBeCloseTo(original.x)
    expect(back.y).toBeCloseTo(original.y)
  })
})
