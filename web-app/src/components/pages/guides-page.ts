import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { apiClient } from '../../services/api-client.js'
import type { Guide } from '@models/guide.js'

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  cooking: { bg: 'rgba(76, 175, 80, 0.15)', text: '#66bb6a' },
  workout: { bg: 'rgba(255, 152, 0, 0.15)', text: '#ffa726' },
  general: { bg: 'rgba(66, 165, 245, 0.15)', text: '#42a5f5' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

@customElement('guides-page')
export class GuidesPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    h1 {
      color: var(--color-primary);
      margin: 0;
    }

    .btn-new {
      padding: 8px 16px;
      background-color: var(--color-primary);
      color: #1a1a2e;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      text-decoration: none;
    }

    .btn-new:hover {
      opacity: 0.85;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary);
    }

    .error {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--color-danger);
      border-radius: 4px;
      padding: 1rem;
      color: var(--color-danger);
    }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .guide-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.25rem;
      transition: box-shadow 0.2s, border-color 0.2s;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .guide-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-color: var(--color-primary);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0.5rem;
    }

    .type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.3px;
    }

    .guide-card h3 {
      margin: 0 0 0.5rem 0;
      color: var(--color-text-primary);
      font-size: 1.05rem;
      line-height: 1.3;
      transition: color 0.2s;
    }

    .guide-card:hover h3 {
      color: var(--color-primary);
    }

    .guide-description {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0 0 auto 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
    }

    .card-footer .separator {
      opacity: 0.5;
    }

    .empty {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }

    .empty p {
      margin: 0.5rem 0;
    }

    .empty .hint {
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
    }
  `

  @state()
  private guides: Guide[] = []

  @state()
  private loading = true

  @state()
  private error: string | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.fetchGuides()
  }

  private async fetchGuides(): Promise<void> {
    try {
      this.loading = true
      this.error = null
      this.guides = await apiClient.get<Guide[]>('/guides')
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch guides'
    } finally {
      this.loading = false
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="page-header">
          <h1>Guides</h1>
          <a class="btn-new" href="/guides/new" @click=${this.navigateToNew}>+ New Guide</a>
        </div>
        <div class="loading">Loading guides...</div>
      `
    }

    if (this.error) {
      return html`
        <div class="page-header">
          <h1>Guides</h1>
          <a class="btn-new" href="/guides/new" @click=${this.navigateToNew}>+ New Guide</a>
        </div>
        <div class="error">
          <strong>Error:</strong> ${this.error}
        </div>
      `
    }

    if (this.guides.length === 0) {
      return html`
        <div class="page-header">
          <h1>Guides</h1>
          <a class="btn-new" href="/guides/new" @click=${this.navigateToNew}>+ New Guide</a>
        </div>
        <div class="empty">
          <p>No guides yet</p>
          <p class="hint">Click <strong>+ New Guide</strong> above to create your first guide.</p>
        </div>
      `
    }

    return html`
      <div class="page-header">
        <h1>Guides</h1>
        <a class="btn-new" href="/guides/new" @click=${this.navigateToNew}>+ New Guide</a>
      </div>
      <div class="guides-grid">
        ${this.guides.map(guide => this.renderCard(guide))}
      </div>
    `
  }

  private renderCard(guide: Guide) {
    const typeColor = TYPE_COLORS[guide.guideType] ?? TYPE_COLORS['general']
    return html`
      <div class="guide-card" @click=${() => this.navigateToGuide(guide.id)}>
        <div class="card-header">
          <span
            class="type-badge"
            style="background:${typeColor.bg}; color:${typeColor.text};"
          >${guide.guideType}</span>
          ${guide.language && guide.language !== 'en'
            ? html`<span class="type-badge" style="background:rgba(156,39,176,0.15); color:#ba68c8;">${guide.language}</span>`
            : nothing}
        </div>
        <h3>${guide.title}</h3>
        ${guide.description
          ? html`<p class="guide-description">${guide.description}</p>`
          : nothing}
        <div class="card-footer">
          <span>${guide.stepIds.length} step${guide.stepIds.length !== 1 ? 's' : ''}</span>
          <span class="separator">&middot;</span>
          <span>${relativeTime(guide.createdAt)}</span>
        </div>
      </div>
    `
  }

  private navigateToGuide(id: string): void {
    window.history.pushState({}, '', `/guides/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToNew(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides/new')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
