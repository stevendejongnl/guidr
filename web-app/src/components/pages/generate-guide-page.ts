import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { authContext, type AuthContextValue } from '../../contexts/auth-context.js'
import {
  generationService,
  type GeneratedGuide,
  type GeneratedStep,
} from '../../services/generation-service.js'

type InputMode = 'prompt' | 'url'
type PageState = 'input' | 'generating' | 'review' | 'saving' | 'saved'

@customElement('generate-guide-page')
export class GenerateGuidePage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  auth?: AuthContextValue

  @state() pageState: PageState = 'input'
  @state() inputMode: InputMode = 'prompt'
  @state() prompt = ''
  @state() url = ''
  @state() guideTypeHint = ''
  @state() error: string | null = null

  // Review state
  @state() guideTitle = ''
  @state() description = ''
  @state() guideType = 'general'
  @state() isPublic = false
  @state() steps: GeneratedStep[] = []
  @state() savedGuideId: string | null = null

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .container {
      max-width: 800px;
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

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--color-primary);
    }

    .subtitle {
      color: var(--color-text-secondary);
      margin: 0 0 24px 0;
      font-size: 15px;
    }

    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid var(--color-border);
    }

    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
    }

    .tab:hover {
      color: var(--color-text-primary);
    }

    .tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

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
      min-height: 100px;
      resize: vertical;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .btn {
      padding: 10px 20px;
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

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn-group {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }

    .error {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--color-danger);
      border-radius: 8px;
      padding: 1rem;
      color: var(--color-danger);
      margin-bottom: 16px;
    }

    .spinner {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }

    .spinner-text {
      margin-top: 12px;
      font-size: 15px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spinner-icon {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    .step-card {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
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

    .step-header .form-input {
      flex: 1;
    }

    .step-fields {
      display: grid;
      grid-template-columns: 1fr 120px;
      gap: 12px;
      margin-bottom: 8px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
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

    .success-card {
      text-align: center;
      padding: 2rem;
    }

    .success-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .success-card h2 {
      color: var(--color-primary);
      margin: 0 0 8px 0;
    }

    .success-card p {
      color: var(--color-text-secondary);
      margin: 0 0 20px 0;
    }

    .hint {
      font-size: 12px;
      color: var(--color-text-tertiary);
      margin-top: 4px;
    }
  `

  render() {
    return html`
      <div class="container">
        <a class="back-link" @click=${this.navigateBack}>← Back to Guides</a>
        <h1>Generate Guide with AI</h1>
        <p class="subtitle">Describe what you want or paste a URL, and AI will create a guide draft for you.</p>

        ${this.error ? html`<div class="error">${this.error}</div>` : nothing}

        ${this.pageState === 'input' ? this.renderInput() : nothing}
        ${this.pageState === 'generating' ? this.renderGenerating() : nothing}
        ${this.pageState === 'review' || this.pageState === 'saving'
          ? this.renderReview()
          : nothing}
        ${this.pageState === 'saved' ? this.renderSaved() : nothing}
      </div>
    `
  }

  private renderInput() {
    return html`
      <div class="card">
        <div class="tabs">
          <button
            class="tab ${this.inputMode === 'prompt' ? 'active' : ''}"
            @click=${() => { this.inputMode = 'prompt' }}
          >Text Prompt</button>
          <button
            class="tab ${this.inputMode === 'url' ? 'active' : ''}"
            @click=${() => { this.inputMode = 'url' }}
          >URL Import</button>
        </div>

        ${this.inputMode === 'prompt'
          ? html`
            <div class="form-group">
              <label class="form-label">What kind of guide do you want?</label>
              <textarea
                class="form-textarea"
                placeholder="e.g., A bread baking guide for beginners with sourdough..."
                .value=${this.prompt}
                @input=${(e: InputEvent) => { this.prompt = (e.target as HTMLTextAreaElement).value }}
              ></textarea>
            </div>
          `
          : html`
            <div class="form-group">
              <label class="form-label">URL to import from</label>
              <input
                class="form-input"
                type="url"
                placeholder="https://example.com/recipe-or-guide"
                .value=${this.url}
                @input=${(e: InputEvent) => { this.url = (e.target as HTMLInputElement).value }}
              />
              <div class="hint">Paste a URL to a recipe, tutorial, or guide. The AI will extract and structure it.</div>
            </div>
          `}

        <div class="form-group">
          <label class="form-label">Guide Type (optional)</label>
          <select
            class="form-select"
            .value=${this.guideTypeHint}
            @change=${(e: Event) => { this.guideTypeHint = (e.target as HTMLSelectElement).value }}
          >
            <option value="">Auto-detect</option>
            <option value="cooking" ?selected=${this.guideTypeHint === 'cooking'}>Cooking</option>
            <option value="workout" ?selected=${this.guideTypeHint === 'workout'}>Workout</option>
            <option value="general" ?selected=${this.guideTypeHint === 'general'}>General</option>
          </select>
        </div>

        <div class="btn-group">
          <button
            class="btn btn-primary"
            @click=${this.handleGenerate}
            ?disabled=${this.inputMode === 'prompt' ? !this.prompt.trim() : !this.url.trim()}
          >Generate Guide</button>
        </div>
      </div>
    `
  }

  private renderGenerating() {
    return html`
      <div class="card spinner">
        <div class="spinner-icon"></div>
        <div class="spinner-text">Generating your guide...</div>
      </div>
    `
  }

  private renderReview() {
    const saving = this.pageState === 'saving'
    return html`
      <div class="card">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input
            class="form-input"
            type="text"
            .value=${this.guideTitle}
            @input=${(e: InputEvent) => { this.guideTitle = (e.target as HTMLInputElement).value }}
            ?disabled=${saving}
          />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            class="form-textarea"
            .value=${this.description}
            @input=${(e: InputEvent) => { this.description = (e.target as HTMLTextAreaElement).value }}
            ?disabled=${saving}
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Guide Type</label>
          <select
            class="form-select"
            .value=${this.guideType}
            @change=${(e: Event) => { this.guideType = (e.target as HTMLSelectElement).value }}
            ?disabled=${saving}
          >
            <option value="cooking" ?selected=${this.guideType === 'cooking'}>Cooking</option>
            <option value="workout" ?selected=${this.guideType === 'workout'}>Workout</option>
            <option value="general" ?selected=${this.guideType === 'general'}>General</option>
          </select>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              .checked=${this.isPublic}
              @change=${(e: Event) => { this.isPublic = (e.target as HTMLInputElement).checked }}
              ?disabled=${saving}
            />
            Make this guide public
          </label>
        </div>
      </div>

      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: var(--color-primary);">Steps (${this.steps.length})</h2>

      ${this.steps.map((step, i) => this.renderStepCard(step, i, saving))}

      <button
        class="btn btn-secondary"
        @click=${this.addStep}
        ?disabled=${saving}
        style="margin-bottom: 20px;"
      >+ Add Step</button>

      <div class="btn-group">
        <button
          class="btn btn-primary"
          @click=${this.handleSave}
          ?disabled=${saving || !this.guideTitle.trim()}
        >${saving ? 'Saving...' : 'Save Guide'}</button>
        <button
          class="btn btn-secondary"
          @click=${this.backToInput}
          ?disabled=${saving}
        >Start Over</button>
      </div>
    `
  }

  private renderStepCard(step: GeneratedStep, index: number, disabled: boolean) {
    return html`
      <div class="step-card">
        <div class="step-header">
          <span class="step-number">${index + 1}</span>
          <input
            class="form-input"
            type="text"
            placeholder="Step title"
            .value=${step.title}
            @input=${(e: InputEvent) => {
              this.updateStep(index, 'title', (e.target as HTMLInputElement).value)
            }}
            ?disabled=${disabled}
          />
        </div>
        <div class="step-fields">
          <div class="form-group" style="margin-bottom: 0;">
            <input
              class="form-input"
              type="text"
              placeholder="Description (optional)"
              .value=${step.description ?? ''}
              @input=${(e: InputEvent) => {
                this.updateStep(index, 'description', (e.target as HTMLInputElement).value || null)
              }}
              ?disabled=${disabled}
            />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <input
              class="form-input"
              type="number"
              placeholder="Min"
              min="0"
              .value=${step.duration != null ? String(step.duration) : ''}
              @input=${(e: InputEvent) => {
                const val = (e.target as HTMLInputElement).value
                this.updateStep(index, 'duration', val ? Number(val) : null)
              }}
              ?disabled=${disabled}
            />
          </div>
        </div>
        <div class="step-actions">
          <button
            class="btn btn-danger btn-sm"
            @click=${() => this.removeStep(index)}
            ?disabled=${disabled}
          >Remove</button>
        </div>
      </div>
    `
  }

  private renderSaved() {
    return html`
      <div class="card success-card">
        <div class="success-icon">&#10003;</div>
        <h2>Guide Created!</h2>
        <p>Your guide has been saved with ${this.steps.length} steps.</p>
        <div class="btn-group" style="justify-content: center;">
          <button
            class="btn btn-primary"
            @click=${() => { if (this.savedGuideId) this.navigateToGuide(this.savedGuideId) }}
          >View Guide</button>
          <button
            class="btn btn-secondary"
            @click=${this.startNew}
          >Create Another</button>
        </div>
      </div>
    `
  }

  private async handleGenerate(): Promise<void> {
    this.error = null
    this.pageState = 'generating'

    try {
      let result: GeneratedGuide
      if (this.inputMode === 'prompt') {
        result = await generationService.generateFromPrompt({
          prompt: this.prompt,
          guideType: this.guideTypeHint || undefined,
        })
      } else {
        result = await generationService.generateFromUrl({
          url: this.url,
          guideType: this.guideTypeHint || undefined,
        })
      }

      this.guideTitle = result.title
      this.description = result.description ?? ''
      this.guideType = result.guideType
      this.steps = result.steps
      this.pageState = 'review'
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Generation failed'
      this.pageState = 'input'
    }
  }

  private async handleSave(): Promise<void> {
    this.error = null
    this.pageState = 'saving'

    try {
      const result = await generationService.createWithSteps({
        guideType: this.guideType,
        title: this.guideTitle,
        description: this.description || undefined,
        isPublic: this.isPublic,
        steps: this.steps.map((s, i) => ({
          order: i + 1,
          title: s.title,
          description: s.description,
          duration: s.duration != null ? s.duration * 60 : undefined,
        })),
      })

      this.savedGuideId = result.guide.id
      this.pageState = 'saved'
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to save guide'
      this.pageState = 'review'
    }
  }

  private updateStep(index: number, field: string, value: string | number | null): void {
    const updated = [...this.steps]
    updated[index] = { ...updated[index], [field]: value }
    this.steps = updated
  }

  private removeStep(index: number): void {
    this.steps = this.steps.filter((_, i) => i !== index)
  }

  private addStep(): void {
    this.steps = [
      ...this.steps,
      { order: this.steps.length + 1, title: '', description: null, duration: null },
    ]
  }

  private backToInput(): void {
    this.pageState = 'input'
    this.error = null
  }

  private startNew(): void {
    this.prompt = ''
    this.url = ''
    this.guideTypeHint = ''
    this.guideTitle = ''
    this.description = ''
    this.guideType = 'general'
    this.isPublic = false
    this.steps = []
    this.savedGuideId = null
    this.error = null
    this.pageState = 'input'
  }

  private navigateBack(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToGuide(id: string): void {
    window.history.pushState({}, '', `/guides/${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
