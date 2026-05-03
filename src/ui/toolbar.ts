import type { ToolbarItem, ToolStyle, ToolType, Annotation } from '../types'
import { icons } from './icons'
import { toolControls } from '../core/toolControls'

const labels: Record<string, string> = {
  rect: 'Rectangle',
  arrow: 'Arrow',
  text: 'Text',
  blur: 'Blur',
  ellipse: 'Ellipse',
}

export function getTopbarHTML(): string {
  return `
    <div class="im-history">
      <button class="im-tool-btn" data-action="undo" title="Undo (Ctrl+Z)">${icons.undo}</button>
      <button class="im-tool-btn" data-action="redo" title="Redo (Ctrl+Y)">${icons.redo}</button>
    </div>
    <div class="im-zoom">
      <button class="im-tool-btn" data-action="zoom-out" title="Zoom out">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><line x1="6" y1="9" x2="12" y2="9"/><line x1="14" y1="14" x2="18" y2="18"/></svg>
      </button>
      <span class="im-zoom-level">100%</span>
      <button class="im-tool-btn" data-action="zoom-in" title="Zoom in">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><line x1="9" y1="6" x2="9" y2="12"/><line x1="6" y1="9" x2="12" y2="9"/><line x1="14" y1="14" x2="18" y2="18"/></svg>
      </button>
    </div>
  `
}

export function getToolbarHTML(items: ToolbarItem[], style: ToolStyle): string {
  const visible = items.filter((i) => !i.hidden)

  const toolBtns = visible
    .map(
      ({ tool }) => `
      <button class="im-tool-btn" data-tool="${tool}" title="${labels[tool]}">
        ${icons[tool]}
      </button>`,
    )
    .join('')

  return `
    <div class="im-tools-row">
      ${toolBtns}
    </div>
    <div class="im-options-row" style="display:none">
      <label class="im-label" data-control="fill" title="Fill color">
        Fill
        <input class="im-color" type="color" value="${style.color.startsWith('#') ? style.color : '#ff0000'}">
      </label>
      <label class="im-label" data-control="fillAlpha" title="Fill opacity">
        Alpha
        <input class="im-fill-alpha" type="range" min="0" max="1" step="0.05" value="${style.fillAlpha}">
      </label>
      <label class="im-label" data-control="strokeColor" title="Color">
        Color
        <input class="im-stroke-color" type="color" value="${style.strokeColor}">
      </label>
      <label class="im-label" data-control="strokeWidth" title="Stroke width">
        Width
        <input class="im-stroke-width" type="range" min="1" max="20" value="${style.strokeWidth}">
      </label>
      <label class="im-label" data-control="opacity" title="Opacity">
        Opacity
        <input class="im-opacity" type="range" min="0" max="1" step="0.05" value="${style.opacity}">
      </label>
      <label class="im-label" data-control="fontSize" title="Font size">
        Size
        <input class="im-font-size" type="range" min="10" max="72" value="${style.fontSize}">
      </label>
      <label class="im-label" data-control="radius" title="Blur radius">
        Blur
        <input class="im-radius" type="range" min="2" max="40" value="${style.radius}">
      </label>
    </div>
  `
}

export function updateToolbarForActiveTool(toolbar: HTMLElement, tool: ToolType | null): void {
  const controls = toolControls(tool)

  const optionsRow = toolbar.querySelector<HTMLElement>('.im-options-row')
  if (optionsRow) optionsRow.style.display = tool === null ? 'none' : ''

  toolbar.querySelectorAll<HTMLElement>('[data-control]').forEach((el) => {
    el.style.display = controls.includes(el.dataset.control as any) ? '' : 'none'
  })

  toolbar.querySelectorAll<HTMLElement>('[data-tool]').forEach((btn) => {
    btn.classList.toggle('im-active', btn.dataset.tool === tool)
  })
}

export function syncToolbarToAnnotation(toolbar: HTMLElement, ann: Annotation): void {
  updateToolbarForActiveTool(toolbar, ann.type as ToolType)
  const s = ann.style
  const q = <T extends HTMLInputElement>(sel: string) => toolbar.querySelector<T>(sel)
  const colorEl = q<HTMLInputElement>('.im-color')
  if (colorEl) colorEl.value = s.color.startsWith('#') ? s.color : '#ff0000'
  const fillAlphaEl = q<HTMLInputElement>('.im-fill-alpha')
  if (fillAlphaEl) fillAlphaEl.value = String(s.fillAlpha)
  const strokeColorEl = q<HTMLInputElement>('.im-stroke-color')
  if (strokeColorEl) strokeColorEl.value = s.strokeColor
  const strokeWidthEl = q<HTMLInputElement>('.im-stroke-width')
  if (strokeWidthEl) strokeWidthEl.value = String(s.strokeWidth)
  const opacityEl = q<HTMLInputElement>('.im-opacity')
  if (opacityEl) opacityEl.value = String(s.opacity)
  const fontSizeEl = q<HTMLInputElement>('.im-font-size')
  if (fontSizeEl) fontSizeEl.value = String(s.fontSize)
  const radiusEl = q<HTMLInputElement>('.im-radius')
  if (radiusEl) radiusEl.value = String(s.radius)
}

export function updateZoomLabel(topbar: HTMLElement, zoom: number): void {
  const label = topbar.querySelector<HTMLElement>('.im-zoom-level')
  if (label) label.textContent = `${Math.round(zoom * 100)}%`
}
