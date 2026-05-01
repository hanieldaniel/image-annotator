import html2canvas from 'html2canvas'

export function captureScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      cursor: crosshair;
    `

    const dimTop = document.createElement('div')
    const dimBottom = document.createElement('div')
    const dimLeft = document.createElement('div')
    const dimRight = document.createElement('div')
    const dimStyle = 'position:absolute;background:rgba(0,0,0,0.4);'
    dimTop.style.cssText = dimStyle + 'top:0;left:0;right:0;height:0'
    dimBottom.style.cssText = dimStyle + 'bottom:0;left:0;right:0;height:0'
    dimLeft.style.cssText = dimStyle + 'top:0;left:0;width:0'
    dimRight.style.cssText = dimStyle + 'top:0;right:0;width:0'

    const sel = document.createElement('div')
    sel.style.cssText = `
      position: absolute;
      border: 2px solid #2563eb;
      box-sizing: border-box;
      pointer-events: none;
    `

    const hint = document.createElement('div')
    hint.style.cssText = `
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.75); color: #fff; padding: 6px 14px;
      border-radius: 6px; font-family: system-ui; font-size: 13px; pointer-events: none;
    `
    hint.textContent = 'Drag to select area — Esc to cancel'

    overlay.append(dimTop, dimBottom, dimLeft, dimRight, sel, hint)
    document.body.appendChild(overlay)

    let startX = 0, startY = 0, dragging = false

    const updateDims = (x: number, y: number, w: number, h: number) => {
      dimTop.style.height = `${y}px`
      dimBottom.style.top = `${y + h}px`
      dimBottom.style.height = `${window.innerHeight - y - h}px`
      dimLeft.style.top = `${y}px`
      dimLeft.style.width = `${x}px`
      dimLeft.style.height = `${h}px`
      dimRight.style.top = `${y}px`
      dimRight.style.left = `${x + w}px`
      dimRight.style.width = `${window.innerWidth - x - w}px`
      dimRight.style.height = `${h}px`
      sel.style.left = `${x}px`
      sel.style.top = `${y}px`
      sel.style.width = `${w}px`
      sel.style.height = `${h}px`
    }

    const onMouseDown = (e: MouseEvent) => {
      startX = e.clientX
      startY = e.clientY
      dragging = true
      hint.style.display = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      const x = Math.min(e.clientX, startX)
      const y = Math.min(e.clientY, startY)
      const w = Math.abs(e.clientX - startX)
      const h = Math.abs(e.clientY - startY)
      updateDims(x, y, w, h)
    }

    const onMouseUp = async (e: MouseEvent) => {
      if (!dragging) return
      dragging = false

      const x = Math.min(e.clientX, startX)
      const y = Math.min(e.clientY, startY)
      const w = Math.abs(e.clientX - startX)
      const h = Math.abs(e.clientY - startY)

      cleanup()

      if (w < 10 || h < 10) {
        reject(new Error('Selection too small'))
        return
      }

      try {
        const full = await html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,
        })
        const cropped = document.createElement('canvas')
        const dpr = window.devicePixelRatio || 1
        cropped.width = w * dpr
        cropped.height = h * dpr
        cropped.getContext('2d')!.drawImage(
          full,
          x * dpr, y * dpr, w * dpr, h * dpr,
          0, 0, w * dpr, h * dpr,
        )
        resolve(cropped.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { cleanup(); reject(new Error('cancelled')) }
    }

    const cleanup = () => {
      overlay.remove()
      document.removeEventListener('keydown', onKeyDown)
      overlay.removeEventListener('mousedown', onMouseDown)
      overlay.removeEventListener('mousemove', onMouseMove)
      overlay.removeEventListener('mouseup', onMouseUp)
    }

    overlay.addEventListener('mousedown', onMouseDown)
    overlay.addEventListener('mousemove', onMouseMove)
    overlay.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keydown', onKeyDown)
  })
}
