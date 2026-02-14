import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { authContext, type AuthContextValue } from '../../contexts/auth-context.js'
import { apiClient } from '../../services/api-client.js'
import { guidesService } from '../../services/guides-service.js'
import type { Guide } from '@models/guide.js'

@customElement('guide-detail-page')
export class GuideDetailPage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  auth?: AuthContextValue
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

    .copy-section {
      margin-top: 2rem;
      background: var(--color-card);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid var(--color-border);
    }

    .copy-section h2 {
      color: var(--color-primary);
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
    }

    .copy-form {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .copy-form .form-group {
      margin: 0;
    }

    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 0.375rem;
    }

    .form-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 0.875rem;
      background-color: var(--color-card);
      color: var(--color-text-primary);
    }

    .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
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

    .btn-outline {
      background-color: var(--color-card);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
    }

    .copy-error {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--color-danger);
      border-radius: 4px;
      color: var(--color-danger);
      font-size: 0.875rem;
    }

    .same-language-warning {
      margin-top: 0.5rem;
      color: var(--color-text-secondary);
      font-size: 0.8125rem;
    }
  `

  @state()
  private guide: Guide | null = null

  @state()
  private loading = true

  @state()
  private error: string | null = null

  @state()
  private copyLanguage = 'en'

  @state()
  private copyLoading = false

  @state()
  private copyError: string | null = null

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
      this.guide = await apiClient.get<Guide>(`/guides/${id}`)
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

    const isSameLanguage = this.copyLanguage === (this.guide.language ?? 'en')

    return html`
      <a href="/guides" class="back-link" @click=${this.navigateBack}>← Back to Guides</a>
      <h1>${this.guide.title}</h1>
      <p class="description">${this.guide.description}</p>

      <div class="steps-section">
        <h2>Steps (${this.guide.stepIds.length})</h2>
        <div class="steps-placeholder">
          <p>Step details will be displayed here.</p>
          <p>Full step implementation coming soon!</p>
        </div>
      </div>

      <div class="copy-section">
        <h2>Copy to Language</h2>
        <div class="copy-form">
          <div class="form-group">
            <label class="form-label">Target Language</label>
            <select
              class="form-select"
              .value=${this.copyLanguage}
              @change=${(e: Event) => { this.copyLanguage = (e.target as HTMLSelectElement).value }}
              ?disabled=${this.copyLoading}
            >
              <option value="en" ?selected=${this.copyLanguage === 'en'}>English</option>
              <option value="nl" ?selected=${this.copyLanguage === 'nl'}>Nederlands</option>
              <option value="de" ?selected=${this.copyLanguage === 'de'}>Deutsch</option>
              <option value="fr" ?selected=${this.copyLanguage === 'fr'}>Français</option>
              <option value="es" ?selected=${this.copyLanguage === 'es'}>Español</option>
              <option value="it" ?selected=${this.copyLanguage === 'it'}>Italiano</option>
              <option value="pt" ?selected=${this.copyLanguage === 'pt'}>Português</option>
              <option value="ja" ?selected=${this.copyLanguage === 'ja'}>日本語</option>
              <option value="ko" ?selected=${this.copyLanguage === 'ko'}>한국어</option>
              <option value="zh" ?selected=${this.copyLanguage === 'zh'}>中文</option>
            </select>
          </div>
          <button
            class="btn btn-primary"
            @click=${this.handleCopy}
            ?disabled=${isSameLanguage || this.copyLoading}
          >${this.copyLoading ? 'Copying...' : 'Copy'}</button>
          ${this.auth?.isBeta
            ? html`
              <button
                class="btn btn-outline"
                @click=${this.handleTranslate}
                ?disabled=${isSameLanguage || this.copyLoading}
              >${this.copyLoading ? 'Translating...' : 'Translate with AI'}</button>
            `
            : nothing}
        </div>
        ${isSameLanguage
          ? html`<div class="same-language-warning">Select a different language than the source guide.</div>`
          : nothing}
        ${this.copyError
          ? html`<div class="copy-error">${this.copyError}</div>`
          : nothing}
      </div>
    `
  }

  private async handleCopy(): Promise<void> {
    if (!this.guide) return
    this.copyLoading = true
    this.copyError = null
    try {
      const result = await guidesService.copyToLanguage(this.guide.id, this.copyLanguage)
      this.navigateToGuide(result.guide.id)
    } catch (err) {
      this.copyError = err instanceof Error ? err.message : 'Failed to copy guide'
    } finally {
      this.copyLoading = false
    }
  }

  private async handleTranslate(): Promise<void> {
    if (!this.guide) return
    this.copyLoading = true
    this.copyError = null
    try {
      const result = await guidesService.translateToLanguage(this.guide.id, this.copyLanguage)
      this.navigateToGuide(result.guide.id)
    } catch (err) {
      this.copyError = err instanceof Error ? err.message : 'Failed to translate guide'
    } finally {
      this.copyLoading = false
    }
  }

  private navigateToGuide(id: string): void {
    window.history.pushState({}, '', `/guides/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateBack(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
