import { expect } from '@open-wc/testing'
import { Router, routes } from './router.js'

describe('Router', () => {
  let outlet: HTMLElement

  beforeEach(() => {
    outlet = document.createElement('div')
    document.body.appendChild(outlet)
    localStorage.clear()
    // Reset to a known path
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    outlet.remove()
    localStorage.clear()
  })

  function setAuthenticated(isAdmin = false, isBeta = false) {
    localStorage.setItem('Guidr_Web_AuthToken', 'test-token')
    localStorage.setItem('Guidr_Web_UserIsAdmin', String(isAdmin))
    localStorage.setItem('Guidr_Web_UserIsBeta', String(isBeta))
  }

  describe('routes config', () => {
    it('has a route for /', () => {
      const route = routes.find(r => r.path === '/')
      expect(route).to.exist
      expect(route!.component).to.equal('landing-page')
    })

    it('has a route for /login', () => {
      const route = routes.find(r => r.path === '/login')
      expect(route).to.exist
      expect(route!.requiresAuth).to.be.undefined
    })

    it('has auth-protected routes', () => {
      const appRoute = routes.find(r => r.path === '/app')
      expect(appRoute!.requiresAuth).to.be.true
    })

    it('has admin-protected routes', () => {
      const adminRoute = routes.find(r => r.path === '/admin/users')
      expect(adminRoute!.requiresAdmin).to.be.true
    })

    it('has beta-protected routes', () => {
      const betaRoute = routes.find(r => r.path === '/guides/generate')
      expect(betaRoute!.requiresBeta).to.be.true
    })
  })

  describe('navigate — unauthenticated', () => {
    it('renders landing page at /', () => {
      const router = new Router(outlet)
      router.start()
      expect(outlet.querySelector('landing-page')).to.exist
    })

    it('renders login page at /login', () => {
      const router = new Router(outlet)
      router.navigate('/login')
      expect(outlet.querySelector('login-page')).to.exist
    })

    it('renders register page at /register', () => {
      const router = new Router(outlet)
      router.navigate('/register')
      expect(outlet.querySelector('register-page')).to.exist
    })

    it('renders not-found page for unknown path', () => {
      const router = new Router(outlet)
      router.navigate('/does-not-exist')
      expect(outlet.querySelector('not-found-page')).to.exist
    })

    it('redirects protected routes to / when not authenticated', () => {
      const router = new Router(outlet)
      router.navigate('/guides')
      expect(outlet.querySelector('landing-page')).to.exist
    })

    it('redirects admin routes to / when not authenticated', () => {
      const router = new Router(outlet)
      router.navigate('/admin/users')
      expect(outlet.querySelector('landing-page')).to.exist
    })

    it('sets document.title from route', () => {
      const router = new Router(outlet)
      router.navigate('/login')
      expect(document.title).to.equal('Login - Guidr')
    })
  })

  describe('navigate — authenticated user', () => {
    it('redirects / to /guides for authenticated users', () => {
      setAuthenticated()
      const router = new Router(outlet)
      router.start()
      expect(outlet.querySelector('guides-page')).to.exist
    })

    it('renders guides page at /guides', () => {
      setAuthenticated()
      const router = new Router(outlet)
      router.navigate('/guides')
      expect(outlet.querySelector('guides-page')).to.exist
    })

    it('renders home page at /app', () => {
      setAuthenticated()
      const router = new Router(outlet)
      router.navigate('/app')
      expect(outlet.querySelector('home-page')).to.exist
    })

    it('redirects admin routes to /guides for non-admin authenticated users', () => {
      setAuthenticated(false)
      const router = new Router(outlet)
      router.navigate('/admin/users')
      // non-admin authenticated → redirect to / → authenticated → redirect to /guides
      expect(outlet.querySelector('guides-page')).to.exist
    })

    it('redirects beta routes to /guides for non-beta users', () => {
      setAuthenticated(false, false)
      const router = new Router(outlet)
      router.navigate('/guides/generate')
      expect(outlet.querySelector('guides-page')).to.exist
    })
  })

  describe('navigate — admin user', () => {
    it('renders admin users page', () => {
      setAuthenticated(true)
      const router = new Router(outlet)
      router.navigate('/admin/users')
      expect(outlet.querySelector('admin-users-page')).to.exist
    })

    it('renders admin guides page', () => {
      setAuthenticated(true)
      const router = new Router(outlet)
      router.navigate('/admin/guides')
      expect(outlet.querySelector('admin-guides-page')).to.exist
    })
  })

  describe('navigate — beta user', () => {
    it('renders generate guide page for beta users', () => {
      setAuthenticated(false, true)
      const router = new Router(outlet)
      router.navigate('/guides/generate')
      expect(outlet.querySelector('generate-guide-page')).to.exist
    })
  })

  describe('parameterized routes', () => {
    it('matches /guides/:id', () => {
      setAuthenticated()
      const router = new Router(outlet)
      router.navigate('/guides/some-guide-id')
      expect(outlet.querySelector('guide-detail-page')).to.exist
    })

    it('matches /admin/users/:id for admin', () => {
      setAuthenticated(true)
      const router = new Router(outlet)
      router.navigate('/admin/users/some-user-id')
      expect(outlet.querySelector('admin-user-detail-page')).to.exist
    })
  })

  describe('popstate', () => {
    it('re-renders on popstate event', () => {
      const router = new Router(outlet)
      router.navigate('/register')
      expect(outlet.querySelector('register-page')).to.exist
      // Manually set history state and fire popstate (back navigation simulation)
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      expect(outlet.querySelector('login-page')).to.exist
    })
  })
})
