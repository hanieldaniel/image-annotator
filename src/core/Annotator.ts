import type {
  AnnotatorConfig,
  AnnotatorEvents,
  AnnotatorAPI,
  ImageSource,
  ToolType,
  ToolStyle,
  Annotation,
  ToolbarItem,
} from '../types'
import { History } from './History'
import { CanvasRenderer } from './CanvasRenderer'
import { ToolManager } from './ToolManager'
import { exportToBlob } from './Export'
import { captureScreenshot } from '../sources/ScreenshotCapture'
import { loadFile } from '../sources/FileUpload'
import { captureFromCamera } from '../sources/CameraCapture'
import { getToolbarHTML, getTopbarHTML, updateToolbarForActiveTool, updateZoomLabel, syncToolbarToAnnotation } from '../ui/toolbar'
import { STYLES } from '../ui/styles/styles'

const DEFAULT_TOOLBAR: ToolbarItem[] = [
  { tool: 'rect' },
  { tool: 'arrow' },
  { tool: 'text' },
  { tool: 'blur' },
  { tool: 'ellipse' },
]

const DEFAULT_STYLE: ToolStyle = {
  color: '#ff0000',
  fillAlpha: 0,
  strokeColor: '#ff0000',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 16,
  radius: 12,
}

const ZOOM_STEP = 0.25
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4

export class Annotator implements AnnotatorAPI {
  private shadow!: ShadowRoot
  private modal!: HTMLElement
  private canvas!: HTMLCanvasElement
  private canvasWrap!: HTMLElement
  private topbar!: HTMLElement
  private toolbar!: HTMLElement
  private renderer!: CanvasRenderer
  private toolManager!: ToolManager
  private history = new History()
  private annotations: Annotation[] = []
  private activeTool: ToolType | null = null
  private selectedId: string | null = null
  private style: ToolStyle
  private image: HTMLImageElement | null = null
  // eslint-disable-next-line @typescript-eslint/ban-types
  private handlers = new Map<string, Set<Function>>()
  private config: Required<AnnotatorConfig>
  private host!: HTMLElement
  private zoom = 1
  private canvasEventsBound = false

  constructor(config: AnnotatorConfig = {}) {
    this.config = {
      toolbar: config.toolbar ?? DEFAULT_TOOLBAR,
      defaultStyle: { ...DEFAULT_STYLE, ...config.defaultStyle },
      customToolbar: config.customToolbar ?? false,
    }
    this.style = { ...DEFAULT_STYLE, ...config.defaultStyle }
  }

  private buildDOM(): void {
    this.host = document.createElement('div')
    this.host.setAttribute('data-img-marker', '')
    this.shadow = this.host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = STYLES
    this.shadow.appendChild(style)

    this.modal = document.createElement('div')
    this.modal.className = 'im-modal'
    this.shadow.appendChild(this.modal)

    const overlay = document.createElement('div')
    overlay.className = 'im-overlay'
    this.modal.appendChild(overlay)

    const dialog = document.createElement('div')
    dialog.className = 'im-dialog'
    overlay.appendChild(dialog)

    if (!this.config.customToolbar) {
      this.topbar = document.createElement('div')
      this.topbar.className = 'im-topbar'
      this.topbar.innerHTML = getTopbarHTML()
      dialog.appendChild(this.topbar)
      this.bindTopbar(this.topbar)
    }

    this.canvasWrap = document.createElement('div')
    this.canvasWrap.className = 'im-canvas-wrap'

    this.canvas = document.createElement('canvas')
    this.canvasWrap.appendChild(this.canvas)
    dialog.appendChild(this.canvasWrap)

    if (!this.config.customToolbar) {
      this.toolbar = document.createElement('div')
      this.toolbar.className = 'im-toolbar'
      this.toolbar.innerHTML = getToolbarHTML(this.config.toolbar, this.style)
      dialog.appendChild(this.toolbar)
      this.bindDefaultToolbar(this.toolbar)
    }

    const actions = document.createElement('div')
    actions.className = 'im-actions'
    actions.innerHTML = `
      <button class="im-btn im-btn-cancel">Cancel</button>
      <button class="im-btn im-btn-save">Save</button>
    `
    dialog.appendChild(actions)

    actions.querySelector('.im-btn-cancel')!.addEventListener('click', () => this.emit('cancel'))
    actions.querySelector('.im-btn-save')!.addEventListener('click', () => this.save())

    document.body.appendChild(this.host)
  }

  private bindTopbar(topbar: HTMLElement): void {
    topbar.addEventListener('click', (e) => {
      const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
      if (!action) return
      if (action.dataset.action === 'undo') this.undo()
      if (action.dataset.action === 'redo') this.redo()
      if (action.dataset.action === 'zoom-in') this.zoomIn()
      if (action.dataset.action === 'zoom-out') this.zoomOut()
    })
  }

