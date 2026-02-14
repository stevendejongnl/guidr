import { isValidGuideType } from '../constants/GuideTypes'

export class Guide {
  readonly id: string
  readonly guideType: string
  readonly createdByUserId: string | undefined
  private _title: string
  private _description: string | undefined
  private _metadata: Record<string, unknown> | undefined
  private _stepIds: string[]
  private _isPublic: boolean
  private _isHighlighted: boolean
  private _language: string
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(
    id: string,
    guideType: string,
    title: string,
    description?: string,
    createdByUserId?: string,
    isPublic: boolean = false,
    isHighlighted: boolean = false,
    metadata?: Record<string, unknown>,
    language: string = 'en'
  ) {
    if (!id || id.trim() === '') {
      throw new Error('Guide id cannot be empty')
    }
    if (!isValidGuideType(guideType)) {
      throw new Error(`Invalid guide type: ${guideType}`)
    }
    if (!title || title.trim() === '') {
      throw new Error('Guide title cannot be empty')
    }

    this.id = id
    this.guideType = guideType
    this.createdByUserId = createdByUserId
    this._title = title
    this._description = description
    this._metadata = metadata
    this._stepIds = []
    this._isPublic = isPublic
    this._isHighlighted = isHighlighted
    this._language = language
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get title(): string {
    return this._title
  }

  get description(): string | undefined {
    return this._description
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata
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

  get isPublic(): boolean {
    return this._isPublic
  }

  get isHighlighted(): boolean {
    return this._isHighlighted
  }

  get language(): string {
    return this._language
  }

  updateLanguage(newLanguage: string): void {
    this._language = newLanguage
    this._updatedAt = new Date()
  }

  isOwnedBy(userId: string): boolean {
    return this.createdByUserId === userId
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

  updateMetadata(newMetadata: Record<string, unknown> | undefined): void {
    this._metadata = newMetadata
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

  makePublic(): void {
    this._isPublic = true
    this._updatedAt = new Date()
  }

  makePrivate(): void {
    this._isPublic = false
    this._updatedAt = new Date()
  }

  highlight(): void {
    this._isHighlighted = true
    this._updatedAt = new Date()
  }

  unhighlight(): void {
    this._isHighlighted = false
    this._updatedAt = new Date()
  }
}
