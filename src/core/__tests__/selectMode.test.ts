import { describe, it, expect, vi } from 'vitest'
import { Annotator } from '../Annotator'

describe('select mode — tool toggle', () => {
  it('selectTool sets activeTool and emits tool-change', () => {
    const annotator = new Annotator()
    const handler = vi.fn()
    annotator.on('tool-change', handler)

    annotator.selectTool('rect')
    expect(handler).toHaveBeenCalledWith('rect')
  })

  it('selecting the active tool again sets null (select mode)', () => {
    const annotator = new Annotator()
    const handler = vi.fn()
    annotator.on('tool-change', handler)

    annotator.selectTool('rect')
    annotator.selectTool('rect')

    expect(handler).toHaveBeenLastCalledWith(null)
  })

  it('selecting a different tool from active does not toggle off', () => {
    const annotator = new Annotator()
    const handler = vi.fn()
    annotator.on('tool-change', handler)

    annotator.selectTool('rect')
    annotator.selectTool('arrow')

    expect(handler).toHaveBeenLastCalledWith('arrow')
  })

  it('selectTool(null) directly enters select mode', () => {
    const annotator = new Annotator()
    const handler = vi.fn()
    annotator.on('tool-change', handler)

    annotator.selectTool(null)
    expect(handler).toHaveBeenCalledWith(null)
  })
})
