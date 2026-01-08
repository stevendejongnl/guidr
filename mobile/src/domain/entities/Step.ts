export class Step {
  readonly id: string
  readonly guideId: string
  private _order: number
  private _title: string
  private _description: string | undefined
  private _duration: number
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(
    id: string,
    guideId: string,
    order: number,
    title: string,
    duration: number,
    description?: string
  ) {
    if (!id || id.trim() === '') {
      throw new Error('Step id cannot be empty')
    }
    if (!guideId || guideId.trim() === '') {
      throw new Error('Guide id cannot be empty')
    }
    if (!title || title.trim() === '') {
      throw new Error('Step title cannot be empty')
    }
    if (order < 0) {
      throw new Error('Step order must be non-negative')
    }
    if (duration < 0) {
      throw new Error('Step duration must be non-negative')
    }

    this.id = id
    this.guideId = guideId
    this._order = order
    this._title = title
    this._duration = duration
    this._description = description
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get order(): number {
    return this._order
  }

  get title(): string {
    return this._title
  }

  get description(): string | undefined {
    return this._description
  }

  get duration(): number {
    return this._duration
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('Step title cannot be empty')
    }
    this._title = newTitle
    this._updatedAt = new Date()
  }

  updateDescription(newDescription: string): void {
    this._description = newDescription
    this._updatedAt = new Date()
  }

  updateDuration(newDuration: number): void {
    if (newDuration < 0) {
      throw new Error('Step duration must be non-negative')
    }
    this._duration = newDuration
    this._updatedAt = new Date()
  }

  updateOrder(newOrder: number): void {
    if (newOrder < 0) {
      throw new Error('Step order must be non-negative')
    }
    this._order = newOrder
    this._updatedAt = new Date()
  }
}
