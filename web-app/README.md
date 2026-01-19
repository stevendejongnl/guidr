# Guidr Web Application

Step-by-step guide execution web application built with Lit, TypeScript, and Vite.

## Overview

The Guidr web application is a single-page application (SPA) that provides a web interface for executing step-by-step guides. It connects to the Guidr API server to manage guides, categories, steps, and execution sessions.

## Tech Stack

- **Lit 3.3.1** - Web Components framework
- **TypeScript 5.6.3** - Type-safe JavaScript
- **Vite 7.1.12** - Build tool and dev server
- **@lit/context** - Dependency injection for Lit
- **@floating-ui/dom** - Positioning library for tooltips/popovers

## Prerequisites

- **Node.js**: 24.11.0+ (LTS)
- **npm**: 11.6.0+

## Quick Start

### Development (with Vite dev server)

```bash
# Install dependencies
npm install

# Start dev server with hot module replacement
npm run dev
# Opens http://localhost:3000
# API calls automatically proxied to http://localhost:8000
```

Make sure the API server is running on port 8000:

```bash
cd ../api-server
uv run guidr-server
```

### Production Build

```bash
# Build for production
npm run build
# Output: dist/

# Preview production build locally
npm run preview
```

The production build is served by the FastAPI server at the root URL (`/`).

### Type Checking and Linting

```bash
# Type check without emitting files
npm run typecheck

# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

## Project Structure

```
web-app/
├── src/
│   ├── main.ts                 # Bootstrap app-root component
│   ├── router.ts               # Client-side routing
│   ├── components/
│   │   ├── app-root.ts         # Root component with navigation
│   │   └── pages/              # Page components
│   │       ├── home-page.ts
│   │       ├── guides-page.ts
│   │       ├── guide-detail-page.ts
│   │       └── not-found-page.ts
│   ├── services/               # API client services
│   │   ├── api-client.ts       # Base HTTP client
│   │   └── guides-service.ts   # Guides API wrapper
│   ├── models/                 # TypeScript interfaces
│   │   ├── guide.ts
│   │   ├── category.ts
│   │   └── session.ts
│   └── styles/                 # Global styles
├── public/                     # Static assets
├── dist/                       # Build output (gitignored)
├── index.html                  # Entry HTML
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Development Workflow

### Local Development with HMR

The recommended development workflow uses two separate servers:

**Terminal 1 - API Server:**
```bash
cd api-server
uv run guidr-server
# Runs on http://localhost:8000
```

**Terminal 2 - Web App Dev Server:**
```bash
cd web-app
npm run dev
# Runs on http://localhost:3000
# Proxies /api/* and /health to localhost:8000
```

**Benefits:**
- Hot Module Replacement (HMR) for instant updates
- Fast refresh without full page reload
- Separate logging for frontend and backend

### Path Aliases

TypeScript path aliases are configured for cleaner imports:

```typescript
import { GuidesService } from '@services/guides-service.js'
import type { Guide } from '@models/guide.js'
import { HomePage } from '@components/pages/home-page.js'
```

**Available aliases:**
- `@components/*` → `src/components/*`
- `@services/*` → `src/services/*`
- `@models/*` → `src/models/*`
- `@styles/*` → `src/styles/*`

## API Integration

The web app connects to the Guidr API server:

**Base URL:** `/api/v1`

**Available endpoints:**
- `GET /api/v1/guides` - List all guides
- `GET /api/v1/guides/:id` - Get guide by ID
- `POST /api/v1/guides` - Create new guide
- `PUT /api/v1/guides/:id` - Update guide
- `DELETE /api/v1/guides/:id` - Delete guide
- `GET /api/v1/categories` - List categories
- `GET /api/v1/steps` - List steps
- `POST /api/v1/sessions` - Start execution session

See `api-server/README.md` for complete API documentation.

## Lit Components

### Custom Elements

All components are registered as custom elements using the `@customElement` decorator:

