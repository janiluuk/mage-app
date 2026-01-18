import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const mockPost = vi.fn(() => Promise.resolve({ data: {}, status: 200 }))

vi.mock('axios', () => ({
  default: { post: mockPost },
}))

vi.mock('./auth-header', () => ({
  default: () => ({ Authorization: 'Bearer test' }),
}))

describe('auth.service', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    mockPost.mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  it('targets v2 endpoints derived from API_URL', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    const authService = await import('./auth.service.js')
    await authService.default.login({ email: 'a@example.com', password: 'pw' })

    expect(mockPost).toHaveBeenCalledWith(
      'https://api.example.com/api/v2/login',
      { email: 'a@example.com', password: 'pw' },
      { headers: { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' } }
    )
  })
})
