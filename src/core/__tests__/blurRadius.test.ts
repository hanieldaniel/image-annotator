import { describe, it, expect, vi } from 'vitest'
import { Annotator } from '../Annotator'

function bootAnnotator() {
  const annotator = new Annotator()
  ;(annotator as any).buildDOM()
  const canvas = (annotator as any).canvas as HTMLCanvasElement
  canvas.width = 500
  canvas.height = 500
  canvas.getBoundingClientRect = () => ({
    left: 0, top: 0, width: 500, height: 500,
    right: 500, bottom: 500, x: 0, y: 0, toJSON: () => {},
  } as DOMRect)
  ;(annotator as any).renderer = { render: vi.fn() }
  ;(annotator as any).image = {}
  ;(annotator as any).bindCanvasEvents()
  ;(annotator as any).bindKeyboard()
  return annotator
}

describe('blur radius slider', () => {
  it('updating radius via setRadius changes the rendered ann.radius on a selected blur', () => {
    const annotator = bootAnnotator()
    const blur = {
      id: 'b1',
      type: 'blur' as const,
      x: 50, y: 50, width: 100, height: 80,
      radius: 12,
      style: { color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000', strokeWidth: 2, opacity: 1, fontSize: 16, radius: 12 },
    }
    ;(annotator as any).annotations = [blur]
    ;(annotator as any).toolManager.setAnnotations([blur])
    ;(annotator as any).selectedId = 'b1'

    annotator.setRadius(30)

    const updated = (annotator as any).annotations.find((a: any) => a.id === 'b1')
    expect(updated.radius).toBe(30)
    expect(updated.style.radius).toBe(30)
  })
})
