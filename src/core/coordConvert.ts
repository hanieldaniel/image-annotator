import type { Point } from '../types'

export function canvasToCss(p: Point, canvasW: number, canvasH: number, cssW: number, cssH: number): Point {
  return { x: p.x * (cssW / canvasW), y: p.y * (cssH / canvasH) }
}

export function cssToCanvas(p: Point, canvasW: number, canvasH: number, cssW: number, cssH: number): Point {
  return { x: p.x * (canvasW / cssW), y: p.y * (canvasH / cssH) }
}
