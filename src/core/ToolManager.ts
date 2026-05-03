import type { Annotation, ToolType, ToolStyle, Point } from '../types'
import { hitTest } from './hitTest'

const HANDLE_HIT_RADIUS = 8

const HANDLE_CURSORS = [
  'nw-resize', 'n-resize', 'ne-resize',
  'w-resize',              'e-resize',
  'sw-resize', 's-resize', 'se-resize',
]

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function translateAnnotation(ann: Annotation, dx: number, dy: number): Annotation {
  switch (ann.type) {
    case 'rect':
    case 'blur': return { ...ann, x: ann.x + dx, y: ann.y + dy }
    case 'arrow': return { ...ann, from: { x: ann.from.x + dx, y: ann.from.y + dy }, to: { x: ann.to.x + dx, y: ann.to.y + dy } }
    case 'ellipse': return { ...ann, cx: ann.cx + dx, cy: ann.cy + dy }
    case 'text': return { ...ann, x: ann.x + dx, y: ann.y + dy }
  }
}

function handlePoints(ann: Annotation): Point[] | null {
  switch (ann.type) {
    case 'rect':
    case 'blur': {
      const { x, y, width: w, height: h } = ann
      return [
        { x, y }, { x: x + w / 2, y }, { x: x + w, y },
        { x, y: y + h / 2 }, { x: x + w, y: y + h / 2 },
        { x, y: y + h }, { x: x + w / 2, y: y + h }, { x: x + w, y: y + h },
      ]
    }
    case 'ellipse': {
      const { cx, cy, rx, ry } = ann
      const x = cx - rx, y = cy - ry, w = rx * 2, h = ry * 2
      return [
        { x, y }, { x: x + w / 2, y }, { x: x + w, y },
        { x, y: y + h / 2 }, { x: x + w, y: y + h / 2 },
        { x, y: y + h }, { x: x + w / 2, y: y + h }, { x: x + w, y: y + h },
      ]
    }
    case 'arrow': return [ann.from, ann.to]
    default: return null
  }
}

function hitTestHandle(point: Point, ann: Annotation): number | null {
  const pts = handlePoints(ann)
  if (!pts) return null
  for (let i = 0; i < pts.length; i++) {
    if (Math.hypot(point.x - pts[i].x, point.y - pts[i].y) <= HANDLE_HIT_RADIUS) return i
  }
  return null
}

function resizeAnnotation(ann: Annotation, handleIndex: number, dx: number, dy: number): Annotation {
  switch (ann.type) {
    case 'rect':
    case 'blur': {
      let { x, y, width: w, height: h } = ann
      // Indices: 0=TL,1=TC,2=TR,3=ML,4=MR,5=BL,6=BC,7=BR
      if (handleIndex === 0) { x += dx; y += dy; w -= dx; h -= dy }
      else if (handleIndex === 1) { y += dy; h -= dy }
      else if (handleIndex === 2) { y += dy; w += dx; h -= dy }
      else if (handleIndex === 3) { x += dx; w -= dx }
      else if (handleIndex === 4) { w += dx }
      else if (handleIndex === 5) { x += dx; w -= dx; h += dy }
      else if (handleIndex === 6) { h += dy }
      else if (handleIndex === 7) { w += dx; h += dy }
      return { ...ann, x, y, width: Math.max(4, w), height: Math.max(4, h) }
    }
    case 'ellipse': {
      let x = ann.cx - ann.rx, y = ann.cy - ann.ry, w = ann.rx * 2, h = ann.ry * 2
      if (handleIndex === 0) { x += dx; y += dy; w -= dx; h -= dy }
      else if (handleIndex === 1) { y += dy; h -= dy }
      else if (handleIndex === 2) { y += dy; w += dx; h -= dy }
      else if (handleIndex === 3) { x += dx; w -= dx }
      else if (handleIndex === 4) { w += dx }
      else if (handleIndex === 5) { x += dx; w -= dx; h += dy }
      else if (handleIndex === 6) { h += dy }
      else if (handleIndex === 7) { w += dx; h += dy }
      w = Math.max(8, w); h = Math.max(8, h)
      return { ...ann, cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 }
    }
    case 'arrow': {
      if (handleIndex === 0) return { ...ann, from: { x: ann.from.x + dx, y: ann.from.y + dy } }
      return { ...ann, to: { x: ann.to.x + dx, y: ann.to.y + dy } }
    }
    default: return ann
  }
}