  private bindDefaultToolbar(toolbar: HTMLElement): void {
    toolbar.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-tool]')
      if (btn) {
        this.selectTool(btn.dataset.tool as ToolType)
        return
      }
    })

    toolbar.querySelector<HTMLInputElement>('.im-color')
      ?.addEventListener('input', (e) => this.setColor((e.target as HTMLInputElement).value))
    toolbar.querySelector<HTMLInputElement>('.im-fill-alpha')
      ?.addEventListener('input', (e) => this.setFillAlpha(Number((e.target as HTMLInputElement).value)))
    toolbar.querySelector<HTMLInputElement>('.im-stroke-color')
      ?.addEventListener('input', (e) => this.setStrokeColor((e.target as HTMLInputElement).value))
    toolbar.querySelector<HTMLInputElement>('.im-stroke-width')
      ?.addEventListener('input', (e) => this.setStrokeWidth(Number((e.target as HTMLInputElement).value)))
    toolbar.querySelector<HTMLInputElement>('.im-opacity')
      ?.addEventListener('input', (e) => this.setOpacity(Number((e.target as HTMLInputElement).value)))
    toolbar.querySelector<HTMLInputElement>('.im-font-size')
      ?.addEventListener('input', (e) => this.setFontSize(Number((e.target as HTMLInputElement).value)))
    toolbar.querySelector<HTMLInputElement>('.im-radius')
      ?.addEventListener('input', (e) => this.setRadius(Number((e.target as HTMLInputElement).value)))

    updateToolbarForActiveTool(toolbar, this.activeTool)
  }

  private bindCanvasEvents(): void {
    if (this.canvasEventsBound) {
      this.toolManager.setAnnotations(this.annotations)
      return
    }

    this.toolManager = new ToolManager(
      this.canvas,
      () => this.activeTool,
      () => this.style,
      () => this.selectedId,
      (annotations) => {
        this.annotations = annotations
        this.redraw()
      },
      (annotations) => {
        this.annotations = annotations
        this.history.push(annotations)
        this.redraw()
        if (this.activeTool !== null) this.selectTool(null)
      },
      (id) => {
        this.selectedId = id
        if (id !== null) {
          const ann = this.annotations.find((a) => a.id === id)
          if (ann) {
            this.style = { ...ann.style }
            if (this.toolbar) syncToolbarToAnnotation(this.toolbar, ann)
            this.emit('style-change', this.style)
          }
        } else {
          if (this.toolbar) updateToolbarForActiveTool(this.toolbar, this.activeTool)
        }
        this.redraw()
      },
      this.annotations,
    )

    const down = (e: MouseEvent | TouchEvent) => this.toolManager.onPointerDown(e)
    const move = (e: MouseEvent | TouchEvent) => this.toolManager.onPointerMove(e)
    const up = (e: MouseEvent | TouchEvent) => this.toolManager.onPointerUp(e)
    const dbl = (e: MouseEvent) => this.toolManager.onDblClick(e)

    this.canvas.addEventListener('mousedown', down)
    this.canvas.addEventListener('mousemove', move)
    this.canvas.addEventListener('mouseup', up)
    this.canvas.addEventListener('dblclick', dbl)
    this.canvas.addEventListener('touchstart', down, { passive: false })
    this.canvas.addEventListener('touchmove', move, { passive: false })
    this.canvas.addEventListener('touchend', up)

    this.canvasEventsBound = true
  }

  private bindKeyboard(): void {
    this._keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.redo() }
      if (e.key === 'Escape') {
        e.preventDefault()
        const cancelled = this.toolManager?.cancelInProgress()
        if (!cancelled && this.activeTool !== null) this.selectTool(null)
        else if (!cancelled && this.selectedId !== null) {
          this.selectedId = null
          if (this.toolbar) updateToolbarForActiveTool(this.toolbar, null)
          this.redraw()
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.deleteSelected() }
    }
    document.addEventListener('keydown', this._keyHandler)
  }

  private _keyHandler: ((e: KeyboardEvent) => void) | null = null

  private unbindKeyboard(): void {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler)
      this._keyHandler = null
    }
  }

  private redraw(): void {
    if (!this.image) return
    this.renderer.render(this.image, this.annotations, this.selectedId)
  }

  private applyZoom(): void {
    this.canvas.style.width = `${this.canvas.width * this.zoom}px`
    this.canvas.style.height = `${this.canvas.height * this.zoom}px`
    this.canvasWrap.classList.toggle('im-select-mode', this.activeTool === null)
    if (this.topbar) updateZoomLabel(this.topbar, this.zoom)
    this.redraw()
  }

  private async save(): Promise<void> {
    const blob = await exportToBlob(this.canvas)
    this.emit('save', blob)
  }

  async open(source: ImageSource): Promise<void> {
    this.history.reset()
    this.annotations = []
    this.selectedId = null

    if (!this.host) this.buildDOM()

    // Screenshot captured before modal opens so overlay sees unobstructed page
    let imageData: string
    switch (source.type) {
      case 'screenshot': imageData = await captureScreenshot(); break
      case 'file': imageData = await loadFile(source.file); break
      case 'camera': imageData = await captureFromCamera(this.shadow); break
    }

    this.modal.classList.add('im-modal--open')
    this.bindKeyboard()

    await this.loadImage(imageData)
    this.renderer = new CanvasRenderer(this.canvas)
    this.bindCanvasEvents()
    // Collapse canvas so its attribute-based size doesn't inflate the wrap before we measure
    this.canvas.style.width = '1px'
    this.canvas.style.height = '1px'
    const availableWidth = this.canvasWrap.clientWidth
    const availableHeight = this.canvasWrap.clientHeight
    this.canvas.style.width = ''
    this.canvas.style.height = ''
    const zoomX = availableWidth > 0 ? availableWidth / this.canvas.width : 1
    const zoomY = availableHeight > 0 ? availableHeight / this.canvas.height : 1
    this.zoom = Math.min(Math.min(zoomX, zoomY), ZOOM_MAX)
    this.applyZoom()
    this.redraw()
  }

  private loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.canvas.width = img.naturalWidth
        this.canvas.height = img.naturalHeight
        this.image = img
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  close(): void {
    this.modal.classList.remove('im-modal--open')
    this.unbindKeyboard()
    this.toolManager?.setAnnotations([])
    this.annotations = []
    this.selectedId = null
    this.history.reset()
    this.zoom = 1
  }

  selectTool(tool: ToolType | null): void {
    this.activeTool = this.activeTool === tool ? null : tool
    if (this.toolbar) updateToolbarForActiveTool(this.toolbar, this.activeTool)
    this.canvasWrap?.classList.toggle('im-select-mode', this.activeTool === null)
    this.emit('tool-change', this.activeTool)
  }

  setColor(color: string): void {
    this.style = { ...this.style, color }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setFillAlpha(alpha: number): void {
    this.style = { ...this.style, fillAlpha: alpha }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setStrokeColor(color: string): void {
    this.style = { ...this.style, strokeColor: color }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setStrokeWidth(width: number): void {
    this.style = { ...this.style, strokeWidth: width }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setOpacity(opacity: number): void {
    this.style = { ...this.style, opacity }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setFontSize(size: number): void {
    this.style = { ...this.style, fontSize: size }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  setRadius(radius: number): void {
    this.style = { ...this.style, radius }
    this.applyStyleToSelected()
    this.emit('style-change', this.style)
  }

  private applyStyleToSelected(): void {
    if (!this.selectedId) return
    this.annotations = this.annotations.map((a) => {
      if (a.id !== this.selectedId) return a
      const updated = { ...a, style: { ...this.style } }
      if (a.type === 'blur') return { ...updated, radius: this.style.radius }
      return updated
    })
    this.toolManager?.setAnnotations(this.annotations)
    this.history.push(this.annotations)
    this.redraw()
  }

  getSelected(): string | null {
    return this.selectedId
  }

  setSelected(id: string | null): void {
    this.selectedId = id
  }

  deleteSelected(): void {
    if (!this.selectedId) return
    this.annotations = this.annotations.filter((a) => a.id !== this.selectedId)
    this.selectedId = null
    this.toolManager?.setAnnotations(this.annotations)
    this.history.push(this.annotations)
    this.redraw()
  }

  zoomIn(): void {
    this.zoom = Math.min(ZOOM_MAX, Math.round((this.zoom + ZOOM_STEP) * 100) / 100)
    this.applyZoom()
  }

  zoomOut(): void {
    this.zoom = Math.max(ZOOM_MIN, Math.round((this.zoom - ZOOM_STEP) * 100) / 100)
    this.applyZoom()
  }

  undo(): void {
    this.annotations = this.history.undo()
    this.toolManager?.setAnnotations(this.annotations)
    this.selectedId = null
    this.redraw()
  }

  redo(): void {
    this.annotations = this.history.redo()
    this.toolManager?.setAnnotations(this.annotations)
    this.selectedId = null
    this.redraw()
  }

  on<K extends keyof AnnotatorEvents>(event: K, handler: AnnotatorEvents[K]): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
  }

  off<K extends keyof AnnotatorEvents>(event: K, handler: AnnotatorEvents[K]): void {
    this.handlers.get(event)?.delete(handler)
  }

  private emit<K extends keyof AnnotatorEvents>(event: K, ...args: Parameters<AnnotatorEvents[K]>): void {
    // eslint-disable-next-line @typescript-eslint/ban-types
    this.handlers.get(event)?.forEach((h) => (h as Function)(...args))
  }
}
