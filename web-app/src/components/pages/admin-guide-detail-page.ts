import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { guidesService } from '../../services/guides-service.js'
import { adminService, UserDto } from '../../services/admin-service.js'
import type { Guide, UpdateGuideRequest } from '@models/guide.js'

@customElement('admin-guide-detail-page')
export class AdminGuideDetailPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private guide: Guide | null = null
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
      const [guide, users] = await Promise.all([
        guidesService.getById(id),
        adminService.getAllUsers(),
      ])
      this.guide = guide
      this.users = users
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

    const changes: UpdateGuideRequest = {}
    let hasChanges = false

    if (this.editTitle !== this.guide.title) {
      changes.title = this.editTitle
      hasChanges = true
    }
    const newDesc = this.editDescription || null
    if (newDesc !== this.guide.description) {
      changes.description = this.editDescription
      hasChanges = true
    }
    if (this.editGuideType !== this.guide.guideType) {
      changes.guideType = this.editGuideType
      hasChanges = true
    }
    const newUserId = this.editUserId || null
    if (newUserId !== this.guide.createdByUserId) {
      changes.createdByUserId = this.editUserId
      hasChanges = true
    }
    if (this.editIsPublic !== this.guide.isPublic) {
      changes.isPublic = this.editIsPublic
      hasChanges = true
    }
    if (this.editIsHighlighted !== this.guide.isHighlighted) {
      changes.isHighlighted = this.editIsHighlighted
      hasChanges = true
    }

    if (!hasChanges) {
      this.editMode = false
      return
    }

    try {
      this.saving = true
      this.error = null
      const updated = await guidesService.update(this.guide.id, changes)
      this.guide = updated
      this.populateEditForm(updated)
      this.editMode = false
      // Reset URL
      window.history.replaceState({}, '', window.location.pathname)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save changes'
    } finally {
      this.saving = false
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
        <button class="btn btn-primary" @click=${this.enterEditMode}>Edit</button>
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
            <div class="field-value">${guide.stepIds.length}</div>
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

      <div class="field">
        <div class="field-label">Guide ID</div>
        <div class="field-value" style="font-family: monospace; font-size: 13px; color: var(--color-text-tertiary);">${guide.id}</div>
      </div>
    `
  }

  private renderEditMode() {
    return html`
      <div class="header">
        <h1>Edit Guide</h1>
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
            @change=${(e: Event) => { this.editGuideType = (e.target as HTMLSelectElement).value }}
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
          >×</button>
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
