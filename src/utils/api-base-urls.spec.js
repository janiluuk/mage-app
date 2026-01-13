import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('API base URL helpers', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.resetModules()
  })

  it('derives v1 base URL from VITE_API_URL', async () => {
    process.env.VITE_API_URL = 'https://test-api.example.com'
    delete process.env.VITE_API_BASE_URL
    vi.resetModules()

    const baseUrls = await import('./api-base-urls.js')
    expect(baseUrls.API_BASE_URL).toBe('https://test-api.example.com/api/v1')
    expect(baseUrls.API_V1_BASE_URL).toBe('https://test-api.example.com/api/v1')
  })

  it('uses VITE_API_BASE_URL when provided', async () => {
    delete process.env.VITE_API_URL
    process.env.VITE_API_BASE_URL = 'https://override.example.com/api/v1'
    vi.resetModules()

    const baseUrls = await import('./api-base-urls.js')
    expect(baseUrls.API_BASE_URL).toBe('https://override.example.com/api/v1')
    expect(baseUrls.API_V1_BASE_URL).toBe('https://override.example.com/api/v1')
  })

  it('returns empty strings when no API URL is set', async () => {
    delete process.env.VITE_API_URL
    delete process.env.VITE_API_BASE_URL
    vi.resetModules()

    const baseUrls = await import('./api-base-urls.js')
    expect(baseUrls.API_BASE_URL).toBe('')
    expect(baseUrls.API_V1_BASE_URL).toBe('')
  })
})
