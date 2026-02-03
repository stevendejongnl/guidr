import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

interface Guide {
  id: string
  name: string
  description: string
  category_id: string
  step_ids: string[]
}

@customElement('guides-page')
export class GuidesPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    h1 {
      color: var(--color-primary);
      margin-bottom: 2rem;
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
      padding: 1.5rem;
      transition: box-shadow 0.2s;
      cursor: pointer;
    }

    .guide-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .guide-card h3 {
      margin: 0 0 0.5rem 0;
      color: var(--color-primary);
    }

    .guide-card p {
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .guide-meta {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--color-text-tertiary);
    }

    .empty {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
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

      const response = await fetch('/api/v1/guides')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.guides = await response.json()
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch guides'
    } finally {
      this.loading = false
    }
  }

  render() {
    if (this.loading) {
      return html`
        <h1>Guides</h1>
        <div class="loading">Loading guides...</div>
      `
    }

    if (this.error) {
      return html`
        <h1>Guides</h1>
        <div class="error">
          <strong>Error:</strong> ${this.error}
        </div>
      `
    }

    if (this.guides.length === 0) {
      return html`
        <h1>Guides</h1>
        <div class="empty">
          <p>No guides available yet.</p>
          <p>Create your first guide to get started!</p>
        </div>
      `
    }

    return html`
      <h1>Guides</h1>
      <div class="guides-grid">
        ${this.guides.map(guide => html`
          <div class="guide-card" @click=${() => this.navigateToGuide(guide.id)}>
            <h3>${guide.name}</h3>
            <p>${guide.description}</p>
            <div class="guide-meta">
              ${guide.step_ids.length} steps
            </div>
          </div>
        `)}
      </div>
    `
  }

  private navigateToGuide(id: string): void {
    window.history.pushState({}, '', `/guides/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