interface DragState {
  startX: number
  startY: number
  annotation: Annotation | null
  mode: 'draw' | 'move' | 'resize'
  handleIndex: number
}

export class ToolManager {
  private drag: DragState = { startX: 0, startY: 0, annotation: null, mode: 'draw', handleIndex: -1 }
  private textWrapper: HTMLDivElement | null = null
  private textInput: HTMLTextAreaElement | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private getActiveTool: () => ToolType | null,
    private getStyle: () => ToolStyle,
    private getSelectedId: () => string | null,
    private onPreview: (annotations: Annotation[]) => void,
    private onCommit: (annotations: Annotation[]) => void,
    private onSelect: (id: string | null) => void,
    private annotations: Annotation[],
  ) {}

  setAnnotations(annotations: Annotation[]): void {
    this.annotations = annotations
  }

  private point(e: MouseEvent | Touch): Point {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  private clientPoint(e: MouseEvent | TouchEvent): Point {
    if ('touches' in e) return this.point(e.touches[0] ?? e.changedTouches[0])
    return this.point(e as MouseEvent)
  }

  private rawClient(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
    if ('touches' in e) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY }
  }

  onPointerDown(e: MouseEvent | TouchEvent): void {
    e.preventDefault()
    const p = this.clientPoint(e)
    const tool = this.getActiveTool()

    if (tool === null) {
      const selectedId = this.getSelectedId()
      if (selectedId) {
        const sel = this.annotations.find((a) => a.id === selectedId)
        if (sel) {
          const hi = hitTestHandle(p, sel)
          if (hi !== null) {
            this.drag = { startX: p.x, startY: p.y, annotation: { ...sel } as Annotation, mode: 'resize', handleIndex: hi }
            return
          }
        }
      }
      const hitId = hitTest(p, this.annotations)
      this.onSelect(hitId)
      if (hitId) {
        const ann = this.annotations.find((a) => a.id === hitId)!
        this.drag = { startX: p.x, startY: p.y, annotation: { ...ann } as Annotation, mode: 'move', handleIndex: -1 }
      }
      return
    }

    if (tool === 'text') {
      if (this.textWrapper !== null) return
      this.startTextEntry(e, p, { ...this.getStyle() })
      return
    }

    const ann = this.createInitial(tool, p, { ...this.getStyle() })
    if (!ann) return
    this.drag = { startX: p.x, startY: p.y, annotation: ann, mode: 'draw', handleIndex: -1 }
  }

  onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.drag.annotation) {
      if (this.getActiveTool() === null) this.updateHoverCursor(this.clientPoint(e))
      else this.canvas.style.cursor = ''
      return
    }
    e.preventDefault()
    const p = this.clientPoint(e)
    const dx = p.x - this.drag.startX
    const dy = p.y - this.drag.startY

    if (this.drag.mode === 'move') {
      const moved = translateAnnotation(this.drag.annotation, dx, dy)
      this.onPreview(this.annotations.map((a) => (a.id === moved.id ? moved : a)))
      return
    }

    if (this.drag.mode === 'resize') {
      const resized = resizeAnnotation(this.drag.annotation, this.drag.handleIndex, dx, dy)
      this.onPreview(this.annotations.map((a) => (a.id === resized.id ? resized : a)))
      return
    }

    this.updateDrag(p)
    this.onPreview([...this.annotations, this.drag.annotation])
  }

  onPointerUp(e: MouseEvent | TouchEvent): void {
    if (!this.drag.annotation) return
    const p = this.clientPoint(e)
    const dx = p.x - this.drag.startX
    const dy = p.y - this.drag.startY

    if (this.drag.mode === 'move') {
      const moved = translateAnnotation(this.drag.annotation, dx, dy)
      this.annotations = this.annotations.map((a) => (a.id === moved.id ? moved : a))
      this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw', handleIndex: -1 }
      this.onCommit(this.annotations)
      return
    }

    if (this.drag.mode === 'resize') {
      const resized = resizeAnnotation(this.drag.annotation, this.drag.handleIndex, dx, dy)
      this.annotations = this.annotations.map((a) => (a.id === resized.id ? resized : a))
      this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw', handleIndex: -1 }
      this.onCommit(this.annotations)
      return
    }

    this.updateDrag(p)
    const ann = this.drag.annotation
    this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw', handleIndex: -1 }
    if (this.isDegenerate(ann)) return
    this.annotations = [...this.annotations, ann]
    this.onCommit(this.annotations)
  }

  onDblClick(e: MouseEvent): void {
    const p = this.clientPoint(e)
    if (this.getActiveTool() !== null) return
    const hitId = hitTest(p, this.annotations)
    if (!hitId) return
    const ann = this.annotations.find((a) => a.id === hitId)
    if (!ann || ann.type !== 'text') return
    this.cancelInProgress()
    this.startTextEntry(e, p, { ...ann.style }, ann.id, ann.text)
  }

  cancelInProgress(): boolean {
    const hadProgress = this.drag.annotation !== null || this.textWrapper !== null
    this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw', handleIndex: -1 }
    this.removeTextWrapper()
    this.onPreview(this.annotations)
    return hadProgress
  }

  private createInitial(tool: ToolType, p: Point, style: ToolStyle): Annotation | null {
    const base = { id: uid(), style }
    switch (tool) {
      case 'rect': return { ...base, type: 'rect', x: p.x, y: p.y, width: 0, height: 0 }
      case 'arrow': return { ...base, type: 'arrow', from: p, to: p }
      case 'ellipse': return { ...base, type: 'ellipse', cx: p.x, cy: p.y, rx: 0, ry: 0 }
      case 'blur': return { ...base, type: 'blur', x: p.x, y: p.y, width: 0, height: 0, radius: style.radius }
      default: return null
    }
  }

  private updateDrag(p: Point): void {
    const ann = this.drag.annotation!
    const dx = p.x - this.drag.startX
    const dy = p.y - this.drag.startY

    switch (ann.type) {
      case 'rect':
      case 'blur':
        ann.x = dx < 0 ? p.x : this.drag.startX
        ann.y = dy < 0 ? p.y : this.drag.startY
        ann.width = Math.abs(dx)
        ann.height = Math.abs(dy)
        break
      case 'arrow':
        ann.to = p
        break
      case 'ellipse':
        ann.cx = this.drag.startX + dx / 2
        ann.cy = this.drag.startY + dy / 2
        ann.rx = Math.abs(dx) / 2
        ann.ry = Math.abs(dy) / 2
        break
    }
  }

  private updateHoverCursor(p: Point): void {
    const selectedId = this.getSelectedId()
    if (selectedId) {
      const sel = this.annotations.find((a) => a.id === selectedId)
      if (sel) {
        const hi = hitTestHandle(p, sel)
        if (hi !== null) {
          this.canvas.style.cursor = sel.type === 'arrow' ? 'crosshair' : HANDLE_CURSORS[hi]
          return
        }
        if (hitTest(p, [sel])) {
          this.canvas.style.cursor = 'move'
          return
        }
      }
    }
    const hitId = hitTest(p, this.annotations)
    this.canvas.style.cursor = hitId ? 'pointer' : 'default'
  }

  private isDegenerate(ann: Annotation): boolean {
    switch (ann.type) {
      case 'rect':
      case 'blur': return ann.width < 4 || ann.height < 4
      case 'arrow': return Math.hypot(ann.to.x - ann.from.x, ann.to.y - ann.from.y) < 8
      case 'ellipse': return ann.rx < 4 || ann.ry < 4
      default: return false
    }
  }

  private startTextEntry(
    e: MouseEvent | TouchEvent,
    p: Point,
    style: ToolStyle,
    replaceId?: string,
    initialText?: string,
  ): void {
    this.removeTextWrapper()

    const container = this.canvas.parentElement!
    container.style.position = 'relative'

    const containerRect = container.getBoundingClientRect()
    const { clientX, clientY } = this.rawClient(e)
    const cssX = clientX - containerRect.left + container.scrollLeft
    const cssY = clientY - containerRect.top + container.scrollTop

    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      position: absolute;
      left: ${cssX}px;
      top: ${cssY}px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      min-width: 140px;
    `

    const grip = document.createElement('div')
    grip.style.cssText = `
      height: 10px;
      background: ${style.strokeColor};
      opacity: 0.7;
      border-radius: 3px 3px 0 0;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
    `
    grip.innerHTML = `<svg width="16" height="4" viewBox="0 0 16 4"><circle cx="2" cy="2" r="1.5" fill="white"/><circle cx="8" cy="2" r="1.5" fill="white"/><circle cx="14" cy="2" r="1.5" fill="white"/></svg>`

    const ta = document.createElement('textarea')
    ta.style.cssText = `
      min-width: 120px;
      min-height: 36px;
      font-size: ${style.fontSize}px;
      border: 2px dashed ${style.strokeColor};
      background: #fff;
      color: ${style.strokeColor};
      resize: both;
      padding: 4px;
      outline: none;
      font-family: sans-serif;
      line-height: 1.4;
    `
    if (initialText) ta.value = initialText

    wrapper.appendChild(grip)
    wrapper.appendChild(ta)
    container.appendChild(wrapper)

    ta.focus()
    this.textWrapper = wrapper
    this.textInput = ta

    // Make grip draggable
    let dragging = false
    let dragOffX = 0, dragOffY = 0

    const onGripDown = (ev: MouseEvent) => {
      dragging = true
      dragOffX = ev.clientX - parseFloat(wrapper.style.left)
      dragOffY = ev.clientY - parseFloat(wrapper.style.top)
      grip.style.cursor = 'grabbing'
      ev.preventDefault()
    }

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging) return
      wrapper.style.left = `${ev.clientX - dragOffX}px`
      wrapper.style.top = `${ev.clientY - dragOffY}px`
    }

    const onMouseUp = () => {
      dragging = false
      grip.style.cursor = 'grab'
    }

    grip.addEventListener('mousedown', onGripDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    let committed = false
    const commit = () => {
      if (committed || !wrapper.isConnected) return
      committed = true
      const text = ta.value.trim()
      const wLeft = parseFloat(wrapper.style.left)
      const wTop = parseFloat(wrapper.style.top)

      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      this.removeTextWrapper()

      if (!text) return

      // Convert wrapper CSS position back to canvas coords
      const rect = this.canvas.getBoundingClientRect()
      const containerRect2 = container.getBoundingClientRect()
      const canvasOffsetLeft = rect.left - containerRect2.left + container.scrollLeft
      const canvasOffsetTop = rect.top - containerRect2.top + container.scrollTop
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      const canvasX = (wLeft - canvasOffsetLeft) * scaleX
      const canvasY = (wTop - canvasOffsetTop) * scaleY

      const ann: Annotation = { id: replaceId ?? uid(), type: 'text', style, x: canvasX, y: canvasY + style.fontSize, text }
      if (replaceId) {
        this.annotations = this.annotations.map((a) => (a.id === replaceId ? ann : a))
      } else {
        this.annotations = [...this.annotations, ann]
      }
      this.onCommit(this.annotations)
    }

    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commit() }
      if (ev.key === 'Escape') {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        this.removeTextWrapper()
      }
    })

    ta.addEventListener('blur', () => {
      // Delay so style control clicks don't trigger premature commit
      setTimeout(commit, 150)
    })
  }

  private removeTextWrapper(): void {
    if (this.textWrapper) {
      this.textWrapper.remove()
      this.textWrapper = null
      this.textInput = null
    }
  }
}
