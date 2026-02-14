import { AuthStorage } from './storage/auth-storage'

export interface Route {
  path: string
  component: string
  title: string
  requiresAuth?: boolean
  requiresAdmin?: boolean
  requiresBeta?: boolean
}

export const routes: Route[] = [
  { path: '/', component: 'home-page', title: 'Home - Guidr', requiresAuth: true },
  { path: '/login', component: 'login-page', title: 'Login - Guidr' },
  { path: '/register', component: 'register-page', title: 'Register - Guidr' },
  { path: '/guides', component: 'guides-page', title: 'Guides - Guidr', requiresAuth: true },
  { path: '/guides/new', component: 'new-guide-page', title: 'New Guide - Guidr', requiresAuth: true },
  { path: '/guides/generate', component: 'generate-guide-page', title: 'Generate Guide - Guidr', requiresAuth: true, requiresBeta: true },
  { path: '/guides/:id', component: 'guide-detail-page', title: 'Guide Detail - Guidr', requiresAuth: true },
  { path: '/admin/guides', component: 'admin-guides-page', title: 'Admin Guides - Guidr', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/guides/:id', component: 'admin-guide-detail-page', title: 'Guide Detail - Guidr', requiresAuth: true, requiresAdmin: true },
  { path: '/admin/styleguide', component: 'admin-styleguide-page', title: 'Styleguide - Guidr', requiresAuth: true, requiresAdmin: true },
  { path: '*', component: 'not-found-page', title: 'Not Found - Guidr' }
]

export class Router {
  private outlet: HTMLElement
  private authStorage: AuthStorage

  constructor(outlet: HTMLElement) {
    this.outlet = outlet
    this.authStorage = new AuthStorage()
    window.addEventListener('popstate', () => this.handleRoute())
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  private handleRoute(): void {
    const path = window.location.pathname
    const route = this.matchRoute(path)

    // Check auth requirements
    if (route.requiresAuth && !this.isAuthenticated()) {
      this.navigateInternal('/login')
      return
    }

    // Check admin requirements
    if (route.requiresAdmin && !this.isAdmin()) {
      this.navigateInternal('/')
      return
    }

    // Check beta requirements
    if (route.requiresBeta && !this.isBeta()) {
      this.navigateInternal('/guides')
      return
    }

    document.title = route.title

    // Clear outlet and render new component
    this.outlet.innerHTML = ''
    const component = document.createElement(route.component)
    this.outlet.appendChild(component)
  }

  private isAuthenticated(): boolean {
    return this.authStorage.hasAuthToken()
  }

  private isAdmin(): boolean {
    return this.authStorage.getUserIsAdmin()
  }

  private isBeta(): boolean {
    return this.authStorage.getUserIsBeta()
  }

  private navigateInternal(path: string): void {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  private matchRoute(path: string): Route {
    // Check exact matches first
    for (const route of routes) {
      if (route.path === path) {
        return route
      }
    }

    // Check parameterized routes (basic pattern matching)
    for (const route of routes) {
      if (route.path.includes(':')) {
        const pattern = route.path.replace(/:[^/]+/g, '[^/]+')
        const regex = new RegExp(`^${pattern}$`)
        if (regex.test(path)) {
          return route
        }
      }
    }

    // Return not found route
    return routes[routes.length - 1]
  }

  start(): void {
    this.handleRoute()
  }
}
