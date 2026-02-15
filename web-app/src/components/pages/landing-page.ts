import { html, LitElement, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('landing-page')
export class LandingPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--color-background);
      color: var(--color-text-primary);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* ── Fixed Nav ── */
    .landing-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: rgba(11, 15, 20, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
    }

    .landing-nav .logo {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: -0.5px;
    }

    .landing-nav .nav-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .btn-ghost {
      padding: 0.5rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: transparent;
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: border-color 0.2s, color 0.2s;
      cursor: pointer;
    }

    .btn-ghost:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .btn-filled {
      padding: 0.5rem 1.25rem;
      border: 1px solid var(--color-primary);
      border-radius: 6px;
      background: var(--color-primary);
      color: var(--color-background);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      transition: opacity 0.2s;
      cursor: pointer;
    }

    .btn-filled:hover {
      opacity: 0.85;
    }

    /* ── Hero ── */
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 8rem 2rem 4rem;
      overflow: hidden;
    }

    .hero-grid-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(154, 245, 207, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(154, 245, 207, 0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    .hero-glow {
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 400px;
      background: radial-gradient(ellipse, rgba(154, 245, 207, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 1rem;
      border: 1px solid rgba(154, 245, 207, 0.3);
      border-radius: 999px;
      background: rgba(154, 245, 207, 0.07);
      color: var(--color-primary);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
      animation: badge-pulse 3s ease-in-out infinite;
    }

    @keyframes badge-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -1px;
      margin: 0 0 1.25rem;
      color: var(--color-text-primary);
      max-width: 800px;
    }

    .hero h1 span {
      color: var(--color-primary);
    }

    .hero-sub {
      font-size: clamp(1rem, 2vw, 1.25rem);
      color: var(--color-text-secondary);
      max-width: 560px;
      line-height: 1.6;
      margin: 0 0 2.5rem;
    }

    .hero-cta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 3rem;
    }

    .hero-cta .btn-filled {
      padding: 0.85rem 2rem;
      font-size: 1rem;
      border-radius: 8px;
    }

    .hero-cta .btn-ghost {
      padding: 0.85rem 2rem;
      font-size: 1rem;
      border-radius: 8px;
    }

    .app-badges {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .app-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface);
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      cursor: default;
    }

    /* ── Stats Row ── */
    .stats {
      display: flex;
      justify-content: center;
      gap: 0;
      flex-wrap: wrap;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
    }

    .stat-item {
      flex: 1;
      min-width: 160px;
      padding: 2rem 1rem;
      text-align: center;
      border-right: 1px solid var(--color-border);
    }

    .stat-item:last-child {
      border-right: none;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    /* ── Sections ── */
    section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 5rem 2rem;
    }

    .section-tag {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0 0 1rem;
    }

    .section-sub {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      max-width: 560px;
      line-height: 1.6;
      margin: 0 0 3rem;
    }

    /* ── Guide Type Cards ── */
    .guide-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .guide-card {
      padding: 2rem;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      border-top: 3px solid var(--card-accent, var(--color-primary));
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .guide-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .guide-card .card-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .guide-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: var(--card-accent, var(--color-primary));
    }

    .guide-card p {
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    /* ── Feature Grid ── */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .feature-tile {
      padding: 1.75rem;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      transition: border-color 0.2s;
    }

    .feature-tile:hover {
      border-color: var(--color-primary-muted);
    }

    .feature-tile .tile-icon {
      font-size: 1.75rem;
      margin-bottom: 0.75rem;
    }

    .feature-tile h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: var(--color-text-primary);
    }

    .feature-tile p {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    /* ── How It Works ── */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-width: 600px;
    }

    .step-item {
      display: flex;
      gap: 1.5rem;
      position: relative;
    }

    .step-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 19px;
      top: 48px;
      bottom: -1.5rem;
      width: 2px;
      background: var(--color-border);
    }

    .step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-elevated);
      border: 2px solid var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--color-primary);
      font-size: 0.9rem;
    }

    .step-content {
      padding-bottom: 2.5rem;
    }

    .step-content h4 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0.5rem 0 0.4rem;
    }

    .step-content p {
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }

    /* ── Mobile App CTA ── */
    .mobile-cta {
      text-align: center;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .mobile-cta .phone-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }

    .mobile-cta h2 {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 700;
      margin: 0 0 1rem;
    }

    .mobile-cta p {
      color: var(--color-text-secondary);
      max-width: 480px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    .platform-pills {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .platform-pill {
      padding: 0.6rem 1.5rem;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: var(--color-card);
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    /* ── Open Source ── */
    .oss-callout {
      text-align: center;
      padding: 3.5rem 2rem;
      background: linear-gradient(135deg, rgba(154, 245, 207, 0.05), transparent);
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .oss-callout h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
    }

    .oss-callout p {
      color: var(--color-text-secondary);
      max-width: 480px;
      margin: 0 auto 1.5rem;
      line-height: 1.6;
    }

    .oss-callout a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.5rem;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-card);
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: border-color 0.2s, color 0.2s;
    }

    .oss-callout a:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    /* ── Final CTA ── */
    .final-cta {
      text-align: center;
    }

    .final-cta h2 {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 1rem;
    }

    .final-cta p {
      color: var(--color-text-secondary);
      font-size: 1.1rem;
      max-width: 480px;
      margin: 0 auto 2.5rem;
      line-height: 1.6;
    }

    .final-cta .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .final-cta .btn-filled,
    .final-cta .btn-ghost {
      padding: 0.9rem 2.25rem;
      font-size: 1rem;
      border-radius: 8px;
    }

    /* ── Footer ── */
    footer {
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    footer .footer-copy {
      color: var(--color-text-tertiary);
      font-size: 0.85rem;
    }

    footer .footer-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    footer a {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    footer a:hover {
      color: var(--color-primary);
    }
  `

  render() {
    return html`
      <!-- Fixed Nav -->
      <nav class="landing-nav">
        <span class="logo">Guidr</span>
        <div class="nav-actions">
          <a class="btn-ghost" href="/login">Sign in</a>
          <a class="btn-filled" href="/register">Get started</a>
        </div>
      </nav>

      <!-- Hero -->
      <div class="hero">
        <div class="hero-grid-bg"></div>
        <div class="hero-glow"></div>

        <div class="hero-badge">✨ Step-by-step. Every time.</div>

        <h1>Master anything with<br><span>guided precision</span></h1>
        <p class="hero-sub">
          Create and follow step-by-step guides for cooking, workouts, and anything
          you want to do well — with built-in timing and session tracking.
        </p>

        <div class="hero-cta">
          <a class="btn-filled" href="/register">Get started</a>
          <a class="btn-ghost" href="/login">Sign in</a>
        </div>

        <div class="app-badges">
          <div class="app-badge">📱 iOS App</div>
          <div class="app-badge">🤖 Android App</div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats">
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">Guide types</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">∞</div>
          <div class="stat-label">Guides you can create</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">iOS + Android</div>
          <div class="stat-label">Mobile apps</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">Open source</div>
          <div class="stat-label">on GitHub</div>
        </div>
      </div>

      <!-- Guide Types -->
      <section>
        <div class="section-tag">What you can guide</div>
        <h2 class="section-title">Three guide types, endless possibilities</h2>
        <p class="section-sub">
          Every guide fits neatly into one of three categories, each with
          type-specific fields to capture exactly what you need.
        </p>
        <div class="guide-cards">
          <div class="guide-card" style="--card-accent: #F97316">
            <div class="card-icon">🍳</div>
            <h3>Cooking</h3>
            <p>
              Document recipes with ingredients, portions, and step timing.
              Follow along in the kitchen without losing your place.
            </p>
          </div>
          <div class="guide-card" style="--card-accent: #EF4444">
            <div class="card-icon">💪</div>
            <h3>Workouts</h3>
            <p>
              Structure training sessions with sets, reps, rest periods,
              and target muscle groups — then execute them with precision.
            </p>
          </div>
          <div class="guide-card" style="--card-accent: #9AF5CF">
            <div class="card-icon">📋</div>
            <h3>General</h3>
            <p>
              Anything else — DIY projects, music practice, study routines.
              If it has steps, Guidr can guide you through it.
            </p>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section>
        <div class="section-tag">Features</div>
        <h2 class="section-title">Everything you need to execute</h2>
        <div class="feature-grid">
          <div class="feature-tile">
            <div class="tile-icon">⏱️</div>
            <h4>Step timing</h4>
            <p>Assign durations to each step. The app counts down so you stay on track without watching the clock.</p>
          </div>
          <div class="feature-tile">
            <div class="tile-icon">▶️</div>
            <h4>Session management</h4>
            <p>Start, pause, resume, and complete guides. Your progress is saved so you can pick up where you left off.</p>
          </div>
          <div class="feature-tile">
            <div class="tile-icon">🤖</div>
            <h4>AI guide generation</h4>
            <p>Describe what you want to do and let AI draft the steps, timing, and metadata for you.</p>
          </div>
          <div class="feature-tile">
            <div class="tile-icon">🌍</div>
            <h4>Multi-language</h4>
            <p>Copy and translate any guide into another language in one tap — great for sharing with others.</p>
          </div>
          <div class="feature-tile">
            <div class="tile-icon">📱</div>
            <h4>Mobile-first</h4>
            <p>Native iOS and Android apps built with React Native for a smooth, responsive experience on any device.</p>
          </div>
          <div class="feature-tile">
            <div class="tile-icon">🔄</div>
            <h4>Synced everywhere</h4>
            <p>Create on the web, execute on mobile. Your guides and sessions stay in sync across all your devices.</p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section>
        <div class="section-tag">How it works</div>
        <h2 class="section-title">Up and running in minutes</h2>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Create your guide</h4>
              <p>Add a title, choose a type, write your steps — or let AI generate them for you. Each step can have a duration and detailed notes.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Start a session</h4>
              <p>Hit Start and follow the steps one by one. Timers run automatically and you can pause or skip any step.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Review and repeat</h4>
              <p>Complete the guide, check your history, and refine your steps over time. The more you run it, the better it gets.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobile App CTA -->
      <div class="mobile-cta">
        <section>
          <div class="phone-icon">📱</div>
          <h2>Take your guides anywhere</h2>
          <p>The Guidr mobile app puts all your guides in your pocket. Cook, work out, or work through any project — hands-free.</p>
          <div class="platform-pills">
            <div class="platform-pill">📱 iOS</div>
            <div class="platform-pill">🤖 Android</div>
          </div>
        </section>
      </div>

      <!-- Open Source Callout -->
      <div class="oss-callout">
        <h3>Built in the open</h3>
        <p>Guidr is open source. Browse the code, report issues, or contribute on GitHub.</p>
        <a href="https://github.com/stevendejongnl/guidr" target="_blank" rel="noopener">
          ⭐ View on GitHub
        </a>
      </div>

      <!-- Final CTA -->
      <section class="final-cta">
        <h2>Ready to guide yourself?</h2>
        <p>Create your first guide in under a minute. No credit card, no setup.</p>
        <div class="cta-buttons">
          <a class="btn-filled" href="/register">Get started</a>
          <a class="btn-ghost" href="/login">Sign in</a>
        </div>
      </section>

      <!-- Footer -->
      <footer>
        <span class="footer-copy">© ${new Date().getFullYear()} Guidr</span>
        <div class="footer-links">
          <a href="https://github.com/stevendejongnl/guidr" target="_blank" rel="noopener">GitHub</a>
          <a href="/login">Sign in</a>
          <a href="/register">Register</a>
        </div>
      </footer>
    `
  }
}
