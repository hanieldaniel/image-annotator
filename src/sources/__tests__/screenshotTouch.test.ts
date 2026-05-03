import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue(
    Object.assign(document.createElement('canvas'), { width: 800, height: 600 })
  ),
}))

import { captureScreenshot } from '../ScreenshotCapture'

function makeTouch(clientX: number, clientY: number): Touch {
  return {
    clientX, clientY, identifier: 0, target: document.body,
    screenX: 0, screenY: 0, pageX: clientX, pageY: clientY,
    radiusX: 0, radiusY: 0, rotationAngle: 0, force: 0,
  } as Touch
}

function fireTouchEvent(target: Element, type: string, active: Touch[], changed: Touch[]) {
  target.dispatchEvent(
    new TouchEvent(type, {
      bubbles: true, cancelable: true,
      touches: active, changedTouches: changed,
    })
  )
}

describe('captureScreenshot: touch support', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,abc')
  })
  afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

  it('resolves with image data when region is selected via touch drag', async () => {
    const promise = captureScreenshot()

    const overlay = document.body.querySelector('div') as HTMLElement
    expect(overlay).not.toBeNull()

    const t1 = makeTouch(100, 100)
    fireTouchEvent(overlay, 'touchstart', [t1], [t1])

    const t2 = makeTouch(300, 250)
    fireTouchEvent(overlay, 'touchmove', [t2], [t2])

    const t3 = makeTouch(300, 250)
    fireTouchEvent(overlay, 'touchend', [], [t3])

    const result = await promise
    expect(typeof result).toBe('string')
    expect(result.startsWith('data:')).toBe(true)
  })

  it('updates selection dims element during touch drag', () => {
    captureScreenshot()

    const overlay = document.body.querySelector('div') as HTMLElement
    const sel = overlay.querySelector('div[style*="border"]') as HTMLElement

    const t1 = makeTouch(50, 50)
    fireTouchEvent(overlay, 'touchstart', [t1], [t1])

    const t2 = makeTouch(200, 180)
    fireTouchEvent(overlay, 'touchmove', [t2], [t2])

    expect(sel.style.width).toBe('150px')
    expect(sel.style.height).toBe('130px')
  })
})
