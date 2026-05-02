import { describe, it, expect } from 'vitest'
import { toolControls } from '../toolControls'

describe('toolControls', () => {
  it('rect shows fill, fillAlpha, stroke color, stroke width, opacity', () => {
    const c = toolControls('rect')
    expect(c).toContain('fill')
    expect(c).toContain('fillAlpha')
    expect(c).toContain('strokeColor')
    expect(c).toContain('strokeWidth')
    expect(c).toContain('opacity')
    expect(c).not.toContain('fontSize')
    expect(c).not.toContain('radius')
  })

  it('ellipse shows same controls as rect', () => {
    expect(toolControls('ellipse')).toEqual(toolControls('rect'))
  })

  it('arrow shows stroke color only', () => {
    const c = toolControls('arrow')
    expect(c).toContain('strokeColor')
    expect(c).not.toContain('fill')
    expect(c).not.toContain('fillAlpha')
    expect(c).not.toContain('strokeWidth')
    expect(c).not.toContain('opacity')
    expect(c).not.toContain('fontSize')
  })

  it('blur shows radius only', () => {
    const c = toolControls('blur')
    expect(c).toContain('radius')
    expect(c).not.toContain('fill')
    expect(c).not.toContain('strokeColor')
    expect(c).not.toContain('fontSize')
  })

  it('text shows fontSize and strokeColor (text color)', () => {
    const c = toolControls('text')
    expect(c).toContain('fontSize')
    expect(c).toContain('strokeColor')
    expect(c).not.toContain('fill')
    expect(c).not.toContain('radius')
    expect(c).not.toContain('strokeWidth')
  })

  it('null (select mode) shows no controls', () => {
    expect(toolControls(null)).toHaveLength(0)
  })
})
