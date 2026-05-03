import { describe, it, expect, vi, afterEach } from 'vitest'
import { CanvasRenderer } from '../CanvasRenderer'
import type { RectAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

/**
 * Simulates the zoom scenario: canvas.width is fixed, but offsetWidth changes
 * as the zoom CSS is applied. Verifies that re-rendering after zoom produces
 * the same visual stroke width (lineWidth * displayZoom = constant).
 */
function makeSetupWithMutableOffset(canvasW: number) {
  const lineWidths: number[] = []
  let _lw = 0
  let _offsetWidth = canvasW

  const ctx = {
    clearRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
    fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(), closePath: vi.fn(),
    ellipse: vi.fn(), setLineDash: vi.fn(), fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    strokeStyle: '', fillStyle: '', lineCap: '', font: '', globalAlpha: 1, filter: 'none',
    get lineWidth() { return _lw },
    set lineWidth(v: number) { lineWidths.push(v); _lw = v },
  }

  const canvas = {
    width: canvasW, height: canvasW,
    get offsetWidth() { return _offsetWidth },
    get offsetHeight() { return _offsetWidth },
    getContext: vi.fn().mockReturnValue(ctx),
    style: {},
  } as unknown as HTMLCanvasElement

  const setDisplayWidth = (w: number) => { _offsetWidth = w }

  return { canvas, lineWidths, setDisplayWidth }
}

describe('CanvasRenderer: stroke visual size stays constant across zoom changes', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('lineWidth × zoom equals strokeWidth regardless of display scale', () => {
    const { canvas, lineWidths, setDisplayWidth } = makeSetupWithMutableOffset(2000)
    const renderer = new CanvasRenderer(canvas)
    const ann: RectAnnotation = { id: '1', type: 'rect', x: 10, y: 10, width: 50, height: 50, style: { ...style, strokeWidth: 2 } }

    // Zoom 0.5: canvas displayed at 1000px → displayScale = 2
    setDisplayWidth(1000)
    lineWidths.length = 0
    renderer.render({} as HTMLImageElement, [ann])
    const lwAtHalfZoom = lineWidths.find((w) => w > 0)!
    const visualAtHalf = lwAtHalfZoom * (1000 / 2000) // lineWidth × CSS-zoom

    // Zoom 1.0: canvas displayed at 2000px → displayScale = 1
    setDisplayWidth(2000)
    lineWidths.length = 0
    renderer.render({} as HTMLImageElement, [ann])
    const lwAtFullZoom = lineWidths.find((w) => w > 0)!
    const visualAtFull = lwAtFullZoom * (2000 / 2000)

    // Visual stroke must be the same regardless of zoom
    expect(visualAtHalf).toBeCloseTo(visualAtFull)
    expect(visualAtHalf).toBeCloseTo(2) // equals strokeWidth
  })
})
