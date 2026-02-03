import { html, LitElement, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { provide } from '@lit/context'
import { Router } from '../router.js'
import { authContext, AuthContextValue } from '../contexts/auth-context'
import { authService } from '../services/auth-service'

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    nav {
      background: var(--color-surface);
      color: var(--color-text-primary);
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid var(--color-border);
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      margin: 0;
      color: var(--color-primary);
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    nav a {
      color: var(--color-text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--color-primary);
    }

    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background-color: var(--color-background);
    }

    #outlet {
      min-height: 400px;
    }
  `

  private router!: Router

  @provide({ context: authContext })
  @state()
  private authState: AuthContextValue = {
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    userEmail: authService.getUserEmail(),
    login: async (email: string, password: string) => {
      await authService.login(email, password)
      this.updateAuthState()
      this.router.navigate('/')
    },
    register: async (email: string, password: string) => {
      await authService.register(email, password)
      this.updateAuthState()
      this.router.navigate('/')
    },
    logout: () => {
      authService.logout()
      this.updateAuthState()
      this.router.navigate('/login')
    },
  }

  private updateAuthState(): void {
    this.authState = {
      ...this.authState,
      isAuthenticated: authService.isAuthenticated(),
      isAdmin: authService.isAdmin(),
      userEmail: authService.getUserEmail(),
    }
  }

  firstUpdated(): void {
    const outlet = this.shadowRoot?.getElementById('outlet')
    if (!outlet) {
      throw new Error('Router outlet element not found')
    }
    this.router = new Router(outlet)
    this.router.start()
  }

  render() {
    return html`
      <nav>
        <div class="nav-content">
          <h1 class="logo">Guidr</h1>
          <ul class="nav-links">
            ${this.authState.isAuthenticated
              ? html`
                  <li><a href="/" @click=${this.navigate}>Home</a></li>
                  <li><a href="/guides" @click=${this.navigate}>Guides</a></li>
                  ${this.authState.isAdmin
                    ? html`<li><a href="/admin/styleguide" @click=${this.navigate}>Admin</a></li>`
                    : ''}
                  <li>
                    <a href="#" @click=${this.handleLogout}>Logout (${this.authState.userEmail})</a>
                  </li>
                `
              : html`
                  <li><a href="/login" @click=${this.navigate}>Login</a></li>
                  <li><a href="/register" @click=${this.navigate}>Register</a></li>
                `}
          </ul>
        </div>
      </nav>
      <main>
        <div id="outlet"></div>
      </main>
    `
  }

  private navigate(e: Event): void {
    e.preventDefault()
    const href = (e.target as HTMLAnchorElement).getAttribute('href')
    if (href) {
      this.router.navigate(href)
    }
  }

  private handleLogout(e: Event): void {
    e.preventDefault()
    this.authState.logout()
  }
}
