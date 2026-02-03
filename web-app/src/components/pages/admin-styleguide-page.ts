import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors, spacingWeb, borderRadius, typography } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'

@customElement('admin-styleguide-page')
export class AdminStyleguidePage extends LitElement {
  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  static styles = css`
    :host {
      display: block;
      padding: 32px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }

    .header-icon {
      font-size: 32px;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }

    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .token-card {
      border: 1px solid;
      border-radius: 8px;
      padding: 16px;
    }

    .token-label {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .color-swatch {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }

    .color-preview {
      width: 60px;
      height: 60px;
      border-radius: 4px;
      border: 1px solid;
      flex-shrink: 0;
    }

    .color-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .color-name {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .color-hex {
      font-size: 14px;
      font-family: monospace;
    }

    .spacing-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .spacing-label {
      font-size: 14px;
      min-width: 80px;
      font-weight: 500;
    }

    .spacing-bar {
      height: 24px;
      border-radius: 4px;
      flex-grow: 1;
    }

    .typography-item {
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 4px;
    }

    .typography-label {
      font-size: 14px;
      margin-bottom: 4px;
      font-family: monospace;
    }

    .typography-example {
      margin-bottom: 4px;
    }

    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .component-group {
      border: 1px solid;
      border-radius: 8px;
      padding: 16px;
    }

    .component-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid;
    }

    button {
      display: block;
      width: 100%;
      padding: 12px 16px;
      margin-bottom: 12px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    button:hover:not(:disabled) {
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      color: white;
    }

    .btn-secondary {
      color: white;
    }

    .btn-danger {
      color: white;
    }

    .btn-outline {
      background-color: transparent;
      border: 1px solid;
    }

    input {
      display: block;
      width: 100%;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid;
      border-radius: 8px;
      font-size: 16px;
      box-sizing: border-box;
    }

    input::placeholder {
      opacity: 0.5;
    }

    input.error {
      border-color: #f44336;
    }

    .card {
      border: 1px solid;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .card-text {
      font-size: 14px;
    }

    .feedback-box {
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 12px;
      border: 1px solid;
    }

    .feedback-success {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border-color: #4caf50;
    }

    .feedback-warning {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
      border-color: #ff9800;
    }

    .feedback-danger {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border-color: #f44336;
    }
  `

