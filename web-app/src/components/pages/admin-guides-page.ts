import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { adminService, GuideWithUser } from '../../services/admin-service.js'
import { guidesService } from '../../services/guides-service.js'

type SortField = 'title' | 'guideType' | 'steps' | 'userEmail' | 'isPublic' | 'createdAt'
type SortDirection = 'asc' | 'desc'
type VisibilityFilter = 'all' | 'public' | 'private' | 'highlighted'

@customElement('admin-guides-page')
export class AdminGuidesPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private guides: GuideWithUser[] = []
  @state() private loading = true
  @state() private error: string | null = null
  @state() private searchQuery = ''
  @state() private sortField: SortField = 'createdAt'
  @state() private sortDirection: SortDirection = 'desc'
  @state() private typeFilter = 'all'
  @state() private visibilityFilter: VisibilityFilter = 'all'

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

    .id-cell {
      font-family: monospace;
      font-size: 12px;
      color: var(--color-text-tertiary);
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
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

    .badge-type {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--color-primary);
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

    .generate-btn {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid var(--color-primary);
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-primary);
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .generate-btn:hover {
      background-color: rgba(99, 102, 241, 0.2);
    }

    @media (max-width: 768px) {
      :host {
        padding: 16px;
      }

      th:nth-child(1),
      td:nth-child(1),
      th:nth-child(4),
      td:nth-child(4),
      th:nth-child(5),
      td:nth-child(5),
      th:nth-child(7),
      td:nth-child(7) {
        display: none;
      }
    }
  `

  connectedCallback(): void {
    super.connectedCallback()
    this.fetchGuides()
  }

  private async fetchGuides(): Promise<void> {
    try {
      this.loading = true
      this.error = null
      this.guides = await adminService.getAllGuidesWithUsers()
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch guides'
    } finally {
      this.loading = false
    }
  }

  private get filteredGuides(): GuideWithUser[] {
    let result = [...this.guides]

    // Type filter
    if (this.typeFilter !== 'all') {
      result = result.filter(g => g.guideType === this.typeFilter)
    }

    // Visibility filter
    if (this.visibilityFilter === 'public') {
      result = result.filter(g => g.isPublic)
    } else if (this.visibilityFilter === 'private') {
      result = result.filter(g => !g.isPublic)
    } else if (this.visibilityFilter === 'highlighted') {
      result = result.filter(g => g.isHighlighted)
    }

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase()
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.description?.toLowerCase().includes(q)) ||
        (g.userEmail?.toLowerCase().includes(q))
      )
    }

    // Sort
    result.sort((a, b) => {
      const dir = this.sortDirection === 'asc' ? 1 : -1
      switch (this.sortField) {
        case 'title':
          return dir * a.title.localeCompare(b.title)
        case 'guideType':
          return dir * a.guideType.localeCompare(b.guideType)
        case 'steps':
          return dir * (a.stepIds.length - b.stepIds.length)
        case 'userEmail':
          return dir * (a.userEmail ?? '').localeCompare(b.userEmail ?? '')
        case 'isPublic':
          return dir * (Number(a.isPublic) - Number(b.isPublic))
        case 'createdAt':
          return dir * a.createdAt.localeCompare(b.createdAt)
        default:
          return 0
      }
    })

    return result
  }

  private get guideTypes(): string[] {
    const types = new Set(this.guides.map(g => g.guideType))
    return [...types].sort()
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
          <h1>Admin - Guides</h1>
          <div class="loading">Loading guides...</div>
        </div>
      `
    }

    if (this.error) {
      return html`
        <div class="container">
          <h1>Admin - Guides</h1>
          <div class="error"><strong>Error:</strong> ${this.error}</div>
        </div>
      `
    }

    const filtered = this.filteredGuides

    return html`
      <div class="container">
        <div class="header">
          <h1>Admin - Guides</h1>
          <div style="display: flex; align-items: center; gap: 16px;">
            ${this.auth?.isBeta ? html`
              <button class="generate-btn" @click=${this.navigateToGenerate}>✦ Generate Guide</button>
            ` : nothing}
            <div class="stats">
              Showing ${filtered.length} of ${this.guides.length} guides
            </div>
          </div>
        </div>

        <div class="controls">
          <input
            class="search-input"
            type="text"
            placeholder="Search by title, description, or user email..."
            .value=${this.searchQuery}
            @input=${(e: InputEvent) => {
              this.searchQuery = (e.target as HTMLInputElement).value
            }}
          />
          <select
            class="filter-select"
            @change=${(e: Event) => {
              this.typeFilter = (e.target as HTMLSelectElement).value
            }}
          >
            <option value="all">All types</option>
            ${this.guideTypes.map(t => html`
              <option value=${t} ?selected=${this.typeFilter === t}>${t}</option>
            `)}
          </select>
          <select
            class="filter-select"
            @change=${(e: Event) => {
              this.visibilityFilter = (e.target as HTMLSelectElement).value as VisibilityFilter
            }}
          >
            <option value="all">All visibility</option>
            <option value="public" ?selected=${this.visibilityFilter === 'public'}>Public</option>
            <option value="private" ?selected=${this.visibilityFilter === 'private'}>Private</option>
            <option value="highlighted" ?selected=${this.visibilityFilter === 'highlighted'}>Highlighted</option>
          </select>
        </div>

        ${filtered.length === 0
          ? html`<div class="empty">No guides match your filters.</div>`
          : this.renderTable(filtered)
        }
      </div>
    `
  }

  private navigateToGenerate(): void {
    window.history.pushState({}, '', '/admin/guides/generate')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToGuide(id: string): void {
    window.history.pushState({}, '', `/admin/guides/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToEdit(id: string, e: Event): void {
    e.stopPropagation()
    window.history.pushState({}, '', `/admin/guides/${id}?edit=true`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private async deleteGuide(guide: GuideWithUser, e: Event): Promise<void> {
    e.stopPropagation()
    if (!window.confirm(`Delete guide "${guide.title}"? This cannot be undone.`)) return
    try {
      await guidesService.delete(guide.id)
      this.guides = this.guides.filter(g => g.id !== guide.id)
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete guide'
    }
  }

  private renderTable(guides: GuideWithUser[]) {
    return html`
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th @click=${() => this.toggleSort('title')}>
                Title ${this.sortIndicator('title')}
              </th>
              <th @click=${() => this.toggleSort('guideType')}>
                Type ${this.sortIndicator('guideType')}
              </th>
              <th @click=${() => this.toggleSort('steps')}>
                Steps ${this.sortIndicator('steps')}
              </th>
              <th @click=${() => this.toggleSort('userEmail')}>
                Created By ${this.sortIndicator('userEmail')}
              </th>
              <th @click=${() => this.toggleSort('isPublic')}>
                Visibility ${this.sortIndicator('isPublic')}
              </th>
              <th @click=${() => this.toggleSort('createdAt')}>
                Created ${this.sortIndicator('createdAt')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${guides.map(guide => html`
              <tr @click=${() => this.navigateToGuide(guide.id)}>
                <td class="id-cell" title=${guide.id}>${guide.id.slice(0, 8)}</td>
                <td>${guide.title}</td>
                <td><span class="badge badge-type">${guide.guideType}</span></td>
                <td>${guide.stepIds.length}</td>
                <td>${guide.userEmail ?? '—'}</td>
                <td>
                  ${guide.isPublic
                    ? html`<span class="badge badge-public">Public</span>`
                    : html`<span class="badge badge-private">Private</span>`}
                  ${guide.isHighlighted
                    ? html`<span class="badge badge-highlighted">Highlighted</span>`
                    : nothing}
                </td>
                <td class="date-cell">${this.formatDate(guide.createdAt)}</td>
                <td>
                  <button class="edit-btn" @click=${(e: Event) => this.navigateToEdit(guide.id, e)}>Edit</button>
                  <button class="delete-btn" @click=${(e: Event) => this.deleteGuide(guide, e)}>Delete</button>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }
}
