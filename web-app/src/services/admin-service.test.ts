import { expect } from '@open-wc/testing'
import { AdminService } from './admin-service.js'

describe('AdminService', () => {
  let service: AdminService
  const originalFetch = window.fetch

  beforeEach(() => {
    service = new AdminService()
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

  const user = {
    id: 'user-1', email: 'a@b.com', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    name: null, interests: null, preferredLanguages: null, isAdmin: false, isBeta: false,
  }

  it('fires an Admin/update_user trackEvent on successful updateUser', async () => {
    mockFetch(200, user)
    await service.updateUser('user-1', { isBeta: true })
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Admin', eventAction: 'update_user', eventName: undefined, eventValue: undefined,
    })
  })

  it('does not fire a trackEvent when updateUser fails', async () => {
    window.fetch = async () => new Response(JSON.stringify({ detail: 'boom' }), { status: 400 })
    try {
      await service.updateUser('user-1', { isBeta: true })
    } catch { /* expected */ }
    expect(window._mtm ?? []).to.be.empty
  })

  it('fires an Admin/delete_user trackEvent on successful deleteUser', async () => {
    mockFetchEmpty(204)
    await service.deleteUser('user-1')
    const entry = window._mtm?.find(e => e.event === 'guidrEvent')
    expect(entry).to.deep.equal({
      event: 'guidrEvent', eventCategory: 'Admin', eventAction: 'delete_user', eventName: undefined, eventValue: undefined,
    })
  })

  it('does not fire a trackEvent for read-only getAllUsers', async () => {
    mockFetch(200, [user])
    await service.getAllUsers()
    expect(window._mtm ?? []).to.be.empty
  })

  describe('getAllGuidesWithUsers', () => {
    const guide = {
      id: 'guide-1', guideType: 'cooking', title: 'Pasta', description: null, metadata: null,
      stepIds: [], createdByUserId: 'user-1', isPublic: false, isHighlighted: false,
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    }

    it('joins guides with their creator email/name', async () => {
      let call = 0
      window.fetch = async () => {
        call += 1
        const body = call === 1 ? [guide] : [{ ...user, name: 'Alice' }]
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      const [result] = await service.getAllGuidesWithUsers()
      expect(result.userEmail).to.equal('a@b.com')
      expect(result.userName).to.equal('Alice')
    })

    it('leaves userEmail/userName null when the guide has no creator', async () => {
      let call = 0
      window.fetch = async () => {
        call += 1
        const body = call === 1 ? [{ ...guide, createdByUserId: null }] : []
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      const [result] = await service.getAllGuidesWithUsers()
      expect(result.userEmail).to.be.null
      expect(result.userName).to.be.null
    })

    it('does not fire a trackEvent', async () => {
      window.fetch = async () => new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      await service.getAllGuidesWithUsers()
      expect(window._mtm ?? []).to.be.empty
    })
  })

  describe('getAuditLogs', () => {
    it('requests without query params when no filters given', async () => {
      let capturedUrl = ''
      window.fetch = async (url: RequestInfo | URL) => {
        capturedUrl = String(url)
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      await service.getAuditLogs()
      expect(capturedUrl).to.not.include('?')
    })

    it('builds a query string from provided filters', async () => {
      let capturedUrl = ''
      window.fetch = async (url: RequestInfo | URL) => {
        capturedUrl = String(url)
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      await service.getAuditLogs({
        userId: 'user-1', resourceType: 'guide', resourceId: 'guide-1',
        startDate: '2026-01-01', endDate: '2026-01-31', limit: 10, offset: 5,
      })
      expect(capturedUrl).to.include('userId=user-1')
      expect(capturedUrl).to.include('resourceType=guide')
      expect(capturedUrl).to.include('resourceId=guide-1')
      expect(capturedUrl).to.include('startDate=2026-01-01')
      expect(capturedUrl).to.include('endDate=2026-01-31')
      expect(capturedUrl).to.include('limit=10')
      expect(capturedUrl).to.include('offset=5')
    })

    it('does not fire a trackEvent', async () => {
      mockFetch(200, [])
      await service.getAuditLogs()
      expect(window._mtm ?? []).to.be.empty
    })
  })
})
