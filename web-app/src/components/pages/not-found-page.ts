import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .container {
      text-align: center;
      padding: 4rem 2rem;
    }

    h1 {
      font-size: 4rem;
      color: var(--color-primary);
      margin: 0 0 1rem 0;
    }

    h2 {
      font-size: 1.5rem;
      color: var(--color-text-secondary);
      font-weight: normal;
      margin: 0 0 2rem 0;
    }

    p {
      color: var(--color-text-secondary);
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
      background: var(--color-primary);
      color: var(--color-background);
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    a:hover {
      opacity: 0.8;
    }

    a.secondary {
      background: var(--color-text-tertiary);
      color: var(--color-background);
    }

    a.secondary:hover {
      opacity: 0.8;
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
    const href = (e.target as HTMLAnchorElement).getAttribute('href')
    if (href) {
      window.history.pushState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }
}
