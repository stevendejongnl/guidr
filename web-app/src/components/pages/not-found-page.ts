import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      text-align: center;
      padding: 4rem 2rem;
    }

    h1 {
      font-size: 4rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
    }

    h2 {
      font-size: 1.5rem;
      color: #666;
      font-weight: normal;
      margin: 0 0 2rem 0;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .links {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    a {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }

    a:hover {
      background: #2980b9;
    }

    a.secondary {
      background: #95a5a6;
    }

    a.secondary:hover {
      background: #7f8c8d;
    }
  `

  render() {
    return html`
      <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <div class="links">
          <a href="/" @click=${this.navigate}>Go Home</a>
          <a href="/guides" class="secondary" @click=${this.navigate}>Browse Guides</a>
        </div>
      </div>
    `
  }

  private navigate(e: Event): void {
    e.preventDefault()
    const href = (e.target as HTMLAnchorElement).getAttribute('href')!
    window.history.pushState({}, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
