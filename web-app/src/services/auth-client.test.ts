import { expect } from '@open-wc/testing'
import { AuthClient } from './auth-client.js'

describe('AuthClient', () => {
  const originalFetch = window.fetch

  afterEach(() => {
    window.fetch = originalFetch
  })

  function mockFetch(status: number, body: unknown) {
    window.fetch = async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
  }

  async function expectThrows(fn: () => Promise<unknown>, message: string) {
    try {
      await fn()
      throw new Error('Expected rejection but resolved')
    } catch (err) {
      expect((err as Error).message).to.include(message)
    }
  }

  const validUser = {
    id: 'user-1',
    email: 'user@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    name: null,
    interests: null,
    isAdmin: false,
    isBeta: false,
  }

  const validAuthResponse = {
    accessToken: 'access-token',
    tokenType: 'bearer',
    user: validUser,
  }

  describe('constructor', () => {
    it('throws on empty server URL', () => {
      expect(() => new AuthClient('')).to.throw('Server URL cannot be empty')
    })

    it('throws on whitespace-only URL', () => {
      expect(() => new AuthClient('   ')).to.throw('Server URL cannot be empty')
    })

    it('does not duplicate /api/v1 if already in URL', () => {
      const client = new AuthClient('http://localhost:8000/api/v1')
      expect(client).to.exist
    })

    it('strips trailing slash from URL', () => {
      const client = new AuthClient('http://localhost:8000/')
      expect(client).to.exist
    })
  })

  describe('login', () => {
    it('throws on empty email', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.login('', 'pass'), 'Email cannot be empty')
    })

    it('throws on empty password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.login('user@example.com', ''), 'Password cannot be empty')
    })

    it('returns auth response on success', async () => {
      mockFetch(200, validAuthResponse)
      const client = new AuthClient('http://localhost:8000')
      const result = await client.login('user@example.com', 'password')
      expect(result.accessToken).to.equal('access-token')
      expect(result.user.email).to.equal('user@example.com')
    })

    it('throws on API error with detail field', async () => {
      mockFetch(401, { detail: 'Invalid credentials' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.login('user@example.com', 'wrong'), 'Invalid credentials')
    })

    it('throws on invalid response (missing accessToken)', async () => {
      mockFetch(200, { tokenType: 'bearer', user: validUser })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.login('user@example.com', 'pass'), 'Invalid response from server')
    })

    it('defaults isAdmin/isBeta to false when not boolean', async () => {
      mockFetch(200, {
        ...validAuthResponse,
        user: { ...validUser, isAdmin: 'yes', isBeta: 'yes' },
      })
      const client = new AuthClient('http://localhost:8000')
      const result = await client.login('user@example.com', 'pass')
      expect(result.user.isAdmin).to.be.false
      expect(result.user.isBeta).to.be.false
    })
  })

  describe('register', () => {
    it('throws on empty email', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.register('', 'pass'), 'Email cannot be empty')
    })

    it('throws on empty password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.register('user@example.com', ''), 'Password cannot be empty')
    })

    it('returns auth response on success', async () => {
      mockFetch(201, validAuthResponse)
      const client = new AuthClient('http://localhost:8000')
      const result = await client.register('user@example.com', 'password')
      expect(result.accessToken).to.equal('access-token')
    })

    it('throws on invalid response (missing id)', async () => {
      const { id: _id, ...userWithoutId } = validUser
      mockFetch(201, { ...validAuthResponse, user: userWithoutId })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.register('user@example.com', 'pass'), 'Invalid response from server')
    })
  })

  describe('getProfile', () => {
    it('throws on empty auth token', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.getProfile(''), 'Auth token cannot be empty')
    })

    it('returns user profile on success', async () => {
      mockFetch(200, validUser)
      const client = new AuthClient('http://localhost:8000')
      const result = await client.getProfile('valid-token')
      expect(result.email).to.equal('user@example.com')
    })

    it('throws on invalid response (missing id)', async () => {
      const { id: _id, ...userWithoutId } = validUser
      mockFetch(200, userWithoutId)
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.getProfile('token'), 'Invalid response from server')
    })
  })

  describe('updateProfile', () => {
    it('throws on empty auth token', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.updateProfile('name', null, ''), 'Auth token cannot be empty')
    })

    it('updates and returns user profile', async () => {
      mockFetch(200, { ...validUser, name: 'New Name' })
      const client = new AuthClient('http://localhost:8000')
      const result = await client.updateProfile('New Name', null, 'token')
      expect(result.name).to.equal('New Name')
    })
  })

  describe('changePassword', () => {
    it('throws on empty old password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changePassword('', 'newpass', 'token'), 'Old password cannot be empty')
    })

    it('throws on empty new password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changePassword('oldpass', '', 'token'), 'New password cannot be empty')
    })

    it('throws on empty auth token', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changePassword('old', 'new', ''), 'Auth token cannot be empty')
    })

    it('resolves on success', async () => {
      mockFetch(200, {})
      const client = new AuthClient('http://localhost:8000')
      await client.changePassword('old', 'new', 'token')
    })
  })

  describe('changeEmail', () => {
    it('throws on empty new email', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changeEmail('', 'pass', 'token'), 'New email cannot be empty')
    })

    it('throws on empty password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changeEmail('new@example.com', '', 'token'), 'Password cannot be empty')
    })

    it('throws on empty auth token', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changeEmail('new@example.com', 'pass', ''), 'Auth token cannot be empty')
    })

    it('returns new auth response on success', async () => {
      mockFetch(200, { ...validAuthResponse, user: { ...validUser, email: 'new@example.com' } })
      const client = new AuthClient('http://localhost:8000')
      const result = await client.changeEmail('new@example.com', 'pass', 'token')
      expect(result.user.email).to.equal('new@example.com')
    })
  })

  describe('error response with non-JSON body', () => {
    it('login throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.login('user@example.com', 'pass'), 'Server error: 500')
    })

    it('register throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.register('user@example.com', 'pass'), 'Server error: 502')
    })

    it('getProfile throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.getProfile('token'), 'Server error: 403')
    })

    it('updateProfile throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.updateProfile('name', null, 'token'), 'Server error: 403')
    })

    it('changePassword throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changePassword('old', 'new', 'token'), 'Server error: 403')
    })

    it('changeEmail throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.changeEmail('new@example.com', 'pass', 'token'), 'Server error: 403')
    })

    it('deleteAccount throws with status text on non-JSON error body', async () => {
      window.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.deleteAccount('pass', 'token'), 'Server error: 403')
    })
  })

  describe('deleteAccount', () => {
    it('throws on empty password', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.deleteAccount('', 'token'), 'Password cannot be empty')
    })

    it('throws on empty auth token', async () => {
      const client = new AuthClient('http://localhost:8000')
      await expectThrows(() => client.deleteAccount('pass', ''), 'Auth token cannot be empty')
    })

    it('resolves on success', async () => {
      mockFetch(200, {})
      const client = new AuthClient('http://localhost:8000')
      await client.deleteAccount('pass', 'token')
    })
  })
})
