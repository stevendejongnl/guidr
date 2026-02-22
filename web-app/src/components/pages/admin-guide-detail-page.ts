import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { guidesService } from '../../services/guides-service.js'
import { stepsService } from '../../services/steps-service.js'
import { adminService, UserDto } from '../../services/admin-service.js'
import { formatDuration } from '../../utils/format-duration.js'
import type { Guide, UpdateGuideRequest } from '@models/guide.js'
import type { Step } from '@models/step.js'

interface EditStep {
  id?: string
  order: number
  title: string
  description: string
  duration: string // stored as string for input binding
  _isNew?: boolean
  _isModified?: boolean
  _isDeleted?: boolean
}

interface MetadataItem {
  [key: string]: string
}

@customElement('admin-guide-detail-page')
export class AdminGuideDetailPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private guide: Guide | null = null
  @state() private steps: Step[] = []
  @state() private users: UserDto[] = []
  @state() private loading = true
  @state() private saving = false
  @state() private error: string | null = null
  @state() private editMode = false

  // Edit form state
  @state() private editTitle = ''
  @state() private editDescription = ''
  @state() private editGuideType = ''
  @state() private editUserId = ''
  @state() private editIsPublic = false
  @state() private editIsHighlighted = false
  @state() private editSteps: EditStep[] = []
  @state() private editMetadata: Record<string, MetadataItem[]> | null = null

  // User search
  @state() private userSearchQuery = ''
  @state() private userDropdownOpen = false

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 20px;
      color: var(--color-primary);
      text-decoration: none;
      font-size: 14px;
      cursor: pointer;
    }

    .back-link:hover {
      opacity: 0.8;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      color: var(--color-primary);
    }

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-primary);
      margin: 0 0 16px 0;
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .field {
      margin-bottom: 16px;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    .field-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin-bottom: 4px;
    }

    .field-value {
      font-size: 15px;
      color: var(--color-text-primary);
      line-height: 1.5;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-type {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--color-primary);
    }

    .badge-public {
      background-color: rgba(74, 222, 128, 0.15);
      color: var(--color-success);
    }

    .badge-private {
      background-color: rgba(156, 163, 175, 0.15);
      color: var(--color-text-secondary);
    }

    .badge-highlighted {
      background-color: rgba(251, 191, 36, 0.15);
      color: var(--color-warning);
    }

    .badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn:hover {
      opacity: 0.85;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: var(--color-primary);
      color: white;
    }

    .btn-secondary {
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }

    .btn-danger {
      background-color: var(--color-danger);
      color: white;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn-group {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }

    /* Form styles */
    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
      box-sizing: border-box;
    }

    .form-textarea {
      min-height: 80px;
      resize: vertical;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .checkbox-group {
      display: flex;
      gap: 20px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .checkbox-label input {
      accent-color: var(--color-primary);
    }

    /* User search dropdown */
    .user-search-wrapper {
      position: relative;
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 200px;
      overflow-y: auto;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 0 0 6px 6px;
      z-index: 10;
    }

    .user-option {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      border-bottom: 1px solid var(--color-border);
    }

    .user-option:last-child {
      border-bottom: none;
    }

    .user-option:hover {
      background-color: rgba(99, 102, 241, 0.1);
    }

    .user-option.selected {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--color-primary);
    }

    .user-option-email {
      font-weight: 500;
    }

    .user-option-name {
      font-size: 12px;
      color: var(--color-text-tertiary);
    }

    .selected-user {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--color-input-background);
      border: 1px solid var(--color-border);
      border-radius: 6px;
    }

    .selected-user-clear {
      background: none;
      border: none;
      color: var(--color-text-tertiary);
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
    }

    .meta-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .meta-row .field {
      flex: 1;
      min-width: 200px;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }

    .error {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--color-danger);
      border-radius: 8px;
      padding: 1rem;
      color: var(--color-danger);
    }

    .save-error {
      color: var(--color-danger);
      font-size: 14px;
      margin-top: 8px;
    }

    /* Step cards (read-only) */
    .step-card {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .step-number {
      background: var(--color-primary);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
    }

    .step-description {
      color: var(--color-text-secondary);
      font-size: 14px;
      line-height: 1.4;
    }

    .step-duration {
      color: var(--color-text-tertiary);
      font-size: 13px;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .steps-empty {
      padding: 2rem;
      text-align: center;
      color: var(--color-text-secondary);
    }

    /* Editable step cards */
    .edit-step-card {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .edit-step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .edit-step-header .form-input {
      flex: 1;
    }

    .edit-step-fields {
      display: grid;
      grid-template-columns: 1fr 120px;
      gap: 12px;
      margin-bottom: 8px;
    }

    .edit-step-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Metadata tables (read-only) */
    .metadata-card {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .metadata-card h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin: 0 0 12px 0;
    }

    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .metadata-table th {
      text-align: left;
      padding: 6px 12px 6px 0;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
    }

    .metadata-table td {
      padding: 6px 12px 6px 0;
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border);
    }

    .metadata-table tr:last-child td {
      border-bottom: none;
    }

    /* Editable metadata rows */
    .metadata-item-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .metadata-item-row .form-input {
      flex: 1;
    }

    .metadata-item-row .btn-sm {
      flex-shrink: 0;
    }

    .add-btn {
      margin-top: 4px;
    }
  `

  connectedCallback(): void {
    super.connectedCallback()
    const id = this.getGuideIdFromPath()
    if (id) {
      this.fetchData(id)
    } else {
      this.error = 'Invalid guide ID'
      this.loading = false
    }

    // Check for ?edit=true query param
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === 'true') {
      this.editMode = true
    }

    // Close user dropdown when clicking outside
    this._handleOutsideClick = this._handleOutsideClick.bind(this)
    document.addEventListener('click', this._handleOutsideClick)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this._handleOutsideClick)
  }

  private _handleOutsideClick(e: Event): void {
    const path = e.composedPath()
    const isInsideDropdown = path.some(el =>
      el instanceof HTMLElement && el.classList?.contains('user-search-wrapper')
    )
    if (!isInsideDropdown) {
      this.userDropdownOpen = false
    }
  }

  private getGuideIdFromPath(): string | null {
    const match = window.location.pathname.match(/\/admin\/guides\/([^/]+)/)
    return match ? match[1] : null
  }

  private async fetchData(id: string): Promise<void> {
    try {
      this.loading = true
      this.error = null
      const [guide, users, steps] = await Promise.all([
        guidesService.getById(id),
        adminService.getAllUsers(),
        stepsService.getByGuideId(id),
      ])
      this.guide = guide
      this.users = users
      this.steps = steps.sort((a, b) => a.order - b.order)
      this.populateEditForm(guide)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch guide'
    } finally {
      this.loading = false
    }
  }

  private populateEditForm(guide: Guide): void {
    this.editTitle = guide.title
    this.editDescription = guide.description ?? ''
    this.editGuideType = guide.guideType
    this.editUserId = guide.createdByUserId ?? ''
    this.editIsPublic = guide.isPublic
    this.editIsHighlighted = guide.isHighlighted
    this.editSteps = this.steps.map(s => ({
      id: s.id,
      order: s.order,
      title: s.title,
      description: s.description ?? '',
      duration: s.duration != null ? String(s.duration) : '',
    }))
    this.editMetadata = this.cloneMetadata(guide.metadata, guide.guideType)
  }

  private cloneMetadata(
    metadata: Record<string, unknown> | null,
    guideType: string,
  ): Record<string, MetadataItem[]> | null {
    if (!metadata) return null

    if (guideType === 'cooking') {
      const ingredients = metadata['ingredients'] as MetadataItem[] | undefined
      return { ingredients: ingredients ? ingredients.map(i => ({ ...i })) : [] }
    }
    if (guideType === 'workout') {
      const muscles = metadata['targetMuscles'] as MetadataItem[] | undefined
      const equipment = metadata['equipment'] as MetadataItem[] | undefined
      return {
        targetMuscles: muscles ? muscles.map(m => ({ ...m })) : [],
        equipment: equipment ? equipment.map(e => ({ ...e })) : [],
      }
    }
    if (guideType === 'general') {
      const notes = metadata['notes'] as MetadataItem[] | undefined
      return { notes: notes ? notes.map(n => ({ ...n })) : [] }
    }
    return null
  }

  private enterEditMode(): void {
    if (this.guide) {
      this.populateEditForm(this.guide)
    }
    this.editMode = true
    this.error = null
  }

  private cancelEdit(): void {
    this.editMode = false
    this.error = null
    // Reset URL if we had ?edit=true
    const url = window.location.pathname
    window.history.replaceState({}, '', url)
  }

  private async saveChanges(): Promise<void> {
    if (!this.guide) return

    try {
      this.saving = true
      this.error = null

      // Build guide update payload
      const changes: UpdateGuideRequest = {}
      let hasGuideChanges = false

      if (this.editTitle !== this.guide.title) {
        changes.title = this.editTitle
        hasGuideChanges = true
      }
      const newDesc = this.editDescription || null
      if (newDesc !== this.guide.description) {
        changes.description = this.editDescription
        hasGuideChanges = true
      }
      if (this.editGuideType !== this.guide.guideType) {
        changes.guideType = this.editGuideType
        hasGuideChanges = true
      }
      const newUserId = this.editUserId || null
      if (newUserId !== this.guide.createdByUserId) {
        changes.createdByUserId = this.editUserId
        hasGuideChanges = true
      }
      if (this.editIsPublic !== this.guide.isPublic) {
        changes.isPublic = this.editIsPublic
        hasGuideChanges = true
      }
      if (this.editIsHighlighted !== this.guide.isHighlighted) {
        changes.isHighlighted = this.editIsHighlighted
        hasGuideChanges = true
      }

      // Check metadata changes
      const newMetadata = this.buildMetadataPayload()
      if (JSON.stringify(newMetadata) !== JSON.stringify(this.guide.metadata)) {
        changes.metadata = newMetadata
        hasGuideChanges = true
      }

      // Save guide changes
      if (hasGuideChanges) {
        const updated = await guidesService.update(this.guide.id, changes)
        this.guide = updated
      }

      // Save step changes
      await this.saveStepChanges()

      // Refresh steps from server
      const freshSteps = await stepsService.getByGuideId(this.guide.id)
      this.steps = freshSteps.sort((a, b) => a.order - b.order)

      this.populateEditForm(this.guide)
      this.editMode = false
      window.history.replaceState({}, '', window.location.pathname)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save changes'
    } finally {
      this.saving = false
    }
  }

  private buildMetadataPayload(): Record<string, unknown> | null {
    if (!this.editMetadata) return null
    // Filter out empty items
    const result: Record<string, unknown> = {}
    let hasContent = false
    for (const [key, items] of Object.entries(this.editMetadata)) {
      const filtered = items.filter(item =>
        Object.values(item).some(v => v.trim() !== '')
      )
      if (filtered.length > 0) {
        result[key] = filtered
        hasContent = true
      }
    }
    return hasContent ? result : null
  }

  private async saveStepChanges(): Promise<void> {
    if (!this.guide) return

    // Delete removed steps
    for (const step of this.editSteps) {
      if (step._isDeleted && step.id) {
        await stepsService.delete(step.id)
      }
    }

    // Create new steps
    for (const step of this.editSteps) {
      if (step._isNew && !step._isDeleted && step.title.trim()) {
        await stepsService.create({
          guideId: this.guide.id,
          order: step.order,
          title: step.title,
          description: step.description || null,
          duration: step.duration ? Number(step.duration) : null,
        })
      }
    }

    // Update modified steps
    for (const step of this.editSteps) {
      if (step._isModified && !step._isNew && !step._isDeleted && step.id) {
        const original = this.steps.find(s => s.id === step.id)
        if (!original) continue
        const updates: Record<string, unknown> = {}
        if (step.title !== original.title) updates['title'] = step.title
        if (step.order !== original.order) updates['order'] = step.order
        const newDesc = step.description || null
        if (newDesc !== original.description) updates['description'] = newDesc
        const newDur = step.duration ? Number(step.duration) : null
        if (newDur !== original.duration) updates['duration'] = newDur
        if (Object.keys(updates).length > 0) {
          await stepsService.update(step.id, updates)
        }
      }
    }
  }

  private updateEditStep(index: number, field: keyof EditStep, value: string): void {
    const updated = [...this.editSteps]
    updated[index] = { ...updated[index], [field]: value, _isModified: true }
    this.editSteps = updated
  }

  private markStepDeleted(index: number): void {
    const step = this.editSteps[index]
    if (step._isNew) {
      // Just remove from array if it was never saved
      this.editSteps = this.editSteps.filter((_, i) => i !== index)
    } else {
      const updated = [...this.editSteps]
      updated[index] = { ...updated[index], _isDeleted: true }
      this.editSteps = updated
    }
    this.reorderEditSteps()
  }

  private addNewEditStep(): void {
    const visibleSteps = this.editSteps.filter(s => !s._isDeleted)
    this.editSteps = [
      ...this.editSteps,
      {
        order: visibleSteps.length + 1,
        title: '',
        description: '',
        duration: '',
        _isNew: true,
      },
    ]
  }

  private reorderEditSteps(): void {
    let order = 1
    this.editSteps = this.editSteps.map(s => {
      if (s._isDeleted) return s
      return { ...s, order: order++, _isModified: s._isModified || s.order !== order - 1 }
    })
  }

  private updateMetadataItem(key: string, index: number, field: string, value: string): void {
    if (!this.editMetadata) return
    const items = [...(this.editMetadata[key] ?? [])]
    items[index] = { ...items[index], [field]: value }
    this.editMetadata = { ...this.editMetadata, [key]: items }
  }

  private removeMetadataItem(key: string, index: number): void {
    if (!this.editMetadata) return
    const items = (this.editMetadata[key] ?? []).filter((_, i) => i !== index)
    this.editMetadata = { ...this.editMetadata, [key]: items }
  }

  private addMetadataItem(key: string, template: MetadataItem): void {
    if (!this.editMetadata) return
    const items = [...(this.editMetadata[key] ?? []), { ...template }]
    this.editMetadata = { ...this.editMetadata, [key]: items }
  }

  private handleEditGuideTypeChange(newType: string): void {
    this.editGuideType = newType
    // Reset metadata when type changes
    if (newType === 'cooking') {
      this.editMetadata = { ingredients: [] }
    } else if (newType === 'workout') {
      this.editMetadata = { targetMuscles: [], equipment: [] }
    } else if (newType === 'general') {
      this.editMetadata = { notes: [] }
    } else {
      this.editMetadata = null
    }
  }

  private get filteredUsers(): UserDto[] {
    if (!this.userSearchQuery) return this.users
    const q = this.userSearchQuery.toLowerCase()
    return this.users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.name?.toLowerCase().includes(q))
    )
  }

  private selectUser(user: UserDto): void {
    this.editUserId = user.id
    this.userSearchQuery = ''
    this.userDropdownOpen = false
  }

  private getSelectedUserEmail(): string {
    const user = this.users.find(u => u.id === this.editUserId)
    return user?.email ?? this.editUserId
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  private navigateBack(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/admin/guides')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private async deleteGuide(): Promise<void> {
    if (!this.guide) return
    if (!window.confirm(`Delete guide "${this.guide.title}"? This cannot be undone.`)) return
    try {
      await guidesService.delete(this.guide.id)
      window.history.pushState({}, '', '/admin/guides')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete guide'
    }
  }

  render() {
    if (!this.auth?.isAdmin) {
      return html`<div style="padding: 2rem; text-align: center; color: ${colors.danger};">Access denied. Admin only.</div>`
    }

    return html`
      <div class="container">
        <a class="back-link" @click=${this.navigateBack}>← Back to Guides</a>

        ${this.loading
          ? html`<div class="loading">Loading guide...</div>`
          : this.guide
            ? this.editMode ? this.renderEditMode() : this.renderViewMode()
            : html`<div class="error">${this.error ?? 'Guide not found'}</div>`
        }
      </div>
    `
  }

  private renderViewMode() {
    if (!this.guide) return nothing
    const guide = this.guide
    const ownerUser = this.users.find(u => u.id === guide.createdByUserId)

    return html`
      <div class="header">
        <h1>${guide.title}</h1>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" @click=${this.enterEditMode}>Edit</button>
          <button class="btn btn-danger" @click=${this.deleteGuide}>Delete Guide</button>
        </div>
      </div>

      ${this.error ? html`<div class="error" style="margin-bottom: 16px;">${this.error}</div>` : nothing}

      <div class="card">
        <div class="field">
          <div class="field-label">Description</div>
          <div class="field-value">${guide.description || '—'}</div>
        </div>

        <div class="meta-row">
          <div class="field">
            <div class="field-label">Type</div>
            <div class="field-value">
              <span class="badge badge-type">${guide.guideType}</span>
            </div>
          </div>

          <div class="field">
            <div class="field-label">Owner</div>
            <div class="field-value">${ownerUser?.email ?? guide.createdByUserId ?? '—'}</div>
          </div>

          <div class="field">
            <div class="field-label">Steps</div>
            <div class="field-value">${this.steps.length}</div>
          </div>
        </div>

        <div class="field">
          <div class="field-label">Visibility</div>
          <div class="badges">
            ${guide.isPublic
              ? html`<span class="badge badge-public">Public</span>`
              : html`<span class="badge badge-private">Private</span>`}
            ${guide.isHighlighted
              ? html`<span class="badge badge-highlighted">Highlighted</span>`
              : nothing}
          </div>
        </div>

        <div class="meta-row">
          <div class="field">
            <div class="field-label">Created</div>
            <div class="field-value">${this.formatDate(guide.createdAt)}</div>
          </div>
          <div class="field">
            <div class="field-label">Updated</div>
            <div class="field-value">${this.formatDate(guide.updatedAt)}</div>
          </div>
        </div>
      </div>

      ${this.renderViewSteps()}
      ${this.renderViewMetadata()}

      <div class="field">
        <div class="field-label">Guide ID</div>
        <div class="field-value" style="font-family: monospace; font-size: 13px; color: var(--color-text-tertiary);">${guide.id}</div>
      </div>
    `
  }

  private renderViewSteps() {
    return html`
      <div class="card">
        <h2>Steps (${this.steps.length})</h2>
        ${this.steps.length > 0
          ? this.steps.map((step, i) => html`
            <div class="step-card">
              <span class="step-number">${i + 1}</span>
              <div class="step-content">
                <div class="step-title">${step.title}</div>
                ${step.description
                  ? html`<div class="step-description">${step.description}</div>`
                  : nothing}
              </div>
              ${step.duration
                ? html`<span class="step-duration">${formatDuration(step.duration)}</span>`
                : nothing}
            </div>
          `)
          : html`<div class="steps-empty">No steps yet.</div>`}
      </div>
    `
  }

  private renderViewMetadata() {
    if (!this.guide?.metadata) return nothing
    const metadata = this.guide.metadata
    const guideType = this.guide.guideType

    if (guideType === 'cooking') {
      const ingredients = metadata['ingredients'] as MetadataItem[] | undefined
      if (!ingredients?.length) return nothing
      return html`
        <div class="card">
          <h2>Ingredients</h2>
          <table class="metadata-table">
            <thead><tr><th>Name</th><th>Quantity</th><th>Unit</th></tr></thead>
            <tbody>
              ${ingredients.map(ing => html`
                <tr>
                  <td>${ing['name'] ?? ''}</td>
                  <td>${ing['quantity'] ?? ''}</td>
                  <td>${ing['unit'] ?? ''}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `
    }

    if (guideType === 'workout') {
      const muscles = metadata['targetMuscles'] as MetadataItem[] | undefined
      const equipment = metadata['equipment'] as MetadataItem[] | undefined
      if (!muscles?.length && !equipment?.length) return nothing
      return html`
        <div class="card">
          <h2>Workout Details</h2>
          ${muscles?.length ? html`
            <div class="metadata-card">
              <h3>Target Muscles</h3>
              <table class="metadata-table">
                <thead><tr><th>Name</th><th>Focus</th></tr></thead>
                <tbody>
                  ${muscles.map(m => html`
                    <tr><td>${m['name'] ?? ''}</td><td>${m['focus'] ?? ''}</td></tr>
                  `)}
                </tbody>
              </table>
            </div>
          ` : nothing}
          ${equipment?.length ? html`
            <div class="metadata-card">
              <h3>Equipment</h3>
              <table class="metadata-table">
                <thead><tr><th>Name</th><th>Weight</th></tr></thead>
                <tbody>
                  ${equipment.map(e => html`
                    <tr><td>${e['name'] ?? ''}</td><td>${e['weight'] ?? ''}</td></tr>
                  `)}
                </tbody>
              </table>
            </div>
          ` : nothing}
        </div>
      `
    }

    if (guideType === 'general') {
      const notes = metadata['notes'] as MetadataItem[] | undefined
      if (!notes?.length) return nothing
      return html`
        <div class="card">
          <h2>Notes</h2>
          <table class="metadata-table">
            <thead><tr><th>Key</th><th>Value</th></tr></thead>
            <tbody>
              ${notes.map(n => html`
                <tr><td>${n['key'] ?? ''}</td><td>${n['value'] ?? ''}</td></tr>
              `)}
            </tbody>
          </table>
        </div>
      `
    }

    return nothing
  }

  private renderEditMode() {
    return html`
      <div class="header">
        <h1>Edit Guide</h1>
        <button class="btn btn-danger" @click=${this.deleteGuide} ?disabled=${this.saving}>Delete Guide</button>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input
            class="form-input"
            type="text"
            .value=${this.editTitle}
            @input=${(e: InputEvent) => { this.editTitle = (e.target as HTMLInputElement).value }}
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            class="form-textarea"
            .value=${this.editDescription}
            @input=${(e: InputEvent) => { this.editDescription = (e.target as HTMLTextAreaElement).value }}
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Guide Type</label>
          <select
            class="form-select"
            .value=${this.editGuideType}
            @change=${(e: Event) => { this.handleEditGuideTypeChange((e.target as HTMLSelectElement).value) }}
          >
            <option value="cooking" ?selected=${this.editGuideType === 'cooking'}>Cooking</option>
            <option value="workout" ?selected=${this.editGuideType === 'workout'}>Workout</option>
            <option value="general" ?selected=${this.editGuideType === 'general'}>General</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Owner</label>
          ${this.renderUserSearch()}
        </div>

        <div class="form-group">
          <label class="form-label">Visibility</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${this.editIsPublic}
                @change=${(e: Event) => { this.editIsPublic = (e.target as HTMLInputElement).checked }}
              />
              Public
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${this.editIsHighlighted}
                @change=${(e: Event) => { this.editIsHighlighted = (e.target as HTMLInputElement).checked }}
              />
              Highlighted
            </label>
          </div>
        </div>
      </div>

      ${this.renderEditSteps()}
      ${this.renderEditMetadata()}

      ${this.error ? html`<div class="save-error">${this.error}</div>` : nothing}

      <div class="btn-group">
        <button
          class="btn btn-primary"
          @click=${this.saveChanges}
          ?disabled=${this.saving || !this.editTitle.trim()}
        >
          ${this.saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          class="btn btn-secondary"
          @click=${this.cancelEdit}
          ?disabled=${this.saving}
        >
          Cancel
        </button>
      </div>
    `
  }

  private renderEditSteps() {
    const visibleSteps = this.editSteps.filter(s => !s._isDeleted)

    return html`
      <div class="card">
        <h2>Steps (${visibleSteps.length})</h2>
        ${visibleSteps.map((step, displayIndex) => {
          const realIndex = this.editSteps.indexOf(step)
          return html`
            <div class="edit-step-card">
              <div class="edit-step-header">
                <span class="step-number">${displayIndex + 1}</span>
                <input
                  class="form-input"
                  type="text"
                  placeholder="Step title"
                  .value=${step.title}
                  @input=${(e: InputEvent) => {
                    this.updateEditStep(realIndex, 'title', (e.target as HTMLInputElement).value)
                  }}
                  ?disabled=${this.saving}
                />
              </div>
              <div class="edit-step-fields">
                <div>
                  <input
                    class="form-input"
                    type="text"
                    placeholder="Description (optional)"
                    .value=${step.description}
                    @input=${(e: InputEvent) => {
                      this.updateEditStep(realIndex, 'description', (e.target as HTMLInputElement).value)
                    }}
                    ?disabled=${this.saving}
                  />
                </div>
                <div>
                  <input
                    class="form-input"
                    type="number"
                    placeholder="Seconds"
                    min="0"
                    .value=${step.duration}
                    @input=${(e: InputEvent) => {
                      this.updateEditStep(realIndex, 'duration', (e.target as HTMLInputElement).value)
                    }}
                    ?disabled=${this.saving}
                  />
                </div>
              </div>
              <div class="edit-step-actions">
                <button
                  class="btn btn-danger btn-sm"
                  @click=${() => this.markStepDeleted(realIndex)}
                  ?disabled=${this.saving}
                >Remove</button>
              </div>
            </div>
          `
        })}

        <button
          class="btn btn-secondary btn-sm"
          @click=${this.addNewEditStep}
          ?disabled=${this.saving}
        >+ Add Step</button>
      </div>
    `
  }

  private renderEditMetadata() {
    const type = this.editGuideType

    if (type === 'cooking') return this.renderEditCookingMetadata()
    if (type === 'workout') return this.renderEditWorkoutMetadata()
    if (type === 'general') return this.renderEditGeneralMetadata()
    return nothing
  }

  private renderEditCookingMetadata() {
    const ingredients = this.editMetadata?.['ingredients'] ?? []

    return html`
      <div class="card">
        <h2>Ingredients</h2>
        ${ingredients.map((ing, i) => html`
          <div class="metadata-item-row">
            <input
              class="form-input"
              type="text"
              placeholder="Name"
              .value=${ing['name'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('ingredients', i, 'name', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <input
              class="form-input"
              type="text"
              placeholder="Quantity"
              .value=${ing['quantity'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('ingredients', i, 'quantity', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <input
              class="form-input"
              type="text"
              placeholder="Unit"
              .value=${ing['unit'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('ingredients', i, 'unit', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <button
              class="btn btn-danger btn-sm"
              @click=${() => this.removeMetadataItem('ingredients', i)}
              ?disabled=${this.saving}
            >x</button>
          </div>
        `)}
        <button
          class="btn btn-secondary btn-sm add-btn"
          @click=${() => this.addMetadataItem('ingredients', { name: '', quantity: '', unit: '' })}
          ?disabled=${this.saving}
        >+ Add Ingredient</button>
      </div>
    `
  }

  private renderEditWorkoutMetadata() {
    const muscles = this.editMetadata?.['targetMuscles'] ?? []
    const equipment = this.editMetadata?.['equipment'] ?? []

    return html`
      <div class="card">
        <h2>Target Muscles</h2>
        ${muscles.map((m, i) => html`
          <div class="metadata-item-row">
            <input
              class="form-input"
              type="text"
              placeholder="Muscle name"
              .value=${m['name'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('targetMuscles', i, 'name', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <input
              class="form-input"
              type="text"
              placeholder="Focus (primary/secondary)"
              .value=${m['focus'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('targetMuscles', i, 'focus', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <button
              class="btn btn-danger btn-sm"
              @click=${() => this.removeMetadataItem('targetMuscles', i)}
              ?disabled=${this.saving}
            >x</button>
          </div>
        `)}
        <button
          class="btn btn-secondary btn-sm add-btn"
          @click=${() => this.addMetadataItem('targetMuscles', { name: '', focus: '' })}
          ?disabled=${this.saving}
        >+ Add Muscle</button>
      </div>

      <div class="card">
        <h2>Equipment</h2>
        ${equipment.map((eq, i) => html`
          <div class="metadata-item-row">
            <input
              class="form-input"
              type="text"
              placeholder="Equipment name"
              .value=${eq['name'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('equipment', i, 'name', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <input
              class="form-input"
              type="text"
              placeholder="Weight"
              .value=${eq['weight'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('equipment', i, 'weight', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <button
              class="btn btn-danger btn-sm"
              @click=${() => this.removeMetadataItem('equipment', i)}
              ?disabled=${this.saving}
            >x</button>
          </div>
        `)}
        <button
          class="btn btn-secondary btn-sm add-btn"
          @click=${() => this.addMetadataItem('equipment', { name: '', weight: '' })}
          ?disabled=${this.saving}
        >+ Add Equipment</button>
      </div>
    `
  }

  private renderEditGeneralMetadata() {
    const notes = this.editMetadata?.['notes'] ?? []

    return html`
      <div class="card">
        <h2>Notes</h2>
        ${notes.map((n, i) => html`
          <div class="metadata-item-row">
            <input
              class="form-input"
              type="text"
              placeholder="Key"
              .value=${n['key'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('notes', i, 'key', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <input
              class="form-input"
              type="text"
              placeholder="Value"
              .value=${n['value'] ?? ''}
              @input=${(e: InputEvent) => this.updateMetadataItem('notes', i, 'value', (e.target as HTMLInputElement).value)}
              ?disabled=${this.saving}
            />
            <button
              class="btn btn-danger btn-sm"
              @click=${() => this.removeMetadataItem('notes', i)}
              ?disabled=${this.saving}
            >x</button>
          </div>
        `)}
        <button
          class="btn btn-secondary btn-sm add-btn"
          @click=${() => this.addMetadataItem('notes', { key: '', value: '' })}
          ?disabled=${this.saving}
        >+ Add Note</button>
      </div>
    `
  }

  private renderUserSearch() {
    if (this.editUserId && !this.userDropdownOpen) {
      return html`
        <div class="selected-user">
          <span>${this.getSelectedUserEmail()}</span>
          <button
            class="selected-user-clear"
            @click=${() => { this.editUserId = ''; this.userDropdownOpen = true }}
          >x</button>
        </div>
      `
    }

    const filtered = this.filteredUsers
    return html`
      <div class="user-search-wrapper">
        <input
          class="form-input"
          type="text"
          placeholder="Search users by email or name..."
          .value=${this.userSearchQuery}
          @input=${(e: InputEvent) => {
            this.userSearchQuery = (e.target as HTMLInputElement).value
            this.userDropdownOpen = true
          }}
          @focus=${() => { this.userDropdownOpen = true }}
        />
        ${this.userDropdownOpen && filtered.length > 0
          ? html`
            <div class="user-dropdown">
              ${filtered.slice(0, 20).map(user => html`
                <div
                  class="user-option ${user.id === this.editUserId ? 'selected' : ''}"
                  @click=${() => this.selectUser(user)}
                >
                  <div class="user-option-email">${user.email}</div>
                  ${user.name ? html`<div class="user-option-name">${user.name}</div>` : nothing}
                </div>
              `)}
            </div>
          `
          : nothing}
      </div>
    `
  }
}
