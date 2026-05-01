import type { Annotation, ToolType, ToolStyle, Point, CalloutAnnotation } from '../types'
import { hitTest } from './hitTest'

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
    case 'callout': return { ...ann, x: ann.x + dx, y: ann.y + dy, tailX: ann.tailX + dx, tailY: ann.tailY + dy }
  }
}

interface DragState {
  startX: number
  startY: number
  annotation: Annotation | null
  mode: 'draw' | 'move'
}

export class ToolManager {
  private drag: DragState = { startX: 0, startY: 0, annotation: null, mode: 'draw' }
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
    if ('touches' in e) return this.point(e.touches[0])
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
      const hitId = hitTest(p, this.annotations)
      this.onSelect(hitId)
      if (hitId) {
        const ann = this.annotations.find((a) => a.id === hitId)!
        this.drag = { startX: p.x, startY: p.y, annotation: { ...ann } as Annotation, mode: 'move' }
      }
      return
    }

    if (tool === 'text' || tool === 'callout') {
      this.startTextEntry(e, p, tool, { ...this.getStyle() })
      return
    }

    const ann = this.createInitial(tool, p, { ...this.getStyle() })
    if (!ann) return
    this.drag = { startX: p.x, startY: p.y, annotation: ann, mode: 'draw' }
  }

  onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.drag.annotation) return
    e.preventDefault()
    const p = this.clientPoint(e)

    if (this.drag.mode === 'move') {
      const dx = p.x - this.drag.startX
      const dy = p.y - this.drag.startY
      const moved = translateAnnotation(this.drag.annotation, dx, dy)
      this.onPreview(this.annotations.map((a) => (a.id === moved.id ? moved : a)))
      return
    }

    this.updateDrag(p)
    this.onPreview([...this.annotations, this.drag.annotation])
  }

  onPointerUp(e: MouseEvent | TouchEvent): void {
    if (!this.drag.annotation) return
    const p = this.clientPoint(e)

    if (this.drag.mode === 'move') {
      const dx = p.x - this.drag.startX
      const dy = p.y - this.drag.startY
      const moved = translateAnnotation(this.drag.annotation, dx, dy)
      this.annotations = this.annotations.map((a) => (a.id === moved.id ? moved : a))
      this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw' }
      this.onCommit(this.annotations)
      return
    }

    this.updateDrag(p)
    const ann = this.drag.annotation
    this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw' }
    if (this.isDegenerate(ann)) return
    this.annotations = [...this.annotations, ann]
    this.onCommit(this.annotations)
  }

  cancelInProgress(): void {
    this.drag = { startX: 0, startY: 0, annotation: null, mode: 'draw' }
    this.removeTextWrapper()
    this.onPreview(this.annotations)
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

  private isDegenerate(ann: Annotation): boolean {
    switch (ann.type) {
      case 'rect':
      case 'blur': return ann.width < 4 || ann.height < 4
      case 'arrow': return Math.hypot(ann.to.x - ann.from.x, ann.to.y - ann.from.y) < 8
      case 'ellipse': return ann.rx < 4 || ann.ry < 4
      default: return false
    }
  }

  private startTextEntry(e: MouseEvent | TouchEvent, p: Point, tool: 'text' | 'callout', style: ToolStyle): void {
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
      background: rgba(0,0,0,0.5);
      color: ${style.strokeColor};
      resize: both;
      padding: 4px;
      outline: none;
      font-family: sans-serif;
      line-height: 1.4;
    `

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
      dragOffX = ev.clientX - wrapper.offsetLeft
      dragOffY = ev.clientY - wrapper.offsetTop
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

    const commit = () => {
      const text = ta.value.trim()
      const wLeft = wrapper.offsetLeft
      const wTop = wrapper.offsetTop

      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      this.removeTextWrapper()

      if (!text) return

      // Convert wrapper CSS position back to canvas coords
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      const canvasX = wLeft * scaleX
      const canvasY = wTop * scaleY

      const id = uid()
      let ann: Annotation
      if (tool === 'text') {
        ann = { id, type: 'text', style, x: canvasX, y: canvasY + style.fontSize, text }
      } else {
        const w = ta.offsetWidth * scaleX
        const h = (ta.offsetHeight + 10) * scaleY
        ann = {
          id, type: 'callout', style,
          x: canvasX, y: canvasY + 10 * scaleY, width: w, height: h, text,
          tailX: canvasX + w / 2, tailY: canvasY + h + 40 * scaleY,
        } satisfies CalloutAnnotation
      }
      this.annotations = [...this.annotations, ann]
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