  render() {
    // Auth check (router should prevent this, but double-check)
    if (!this.auth?.isAdmin) {
      return html`<div style="padding: 2rem; text-align: center; color: #f44336;">Access denied. Admin only.</div>`
    }

    return html`
      <div
        class="container"
        style="background-color: ${colors.background}; color: ${colors.textPrimary};"
      >
        <!-- Header -->
        <div class="header">
          <div class="header-icon">◆◆◆</div>
          <h1>Design Tokens</h1>
        </div>

        <!-- Colors Section -->
        <div class="section">
          <h2 class="section-title">Colors</h2>

          <!-- Backgrounds -->
          <div class="token-label">Backgrounds</div>
          <div class="grid">
            ${this.renderColorToken('background', colors.background)}
            ${this.renderColorToken('surface', colors.surface)}
            ${this.renderColorToken('surfaceLight', colors.surfaceLight)}
          </div>

          <!-- Text -->
          <div class="token-label" style="margin-top: ${spacingWeb.lg}; color: ${colors.textSecondary};">Text</div>
          <div class="grid">
            ${this.renderColorToken('textPrimary', colors.textPrimary)}
            ${this.renderColorToken('textSecondary', colors.textSecondary)}
            ${this.renderColorToken('textMuted', colors.textMuted)}
          </div>

          <!-- Interactive -->
          <div class="token-label" style="margin-top: ${spacingWeb.lg}; color: ${colors.textSecondary};">Interactive</div>
          <div class="grid">
            ${this.renderColorToken('primary', colors.primary)}
            ${this.renderColorToken('primaryDisabled', colors.primaryDisabled)}
            ${this.renderColorToken('danger', colors.danger)}
            ${this.renderColorToken('success', colors.success)}
            ${this.renderColorToken('warning', colors.warning)}
          </div>

          <!-- Inputs & Borders -->
          <div class="token-label" style="margin-top: ${spacingWeb.lg}; color: ${colors.textSecondary};">Inputs & Borders</div>
          <div class="grid">
            ${this.renderColorToken('inputBackground', colors.inputBackground)}
            ${this.renderColorToken('border', colors.border)}
            ${this.renderColorToken('borderError', colors.borderError)}
          </div>

          <!-- Buttons -->
          <div class="token-label" style="margin-top: ${spacingWeb.lg}; color: ${colors.textSecondary};">Buttons</div>
          <div class="grid">
            ${this.renderColorToken('buttonSecondary', colors.buttonSecondary)}
          </div>
        </div>

        <!-- Spacing Section -->
        <div class="section">
          <h2 class="section-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Spacing</h2>
          <div class="token-card" style="background-color: ${colors.surface}; border-color: ${colors.border};">
            ${this.renderSpacingItem('xs', spacingWeb.xs)}
            ${this.renderSpacingItem('sm', spacingWeb.sm)}
            ${this.renderSpacingItem('md', spacingWeb.md)}
            ${this.renderSpacingItem('lg', spacingWeb.lg)}
            ${this.renderSpacingItem('xl', spacingWeb.xl)}
            ${this.renderSpacingItem('xxl', spacingWeb.xxl)}
            ${this.renderSpacingItem('xxxl', spacingWeb.xxxl)}
          </div>
        </div>

        <!-- Typography Section -->
        <div class="section">
          <h2 class="section-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Typography</h2>

          <div class="token-label" style="color: ${colors.textSecondary};">Font Sizes</div>
          <div class="token-card" style="background-color: ${colors.surface}; border-color: ${colors.border};">
            ${this.renderTypographyExample('sizeXs', 'Extra Small', '12px')}
            ${this.renderTypographyExample('sizeSm', 'Small', '14px')}
            ${this.renderTypographyExample('sizeMd', 'Medium', '16px')}
            ${this.renderTypographyExample('sizeLg', 'Large', '18px')}
            ${this.renderTypographyExample('sizeXl', 'Extra Large', '24px')}
            ${this.renderTypographyExample('sizeXxl', 'Extra Extra Large', '28px')}
            ${this.renderTypographyExample('sizeXxxl', 'Extra Extra Extra Large', '32px')}
          </div>

          <div class="token-label" style="margin-top: ${spacingWeb.lg}; color: ${colors.textSecondary};">Font Weights</div>
          <div class="token-card" style="background-color: ${colors.surface}; border-color: ${colors.border};">
            <div class="typography-item">
              <div class="typography-label">weightNormal (400)</div>
              <div class="typography-example" style="font-weight: ${typography.weightNormal};">Regular font weight</div>
            </div>
            <div class="typography-item">
              <div class="typography-label">weightMedium (500)</div>
              <div class="typography-example" style="font-weight: ${typography.weightMedium};">Medium font weight</div>
            </div>
            <div class="typography-item">
              <div class="typography-label">weightSemibold (600)</div>
              <div class="typography-example" style="font-weight: ${typography.weightSemibold};">Semibold font weight</div>
            </div>
            <div class="typography-item">
              <div class="typography-label">weightBold (700)</div>
              <div class="typography-example" style="font-weight: ${typography.weightBold};">Bold font weight</div>
            </div>
          </div>
        </div>

        <!-- Component Examples Section -->
        <div class="section">
          <h2 class="section-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Component Examples</h2>

          <div class="components-grid">
            <!-- Buttons -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Buttons</div>
              <button class="btn-primary" style="background-color: ${colors.primary};">Primary Button</button>
              <button class="btn-primary" style="background-color: ${colors.primaryDisabled};" disabled>Primary Disabled</button>
              <button class="btn-secondary" style="background-color: ${colors.buttonSecondary};">Secondary Button</button>
              <button class="btn-danger" style="background-color: ${colors.danger};">Danger Button</button>
              <button class="btn-outline" style="color: ${colors.textMuted}; border-color: ${colors.border};">Outline Button</button>
            </div>

            <!-- Inputs -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Inputs</div>
              <input type="text" placeholder="Default input" style="background-color: ${colors.inputBackground}; border-color: ${colors.border}; color: ${colors.textPrimary};" />
              <input type="text" placeholder="Focused input" value="Filled input" style="background-color: ${colors.inputBackground}; border-color: ${colors.border}; color: ${colors.textPrimary};" />
              <input type="text" class="error" placeholder="Error state" style="background-color: ${colors.inputBackground}; border-color: ${colors.borderError}; color: ${colors.textPrimary};" />
              <input type="password" placeholder="Password input" style="background-color: ${colors.inputBackground}; border-color: ${colors.border}; color: ${colors.textPrimary};" />
            </div>

            <!-- Cards -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Cards</div>
              <div class="card" style="background-color: ${colors.surfaceLight}; border-color: ${colors.border};">
                <div class="card-title" style="color: ${colors.textPrimary};">Card Title</div>
                <div class="card-text" style="color: ${colors.textSecondary};">This is a card component example showing surface styling.</div>
              </div>
              <div class="card" style="background-color: ${colors.surfaceLight}; border-color: ${colors.border};">
                <div class="card-title" style="color: ${colors.textPrimary};">Another Card</div>
                <div class="card-text" style="color: ${colors.textSecondary};">Cards are useful for grouping related content.</div>
              </div>
            </div>

            <!-- Feedback -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Feedback Messages</div>
              <div class="feedback-box feedback-success">✓ Success message</div>
              <div class="feedback-box feedback-warning">⚠ Warning message</div>
              <div class="feedback-box feedback-danger">✕ Error message</div>
            </div>

            <!-- Typography -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Typography</div>
              <h3 style="font-size: ${typography.sizeXl}; font-weight: ${typography.weightBold}; margin: 0 0 ${spacingWeb.sm} 0; color: ${colors.textPrimary};">Title XL</h3>
              <h4 style="font-size: ${typography.sizeLg}; font-weight: ${typography.weightSemibold}; margin: 0 0 ${spacingWeb.sm} 0; color: ${colors.textSecondary};">Subtitle</h4>
              <p style="font-size: ${typography.sizeMd}; margin: 0 0 ${spacingWeb.md} 0; color: ${colors.textMuted};">Description text</p>
            </div>

            <!-- Border Radius -->
            <div class="component-group" style="background-color: ${colors.surface}; border-color: ${colors.border};">
              <div class="component-title" style="color: ${colors.textPrimary}; border-color: ${colors.border};">Border Radius</div>
              <div style="background-color: ${colors.primary}; border-radius: ${borderRadius.sm}; padding: ${spacingWeb.md}; margin-bottom: ${spacingWeb.md}; text-align: center; color: ${colors.textPrimary};">
                <div style="font-size: ${typography.sizeSm};">sm (4px)</div>
              </div>
              <div style="background-color: ${colors.primary}; border-radius: ${borderRadius.md}; padding: ${spacingWeb.md}; margin-bottom: ${spacingWeb.md}; text-align: center; color: ${colors.textPrimary};">
                <div style="font-size: ${typography.sizeSm};">md (8px)</div>
              </div>
              <div style="background-color: ${colors.primary}; border-radius: ${borderRadius.lg}; padding: ${spacingWeb.md}; text-align: center; color: ${colors.textPrimary};">
                <div style="font-size: ${typography.sizeSm};">lg (12px)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private renderColorToken(name: string, hex: string) {
    return html`
      <div class="token-card" style="background-color: ${colors.surface}; border-color: ${colors.border};">
        <div class="color-swatch">
          <div class="color-preview" style="background-color: ${hex}; border-color: ${colors.border};"></div>
          <div class="color-info">
            <div class="color-name" style="color: ${colors.textPrimary};">${name}</div>
            <div class="color-hex" style="color: ${colors.textMuted};">${hex}</div>
          </div>
        </div>
      </div>
    `
  }

  private renderSpacingItem(label: string, value: string) {
    return html`
      <div class="spacing-item">
        <div class="spacing-label" style="color: ${colors.textSecondary};">${label}</div>
        <div class="spacing-bar" style="width: calc(${value} * 20); background-color: ${colors.primary};"></div>
        <div style="font-size: ${typography.sizeSm}; color: ${colors.textMuted}; min-width: 60px;">${value}</div>
      </div>
    `
  }

  private renderTypographyExample(tokenName: string, label: string, size: string) {
    const sizeValue = tokenName as keyof typeof typography
    return html`
      <div class="typography-item" style="background-color: ${colors.surfaceLight}; border-color: ${colors.border};">
        <div class="typography-label" style="color: ${colors.textMuted};">${tokenName} (${size})</div>
        <div class="typography-example" style="font-size: ${typography[sizeValue]}; color: ${colors.textPrimary};">
          ${label} - The quick brown fox jumps over the lazy dog
        </div>
      </div>
    `
  }
}
