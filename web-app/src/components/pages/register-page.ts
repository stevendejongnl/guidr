import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { consume } from '@lit/context'
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
    }

    .container {
      max-width: 400px;
      width: 100%;
      padding: 2rem;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h1 {
      margin: 0 0 1rem 0;
      font-size: 1.75rem;
      text-align: center;
      color: #2c3e50;
    }

    .description {
      text-align: center;
      color: #666;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
      font-family: inherit;
    }

    input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    input.error {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      margin: 1rem 0;
      padding: 0.75rem;
      background: #ffebee;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    button {
      width: 100%;
      padding: 0.75rem;
      margin-top: 1rem;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      font-family: inherit;
    }

    button:hover:not(:disabled) {
      background: #2980b9;
    }

    button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .link {
      text-align: center;
      margin-top: 1rem;
    }

    .link a {
      color: #3498db;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .link a:hover {
      text-decoration: underline;
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
        <p class="description">Sign up to get started</p>

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              class=${this.error ? 'error' : ''}
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
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class=${this.error ? 'error' : ''}
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
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              class=${this.error ? 'error' : ''}
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

          <button type="submit" ?disabled=${this.loading}>
            ${this.loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div class="link">
          <a href="/login">Already have an account? Login</a>
        </div>
      </div>
    `
  }
}
