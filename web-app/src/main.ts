import * as Sentry from '@sentry/browser'
import './components/app-root.js'
import './components/pages/home-page.js'
import './components/pages/landing-page.js'
import './components/pages/guides-page.js'
import './components/pages/guide-detail-page.js'
import './components/pages/not-found-page.js'
import './components/pages/login-page.js'
import './components/pages/register-page.js'
import './components/pages/generate-guide-page.js'
import './components/pages/new-guide-page.js'
import './components/pages/admin-styleguide-page.js'
import './components/pages/admin-guides-page.js'
import './components/pages/admin-guide-detail-page.js'
import './components/pages/admin-users-page.js'
import './components/pages/admin-user-detail-page.js'
import './components/pages/admin-audit-logs-page.js'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
}
