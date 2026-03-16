import { html, LitElement, css, nothing } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { authContext, type AuthContextValue } from '../../contexts/auth-context.js'
import { guidesService } from '../../services/guides-service.js'

type PageState = 'form' | 'saving'

interface IngredientRow { name: string; quantity: string; unit: string }
interface MuscleRow { name: string; focus: string }
interface EquipmentRow { name: string; weight: string }
interface NoteRow { key: string; value: string }

@customElement('new-guide-page')
export class NewGuidePage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  auth?: AuthContextValue

  @state() pageState: PageState = 'form'
  @state() title = ''
  @state() description = ''
  @state() guideType = 'general'
  @state() isPublic = false
  @state() language = 'en'
  @state() error: string | null = null
  @state() ingredients: IngredientRow[] = []
  @state() targetMuscles: MuscleRow[] = []
  @state() equipment: EquipmentRow[] = []
  @state() notes: NoteRow[] = []

  static styles = css`
    :host {
      display: block;
      padding: 32px;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .container {
      max-width: 640px;
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
      min-height: 80px;
      resize: vertical;
      font-family: inherit;
    }

    .form-input:focus,
    .form-textarea:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
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

    .error {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid var(--color-danger);
      border-radius: 8px;
      padding: 1rem;
      color: var(--color-danger);
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
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
      color: #1a1a2e;
      font-weight: 600;
    }

    .ai-link {
      margin-left: auto;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 13px;
      cursor: pointer;
      transition: color 0.2s;
    }

    .ai-link:hover {
      color: var(--color-primary);
    }

    .metadata-section {
      margin-top: 24px;
      border-top: 1px solid var(--color-border);
      padding-top: 16px;
    }

    .metadata-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metadata-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .metadata-row .form-input {
      flex: 1;
    }

    .btn-remove {
      padding: 6px 10px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--color-danger);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .btn-add {
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-add:hover, .btn-remove:hover {
      opacity: 0.8;
    }
  `

  render() {
    const saving = this.pageState === 'saving'
    return html`
      <div class="container">
        <a class="back-link" @click=${this.navigateBack}>&larr; Back to Guides</a>
        <h1>New Guide</h1>
        <p class="subtitle">Create a new guide manually.</p>

        ${this.error ? html`<div class="error">${this.error}</div>` : nothing}

        <div class="card">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input
              class="form-input"
              type="text"
              placeholder="My awesome guide"
              .value=${this.title}
              @input=${(e: InputEvent) => { this.title = (e.target as HTMLInputElement).value }}
              ?disabled=${saving}
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              class="form-textarea"
              placeholder="What is this guide about?"
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
              @change=${(e: Event) => { this.guideType = (e.target as HTMLSelectElement).value; this._resetMetadata() }}
              ?disabled=${saving}
            >
              <option value="general" ?selected=${this.guideType === 'general'}>General</option>
              <option value="cooking" ?selected=${this.guideType === 'cooking'}>Cooking</option>
              <option value="workout" ?selected=${this.guideType === 'workout'}>Workout</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Language</label>
            <select
              class="form-select"
              .value=${this.language}
              @change=${(e: Event) => { this.language = (e.target as HTMLSelectElement).value }}
              ?disabled=${saving}
            >
              <option value="en" ?selected=${this.language === 'en'}>English</option>
              <option value="nl" ?selected=${this.language === 'nl'}>Nederlands</option>
              <option value="de" ?selected=${this.language === 'de'}>Deutsch</option>
              <option value="fr" ?selected=${this.language === 'fr'}>Français</option>
              <option value="es" ?selected=${this.language === 'es'}>Español</option>
              <option value="it" ?selected=${this.language === 'it'}>Italiano</option>
              <option value="pt" ?selected=${this.language === 'pt'}>Português</option>
              <option value="ja" ?selected=${this.language === 'ja'}>日本語</option>
              <option value="ko" ?selected=${this.language === 'ko'}>한국어</option>
              <option value="zh" ?selected=${this.language === 'zh'}>中文</option>
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

          ${this._renderMetadataSection(saving)}

          <div class="form-actions">
            <button
              class="btn btn-primary"
              @click=${this.handleSave}
              ?disabled=${saving || !this.title.trim()}
            >${saving ? 'Saving...' : 'Create Guide'}</button>
            ${this.auth?.isBeta
              ? html`<a class="ai-link" @click=${this.navigateToGenerate}>&#10024; Generate with AI</a>`
              : nothing}
          </div>
        </div>
      </div>
    `
  }

  private _resetMetadata(): void {
    this.ingredients = []
    this.targetMuscles = []
    this.equipment = []
    this.notes = []
  }

  private _buildMetadata(): Record<string, unknown> | null {
    if (this.guideType === 'cooking' && this.ingredients.length > 0) {
      return { ingredients: this.ingredients }
    }
    if (this.guideType === 'workout' && (this.targetMuscles.length > 0 || this.equipment.length > 0)) {
      return { target_muscles: this.targetMuscles, equipment: this.equipment }
    }
    if (this.guideType === 'general' && this.notes.length > 0) {
      return { notes: this.notes }
    }
    return null
  }

  private _renderMetadataSection(saving: boolean) {
    if (this.guideType === 'cooking') {
      return html`
        <div class="metadata-section">
          <h3>Ingredients</h3>
          ${this.ingredients.map((ing, i) => html`
            <div class="metadata-row">
              <input class="form-input" placeholder="Name" .value=${ing.name}
                @input=${(e: InputEvent) => { this.ingredients = this.ingredients.map((r, j) => j === i ? { ...r, name: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <input class="form-input" placeholder="Qty" .value=${ing.quantity}
                @input=${(e: InputEvent) => { this.ingredients = this.ingredients.map((r, j) => j === i ? { ...r, quantity: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <input class="form-input" placeholder="Unit" .value=${ing.unit}
                @input=${(e: InputEvent) => { this.ingredients = this.ingredients.map((r, j) => j === i ? { ...r, unit: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <button class="btn-remove" @click=${() => { this.ingredients = this.ingredients.filter((_, j) => j !== i) }} ?disabled=${saving}>✕</button>
            </div>
          `)}
          <button class="btn-add" @click=${() => { this.ingredients = [...this.ingredients, { name: '', quantity: '', unit: '' }] }} ?disabled=${saving}>+ Add Ingredient</button>
        </div>
      `
    }
    if (this.guideType === 'workout') {
      return html`
        <div class="metadata-section">
          <h3>Target Muscles</h3>
          ${this.targetMuscles.map((m, i) => html`
            <div class="metadata-row">
              <input class="form-input" placeholder="Muscle name" .value=${m.name}
                @input=${(e: InputEvent) => { this.targetMuscles = this.targetMuscles.map((r, j) => j === i ? { ...r, name: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <input class="form-input" placeholder="Focus (primary/secondary)" .value=${m.focus}
                @input=${(e: InputEvent) => { this.targetMuscles = this.targetMuscles.map((r, j) => j === i ? { ...r, focus: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <button class="btn-remove" @click=${() => { this.targetMuscles = this.targetMuscles.filter((_, j) => j !== i) }} ?disabled=${saving}>✕</button>
            </div>
          `)}
          <button class="btn-add" @click=${() => { this.targetMuscles = [...this.targetMuscles, { name: '', focus: '' }] }} ?disabled=${saving}>+ Add Muscle</button>

          <h3 style="margin-top:16px;">Equipment</h3>
          ${this.equipment.map((eq, i) => html`
            <div class="metadata-row">
              <input class="form-input" placeholder="Equipment name" .value=${eq.name}
                @input=${(e: InputEvent) => { this.equipment = this.equipment.map((r, j) => j === i ? { ...r, name: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <input class="form-input" placeholder="Weight (optional)" .value=${eq.weight}
                @input=${(e: InputEvent) => { this.equipment = this.equipment.map((r, j) => j === i ? { ...r, weight: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <button class="btn-remove" @click=${() => { this.equipment = this.equipment.filter((_, j) => j !== i) }} ?disabled=${saving}>✕</button>
            </div>
          `)}
          <button class="btn-add" @click=${() => { this.equipment = [...this.equipment, { name: '', weight: '' }] }} ?disabled=${saving}>+ Add Equipment</button>
        </div>
      `
    }
    if (this.guideType === 'general') {
      return html`
        <div class="metadata-section">
          <h3>Notes</h3>
          ${this.notes.map((n, i) => html`
            <div class="metadata-row">
              <input class="form-input" placeholder="Key" .value=${n.key}
                @input=${(e: InputEvent) => { this.notes = this.notes.map((r, j) => j === i ? { ...r, key: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <input class="form-input" placeholder="Value" .value=${n.value}
                @input=${(e: InputEvent) => { this.notes = this.notes.map((r, j) => j === i ? { ...r, value: (e.target as HTMLInputElement).value } : r) }}
                ?disabled=${saving} />
              <button class="btn-remove" @click=${() => { this.notes = this.notes.filter((_, j) => j !== i) }} ?disabled=${saving}>✕</button>
            </div>
          `)}
          <button class="btn-add" @click=${() => { this.notes = [...this.notes, { key: '', value: '' }] }} ?disabled=${saving}>+ Add Note</button>
        </div>
      `
    }
    return nothing
  }

  private async handleSave(): Promise<void> {
    this.error = null
    this.pageState = 'saving'

    try {
      const guide = await guidesService.create({
        guideType: this.guideType,
        title: this.title.trim(),
        description: this.description.trim() || undefined,
        isPublic: this.isPublic,
        language: this.language,
        metadata: this._buildMetadata(),
      })

      window.history.pushState({}, '', `/guides/${guide.id}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create guide'
      this.pageState = 'form'
    }
  }

  private navigateBack(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  private navigateToGenerate(e: Event): void {
    e.preventDefault()
    window.history.pushState({}, '', '/guides/generate')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
