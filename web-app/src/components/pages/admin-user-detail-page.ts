import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { adminService, AdminUpdateUserRequest, UserDto } from '../../services/admin-service.js'

@customElement('admin-user-detail-page')
export class AdminUserDetailPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private user: UserDto | null = null
  @state() private loading = true
  @state() private saving = false
  @state() private error: string | null = null
  @state() private editMode = false

  // Edit form state
  @state() private editName = ''
  @state() private editIsAdmin = false
  @state() private editIsBeta = false
  @state() private editInterests = ''
  @state() private editLanguages = ''

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

    .badge-admin {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--color-primary);
    }

    .badge-user {
      background-color: rgba(156, 163, 175, 0.15);
      color: var(--color-text-secondary);
    }

    .badge-beta {
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

    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .form-hint {
      font-size: 12px;
      color: var(--color-text-tertiary);
      margin-top: 4px;
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

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }
    }
  `

  connectedCallback(): void {
    super.connectedCallback()
    const id = this.getUserIdFromPath()
    if (id) {
      this.fetchUser(id)
    } else {
      this.error = 'Invalid user ID'
      this.loading = false
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === 'true') {
      this.editMode = true
    }
  }

  private getUserIdFromPath(): string | null {
    const match = window.location.pathname.match(/\/admin\/users\/([^/]+)/)
    return match ? match[1] : null
  }

  private async fetchUser(id: string): Promise<void> {
    try {
      this.loading = true
      this.error = null
      const users = await adminService.getAllUsers()
      this.user = users.find(u => u.id === id) ?? null
      if (this.user) {
        this.populateEditForm(this.user)
      } else {
        this.error = 'User not found'
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch user'
    } finally {
      this.loading = false
    }
  }

  private populateEditForm(user: UserDto): void {
    this.editName = user.name ?? ''
    this.editIsAdmin = user.isAdmin
    this.editIsBeta = user.isBeta
    this.editInterests = user.interests?.join(', ') ?? ''
    this.editLanguages = user.preferredLanguages?.join(', ') ?? ''
  }

  private enterEditMode(): void {
    if (this.user) {
      this.populateEditForm(this.user)
    }
    this.editMode = true
    this.error = null
  }

  private cancelEdit(): void {
    this.editMode = false
    this.error = null
    window.history.replaceState({}, '', window.location.pathname)
  }

  private async saveChanges(): Promise<void> {
    if (!this.user) return

    const changes: AdminUpdateUserRequest = {}
    let hasChanges = false

    const newName = this.editName || null
    if (newName !== this.user.name) {
      changes.name = this.editName
      hasChanges = true
    }

    if (this.editIsAdmin !== this.user.isAdmin) {
      changes.role = this.editIsAdmin ? 'admin' : 'user'
      hasChanges = true
    }

    if (this.editIsBeta !== this.user.isBeta) {
      changes.isBeta = this.editIsBeta
      hasChanges = true
    }

    const newInterests = this.editInterests
      ? this.editInterests.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const currentInterests = this.user.interests ?? []
    if (JSON.stringify(newInterests) !== JSON.stringify(currentInterests)) {
      changes.interests = newInterests
      hasChanges = true
    }

    const newLanguages = this.editLanguages
      ? this.editLanguages.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const currentLanguages = this.user.preferredLanguages ?? []
    if (JSON.stringify(newLanguages) !== JSON.stringify(currentLanguages)) {
      changes.preferredLanguages = newLanguages
      hasChanges = true
    }

    if (!hasChanges) {
      this.editMode = false
      return
    }

    try {
      this.saving = true
      this.error = null
      const updated = await adminService.updateUser(this.user.id, changes)
      this.user = updated
      this.populateEditForm(updated)
      this.editMode = false
      window.history.replaceState({}, '', window.location.pathname)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save changes'
    } finally {
      this.saving = false
    }
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
    window.history.pushState({}, '', '/admin/users')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private async deleteUser(): Promise<void> {
    if (!this.user) return
    if (!window.confirm(`Delete user "${this.user.email}"? This cannot be undone.`)) return
    try {
      await adminService.deleteUser(this.user.id)
      window.history.pushState({}, '', '/admin/users')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete user'
    }
  }

  render() {
    if (!this.auth?.isAdmin) {
      return html`<div style="padding: 2rem; text-align: center; color: ${colors.danger};">Access denied. Admin only.</div>`
    }

    return html`
      <div class="container">
        <a class="back-link" @click=${this.navigateBack}>← Back to Users</a>

        ${this.loading
          ? html`<div class="loading">Loading user...</div>`
          : this.user
            ? this.editMode ? this.renderEditMode() : this.renderViewMode()
            : html`<div class="error">${this.error ?? 'User not found'}</div>`
        }
      </div>
    `
  }

  private renderViewMode() {
    if (!this.user) return nothing
    const user = this.user

    return html`
      <div class="header">
        <h1>${user.email}</h1>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" @click=${this.enterEditMode}>Edit</button>
          <button class="btn btn-danger" @click=${this.deleteUser}>Delete User</button>
        </div>
      </div>

      ${this.error ? html`<div class="error" style="margin-bottom: 16px;">${this.error}</div>` : nothing}

      <div class="card">
        <div class="field">
          <div class="field-label">Name</div>
          <div class="field-value">${user.name || '—'}</div>
        </div>

        <div class="meta-row">
          <div class="field">
            <div class="field-label">Role</div>
            <div class="field-value">
              ${user.isAdmin
                ? html`<span class="badge badge-admin">Admin</span>`
                : html`<span class="badge badge-user">User</span>`}
            </div>
          </div>

          <div class="field">
            <div class="field-label">Beta</div>
            <div class="field-value">
              ${user.isBeta
                ? html`<span class="badge badge-beta">Beta</span>`
                : html`<span class="field-value">No</span>`}
            </div>
          </div>
        </div>

        <div class="field">
          <div class="field-label">Interests</div>
          <div class="field-value">${user.interests?.length ? user.interests.join(', ') : '—'}</div>
        </div>

        <div class="field">
          <div class="field-label">Preferred Languages</div>
          <div class="field-value">${user.preferredLanguages?.length ? user.preferredLanguages.join(', ') : '—'}</div>
        </div>

        <div class="meta-row">
          <div class="field">
            <div class="field-label">Created</div>
            <div class="field-value">${this.formatDate(user.createdAt)}</div>
          </div>
          <div class="field">
            <div class="field-label">Updated</div>
            <div class="field-value">${this.formatDate(user.updatedAt)}</div>
          </div>
        </div>
      </div>

      <div class="field">
        <div class="field-label">User ID</div>
        <div class="field-value" style="font-family: monospace; font-size: 13px; color: var(--color-text-tertiary);">${user.id}</div>
      </div>
    `
  }

  private renderEditMode() {
    return html`
      <div class="header">
        <h1>Edit User</h1>
        <button class="btn btn-danger" @click=${this.deleteUser} ?disabled=${this.saving}>Delete User</button>
      </div>

      <div class="card">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input
            class="form-input"
            type="text"
            .value=${this.editName}
            @input=${(e: InputEvent) => { this.editName = (e.target as HTMLInputElement).value }}
          />
        </div>

        <div class="form-group">
          <label class="form-label">Role & Beta</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${this.editIsAdmin}
                @change=${(e: Event) => { this.editIsAdmin = (e.target as HTMLInputElement).checked }}
              />
              Admin
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${this.editIsBeta}
                @change=${(e: Event) => { this.editIsBeta = (e.target as HTMLInputElement).checked }}
              />
              Beta
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Interests</label>
          <input
            class="form-input"
            type="text"
            placeholder="cooking, sports, diy"
            .value=${this.editInterests}
            @input=${(e: InputEvent) => { this.editInterests = (e.target as HTMLInputElement).value }}
          />
          <div class="form-hint">Comma-separated list of interests</div>
        </div>

        <div class="form-group">
          <label class="form-label">Preferred Languages</label>
          <input
            class="form-input"
            type="text"
            placeholder="en, nl, de"
            .value=${this.editLanguages}
            @input=${(e: InputEvent) => { this.editLanguages = (e.target as HTMLInputElement).value }}
          />
          <div class="form-hint">Comma-separated ISO 639-1 language codes</div>
        </div>

        ${this.error ? html`<div class="save-error">${this.error}</div>` : nothing}

        <div class="btn-group">
          <button
            class="btn btn-primary"
            @click=${this.saveChanges}
            ?disabled=${this.saving}
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
}
