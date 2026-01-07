import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .subtitle {
      font-size: 1.25rem;
      color: #666;
      margin-bottom: 2rem;
    }

    .cta {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .cta:hover {
      background: #2980b9;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .feature {
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .feature h3 {
      margin-top: 0;
      color: #2c3e50;
    }

    .feature p {
      color: #666;
      line-height: 1.6;
    }
  `

  render() {
    return html`
      <div class="hero">
        <h1>Welcome to Guidr</h1>
        <p class="subtitle">Execute step-by-step guides for recipes, workouts, and lab protocols</p>
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