```typescript
import { html, LitElement, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('my-component')
export class MyComponent extends LitElement {
  @property({ type: String })
  name = ''

  @state()
  private count = 0

  render() {
    return html`<div>Hello ${this.name}! Count: ${this.count}</div>`
  }
}
```

### Component Decorators

- `@customElement('tag-name')` - Register custom element
- `@property()` - Public reactive property (attribute)
- `@state()` - Private reactive state
- `@query()` - Query DOM element in shadow root
- `@queryAll()` - Query multiple DOM elements

### Component Styles

Styles are scoped to the component using Shadow DOM:

```typescript
static styles = css`
  :host {
    display: block;
  }

  h1 {
    color: #2c3e50;
  }
`
```

## Router Implementation

The web app uses a simple client-side router:

**Routes:**
- `/` - Home page
- `/guides` - Guides listing
- `/guides/:id` - Guide detail page
- `*` - 404 Not Found page

**Navigation:**
```typescript
// Programmatic navigation
window.history.pushState({}, '', '/guides')
window.dispatchEvent(new PopStateEvent('popstate'))

// Link navigation (in templates)
<a href="/guides" @click=${this.navigate}>Guides</a>

private navigate(e: Event) {
  e.preventDefault()
  const href = (e.target as HTMLAnchorElement).getAttribute('href')!
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

## TypeScript Configuration

### Strict Mode

All strict TypeScript flags are enabled:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `noUnusedLocals: true`
- `noImplicitReturns: true`

### Lit Decorators Support

Required compiler options for Lit decorators:
```json
{
  "experimentalDecorators": true,
  "useDefineForClassFields": false
}
```

### Module Resolution

Uses modern bundler resolution:
```json
{
  "module": "ESNext",
  "moduleResolution": "bundler"
}
```

## Production Deployment

### Served by FastAPI

In production, the built web app is served by the FastAPI server:

1. Build web app: `npm run build` (outputs to `dist/`)
2. FastAPI serves:
   - Static assets at `/assets/*` (JS, CSS)
   - SPA catch-all at `/*` (returns `index.html`)
   - API at `/api/v1/*`

### Docker Build

The web app is automatically built and included in the Docker image:

```dockerfile
# Multi-stage Dockerfile includes:
# Stage 1: Build web app with Node.js
# Stage 2: Build API server with Python/Poetry
# Stage 3: Runtime with both web app and API
```

**Build Docker image:**
```bash
cd api-server
docker-compose up --build
# Web app + API available at http://localhost:8000
```

### Route Precedence

FastAPI route matching order ensures correct behavior:
1. API routes (`/api/v1/*`) - Highest priority
2. Static assets (`/assets/*`) - Served by StaticFiles
3. SPA catch-all (`/*`) - Returns index.html for all other paths

## Testing

Testing framework coming soon. Planned:
- `@web/test-runner` with Playwright
- Unit tests for components
- Integration tests for API services

## Development Tips

### Hot Module Replacement

Vite provides instant HMR for Lit components. Changes to component files automatically update in the browser without full page reload.

### Browser DevTools

Use browser DevTools to inspect custom elements:
- Elements tab: View shadow DOM
- Console: Access custom element instances (`$0` after selecting)
- Network tab: Monitor API calls

### TypeScript Errors

If you see TypeScript errors about missing decorators:
```bash
npm install
# Ensure ts-patch and typescript-transform-paths are installed
```

### Vite Build Errors

If Vite build fails:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Reinstall dependencies
npm install

# Try build again
npm run build
```

## Contributing

Follow the same conventions as the main Guidr project:
- Use conventional commit messages (`feat:`, `fix:`, `refactor:`, etc.)
- Run `npm run typecheck && npm run lint` before committing
- Keep components small and focused
- Use TypeScript strict mode (no `any` types)
- Document complex component behavior

## Related Documentation

- **API Server:** `../api-server/README.md`
- **Main Project:** `../CLAUDE.md`
- **React Native App:** `../README.md`
