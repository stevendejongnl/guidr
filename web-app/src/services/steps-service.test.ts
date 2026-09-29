import { expect } from '@open-wc/testing'
import { StepsService } from './steps-service.js'

describe('StepsService', () => {
  let service: StepsService
  const originalFetch = window.fetch

  beforeEach(() => {
    service = new StepsService()
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

  function mockFetchEmpty(status = 204) {
    window.fetch = async () => new Response(null, { status })
  }

  const step = {
    id: 'step-1', guideId: 'guide-1', order: 1, title: 'Boil water', description: null,
    duration: 60, durationMinutes: 1, durationSecondsRemainder: 0,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }

  it('fires a Step/create trackEvent on successful create', async () => {
    mockFetch(201, step)
    await service.create({ guideId: 'guide-1', order: 1, title: 'Boil water' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Step', eventAction: 'create', eventName: undefined, eventValue: undefined,
    })
  })

  it('does not fire a trackEvent when create fails', async () => {
    window.fetch = async () => new Response(JSON.stringify({ detail: 'boom' }), { status: 400 })
    try {
      await service.create({ guideId: 'guide-1', order: 1, title: 'Boil water' })
    } catch { /* expected */ }
    expect(window._mtm ?? []).to.be.empty
  })

  it('fires a Step/update trackEvent on successful update', async () => {
    mockFetch(200, step)
    await service.update('step-1', { title: 'Boil more water' })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Step', eventAction: 'update', eventName: undefined, eventValue: undefined,
    })
  })

  it('fires a Step/delete trackEvent on successful delete', async () => {
    mockFetchEmpty(204)
    await service.delete('step-1')
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Step', eventAction: 'delete', eventName: undefined, eventValue: undefined,
    })
  })

  it('does not fire a trackEvent for read-only getByGuideId', async () => {
    mockFetch(200, [step])
    await service.getByGuideId('guide-1')
    expect(window._mtm ?? []).to.be.empty
  })
})
