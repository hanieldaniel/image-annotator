import { describe, it, expect, vi, afterEach } from 'vitest'
import { CanvasRenderer } from '../CanvasRenderer'
import type { TextAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 16, radius: 12,
}

function makeSetup() {
  const strokeRects: Array<[number, number, number, number]> = []
  let _lw = 0

  const ctx = {
    clearRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), closePath: vi.fn(), ellipse: vi.fn(),
    fillText: vi.fn(), setLineDash: vi.fn(),
    strokeStyle: '', fillStyle: '', lineCap: '', font: '', globalAlpha: 1, filter: 'none',
    get lineWidth() { return _lw },
    set lineWidth(v: number) { _lw = v },
    measureText: vi.fn().mockImplementation((text: string) => ({ width: text.length * 10 })),
    strokeRect: vi.fn().mockImplementation((x: number, y: number, w: number, h: number) => {
      strokeRects.push([x, y, w, h])
    }),
  }

  const canvas = {
    width: 400, height: 400, offsetWidth: 400, offsetHeight: 400,
    getContext: vi.fn().mockReturnValue(ctx),
    style: {},
  } as unknown as HTMLCanvasElement

  return { canvas, strokeRects, ctx }
}

describe('CanvasRenderer text bounding box', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('uses measured text width for selection outline instead of hardcoded 128', () => {
    const { canvas, strokeRects } = makeSetup()
    const renderer = new CanvasRenderer(canvas)

    // 'hello' = 5 chars × 10px = 50px measured width
    const ann: TextAnnotation = { id: '1', type: 'text', x: 50, y: 100, text: 'hello', style }
    renderer.render({} as HTMLImageElement, [ann], '1')

    // Selection outline x starts at ann.x - 4 = 46
    const outline = strokeRects.find(([x]) => Math.abs(x - 46) < 1)
    expect(outline).toBeDefined()
    // Width should be measured (50) + padding (8) = 58, NOT hardcoded 128
    expect(outline![2]).toBeCloseTo(58)
  })

  it('adapts bounding box width to longer text', () => {
    const { canvas, strokeRects } = makeSetup()
    const renderer = new CanvasRenderer(canvas)

    // 'hello world' = 11 chars × 10px = 110px measured width
    const ann: TextAnnotation = { id: '1', type: 'text', x: 50, y: 100, text: 'hello world', style }
    renderer.render({} as HTMLImageElement, [ann], '1')

    const outline = strokeRects.find(([x]) => Math.abs(x - 46) < 1)
    expect(outline).toBeDefined()
    expect(outline![2]).toBeCloseTo(118) // 110 + 8
  })
})
