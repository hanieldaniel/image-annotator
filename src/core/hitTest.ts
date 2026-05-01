import type { Annotation, Point } from '../types'

const ARROW_THRESHOLD = 8

function hitRect(point: Point, x: number, y: number, w: number, h: number): boolean {
  return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h
}

function hitArrow(point: Point, fx: number, fy: number, tx: number, ty: number): boolean {
  const len = Math.hypot(tx - fx, ty - fy)
  if (len === 0) return false
  const t = Math.max(0, Math.min(1, ((point.x - fx) * (tx - fx) + (point.y - fy) * (ty - fy)) / (len * len)))
  const dx = point.x - (fx + t * (tx - fx))
  const dy = point.y - (fy + t * (ty - fy))
  return Math.hypot(dx, dy) <= ARROW_THRESHOLD
}

function hitEllipse(point: Point, cx: number, cy: number, rx: number, ry: number): boolean {
  if (rx === 0 || ry === 0) return false
  const dx = (point.x - cx) / rx
  const dy = (point.y - cy) / ry
  return dx * dx + dy * dy <= 1
}

export function hitTest(point: Point, annotations: Annotation[]): string | null {
  for (let i = annotations.length - 1; i >= 0; i--) {
    const ann = annotations[i]
    switch (ann.type) {
      case 'rect':
      case 'blur':
        if (hitRect(point, ann.x, ann.y, ann.width, ann.height)) return ann.id
        break
      case 'ellipse':
        if (hitEllipse(point, ann.cx, ann.cy, ann.rx, ann.ry)) return ann.id
        break
      case 'arrow':
        if (hitArrow(point, ann.from.x, ann.from.y, ann.to.x, ann.to.y)) return ann.id
        break
      case 'text':
        if (hitRect(point, ann.x, ann.y - 14, 120, 20)) return ann.id
        break
      case 'callout':
        if (hitRect(point, ann.x, ann.y, ann.width, ann.height)) return ann.id
        break
    }
  }
  return null
}
