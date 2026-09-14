declare global {
  interface Window {
    _mtm?: Record<string, unknown>[]
  }
}

/**
 * Abstraction over "some tag manager injects a script and receives page-view
 * events" so the concrete provider (currently Matomo Tag Manager) can be
 * swapped for another (e.g. Google Tag Manager) without touching callers.
 */
export interface TagManager {
  init(): void
  trackPageView(path: string, title: string): void
  trackEvent(category: string, action: string, name?: string, value?: number): void
}

export class MatomoTagManager implements TagManager {
  constructor(private readonly containerUrl: string) {}

  init(): void {
    const _mtm = (window._mtm = window._mtm || [])
    _mtm.push({ 'mtm.startTime': new Date().getTime(), event: 'mtm.Start' })

    const d = document
    const g = d.createElement('script')
    const s = d.getElementsByTagName('script')[0]
    g.async = true
    g.src = this.containerUrl
    s.parentNode?.insertBefore(g, s)
  }

  trackPageView(path: string, title: string): void {
    const _mtm = (window._mtm = window._mtm || [])
    _mtm.push({ event: 'guidrPageView', pageUrl: path, pageTitle: title })
  }

  trackEvent(category: string, action: string, name?: string, value?: number): void {
    const _mtm = (window._mtm = window._mtm || [])
    _mtm.push({
      event: 'guidrEvent',
      eventCategory: category,
      eventAction: action,
      eventName: name,
      eventValue: value,
    })
  }
}

// Swap this instance to move to a different tag manager provider.
export const analyticsService: TagManager = new MatomoTagManager(
  'https://analytics.madebysteven.nl/js/container_V2vnW7HM.js',
)
