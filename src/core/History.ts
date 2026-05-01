import type { Annotation } from '../types'

export class History {
  private stack: Annotation[][] = [[]]
  private cursor = 0

  get current(): Annotation[] {
    return structuredClone(this.stack[this.cursor])
  }

  push(annotations: Annotation[]): void {
    this.stack.splice(this.cursor + 1)
    this.stack.push(structuredClone(annotations))
    this.cursor = this.stack.length - 1
  }

  undo(): Annotation[] {
    if (this.cursor > 0) this.cursor--
    return this.current
  }

  redo(): Annotation[] {
    if (this.cursor < this.stack.length - 1) this.cursor++
    return this.current
  }

  canUndo(): boolean {
    return this.cursor > 0
  }

  canRedo(): boolean {
    return this.cursor < this.stack.length - 1
  }

  reset(): void {
    this.stack = [[]]
    this.cursor = 0
  }
}
