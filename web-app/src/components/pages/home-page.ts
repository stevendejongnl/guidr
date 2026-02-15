import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    .subtitle {
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      margin-bottom: 2rem;
    }

    .cta {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: var(--color-primary);
      color: var(--color-background);
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    .cta:hover {
      opacity: 0.8;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .feature {
      padding: 1.5rem;
      background: var(--color-card);
      border-radius: 8px;
      border: 1px solid var(--color-border);
    }

    .feature h3 {
      margin-top: 0;
      color: var(--color-primary);
    }

    .feature p {
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
  `

  render() {
    return html`
      <div class="hero">
        <h1>Welcome to Guidr</h1>
        <p class="subtitle">Execute step-by-step guides for cooking, workouts, and more</p>
        <a href="/guides" class="cta">Browse Guides</a>
      </div>

      <div class="features">
        <div class="feature">
          <h3>Step-by-Step Execution</h3>
          <p>Follow guides with precise timing and detailed instructions for each step.</p>
        </div>
        <div class="feature">
          <h3>Session Management</h3>
          <p>Start, pause, resume, and track your progress through any guide.</p>
        </div>
        <div class="feature">
          <h3>Organized Categories</h3>
          <p>Browse guides organized by categories like recipes, workouts, and protocols.</p>
        </div>
      </div>
    `
  }
}
