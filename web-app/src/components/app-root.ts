import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'
import { Router } from '../router.js'

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    nav {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    nav a {
      color: white;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    nav a:hover {
      opacity: 0.8;
    }

    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    #outlet {
      min-height: 400px;
    }
  `

  private router!: Router

  firstUpdated(): void {
    const outlet = this.shadowRoot!.getElementById('outlet')!
    this.router = new Router(outlet)
    this.router.start()
  }

  render() {
    return html`
      <nav>
        <div class="nav-content">
          <h1 class="logo">Guidr</h1>
          <ul class="nav-links">
            <li><a href="/" @click=${this.navigate}>Home</a></li>
            <li><a href="/guides" @click=${this.navigate}>Guides</a></li>
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
    const href = (e.target as HTMLAnchorElement).getAttribute('href')!
    this.router.navigate(href)
  }
}
