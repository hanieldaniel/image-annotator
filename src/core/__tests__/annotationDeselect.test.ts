import { describe, it, expect, vi, afterEach } from 'vitest'
import { Annotator } from '../Annotator'
import { syncToolbarToAnnotation } from '../../ui/toolbar'

const style = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 16, radius: 12,
}

const annotators: Annotator[] = []

afterEach(() => {
  annotators.splice(0).forEach(a => (a as any).unbindKeyboard())
  document.body.innerHTML = ''
})

function bootAnnotator() {
  const annotator = new Annotator()
  annotators.push(annotator)
  ;(annotator as any).buildDOM()
  ;(annotator as any).bindKeyboard()
  return annotator
}

function bootAnnotatorFull() {
  const annotator = new Annotator()
  annotators.push(annotator)
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

describe('Escape key deselects selected annotation', () => {
  it('clears selectedId when annotation is selected and no draw in progress', () => {
    const annotator = bootAnnotator()
    annotator.setSelected('ann-1')
    expect(annotator.getSelected()).toBe('ann-1')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(annotator.getSelected()).toBeNull()
  })

  it('is a no-op when nothing is selected and no tool active', () => {
    const annotator = bootAnnotator()
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }).not.toThrow()
    expect(annotator.getSelected()).toBeNull()
  })
})

describe('toolbar controls clear when annotation is deselected', () => {
  it('controls hide after clicking outside a selected annotation', () => {
    const annotator = bootAnnotatorFull()
    const toolbar = (annotator as any).toolbar as HTMLElement
    const toolManager = (annotator as any).toolManager

    const ann = { id: 'a1', type: 'rect' as const, x: 200, y: 200, width: 100, height: 100, style }
    ;(annotator as any).annotations = [ann]
    toolManager.setAnnotations([ann])
    ;(annotator as any).selectedId = 'a1'

    // Simulate controls visible after annotation was selected
    toolbar.querySelectorAll<HTMLElement>('[data-control]').forEach(el => {
      el.style.display = ''
    })
    expect(toolbar.querySelector<HTMLElement>('[data-control="fill"]')!.style.display).toBe('')

    // Click outside annotation (10,10 is outside the rect at 200,200–300,300)
    toolManager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))

    toolbar.querySelectorAll<HTMLElement>('[data-control]').forEach(el => {
      expect(el.style.display).toBe('none')
    })
  })

  it('controls hide after pressing Escape with annotation selected', () => {
    const annotator = bootAnnotatorFull()
    const toolbar = (annotator as any).toolbar as HTMLElement

    annotator.setSelected('ann-1')

    // Simulate controls visible after annotation was selected
    toolbar.querySelectorAll<HTMLElement>('[data-control]').forEach(el => {
      el.style.display = ''
    })
    expect(toolbar.querySelector<HTMLElement>('[data-control="strokeColor"]')!.style.display).toBe('')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    toolbar.querySelectorAll<HTMLElement>('[data-control]').forEach(el => {
      expect(el.style.display).toBe('none')
    })
  })
})

describe('tool button loses im-active when annotation is deselected', () => {
  it('rect tool button is no longer active after clicking outside a selected rect annotation', () => {
    const annotator = bootAnnotatorFull()
    const toolbar = (annotator as any).toolbar as HTMLElement
    const toolManager = (annotator as any).toolManager

    const ann = { id: 'a1', type: 'rect' as const, x: 200, y: 200, width: 100, height: 100, style }
    ;(annotator as any).annotations = [ann]
    toolManager.setAnnotations([ann])
    ;(annotator as any).selectedId = 'a1'

    // Simulate full annotation-selected state (highlights rect tool button)
    syncToolbarToAnnotation(toolbar, ann)
    expect(toolbar.querySelector<HTMLElement>('[data-tool="rect"]')!.classList.contains('im-active')).toBe(true)

    // Click outside
    toolManager.onPointerDown(new MouseEvent('mousedown', { clientX: 10, clientY: 10 }))

    expect(toolbar.querySelector<HTMLElement>('[data-tool="rect"]')!.classList.contains('im-active')).toBe(false)
  })

  it('tool button loses im-active after pressing Escape', () => {
    const annotator = bootAnnotatorFull()
    const toolbar = (annotator as any).toolbar as HTMLElement

    const ann = { id: 'a1', type: 'rect' as const, x: 200, y: 200, width: 100, height: 100, style }
    syncToolbarToAnnotation(toolbar, ann)
    ;(annotator as any).selectedId = 'a1'
    expect(toolbar.querySelector<HTMLElement>('[data-tool="rect"]')!.classList.contains('im-active')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(toolbar.querySelector<HTMLElement>('[data-tool="rect"]')!.classList.contains('im-active')).toBe(false)
  })
})
