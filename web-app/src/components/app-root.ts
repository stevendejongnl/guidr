import { html, LitElement, css, nothing } from 'lit'
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

    main.full-width {
      max-width: none;
      padding: 0;
    }

    #outlet {
      min-height: 400px;
    }

    .hamburger {
      display: none;
      background: none;
      border: none;
      color: var(--color-text-primary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 4px 8px;
      margin-left: auto;
      line-height: 1;
    }

    .hamburger:hover {
      color: var(--color-primary);
    }

    .mobile-menu {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.5rem 0 1rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }

    .mobile-menu a {
      padding: 0.75rem 0;
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .mobile-menu a:last-child {
      border-bottom: none;
    }

    .mobile-menu a:hover {
      color: var(--color-primary);
    }

    @media (max-width: 768px) {
      nav {
        padding: 0.75rem 1rem;
      }

      .nav-links {
        display: none;
      }

      .hamburger {
        display: block;
      }
    }
  `

  private router!: Router
  private boundCloseMenu = this.closeAdminMenu.bind(this)
  private boundHandlePopstate = () => { this.currentPath = window.location.pathname }

  @state()
  private showAdminMenu = false

  @state()
  private _mobileMenuOpen = false

  @state()
  private currentPath = window.location.pathname

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
      this.currentPath = '/guides'
      this.router.navigate('/guides')
    },
    register: async (email: string, password: string) => {
      await authService.register(email, password)
      this.updateAuthState()
      this.currentPath = '/guides'
      this.router.navigate('/guides')
    },
    logout: () => {
      authService.logout()
      this.updateAuthState()
      this.currentPath = '/login'
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
    window.addEventListener('popstate', this.boundHandlePopstate)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this.boundCloseMenu)
    window.removeEventListener('popstate', this.boundHandlePopstate)
  }

  private isLandingRoute(): boolean {
    return this.currentPath === '/'
  }

  firstUpdated(): void {
    const outlet = this.shadowRoot?.getElementById('outlet')
    if (!outlet) {
      throw new Error('Router outlet element not found')
    }
    this.router = new Router(outlet)
    this.router.start()
    this.currentPath = window.location.pathname

    if (this.authState.isAuthenticated) {
      authService.refreshProfile().then(() => this.updateAuthState()).catch(() => {})
    }
  }

  private closeAdminMenu(e: Event): void {
    const path = e.composedPath()
    if (this.showAdminMenu) {
      const dropdown = this.shadowRoot?.querySelector('.admin-dropdown')
      if (dropdown && !path.includes(dropdown)) {
        this.showAdminMenu = false
      }
    }
    if (this._mobileMenuOpen) {
      const nav = this.shadowRoot?.querySelector('nav')
      if (nav && !path.includes(nav)) {
        this._mobileMenuOpen = false
      }
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
    this.currentPath = path
    this.router.navigate(path)
  }

  private toggleMobileMenu(e: Event): void {
    e.stopPropagation()
    this._mobileMenuOpen = !this._mobileMenuOpen
  }

  private navigateMobile(e: Event): void {
    this._mobileMenuOpen = false
    this.navigate(e)
  }

  private handleMobileLogout(e: Event): void {
    this._mobileMenuOpen = false
    this.handleLogout(e)
  }

  render() {
    const showNav = !this.isLandingRoute() && this.authState.isAuthenticated
    return html`
      ${showNav ? html`
        <nav>
          <div class="nav-content">
            <h1 class="logo">Guidr</h1>
            <ul class="nav-links">
              <li><a href="/guides" @click=${this.navigate}>Guides</a></li>
              <li><a href="/guides/new" @click=${this.navigate}>New Guide</a></li>
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
                          ${this.authState.isBeta ? html`<a href="/admin/guides/generate" @click=${(e: Event) => this.navigateAdmin(e, '/admin/guides/generate')}>Generate Guide ✦</a>` : nothing}
                          <a href="/admin/users" @click=${(e: Event) => this.navigateAdmin(e, '/admin/users')}>Users</a>
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
            </ul>
            <button class="hamburger" @click=${this.toggleMobileMenu}>☰</button>
          </div>
          ${this._mobileMenuOpen ? html`
            <div class="mobile-menu">
              <a href="/guides" @click=${this.navigateMobile}>Guides</a>
              <a href="/guides/new" @click=${this.navigateMobile}>New Guide</a>
              ${this.authState.isAdmin ? html`
                <a href="/admin/guides" @click=${this.navigateMobile}>Admin - Guides</a>
                ${this.authState.isBeta ? html`<a href="/admin/guides/generate" @click=${this.navigateMobile}>Admin - Generate Guide ✦</a>` : nothing}
                <a href="/admin/users" @click=${this.navigateMobile}>Admin - Users</a>
                <a href="/admin/styleguide" @click=${this.navigateMobile}>Admin - Styleguide</a>
              ` : nothing}
              <a href="#" @click=${this.handleMobileLogout}>Logout (${this.authState.userEmail})</a>
            </div>
          ` : nothing}
        </nav>
      ` : ''}
      <main class=${showNav ? '' : 'full-width'}>
        <div id="outlet"></div>
      </main>
    `
  }

  private navigate(e: Event): void {
    e.preventDefault()
    const href = (e.target as HTMLAnchorElement).getAttribute('href')
    if (href) {
      this.currentPath = href
      this.router.navigate(href)
    }
  }

  private handleLogout(e: Event): void {
    e.preventDefault()
    this.authState.logout()
  }
}
