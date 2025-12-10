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
      expect(domains.VIMAGE_API_URL).toBeDefined()
      expect(domains.SAMPLE_PROCESSED_VIDEO_URL).toBeDefined()
    })

    it('uses environment variables when provided', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_URL).toBe('https://test-api.example.com')
    })

    it('constructs API_BASE_URL from API_URL', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      delete process.env.VUE_APP_API_BASE_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_BASE_URL).toBe('https://test-api.example.com/api')
    })

    it('constructs API_V1_URL from API_URL', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      delete process.env.VUE_APP_API_V1_BASE_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_V1_URL).toBe('https://test-api.example.com/v1')
    })

    it('constructs VIDEO_PREVIEW_URL from API_URL', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      delete process.env.VUE_APP_VIDEO_PREVIEW_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.VIDEO_PREVIEW_URL).toBe('https://test-api.example.com/videos/')
    })

    it('constructs MODEL_PREVIEW_URL from API_URL', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      delete process.env.VUE_APP_MODEL_PREVIEW_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.MODEL_PREVIEW_URL).toBe('https://test-api.example.com/preview/model/')
    })

    it('constructs FALLBACK_IMAGE_URL from API_URL', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      delete process.env.VUE_APP_FALLBACK_IMAGE_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.FALLBACK_IMAGE_URL).toBe('https://test-api.example.com/images/notfound.jpg')
    })
  })

  describe('Environment Variable Overrides', () => {
    it('uses VUE_APP_API_BASE_URL when explicitly set', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      process.env.VUE_APP_API_BASE_URL = 'https://custom-base.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_BASE_URL).toBe('https://custom-base.example.com')
    })

    it('uses VUE_APP_API_V1_BASE_URL when explicitly set', async () => {
      process.env.VUE_APP_API_URL = 'https://test-api.example.com'
      process.env.VUE_APP_API_V1_BASE_URL = 'https://custom-v1.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_V1_URL).toBe('https://custom-v1.example.com')
    })

    it('uses VUE_APP_APP_URL when set', async () => {
      process.env.VUE_APP_APP_URL = 'https://app.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.APP_BASE_URL).toBe('https://app.example.com')
    })

    it('falls back to VUE_APP_BASE_URL for APP_BASE_URL', async () => {
      delete process.env.VUE_APP_APP_URL
      process.env.VUE_APP_BASE_URL = 'https://base.example.com'
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.APP_BASE_URL).toBe('https://base.example.com')
    })
  })

  describe('Default Values', () => {
    it('uses empty string as default when no environment variables are set', async () => {
      // Clear all relevant environment variables
      delete process.env.VUE_APP_API_URL
      delete process.env.VUE_APP_API_BASE_URL
      delete process.env.VUE_APP_STABLE_URL
      delete process.env.VUE_APP_VIMAGE_API_URL
      vi.resetModules()
      
      const domains = await import('./domains.js')
      expect(domains.API_URL).toBe('')
      expect(domains.API_BASE_URL).toBe('')
      expect(domains.STABLE_URL).toBe('')
      expect(domains.VIMAGE_API_URL).toBe('')
    })
  })

  describe('Type Safety', () => {
    it('exports values as strings', async () => {
      const domains = await import('./domains.js')
      expect(typeof domains.API_URL).toBe('string')
      expect(typeof domains.API_BASE_URL).toBe('string')
      expect(typeof domains.API_V1_URL).toBe('string')
      expect(typeof domains.VIDEO_PREVIEW_URL).toBe('string')
      expect(typeof domains.MODEL_PREVIEW_URL).toBe('string')
      expect(typeof domains.FALLBACK_IMAGE_URL).toBe('string')
      expect(typeof domains.APP_BASE_URL).toBe('string')
      expect(typeof domains.STABLE_URL).toBe('string')
      expect(typeof domains.VIMAGE_API_URL).toBe('string')
      expect(typeof domains.SAMPLE_PROCESSED_VIDEO_URL).toBe('string')
    })
  })
})
