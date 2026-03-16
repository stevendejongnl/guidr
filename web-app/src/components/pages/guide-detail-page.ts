import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { authContext, type AuthContextValue } from '../../contexts/auth-context.js'
import { apiClient } from '../../services/api-client.js'
import { guidesService } from '../../services/guides-service.js'
import { stepsService } from '../../services/steps-service.js'
import { formatDuration } from '../../utils/format-duration.js'
import type { Guide } from '@models/guide.js'
import type { Step } from '@models/step.js'

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

    .step-card {
      background: var(--color-card);
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
      background: var(--color-card);
      border-radius: 8px;
      text-align: center;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .metadata-section {
      margin-top: 2rem;
    }

    .metadata-section h2 {
      color: var(--color-primary);
      margin-bottom: 1rem;
    }

    .metadata-card {
      background: var(--color-card);
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

    .metadata-table tr:last-child td,
    .metadata-table tr:last-child th {
      border-bottom: none;
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
  private steps: Step[] = []

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
      const [guide, steps] = await Promise.all([
        apiClient.get<Guide>(`/guides/${id}`),
        stepsService.getByGuideId(id),
      ])
      this.guide = guide
      this.steps = steps.sort((a, b) => a.order - b.order)
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
      ${this.guide.totalDuration
        ? html`<p class="description" style="font-size:0.95rem; color:var(--color-text-tertiary); margin-bottom:0.5rem;">
            ⏱ Total time: ${formatDuration(this.guide.totalDuration)}
          </p>`
        : nothing}
      <p class="description">${this.guide.description}</p>

      ${this.renderSteps()}
      ${this.renderMetadata()}

      ${this.auth?.isBeta
        ? html`
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
              <button
                class="btn btn-outline"
                @click=${this.handleTranslate}
                ?disabled=${isSameLanguage || this.copyLoading}
              >${this.copyLoading ? 'Translating...' : 'Translate with AI'}</button>
            </div>
            ${isSameLanguage
              ? html`<div class="same-language-warning">Select a different language than the source guide.</div>`
              : nothing}
            ${this.copyError
              ? html`<div class="copy-error">${this.copyError}</div>`
              : nothing}
          </div>
        `
        : nothing}
    `
  }

  private renderSteps() {
    return html`
      <div class="steps-section">
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

  private renderMetadata() {
    if (!this.guide?.metadata) return nothing
    const metadata = this.guide.metadata
    const guideType = this.guide.guideType

    if (guideType === 'cooking') {
      const ingredients = metadata['ingredients'] as Array<Record<string, string>> | undefined
      if (!ingredients?.length) return nothing
      return html`
        <div class="metadata-section">
          <h2>Ingredients</h2>
          <div class="metadata-card">
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
        </div>
      `
    }

    if (guideType === 'workout') {
      const muscles = metadata['targetMuscles'] as Array<Record<string, string>> | undefined
      const equipment = metadata['equipment'] as Array<Record<string, string>> | undefined
      if (!muscles?.length && !equipment?.length) return nothing
      return html`
        <div class="metadata-section">
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
      const notes = metadata['notes'] as Array<Record<string, string>> | undefined
      if (!notes?.length) return nothing
      return html`
        <div class="metadata-section">
          <h2>Notes</h2>
          <div class="metadata-card">
            <table class="metadata-table">
              <thead><tr><th>Key</th><th>Value</th></tr></thead>
              <tbody>
                ${notes.map(n => html`
                  <tr><td>${n['key'] ?? ''}</td><td>${n['value'] ?? ''}</td></tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `
    }

    return nothing
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
