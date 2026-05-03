import { describe, it, expect } from 'vitest'
import { getToolbarHTML, getTopbarHTML, updateToolbarForActiveTool } from '../toolbar'
import type { ToolStyle } from '../../types'

const style: ToolStyle = {
  color: '#ff0000', fillAlpha: 0, strokeColor: '#ff0000',
  strokeWidth: 2, opacity: 1, fontSize: 16, radius: 12,
}

function parse(html: string): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = html
  return div
}

describe('getToolbarHTML: bottom panel structure', () => {
  it('contains im-tools-row with tool buttons', () => {
    const el = parse(getToolbarHTML([{ tool: 'rect' }, { tool: 'arrow' }], style))
    const row = el.querySelector('.im-tools-row')
    expect(row).not.toBeNull()
    expect(row!.querySelectorAll('[data-tool]').length).toBe(2)
  })

  it('contains im-options-row with control inputs', () => {
    const el = parse(getToolbarHTML([{ tool: 'rect' }], style))
    const row = el.querySelector('.im-options-row')
    expect(row).not.toBeNull()
    expect(row!.querySelectorAll('[data-control]').length).toBeGreaterThan(0)
  })

  it('does NOT contain undo/redo/zoom actions', () => {
    const el = parse(getToolbarHTML([{ tool: 'rect' }], style))
    expect(el.querySelector('[data-action="undo"]')).toBeNull()
    expect(el.querySelector('[data-action="zoom-in"]')).toBeNull()
  })
})

describe('getTopbarHTML: topbar structure', () => {
  it('contains undo, redo, zoom-in, zoom-out actions', () => {
    const el = parse(getTopbarHTML())
    expect(el.querySelector('[data-action="undo"]')).not.toBeNull()
    expect(el.querySelector('[data-action="redo"]')).not.toBeNull()
    expect(el.querySelector('[data-action="zoom-in"]')).not.toBeNull()
    expect(el.querySelector('[data-action="zoom-out"]')).not.toBeNull()
  })

  it('contains zoom level label', () => {
    const el = parse(getTopbarHTML())
    expect(el.querySelector('.im-zoom-level')).not.toBeNull()
  })

  it('does NOT contain tool buttons', () => {
    const el = parse(getTopbarHTML())
    expect(el.querySelector('[data-tool]')).toBeNull()
  })
})

describe('updateToolbarForActiveTool: options row visibility', () => {
  it('hides im-options-row when no tool selected', () => {
    const el = parse(getToolbarHTML([{ tool: 'rect' }], style))
    updateToolbarForActiveTool(el, null)
    const row = el.querySelector<HTMLElement>('.im-options-row')!
    expect(row.style.display).toBe('none')
  })

  it('shows im-options-row when tool is active', () => {
    const el = parse(getToolbarHTML([{ tool: 'rect' }], style))
    updateToolbarForActiveTool(el, 'rect')
    const row = el.querySelector<HTMLElement>('.im-options-row')!
    expect(row.style.display).not.toBe('none')
  })
})
