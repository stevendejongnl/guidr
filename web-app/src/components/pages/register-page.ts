import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
import { colors } from '@guidr/shared/tokens'
import { authContext, AuthContextValue } from '../../contexts/auth-context'

@customElement('register-page')
export class RegisterPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
      background-color: var(--color-background);
    }

    .container {
      max-width: 400px;
      width: 100%;
      padding: 2rem;
      border-radius: 8px;
      background: var(--color-card);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--color-border);
    }

    h1 {
      margin: 0 0 1rem 0;
      font-size: 1.75rem;
      text-align: center;
      color: var(--color-primary);
    }

    .description {
      text-align: center;
      margin-bottom: 2rem;
      font-size: 0.95rem;
      color: var(--color-text-secondary);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
      font-family: inherit;
      background-color: var(--color-input-background);
      color: var(--color-text-primary);
      transition: border-color 0.2s;
    }

    input::placeholder {
      color: var(--color-text-tertiary);
    }

    input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(154, 245, 207, 0.1);
    }

    input.error {
      border-color: var(--color-danger);
    }

    .error-message {
      color: var(--color-danger);
      margin: 1rem 0;
      padding: 0.75rem;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
      font-size: 0.875rem;
      border-left: 3px solid var(--color-danger);
    }

    button {
      width: 100%;
      padding: 0.75rem;
      margin-top: 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: inherit;
      background-color: var(--color-primary);
      color: var(--color-background);
    }

    button:hover:not(:disabled) {
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .link {
      text-align: center;
      margin-top: 1rem;
    }

    .link a {
      text-decoration: none;
      font-size: 0.9rem;
      color: var(--color-primary);
      transition: opacity 0.2s;
    }

    .link a:hover {
      opacity: 0.8;
    }
  `

  @consume({ context: authContext, subscribe: true })
  @state()
  private auth?: AuthContextValue

  @state()
  private email = ''

  @state()
  private password = ''

  @state()
  private confirmPassword = ''

  @state()
  private error = ''

  @state()
  private loading = false

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private async handleSubmit(e: Event) {
    e.preventDefault()

    if (!this.email.trim()) {
      this.error = 'Please enter your email'
      return
    }

    if (!this.validateEmail(this.email)) {
      this.error = 'Please enter a valid email address'
      return
    }

    if (!this.password.trim()) {
      this.error = 'Please enter a password'
      return
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters'
      return
    }

    if (!this.confirmPassword.trim()) {
      this.error = 'Please confirm your password'
      return
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match'
      return
    }

    this.loading = true
    this.error = ''

    try {
      await this.auth?.register(this.email, this.password)
      // Navigation is handled by app-root after registration
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Registration failed'
    } finally {
      this.loading = false
    }
  }

  render() {
    return html`
      <div class="container">
        <h1>Create Account</h1>
        <p class="description" style="color: ${colors.textSecondary};">Sign up to get started</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="email" style="color: ${colors.textPrimary};">Email</label>
            <input
              id="email"
              type="email"
              class=${this.error ? 'error' : ''}
              style="border-color: ${this.error ? colors.danger : '#ddd'}; color: ${colors.textPrimary}; background-color: white;"
              .value=${this.email}
              @input=${(e: Event) => {
                this.email = (e.target as HTMLInputElement).value
                this.error = ''
              }}
              ?disabled=${this.loading}
              placeholder="email@example.com"
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password" style="color: ${colors.textPrimary};">Password</label>
            <input
              id="password"
              type="password"
              class=${this.error ? 'error' : ''}
              style="border-color: ${this.error ? colors.danger : '#ddd'}; color: ${colors.textPrimary}; background-color: white;"
              .value=${this.password}
              @input=${(e: Event) => {
                this.password = (e.target as HTMLInputElement).value
                this.error = ''
              }}
              ?disabled=${this.loading}
              placeholder="Password (min 6 characters)"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword" style="color: ${colors.textPrimary};">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              class=${this.error ? 'error' : ''}
              style="border-color: ${this.error ? colors.danger : '#ddd'}; color: ${colors.textPrimary}; background-color: white;"
              .value=${this.confirmPassword}
              @input=${(e: Event) => {
                this.confirmPassword = (e.target as HTMLInputElement).value
                this.error = ''
              }}
              ?disabled=${this.loading}
              placeholder="Confirm password"
              autocomplete="new-password"
            />
          </div>

          ${this.error
            ? html`<div class="error-message">${this.error}</div>`
            : ''}

          <button type="submit" ?disabled=${this.loading} style="background-color: ${colors.primary}; color: white;">
            ${this.loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div class="link">
          <a href="/login" style="color: ${colors.primary};">Already have an account? Login</a>
        </div>
      </div>
    `
  }
}
