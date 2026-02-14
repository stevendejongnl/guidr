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
      align-items: center;
    }

    nav a {
      color: var(--color-text-primary);
      text-decoration: none;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--color-primary);
    }

    .admin-dropdown {
      position: relative;
    }

    .admin-toggle {
      background: none;
      border: none;
      color: var(--color-text-primary);
      cursor: pointer;
      font-size: inherit;
      font-family: inherit;
      padding: 0;
      transition: color 0.2s;
    }

    .admin-toggle:hover {
      color: var(--color-primary);
    }

    .admin-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 160px;
      z-index: 100;
      padding: 4px 0;
    }

    .admin-menu a {
      display: block;
      padding: 8px 16px;
      color: var(--color-text-primary);
      text-decoration: none;
      transition: background-color 0.15s;
    }

    .admin-menu a:hover {
      background-color: var(--color-background);
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
  private boundCloseMenu = this.closeAdminMenu.bind(this)

  @state()
  private showAdminMenu = false

  @provide({ context: authContext })
  @state()
  private authState: AuthContextValue = {
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isBeta: authService.isBeta(),
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
      isBeta: authService.isBeta(),
      userEmail: authService.getUserEmail(),
    }
  }

  connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this.boundCloseMenu)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this.boundCloseMenu)
  }

  firstUpdated(): void {
    const outlet = this.shadowRoot?.getElementById('outlet')
    if (!outlet) {
      throw new Error('Router outlet element not found')
    }
    this.router = new Router(outlet)
    this.router.start()
  }

  private closeAdminMenu(e: Event): void {
    if (!this.showAdminMenu) return
    const path = e.composedPath()
    const dropdown = this.shadowRoot?.querySelector('.admin-dropdown')
    if (dropdown && !path.includes(dropdown)) {
      this.showAdminMenu = false
    }
  }

  private toggleAdminMenu(e: Event): void {
    e.preventDefault()
    e.stopPropagation()
    this.showAdminMenu = !this.showAdminMenu
  }

  private navigateAdmin(e: Event, path: string): void {
    e.preventDefault()
    this.showAdminMenu = false
    this.router.navigate(path)
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
                    ? html`
                      <li class="admin-dropdown">
                        <button class="admin-toggle" @click=${this.toggleAdminMenu}>
                          Admin ▾
                        </button>
                        ${this.showAdminMenu
                          ? html`
                            <div class="admin-menu">
                              <a href="/admin/guides" @click=${(e: Event) => this.navigateAdmin(e, '/admin/guides')}>Guides</a>
                              <a href="/admin/styleguide" @click=${(e: Event) => this.navigateAdmin(e, '/admin/styleguide')}>Styleguide</a>
                            </div>
                          `
                          : ''}
                      </li>
                    `
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
