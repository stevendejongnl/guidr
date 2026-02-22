import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { adminService, UserDto } from '../../services/admin-service.js'

type SortField = 'email' | 'name' | 'role' | 'isBeta' | 'createdAt'
type SortDirection = 'asc' | 'desc'
type RoleFilter = 'all' | 'admin' | 'user'
type BetaFilter = 'all' | 'yes' | 'no'

@customElement('admin-users-page')
export class AdminUsersPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private users: UserDto[] = []
  @state() private loading = true
  @state() private error: string | null = null
  @state() private searchQuery = ''
  @state() private sortField: SortField = 'createdAt'
  @state() private sortDirection: SortDirection = 'desc'
  @state() private roleFilter: RoleFilter = 'all'
  @state() private betaFilter: BetaFilter = 'all'

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
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

    .stats {
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
    }

    .search-input::placeholder {
      color: var(--color-text-tertiary);
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead {
      background-color: var(--color-surface);
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 2px solid var(--color-border);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }

    th:hover {
      color: var(--color-primary);
    }

    th .sort-indicator {
      margin-left: 4px;
      opacity: 0.4;
    }

    th .sort-indicator.active {
      opacity: 1;
      color: var(--color-primary);
    }

    td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background-color: var(--color-surface);
    }

    tbody tr {
      cursor: pointer;
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

    .badge-no-beta {
      background-color: rgba(156, 163, 175, 0.1);
      color: var(--color-text-tertiary);
    }

    .languages {
      font-size: 13px;
      color: var(--color-text-secondary);
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

    .empty {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }

    .date-cell {
      white-space: nowrap;
      color: var(--color-text-secondary);
      font-size: 13px;
    }

    .edit-btn {
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-surface);
      color: var(--color-primary);
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .edit-btn:hover {
      background-color: rgba(99, 102, 241, 0.1);
    }

    .delete-btn {
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--color-danger);
      border-radius: 4px;
      background: var(--color-surface);
      color: var(--color-danger);
      cursor: pointer;
      transition: background-color 0.15s;
      margin-left: 4px;
    }

    .delete-btn:hover {
      background-color: rgba(244, 67, 54, 0.1);
    }

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      th:nth-child(2),
      td:nth-child(2),
      th:nth-child(4),
      td:nth-child(4),
      th:nth-child(5),
      td:nth-child(5),
      th:nth-child(6),
      td:nth-child(6) {
        display: none;
      }
    }
  `

  connectedCallback(): void {
    super.connectedCallback()
    this.fetchUsers()
  }

  private async fetchUsers(): Promise<void> {
    try {
      this.loading = true
      this.error = null
      this.users = await adminService.getAllUsers()
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch users'
    } finally {
      this.loading = false
    }
  }

  private get filteredUsers(): UserDto[] {
    let result = [...this.users]

    // Role filter
    if (this.roleFilter === 'admin') {
      result = result.filter(u => u.isAdmin)
    } else if (this.roleFilter === 'user') {
      result = result.filter(u => !u.isAdmin)
    }

    // Beta filter
    if (this.betaFilter === 'yes') {
      result = result.filter(u => u.isBeta)
    } else if (this.betaFilter === 'no') {
      result = result.filter(u => !u.isBeta)
    }

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase()
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      const dir = this.sortDirection === 'asc' ? 1 : -1
      switch (this.sortField) {
        case 'email':
          return dir * a.email.localeCompare(b.email)
        case 'name':
          return dir * (a.name ?? '').localeCompare(b.name ?? '')
        case 'role':
          return dir * (Number(a.isAdmin) - Number(b.isAdmin))
        case 'isBeta':
          return dir * (Number(a.isBeta) - Number(b.isBeta))
        case 'createdAt':
          return dir * a.createdAt.localeCompare(b.createdAt)
        default:
          return 0
      }
    })

    return result
  }

  private toggleSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'asc'
    }
  }

  private sortIndicator(field: SortField) {
    const active = this.sortField === field
    const arrow = active
      ? (this.sortDirection === 'asc' ? '▲' : '▼')
      : '▲'
    return html`<span class="sort-indicator ${active ? 'active' : ''}">${arrow}</span>`
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  render() {
    if (!this.auth?.isAdmin) {
      return html`<div style="padding: 2rem; text-align: center; color: ${colors.danger};">Access denied. Admin only.</div>`
    }

    if (this.loading) {
      return html`
        <div class="container">
          <h1>Admin - Users</h1>
          <div class="loading">Loading users...</div>
        </div>
      `
    }

    if (this.error) {
      return html`
        <div class="container">
          <h1>Admin - Users</h1>
          <div class="error"><strong>Error:</strong> ${this.error}</div>
        </div>
      `
    }

    const filtered = this.filteredUsers

    return html`
      <div class="container">
        <div class="header">
          <h1>Admin - Users</h1>
          <div class="stats">
            Showing ${filtered.length} of ${this.users.length} users
          </div>
        </div>

        <div class="controls">
          <input
            class="search-input"
            type="text"
            placeholder="Search by email or name..."
            .value=${this.searchQuery}
            @input=${(e: InputEvent) => {
              this.searchQuery = (e.target as HTMLInputElement).value
            }}
          />
          <select
            class="filter-select"
            @change=${(e: Event) => {
              this.roleFilter = (e.target as HTMLSelectElement).value as RoleFilter
            }}
          >
            <option value="all">All roles</option>
            <option value="admin" ?selected=${this.roleFilter === 'admin'}>Admin</option>
            <option value="user" ?selected=${this.roleFilter === 'user'}>User</option>
          </select>
          <select
            class="filter-select"
            @change=${(e: Event) => {
              this.betaFilter = (e.target as HTMLSelectElement).value as BetaFilter
            }}
          >
            <option value="all">All beta</option>
            <option value="yes" ?selected=${this.betaFilter === 'yes'}>Beta</option>
            <option value="no" ?selected=${this.betaFilter === 'no'}>Not beta</option>
          </select>
        </div>

        ${filtered.length === 0
          ? html`<div class="empty">No users match your filters.</div>`
          : this.renderTable(filtered)
        }
      </div>
    `
  }

  private navigateToUser(id: string): void {
    window.history.pushState({}, '', `/admin/users/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToEdit(id: string, e: Event): void {
    e.stopPropagation()
    window.history.pushState({}, '', `/admin/users/${id}?edit=true`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private async deleteUser(user: UserDto, e: Event): Promise<void> {
    e.stopPropagation()
    if (!window.confirm(`Delete user "${user.email}"? This cannot be undone.`)) return
    try {
      await adminService.deleteUser(user.id)
      this.users = this.users.filter(u => u.id !== user.id)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete user'
    }
  }

  private renderTable(users: UserDto[]) {
    return html`
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th @click=${() => this.toggleSort('email')}>
                Email ${this.sortIndicator('email')}
              </th>
              <th @click=${() => this.toggleSort('name')}>
                Name ${this.sortIndicator('name')}
              </th>
              <th @click=${() => this.toggleSort('role')}>
                Role ${this.sortIndicator('role')}
              </th>
              <th @click=${() => this.toggleSort('isBeta')}>
                Beta ${this.sortIndicator('isBeta')}
              </th>
              <th>Languages</th>
              <th @click=${() => this.toggleSort('createdAt')}>
                Created ${this.sortIndicator('createdAt')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => html`
              <tr @click=${() => this.navigateToUser(user.id)}>
                <td>${user.email}</td>
                <td>${user.name ?? '—'}</td>
                <td>
                  ${user.isAdmin
                    ? html`<span class="badge badge-admin">Admin</span>`
                    : html`<span class="badge badge-user">User</span>`}
                </td>
                <td>
                  ${user.isBeta
                    ? html`<span class="badge badge-beta">Beta</span>`
                    : html`<span class="badge badge-no-beta">No</span>`}
                </td>
                <td class="languages">${user.preferredLanguages?.join(', ') ?? '—'}</td>
                <td class="date-cell">${this.formatDate(user.createdAt)}</td>
                <td>
                  <button class="edit-btn" @click=${(e: Event) => this.navigateToEdit(user.id, e)}>Edit</button>
                  <button class="delete-btn" @click=${(e: Event) => this.deleteUser(user, e)}>Delete</button>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }
}
