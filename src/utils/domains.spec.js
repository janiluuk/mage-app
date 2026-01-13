import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Domains Utility', () => {
  let originalEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    // Clear module cache to get fresh imports
    vi.resetModules()
  })

  describe('URL Construction', () => {
    it('exports all required URL constants', async () => {
      const domains = await import('./domains.js')
      expect(domains.API_URL).toBeDefined()
      expect(domains.API_BASE_URL).toBeDefined()
      expect(domains.API_V1_URL).toBeDefined()
      expect(domains.VIDEO_PREVIEW_URL).toBeDefined()
      expect(domains.MODEL_PREVIEW_URL).toBeDefined()
      expect(domains.FALLBACK_IMAGE_URL).toBeDefined()
      expect(domains.APP_BASE_URL).toBeDefined()
      expect(domains.STABLE_URL).toBeDefined()
      expect(domains.MAGE_API_URL).toBeDefined()
      expect(domains.SAMPLE_PROCESSED_VIDEO_URL).toBeDefined()
    })

    it('uses environment variables when provided', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_URL).toBe('https://test-api.example.com')
    })

    it('constructs API_BASE_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      delete process.env.VITE_API_BASE_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_BASE_URL).toBe('https://test-api.example.com/api')
    })

    it('constructs API_V1_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_V1_URL).toBe('https://test-api.example.com/api/v1')
    })

    it('constructs API_V2_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_V2_URL).toBe('https://test-api.example.com/api/v2')
    })

    it('constructs VIDEO_PREVIEW_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.VIDEO_PREVIEW_URL).toBe('https://test-api.example.com/videos/')
    })

    it('constructs MODEL_PREVIEW_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.MODEL_PREVIEW_URL).toBe('https://test-api.example.com/preview/model/')
    })

    it('constructs FALLBACK_IMAGE_URL from API_URL', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      delete process.env.VITE_FALLBACK_IMAGE_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.FALLBACK_IMAGE_URL).toBe('https://test-api.example.com/images/notfound.jpg')
    })
  })

  describe('Environment Variable Overrides', () => {
    it('uses VITE_APP_URL when set', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      process.env.VITE_APP_URL = 'https://app.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.APP_BASE_URL).toBe('https://app.example.com')
    })

    it('falls back to VITE_API_URL for APP_BASE_URL when VITE_APP_URL not set', async () => {
      delete process.env.VITE_APP_URL
      process.env.VITE_API_URL = 'https://api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.APP_BASE_URL).toBe('https://api.example.com')
    })

    it('uses VITE_FALLBACK_IMAGE_URL when explicitly set', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      process.env.VITE_FALLBACK_IMAGE_URL = 'https://custom-image.example.com/notfound.jpg'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.FALLBACK_IMAGE_URL).toBe('https://custom-image.example.com/notfound.jpg')
    })
  })

  describe('Default Values', () => {
    it('uses empty string as default when no environment variables are set', async () => {
      // Clear all relevant environment variables
      delete process.env.VITE_API_URL
      delete process.env.VITE_API_BASE_URL
      delete process.env.VITE_STABLE_URL
      delete process.env.VITE_MAGE_API_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_URL).toBe('')
      expect(domains.API_BASE_URL).toBe('')
      expect(domains.STABLE_URL).toBe('')
      expect(domains.MAGE_API_URL).toBe('')
    })
  })

  describe('Type Safety', () => {
    it('exports values as strings', async () => {
      const domains = await import('./domains.js')
      expect(typeof domains.API_URL).toBe('string')
      expect(typeof domains.API_BASE_URL).toBe('string')
      expect(typeof domains.API_V1_URL).toBe('string')
      expect(typeof domains.API_V2_URL).toBe('string')
      expect(typeof domains.VIDEO_PREVIEW_URL).toBe('string')
      expect(typeof domains.MODEL_PREVIEW_URL).toBe('string')
      expect(typeof domains.FALLBACK_IMAGE_URL).toBe('string')
      expect(typeof domains.APP_BASE_URL).toBe('string')
      expect(typeof domains.STABLE_URL).toBe('string')
      expect(typeof domains.MAGE_API_URL).toBe('string')
      expect(typeof domains.SAMPLE_PROCESSED_VIDEO_URL).toBe('string')
    })

    it('exports fetchStableUrl as a function', async () => {
      const domains = await import('./domains.js')
      expect(typeof domains.fetchStableUrl).toBe('function')
    })
  })

  describe('Stable URL Fetching', () => {
    it('fetchStableUrl returns stable URL from backend', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      
      // Mock fetch to return a stable URL
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ stableUrl: 'https://stable.example.com' })
        })
      )
      
      const stableUrl = await domains.fetchStableUrl()
      expect(stableUrl).toBe('https://stable.example.com')
      expect(global.fetch).toHaveBeenCalledWith('https://test-api.example.com/api/config')
    })

    it('fetchStableUrl falls back to STABLE_URL env on fetch failure', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      process.env.VITE_STABLE_URL = 'https://fallback-stable.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      
      // Mock fetch to fail
      global.fetch = vi.fn(() => Promise.resolve({ ok: false }))
      
      const stableUrl = await domains.fetchStableUrl()
      expect(stableUrl).toBe('https://fallback-stable.example.com')
    })

    it('fetchStableUrl falls back to STABLE_URL env on network error', async () => {
      process.env.VITE_API_URL = 'https://test-api.example.com'
      process.env.VITE_STABLE_URL = 'https://fallback-stable.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      
      // Mock fetch to throw error
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
      
      const stableUrl = await domains.fetchStableUrl()
      expect(stableUrl).toBe('https://fallback-stable.example.com')
    })
  })
})
