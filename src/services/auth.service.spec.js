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
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    originalEnv = { ...process.env }
    mockPost.mockClear()
    localStorage.clear()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('uses v1 endpoint successfully with access_token field', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    mockPost.mockResolvedValueOnce({
      data: { access_token: 'test-token-v1' },
      status: 200
    })

    const authService = await import('./auth.service.js')
    const result = await authService.default.login({ email: 'a@example.com', password: 'pw' })

    expect(mockPost).toHaveBeenCalledWith(
      'https://api.example.com/api/auth/login',
      { email: 'a@example.com', password: 'pw' }
    )
    expect(localStorage.getItem('auth.accessToken')).toBe('test-token-v1')
    expect(result).toEqual({ access_token: 'test-token-v1' })
  })

  it('uses v1 endpoint successfully with legacy token field', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    mockPost.mockResolvedValueOnce({
      data: { token: 'test-token-legacy' },
      status: 200
    })

    const authService = await import('./auth.service.js')
    const result = await authService.default.login({ email: 'a@example.com', password: 'pw' })

    expect(localStorage.getItem('auth.accessToken')).toBe('test-token-legacy')
    expect(result).toEqual({ token: 'test-token-legacy' })
  })

  it('falls back to v2 endpoint when v1 returns 404', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    mockPost
      .mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Not Found'
      })
      .mockResolvedValueOnce({
        data: { access_token: 'test-token-v2' },
        status: 200
      })

    const authService = await import('./auth.service.js')
    const result = await authService.default.login({ email: 'a@example.com', password: 'pw' })

    expect(mockPost).toHaveBeenCalledTimes(2)
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/api/auth/login',
      { email: 'a@example.com', password: 'pw' }
    )
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/api/v2/login',
      { email: 'a@example.com', password: 'pw' },
      { headers: { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' } }
    )
    expect(localStorage.getItem('auth.accessToken')).toBe('test-token-v2')
    expect(consoleLogSpy).toHaveBeenCalledWith('v1 auth endpoint not found, falling back to v2')
  })

  it('throws error immediately on 401 unauthorized without fallback', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    mockPost.mockRejectedValueOnce({
      response: { status: 401 },
      message: 'Unauthorized'
    })

    const authService = await import('./auth.service.js')
    
    await expect(
      authService.default.login({ email: 'wrong@example.com', password: 'wrong' })
    ).rejects.toMatchObject({
      response: { status: 401 },
      message: 'Unauthorized'
    })

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed at v1 endpoint:', 'Unauthorized')
  })

  it('throws error immediately on 500 server error without fallback', async () => {
    process.env.VITE_API_URL = 'https://api.example.com'
    vi.resetModules()

    mockPost.mockRejectedValueOnce({
      response: { status: 500 },
      message: 'Internal Server Error'
    })

    const authService = await import('./auth.service.js')
    
    await expect(
      authService.default.login({ email: 'a@example.com', password: 'pw' })
    ).rejects.toMatchObject({
      response: { status: 500 },
      message: 'Internal Server Error'
    })

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed at v1 endpoint:', 'Internal Server Error')
  })
})
