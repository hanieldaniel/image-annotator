export type ToolType = 'rect' | 'arrow' | 'text' | 'blur' | 'ellipse' | 'callout'

export interface Point {
  x: number
  y: number
}

export interface ToolStyle {
  color: string
  fillAlpha: number
  strokeColor: string
  strokeWidth: number
  opacity: number
  fontSize: number
  radius: number
}

export interface BaseAnnotation {
  id: string
  type: ToolType
  style: ToolStyle
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow'
  from: Point
  to: Point
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  x: number
  y: number
  text: string
}

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur'
  x: number
  y: number
  width: number
  height: number
  radius: number
}

export interface EllipseAnnotation extends BaseAnnotation {
  type: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface CalloutAnnotation extends BaseAnnotation {
  type: 'callout'
  x: number
  y: number
  width: number
  height: number
  text: string
  tailX: number
  tailY: number
}

export type Annotation =
  | RectAnnotation
  | ArrowAnnotation
  | TextAnnotation
  | BlurAnnotation
  | EllipseAnnotation
  | CalloutAnnotation

export type ImageSource =
  | { type: 'screenshot' }
  | { type: 'file'; file: File }
  | { type: 'camera' }

export interface ToolbarItem {
  tool: ToolType
  hidden?: boolean
}

export interface AnnotatorConfig {
  toolbar?: ToolbarItem[]
  defaultStyle?: Partial<ToolStyle>
  customToolbar?: boolean
}

export interface AnnotatorEvents {
  save: (blob: Blob) => void
  cancel: () => void
  'tool-change': (tool: ToolType | null) => void
  'style-change': (style: ToolStyle) => void
}

export interface AnnotatorAPI {
  open(source: ImageSource): Promise<void>
  close(): void
  selectTool(tool: ToolType | null): void
  setColor(color: string): void
  setStrokeColor(color: string): void
  setStrokeWidth(width: number): void
  setOpacity(opacity: number): void
  setFillAlpha(alpha: number): void
  setFontSize(size: number): void
  setRadius(radius: number): void
  getSelected(): string | null
  setSelected(id: string | null): void
  deleteSelected(): void
  undo(): void
  redo(): void
  on<K extends keyof AnnotatorEvents>(event: K, handler: AnnotatorEvents[K]): void
  off<K extends keyof AnnotatorEvents>(event: K, handler: AnnotatorEvents[K]): void
}
