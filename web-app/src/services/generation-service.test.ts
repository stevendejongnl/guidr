import { expect } from '@open-wc/testing'
import { GenerationService } from './generation-service.js'

describe('GenerationService', () => {
  let service: GenerationService
  const originalFetch = window.fetch

  beforeEach(() => {
    service = new GenerationService()
    delete window._mtm
  })

  afterEach(() => {
    window.fetch = originalFetch
    delete window._mtm
  })

  function mockFetch(status: number, body: unknown) {
    window.fetch = async () =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }

  const generated = { guideType: 'cooking', title: 'Pasta', description: null, metadata: null, steps: [] }
  const withSteps = {
    guide: {
      id: 'guide-1', guideType: 'cooking', title: 'Pasta', description: null, metadata: null,
      stepIds: [], createdByUserId: 'u1', isPublic: false, isHighlighted: false,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    },
    steps: [],
  }

  it('fires a Generation/generate_from_prompt trackEvent on success', async () => {
    mockFetch(200, generated)
    await service.generateFromPrompt({ prompt: 'a cozy pasta dish', guideType: 'cooking' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Generation', eventAction: 'generate_from_prompt', eventName: 'cooking', eventValue: undefined,
    })
  })

  it('does not fire a trackEvent when generateFromPrompt fails', async () => {
    window.fetch = async () => new Response(JSON.stringify({ detail: 'boom' }), { status: 400 })
    try {
      await service.generateFromPrompt({ prompt: 'x' })
    } catch { /* expected */ }
    expect(window._mtm ?? []).to.be.empty
  })

  it('fires a Generation/generate_from_url trackEvent on success', async () => {
    mockFetch(200, generated)
    await service.generateFromUrl({ url: 'https://example.com/recipe', guideType: 'cooking' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Generation', eventAction: 'generate_from_url', eventName: 'cooking', eventValue: undefined,
    })
  })

  it('fires a Generation/save trackEvent on successful createWithSteps', async () => {
    mockFetch(201, withSteps)
    await service.createWithSteps({ guideType: 'cooking', title: 'Pasta', isPublic: false, steps: [] })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Generation', eventAction: 'save', eventName: 'cooking', eventValue: undefined,
    })
  })
})
