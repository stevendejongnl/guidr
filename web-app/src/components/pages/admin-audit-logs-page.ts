import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'
import { adminService } from '../../services/admin-service.js'
import type { AuditLog, AuditLogFilters } from '@models/audit-log.js'

const RESOURCE_TYPES = ['', 'guide', 'step', 'session', 'user']
const PAGE_SIZE = 50

@customElement('admin-audit-logs-page')
export class AdminAuditLogsPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state() private logs: AuditLog[] = []
  @state() private loading = true
  @state() private error: string | null = null
  @state() private offset = 0
  @state() private hasMore = false
  @state() private expandedId: string | null = null

  @state() private filterUserId = ''
  @state() private filterResourceType = ''
  @state() private filterResourceId = ''
  @state() private filterStartDate = ''
  @state() private filterEndDate = ''

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

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-input,
    .filter-select {
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 14px;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s;
    }

    .btn:hover {
      opacity: 0.85;
    }

    .btn-primary {
      background-color: var(--color-primary);
      color: #fff;
    }

    .btn-secondary {
      background-color: var(--color-surface);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead {
      background-color: var(--color-surface);
    }

    th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 600;
      color: var(--color-text-secondary);
      border-bottom: 2px solid var(--color-border);
      white-space: nowrap;
    }

    td {
      padding: 9px 14px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      vertical-align: top;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr.expandable:hover td {
      background-color: var(--color-surface);
      cursor: pointer;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-created { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-deleted { background: rgba(244,67,54,0.15); color: var(--color-danger); }
    .badge-updated { background: rgba(99,102,241,0.15); color: var(--color-primary); }
    .badge-logged-in { background: rgba(14,165,233,0.15); color: #0ea5e9; }
    .badge-registered { background: rgba(168,85,247,0.15); color: #a855f7; }
    .badge-default { background: rgba(156,163,175,0.15); color: var(--color-text-secondary); }

    .resource-link {
      color: var(--color-primary);
      text-decoration: none;
      cursor: pointer;
    }

    .resource-link:hover {
      text-decoration: underline;
    }

    .mono {
      font-family: monospace;
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .date-cell {
      white-space: nowrap;
      color: var(--color-text-secondary);
      font-size: 12px;
    }

    .details-row td {
      padding: 0;
      background: var(--color-surface);
    }

    .details-content {
      padding: 12px 14px;
      border-top: 1px solid var(--color-border);
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
    }

    .detail-value {
      font-size: 13px;
      color: var(--color-text-primary);
    }

    .json-block {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--color-text-primary);
      max-height: 200px;
      overflow-y: auto;
    }

    .pagination {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
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

    @media (max-width: 768px) {
      :host { padding: 16px; }

      .filters {
        grid-template-columns: 1fr;
      }

      th:nth-child(n+5),
      td:nth-child(n+5) {
        display: none;
      }
    }
  `

  connectedCallback(): void {
    super.connectedCallback()
    this.fetchLogs()
  }

  private buildFilters(): AuditLogFilters {
    const filters: AuditLogFilters = { limit: PAGE_SIZE, offset: this.offset }
    if (this.filterUserId.trim()) filters.userId = this.filterUserId.trim()
    if (this.filterResourceType) filters.resourceType = this.filterResourceType
    if (this.filterResourceId.trim()) filters.resourceId = this.filterResourceId.trim()
    if (this.filterStartDate) filters.startDate = this.filterStartDate
    if (this.filterEndDate) filters.endDate = this.filterEndDate
    return filters
  }

  private async fetchLogs(): Promise<void> {
    try {
      this.loading = true
      this.error = null
      const results = await adminService.getAuditLogs(this.buildFilters())
      this.logs = results
      this.hasMore = results.length === PAGE_SIZE
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch audit logs'
    } finally {
      this.loading = false
    }
  }

  private applyFilters(): void {
    this.offset = 0
    this.expandedId = null
    this.fetchLogs()
  }

  private clearFilters(): void {
    this.filterUserId = ''
    this.filterResourceType = ''
    this.filterResourceId = ''
    this.filterStartDate = ''
    this.filterEndDate = ''
    this.offset = 0
    this.expandedId = null
    this.fetchLogs()
  }

  private prevPage(): void {
    this.offset = Math.max(0, this.offset - PAGE_SIZE)
    this.expandedId = null
    this.fetchLogs()
  }

  private nextPage(): void {
    this.offset += PAGE_SIZE
    this.expandedId = null
    this.fetchLogs()
  }

  private toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  private actionBadge(action: string) {
    const cls = {
      created: 'badge-created',
      deleted: 'badge-deleted',
      updated: 'badge-updated',
      logged_in: 'badge-logged-in',
      registered: 'badge-registered',
    }[action] ?? 'badge-default'
    return html`<span class="badge ${cls}">${action}</span>`
  }

  private navigateToUser(userId: string, e: Event): void {
    e.stopPropagation()
    window.history.pushState({}, '', `/admin/users/${userId}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToGuide(guideId: string, e: Event): void {
    e.stopPropagation()
    window.history.pushState({}, '', `/admin/guides/${guideId}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private renderResourceCell(log: AuditLog) {
    if (!log.resourceType) return html`—`
    const label = `${log.resourceType}${log.resourceId ? `:${log.resourceId.slice(0, 8)}…` : ''}`
    if (log.resourceType === 'user' && log.resourceId) {
      const id = log.resourceId
      return html`<a class="resource-link" @click=${(e: Event) => this.navigateToUser(id, e)}>${label}</a>`
    }
    if (log.resourceType === 'guide' && log.resourceId) {
      const id = log.resourceId
      return html`<a class="resource-link" @click=${(e: Event) => this.navigateToGuide(id, e)}>${label}</a>`
    }
    return html`<span class="mono">${label}</span>`
  }

  render() {
    if (!this.auth?.isAdmin) {
      return html`<div style="padding: 2rem; text-align: center; color: ${colors.danger};">Access denied. Admin only.</div>`
    }

    return html`
      <div class="container">
        <div class="header">
          <h1>Admin - Audit Logs</h1>
          ${!this.loading
            ? html`<div class="stats">${this.logs.length} entries (page ${Math.floor(this.offset / PAGE_SIZE) + 1})</div>`
            : ''}
        </div>

        <div class="filters">
          <div class="filter-group">
            <label class="filter-label">User ID</label>
            <input
              class="filter-input"
              type="text"
              placeholder="Filter by user ID…"
              .value=${this.filterUserId}
              @input=${(e: InputEvent) => { this.filterUserId = (e.target as HTMLInputElement).value }}
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Resource Type</label>
            <select
              class="filter-select"
              @change=${(e: Event) => { this.filterResourceType = (e.target as HTMLSelectElement).value }}
            >
              <option value="">All types</option>
              ${RESOURCE_TYPES.filter(t => t).map(t => html`
                <option value="${t}" ?selected=${this.filterResourceType === t}>${t}</option>
              `)}
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Resource ID</label>
            <input
              class="filter-input"
              type="text"
              placeholder="Filter by resource ID…"
              .value=${this.filterResourceId}
              @input=${(e: InputEvent) => { this.filterResourceId = (e.target as HTMLInputElement).value }}
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Start Date</label>
            <input
              class="filter-input"
              type="datetime-local"
              .value=${this.filterStartDate}
              @input=${(e: InputEvent) => { this.filterStartDate = (e.target as HTMLInputElement).value }}
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">End Date</label>
            <input
              class="filter-input"
              type="datetime-local"
              .value=${this.filterEndDate}
              @input=${(e: InputEvent) => { this.filterEndDate = (e.target as HTMLInputElement).value }}
            />
          </div>
          <div class="filter-actions">
            <button class="btn btn-primary" @click=${this.applyFilters}>Apply</button>
            <button class="btn btn-secondary" @click=${this.clearFilters}>Clear</button>
          </div>
        </div>

        ${this.loading
          ? html`<div class="loading">Loading audit logs…</div>`
          : this.error
            ? html`<div class="error"><strong>Error:</strong> ${this.error}</div>`
            : this.logs.length === 0
              ? html`<div class="empty">No audit log entries found.</div>`
              : html`
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Action</th>
                          <th>Event Type</th>
                          <th>Resource</th>
                          <th>User ID</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.logs.map(log => [
                          html`
                            <tr class="expandable" @click=${() => this.toggleExpand(log.id)}>
                              <td class="date-cell">${this.formatDate(log.occurredAt)}</td>
                              <td>${this.actionBadge(log.action)}</td>
                              <td class="mono">${log.eventType}</td>
                              <td>${this.renderResourceCell(log)}</td>
                              <td>
                                ${log.userId
                                  ? html`<a class="resource-link" @click=${(e: Event) => { const uid = log.userId; if (uid) this.navigateToUser(uid, e) }}>${log.userId.slice(0, 8)}…</a>`
                                  : html`<span style="color: var(--color-text-tertiary)">—</span>`}
                              </td>
                              <td class="mono">${log.ipAddress ?? '—'}</td>
                            </tr>
                          `,
                          this.expandedId === log.id ? html`
                            <tr class="details-row">
                              <td colspan="6">
                                <div class="details-content">
                                  <div class="details-grid">
                                    <div class="detail-item">
                                      <span class="detail-label">ID</span>
                                      <span class="detail-value mono">${log.id}</span>
                                    </div>
                                    <div class="detail-item">
                                      <span class="detail-label">User Agent</span>
                                      <span class="detail-value mono">${log.userAgent ?? '—'}</span>
                                    </div>
                                    ${log.resourceId ? html`
                                      <div class="detail-item">
                                        <span class="detail-label">Resource ID</span>
                                        <span class="detail-value mono">${log.resourceId}</span>
                                      </div>
                                    ` : ''}
                                    ${log.userId ? html`
                                      <div class="detail-item">
                                        <span class="detail-label">Full User ID</span>
                                        <span class="detail-value mono">${log.userId}</span>
                                      </div>
                                    ` : ''}
                                  </div>
                                  ${Object.keys(log.details).length > 0 ? html`
                                    <div class="detail-label" style="margin-bottom: 6px">Details</div>
                                    <pre class="json-block">${JSON.stringify(log.details, null, 2)}</pre>
                                  ` : ''}
                                </div>
                              </td>
                            </tr>
                          ` : '',
                        ])}
                      </tbody>
                    </table>
                  </div>

                  <div class="pagination">
                    <button class="btn btn-secondary" ?disabled=${this.offset === 0} @click=${this.prevPage}>← Previous</button>
                    <span class="stats">Page ${Math.floor(this.offset / PAGE_SIZE) + 1}</span>
                    <button class="btn btn-secondary" ?disabled=${!this.hasMore} @click=${this.nextPage}>Next →</button>
                  </div>
                `
        }
      </div>
    `
  }
}
