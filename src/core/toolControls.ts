import type { ToolType } from '../types'

type Control = 'fill' | 'fillAlpha' | 'strokeColor' | 'strokeWidth' | 'opacity' | 'fontSize' | 'radius'

const CONTROLS: Record<ToolType, Control[]> = {
  rect:    ['fill', 'fillAlpha', 'strokeColor', 'strokeWidth', 'opacity'],
  ellipse: ['fill', 'fillAlpha', 'strokeColor', 'strokeWidth', 'opacity'],
  arrow:   ['strokeColor'],
  blur:    ['radius'],
  text:    ['fontSize', 'strokeColor'],
  callout: ['fontSize', 'strokeColor', 'strokeWidth'],
}

export function toolControls(tool: ToolType | null): Control[] {
  if (tool === null) return []
  return CONTROLS[tool]
}
