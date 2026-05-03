import { describe, it, expect, vi, afterEach } from 'vitest'
import { CanvasRenderer } from '../CanvasRenderer'
import type { RectAnnotation, ArrowAnnotation, TextAnnotation, EllipseAnnotation } from '../../types'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 14, radius: 12,
}

function makeSetup(canvasW: number, displayW: number) {
  const lineWidths: number[] = []
  const fonts: string[] = []
  let _lw = 0

  const ctx = {
    clearRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
    fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(), closePath: vi.fn(),
    ellipse: vi.fn(), setLineDash: vi.fn(), fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    strokeStyle: '', fillStyle: '', lineCap: '', globalAlpha: 1, filter: 'none',
    get lineWidth() { return _lw },
    set lineWidth(v: number) { lineWidths.push(v); _lw = v },
    get font() { return fonts.at(-1) ?? '' },
    set font(v: string) { fonts.push(v) },
  }

  const canvas = {
    width: canvasW, height: canvasW,
    offsetWidth: displayW, offsetHeight: displayW,
    getContext: vi.fn().mockReturnValue(ctx),
    style: {},
  } as unknown as HTMLCanvasElement

  return { canvas, lineWidths, fonts }
}

describe('CanvasRenderer stroke scaling', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('scales strokeWidth by canvas/display ratio when canvas is displayed smaller than its pixel size', () => {
    // canvas 400px, displayed at 200px → scale = 2
    const { canvas, lineWidths } = makeSetup(400, 200)
    const renderer = new CanvasRenderer(canvas)
    const ann: RectAnnotation = { id: '1', type: 'rect', x: 10, y: 10, width: 50, height: 50, style: { ...style, strokeWidth: 2 } }
    renderer.render({} as HTMLImageElement, [ann])

    // strokeWidth 2 × scale 2 = 4
    expect(lineWidths).toContain(4)
  })

  it('uses strokeWidth as-is when canvas display size matches pixel size (scale = 1)', () => {
    const { canvas, lineWidths } = makeSetup(400, 400)
    const renderer = new CanvasRenderer(canvas)
    const ann: RectAnnotation = { id: '1', type: 'rect', x: 10, y: 10, width: 50, height: 50, style: { ...style, strokeWidth: 3 } }
    renderer.render({} as HTMLImageElement, [ann])

    expect(lineWidths).toContain(3)
  })

  it('scales handle lineWidth when rendering selected annotation handles', () => {
    // canvas 400px, displayed at 200px → scale = 2
    const { canvas, lineWidths } = makeSetup(400, 200)
    const renderer = new CanvasRenderer(canvas)
    const ann: RectAnnotation = { id: '1', type: 'rect', x: 10, y: 10, width: 50, height: 50, style }
    renderer.render({} as HTMLImageElement, [ann], '1')

    // Handle lineWidth 1.5 × scale 2 = 3
    expect(lineWidths).toContain(3)
  })

  it('scales arrow lineWidth by display scale', () => {
    // canvas 400px, displayed at 200px → scale = 2
    const { canvas, lineWidths } = makeSetup(400, 200)
    const renderer = new CanvasRenderer(canvas)
    const ann: ArrowAnnotation = {
      id: '1', type: 'arrow',
      from: { x: 10, y: 10 }, to: { x: 100, y: 100 },
      style: { ...style, strokeWidth: 2 },
    }
    renderer.render({} as HTMLImageElement, [ann])

    // strokeWidth 2 × scale 2 = 4
    expect(lineWidths).toContain(4)
  })

  it('ellipse strokeWidth is already scaled via applyStroke', () => {
    const { canvas, lineWidths } = makeSetup(400, 200)
    const renderer = new CanvasRenderer(canvas)
    const ann: EllipseAnnotation = {
      id: '1', type: 'ellipse', cx: 50, cy: 50, rx: 30, ry: 20,
      style: { ...style, strokeWidth: 2 },
    }
    renderer.render({} as HTMLImageElement, [ann])

    expect(lineWidths).toContain(4) // 2 × 2
  })

  it('scales text fontSize by display scale when rendering', () => {
    // canvas 400px, displayed at 200px → scale = 2
    const { canvas, fonts } = makeSetup(400, 200)
    const renderer = new CanvasRenderer(canvas)
    const ann: TextAnnotation = {
      id: '1', type: 'text', x: 50, y: 100, text: 'hi',
      style: { ...style, fontSize: 16 },
    }
    renderer.render({} as HTMLImageElement, [ann])

    // fontSize 16 × scale 2 = 32
    expect(fonts.some((f) => f.includes('32px'))).toBe(true)
  })
})
