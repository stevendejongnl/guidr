export interface Route {
  path: string
  component: string
  title: string
}

export const routes: Route[] = [
  { path: '/', component: 'home-page', title: 'Home - Guidr' },
  { path: '/guides', component: 'guides-page', title: 'Guides - Guidr' },
  { path: '/guides/:id', component: 'guide-detail-page', title: 'Guide Detail - Guidr' },
  { path: '*', component: 'not-found-page', title: 'Not Found - Guidr' }
]

export class Router {
  private outlet: HTMLElement

  constructor(outlet: HTMLElement) {
    this.outlet = outlet
    window.addEventListener('popstate', () => this.handleRoute())
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  private handleRoute(): void {
    const path = window.location.pathname
    const route = this.matchRoute(path)

    document.title = route.title

    // Clear outlet and render new component
    this.outlet.innerHTML = ''
    const component = document.createElement(route.component)
    this.outlet.appendChild(component)
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
