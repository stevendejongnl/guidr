import { expect } from '@open-wc/testing'
import { GuidesService } from './guides-service.js'

describe('GuidesService', () => {
  let service: GuidesService
  const originalFetch = window.fetch

  beforeEach(() => {
    service = new GuidesService()
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

  function mockFetchError(status: number) {
    window.fetch = async () => new Response(JSON.stringify({ detail: 'boom' }), { status })
  }

  function mockFetchEmpty(status = 204) {
    window.fetch = async () => new Response(null, { status })
  }

  const guide = {
    id: 'guide-1', guideType: 'cooking', title: 'Pasta', description: null, metadata: null,
    stepIds: [], createdByUserId: 'u1', isPublic: false, isHighlighted: false,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }

  it('fires a Guide/create trackEvent on successful create', async () => {
    mockFetch(201, guide)
    await service.create({ guideType: 'cooking', title: 'Pasta' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Guide', eventAction: 'create', eventName: 'cooking', eventValue: undefined,
    })
  })

  it('does not fire a trackEvent when create fails', async () => {
    mockFetchError(400)
    try {
      await service.create({ guideType: 'cooking', title: 'Pasta' })
    } catch { /* expected */ }
    expect(window._mtm ?? []).to.be.empty
  })

  it('fires a Guide/update trackEvent on successful update', async () => {
    mockFetch(200, guide)
    await service.update('guide-1', { title: 'New title' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Guide', eventAction: 'update', eventName: undefined, eventValue: undefined,
    })
  })

  it('fires a Guide/delete trackEvent on successful delete', async () => {
    mockFetchEmpty(204)
    await service.delete('guide-1')
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Guide', eventAction: 'delete', eventName: undefined, eventValue: undefined,
    })
  })

  it('fires a Guide/copy trackEvent with the target language on successful copyToLanguage', async () => {
    mockFetch(200, { guide, steps: [] })
    await service.copyToLanguage('guide-1', 'nl')
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Guide', eventAction: 'copy', eventName: 'nl', eventValue: undefined,
    })
  })

  it('fires a Guide/translate trackEvent with the target language on successful translateToLanguage', async () => {
    mockFetch(200, { guide, steps: [] })
    await service.translateToLanguage('guide-1', 'nl')
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Guide', eventAction: 'translate', eventName: 'nl', eventValue: undefined,
    })
  })

  it('does not fire a trackEvent for read-only getAll', async () => {
    mockFetch(200, [guide])
    await service.getAll()
    expect(window._mtm ?? []).to.be.empty
  })
})
