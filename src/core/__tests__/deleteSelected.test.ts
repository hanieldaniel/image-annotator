import { describe, it, expect } from 'vitest'
import { Annotator } from '../Annotator'

describe('deleteSelected', () => {
  it('getSelected returns null initially', () => {
    const annotator = new Annotator()
    expect(annotator.getSelected()).toBeNull()
  })

  it('setSelected sets the selected id', () => {
    const annotator = new Annotator()
    annotator.setSelected('abc')
    expect(annotator.getSelected()).toBe('abc')
  })

  it('deleteSelected clears selection', () => {
    const annotator = new Annotator()
    annotator.setSelected('abc')
    annotator.deleteSelected()
    expect(annotator.getSelected()).toBeNull()
  })

  it('deleteSelected with no selection is a no-op', () => {
    const annotator = new Annotator()
    expect(() => annotator.deleteSelected()).not.toThrow()
    expect(annotator.getSelected()).toBeNull()
  })

  it('setSelected(null) clears selection', () => {
    const annotator = new Annotator()
    annotator.setSelected('abc')
    annotator.setSelected(null)
    expect(annotator.getSelected()).toBeNull()
  })
})
