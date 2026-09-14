import { expect } from '@open-wc/testing'
import { MatomoTagManager, analyticsService, type TagManager } from './analytics-service.js'

describe('MatomoTagManager', () => {
  const containerUrl = 'https://analytics.example.test/js/container_test.js'
  let matomo: MatomoTagManager

  beforeEach(() => {
    matomo = new MatomoTagManager(containerUrl)
    document.body.appendChild(document.createElement('script'))
  })

  afterEach(() => {
    delete window._mtm
  })

  it('creates window._mtm lazily and pushes an mtm.Start event on init', () => {
    matomo.init()
    expect(window._mtm).to.exist
    const events = window._mtm!.map(entry => entry.event)
    expect(events).to.include('mtm.Start')
  })

  it('injects the container script tag pointing at the configured URL', () => {
    matomo.init()
    const script = document.querySelector(`script[src="${containerUrl}"]`) as HTMLScriptElement | null
    expect(script).to.exist
    expect(script!.async).to.be.true
  })

  it('pushes a custom event with page url and title on trackPageView', () => {
    window._mtm = []
    matomo.trackPageView('/guides', 'Guides - Guidr')
    const entry = window._mtm.find(e => e.event === 'guidrPageView')
    expect(entry).to.deep.equal({
      event: 'guidrPageView',
      pageUrl: '/guides',
      pageTitle: 'Guides - Guidr',
    })
  })

  it('creates window._mtm lazily if trackPageView is called before init', () => {
    matomo.trackPageView('/', 'Guidr')
    expect(window._mtm).to.exist
  })

  it('pushes a custom event with category and action on trackEvent', () => {
    window._mtm = []
    matomo.trackEvent('Guide', 'create')
    const entry = window._mtm.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent',
      eventCategory: 'Guide',
      eventAction: 'create',
      eventName: undefined,
      eventValue: undefined,
    })
  })

  it('includes an optional name and value on trackEvent', () => {
    window._mtm = []
    matomo.trackEvent('Generation', 'generate_from_prompt', 'cooking', 3)
    const entry = window._mtm.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent',
      eventCategory: 'Generation',
      eventAction: 'generate_from_prompt',
      eventName: 'cooking',
      eventValue: 3,
    })
  })

  it('creates window._mtm lazily if trackEvent is called before init', () => {
    matomo.trackEvent('Guide', 'create')
    expect(window._mtm).to.exist
  })
})

describe('analyticsService', () => {
  it('exports a singleton conforming to the TagManager interface', () => {
    const t: TagManager = analyticsService
    expect(t.init).to.be.a('function')
    expect(t.trackPageView).to.be.a('function')
    expect(t.trackEvent).to.be.a('function')
  })
})
