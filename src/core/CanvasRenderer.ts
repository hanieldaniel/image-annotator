import type {
  Annotation,
  RectAnnotation,
  ArrowAnnotation,
  TextAnnotation,
  BlurAnnotation,
  EllipseAnnotation,
} from '../types'

const HANDLE_SIZE = 8
const HANDLE_COLOR = '#2563eb'
const HANDLE_BORDER = '#fff'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private imageRef: HTMLImageElement | ImageBitmap | null = null

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  render(image: HTMLImageElement | ImageBitmap, annotations: Annotation[], selectedId?: string | null): void {
    const { ctx, canvas } = this
    this.imageRef = image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const ann of annotations) {
      ctx.save()
      ctx.globalAlpha = ann.style.opacity
      this.draw(ann)
      ctx.restore()
    }
    if (selectedId) {
      const sel = annotations.find((a) => a.id === selectedId)
      if (sel) this.drawHandles(sel)
    }
  }

  private draw(ann: Annotation): void {
    switch (ann.type) {
      case 'rect': return this.drawRect(ann)
      case 'arrow': return this.drawArrow(ann)
      case 'text': return this.drawText(ann)
      case 'blur': return this.drawBlur(ann)
      case 'ellipse': return this.drawEllipse(ann)
    }
  }

  private applyStroke(ann: Annotation): void {
    this.ctx.strokeStyle = ann.style.strokeColor
    this.ctx.lineWidth = ann.style.strokeWidth
  }

  private drawRect(ann: RectAnnotation): void {
    const { ctx } = this
    ctx.fillStyle = ann.style.color
    ctx.globalAlpha = ann.style.opacity * ann.style.fillAlpha
    this.applyStroke(ann)
    ctx.fillRect(ann.x, ann.y, ann.width, ann.height)
    ctx.globalAlpha = ann.style.opacity
    ctx.strokeRect(ann.x, ann.y, ann.width, ann.height)
  }

  private drawArrow(ann: ArrowAnnotation): void {
    const { ctx } = this
    const { from, to } = ann
    const sw = ann.style.strokeWidth
    const headLen = Math.max(12, sw * 5)
    const angle = Math.atan2(to.y - from.y, to.x - from.x)

    ctx.strokeStyle = ann.style.strokeColor
    ctx.lineWidth = sw
    ctx.fillStyle = ann.style.strokeColor
    ctx.lineCap = 'round'

    // Shorten line so it doesn't overlap arrowhead
    const tipX = to.x - headLen * 0.6 * Math.cos(angle)
    const tipY = to.y - headLen * 0.6 * Math.sin(angle)

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(tipX, tipY)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 7), to.y - headLen * Math.sin(angle - Math.PI / 7))
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 7), to.y - headLen * Math.sin(angle + Math.PI / 7))
    ctx.closePath()
    ctx.fill()
  }

  private drawText(ann: TextAnnotation): void {
    const { ctx } = this
    const fontSize = ann.style.fontSize
    ctx.font = `${fontSize}px sans-serif`
    ctx.fillStyle = ann.style.strokeColor
    const lines = ann.text.split('\n')
    lines.forEach((line, i) => {
      ctx.fillText(line, ann.x, ann.y + i * (fontSize * 1.4))
    })
  }

  private drawBlur(ann: BlurAnnotation): void {
    const { ctx, canvas } = this
    const { x, y, width, height } = ann
    const radius = ann.style.radius
    if (width === 0 || height === 0 || !this.imageRef) return

    const offscreen = document.createElement('canvas')
    offscreen.width = canvas.width
    offscreen.height = canvas.height
    const offCtx = offscreen.getContext('2d')!
    offCtx.drawImage(this.imageRef, 0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.filter = `blur(${radius}px)`
    ctx.drawImage(offscreen, x, y, width, height, x, y, width, height)
    ctx.restore()
    ctx.filter = 'none'
  }

  private drawEllipse(ann: EllipseAnnotation): void {
    const { ctx } = this
    ctx.fillStyle = ann.style.color
    ctx.globalAlpha = ann.style.opacity * ann.style.fillAlpha
    this.applyStroke(ann)
    ctx.beginPath()
    ctx.ellipse(ann.cx, ann.cy, ann.rx, ann.ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = ann.style.opacity
    ctx.stroke()
  }

  private drawHandles(ann: Annotation): void {
    switch (ann.type) {
      case 'rect':
      case 'blur':
        this.drawBoxHandles(ann.x, ann.y, ann.width, ann.height)
        break
      case 'ellipse':
        this.drawBoxHandles(ann.cx - ann.rx, ann.cy - ann.ry, ann.rx * 2, ann.ry * 2)
        break
      case 'arrow':
        this.drawHandle(ann.from.x, ann.from.y)
        this.drawHandle(ann.to.x, ann.to.y)
        break
      case 'text':
        this.drawSelectionOutline(ann.x - 4, ann.y - ann.style.fontSize - 4, 128, ann.style.fontSize + 8)
        break
    }
  }

  private drawBoxHandles(x: number, y: number, w: number, h: number): void {
    this.drawSelectionOutline(x, y, w, h)
    const pts = [
      [x, y], [x + w / 2, y], [x + w, y],
      [x, y + h / 2], [x + w, y + h / 2],
      [x, y + h], [x + w / 2, y + h], [x + w, y + h],
    ]
    pts.forEach(([hx, hy]) => this.drawHandle(hx, hy))
  }

  private drawSelectionOutline(x: number, y: number, w: number, h: number): void {
    const { ctx } = this
    ctx.save()
    ctx.strokeStyle = HANDLE_COLOR
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 3])
    ctx.strokeRect(x, y, w, h)
    ctx.setLineDash([])
    ctx.restore()
  }

  private drawHandle(x: number, y: number): void {
    const { ctx } = this
    const half = HANDLE_SIZE / 2
    ctx.save()
    ctx.fillStyle = HANDLE_BORDER
    ctx.strokeStyle = HANDLE_COLOR
    ctx.lineWidth = 1.5
    ctx.fillRect(x - half, y - half, HANDLE_SIZE, HANDLE_SIZE)
    ctx.strokeRect(x - half, y - half, HANDLE_SIZE, HANDLE_SIZE)
    ctx.restore()
  }
}
