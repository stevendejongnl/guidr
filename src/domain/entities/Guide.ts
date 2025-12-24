export class Guide {
  readonly id: string
  readonly categoryId: string
  private _title: string
  private _description: string | undefined
  private _stepIds: string[]
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(id: string, categoryId: string, title: string, description?: string) {
    if (!id || id.trim() === '') {
      throw new Error('Guide id cannot be empty')
    }
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category id cannot be empty')
    }
    if (!title || title.trim() === '') {
      throw new Error('Guide title cannot be empty')
    }

    this.id = id
    this.categoryId = categoryId
    this._title = title
    this._description = description
    this._stepIds = []
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get title(): string {
    return this._title
  }

  get description(): string | undefined {
    return this._description
  }

  get stepIds(): string[] {
    return [...this._stepIds]
  }

  get stepCount(): number {
    return this._stepIds.length
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('Guide title cannot be empty')
    }
    this._title = newTitle
    this._updatedAt = new Date()
  }

  updateDescription(newDescription: string): void {
    this._description = newDescription
    this._updatedAt = new Date()
  }

  addStep(stepId: string): void {
    if (!this._stepIds.includes(stepId)) {
      this._stepIds.push(stepId)
      this._updatedAt = new Date()
    }
  }

  removeStep(stepId: string): void {
    const index = this._stepIds.indexOf(stepId)
    if (index !== -1) {
      this._stepIds.splice(index, 1)
      this._updatedAt = new Date()
    }
  }
}
