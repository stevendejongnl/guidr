export class Category {
  readonly id: string
  private _name: string
  readonly parentId: string | null
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(id: string, name: string, parentId: string | null) {
    if (!id || id.trim() === '') {
      throw new Error('Category id cannot be empty')
    }
    if (!name || name.trim() === '') {
      throw new Error('Category name cannot be empty')
    }

    this.id = id
    this._name = name
    this.parentId = parentId
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get name(): string {
    return this._name
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  updateName(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('Category name cannot be empty')
    }
    this._name = newName
    this._updatedAt = new Date()
  }

  isRoot(): boolean {
    return this.parentId === null
  }
}
