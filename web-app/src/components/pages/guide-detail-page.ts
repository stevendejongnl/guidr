import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'

interface Guide {
  id: string
  name: string
  description: string
  category_id: string
  step_ids: string[]
}

@customElement('guide-detail-page')
export class GuideDetailPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: var(--color-primary);
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .back-link:hover {
      opacity: 0.8;
    }

    h1 {
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .description {
      color: var(--color-text-secondary);
      font-size: 1.125rem;
      line-height: 1.6;
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

    .steps-section {
      margin-top: 2rem;
    }

    .steps-section h2 {
      color: var(--color-primary);
      margin-bottom: 1rem;
    }

    .steps-placeholder {
      padding: 2rem;
      background: var(--color-card);
      border-radius: 8px;
      text-align: center;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
  `

  @state()
  private guide: Guide | null = null

  @state()
  private loading = true

  @state()
  private error: string | null = null

  connectedCallback(): void {
    super.connectedCallback()
    const id = this.getGuideIdFromPath()
    if (id) {
      this.fetchGuide(id)
    } else {
      this.error = 'Invalid guide ID'
      this.loading = false
    }
  }

  private getGuideIdFromPath(): string | null {
    const match = window.location.pathname.match(/\/guides\/([^/]+)/)
    return match ? match[1] : null
  }

  private async fetchGuide(id: string): Promise<void> {
    try {
      this.loading = true
      this.error = null

      const response = await fetch(`/api/v1/guides/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Guide not found')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.guide = await response.json()
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch guide'
    } finally {
      this.loading = false
    }
  }

  render() {
    if (this.loading) {
      return html`
        <a href="/guides" class="back-link">← Back to Guides</a>
        <div class="loading">Loading guide...</div>
      `
    }

    if (this.error) {
      return html`
        <a href="/guides" class="back-link">← Back to Guides</a>
        <div class="error">
          <strong>Error:</strong> ${this.error}
        </div>
      `
    }

    if (!this.guide) {
      return html`
        <a href="/guides" class="back-link">← Back to Guides</a>
        <div class="error">Guide not found</div>
      `
    }

    return html`
      <a href="/guides" class="back-link" @click=${this.navigateBack}>← Back to Guides</a>
      <h1>${this.guide.name}</h1>
      <p class="description">${this.guide.description}</p>

      <div class="steps-section">
        <h2>Steps (${this.guide.step_ids.length})</h2>
        <div class="steps-placeholder">
          <p>Step details will be displayed here.</p>
          <p>Full step implementation coming soon!</p>
        </div>
      </div>
    `
  }

  private navigateBack(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
