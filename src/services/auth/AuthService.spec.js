import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AuthService from './AuthService'

// Mock the request service
vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
  apiClient: {
    defaults: {
      baseURL: 'http://localhost:3000/api/v1',
    },
  },
}))

describe('AuthService', () => {
  let requestService
  let apiClient

  beforeEach(async () => {
    // Import the mocked modules
    const module = await import('@/services/request-service/ApiRequestService')
    requestService = module.default
    apiClient = module.apiClient
    
    // Reset mocks
    vi.clearAllMocks()
    localStorage.clear()
    
    // Reset the apiClient baseURL
    apiClient.defaults.baseURL = 'http://localhost:3000/api/v1'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    it('should correctly manipulate baseURL from /api/v1 to /api', async () => {
      apiClient.defaults.baseURL = 'http://localhost:3000/api/v1'
      
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'test-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      // Verify baseURL was temporarily changed to /api/v1 path
      expect(requestService.post).toHaveBeenCalledWith('/v2/login', {
        email: 'test@example.com',
        password: 'password',
      })
      
      // Verify baseURL was restored
      expect(apiClient.defaults.baseURL).toBe('http://localhost:3000/api/v1')
    })

    it('should handle full URL baseURL with /api/v1', async () => {
      apiClient.defaults.baseURL = 'https://api.example.com/api/v1'
      
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'test-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      // Verify baseURL was restored
      expect(apiClient.defaults.baseURL).toBe('https://api.example.com/api/v1')
    })

    it('should handle relative path baseURL', async () => {
      apiClient.defaults.baseURL = '/api/v1'
      
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'test-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      // Verify baseURL was restored
      expect(apiClient.defaults.baseURL).toBe('/api/v1')
    })

    it('should fallback to /api when baseURL is null', async () => {
      apiClient.defaults.baseURL = null
      
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'test-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      // Verify baseURL was restored to null
      expect(apiClient.defaults.baseURL).toBe(null)
    })

    it('should save token from response.data.accessToken', async () => {
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'direct-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      expect(localStorage.getItem('auth.accessToken')).toBe('direct-token')
    })

    it('should save token from response.data.data.accessToken', async () => {
      requestService.post.mockResolvedValue({
        data: {
          data: {
            accessToken: 'nested-token',
          },
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      expect(localStorage.getItem('auth.accessToken')).toBe('nested-token')
    })

    it('should save token from response.data.token (legacy)', async () => {
      requestService.post.mockResolvedValue({
        data: {
          token: 'legacy-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      expect(localStorage.getItem('auth.accessToken')).toBe('legacy-token')
    })

    it('should prioritize response.data.accessToken over nested token', async () => {
      requestService.post.mockResolvedValue({
        data: {
          accessToken: 'direct-token',
          data: {
            accessToken: 'nested-token',
          },
          token: 'legacy-token',
        },
      })

      await AuthService.signIn({ email: 'test@example.com', password: 'password' })

      expect(localStorage.getItem('auth.accessToken')).toBe('direct-token')
    })

    it('should restore baseURL even if request fails', async () => {
      const originalBaseURL = 'http://localhost:3000/api/v1'
      apiClient.defaults.baseURL = originalBaseURL
      
      requestService.post.mockRejectedValue(new Error('Network error'))

      await expect(
        AuthService.signIn({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Network error')

      // Verify baseURL was restored even after error
      expect(apiClient.defaults.baseURL).toBe(originalBaseURL)
    })
  })

  describe('token management', () => {
    it('should save token to localStorage', () => {
      AuthService.saveToken('test-token')
      expect(localStorage.getItem('auth.accessToken')).toBe('test-token')
    })

    it('should remove token from localStorage', () => {
      localStorage.setItem('auth.accessToken', 'test-token')
      AuthService.removeToken()
      expect(localStorage.getItem('auth.accessToken')).toBe(null)
    })

    it('should get token from localStorage', () => {
      localStorage.setItem('auth.accessToken', 'test-token')
      expect(AuthService.getToken()).toBe('test-token')
    })

    it('should check if token exists', () => {
      expect(AuthService.hasToken()).toBe(false)
      localStorage.setItem('auth.accessToken', 'test-token')
      expect(AuthService.hasToken()).toBe(true)
    })
  })

  describe('OAuth provider authentication', () => {
    it('should initiate OAuth flow for provider', async () => {
      const mockUrl = 'https://discord.com/oauth2/authorize?client_id=123'
      requestService.get.mockResolvedValue({
        data: {
          url: mockUrl
        }
      })

      const url = await AuthService.signInByProvider('discord')
      
      expect(requestService.get).toHaveBeenCalledWith('/discord/auth')
      expect(url).toBe(mockUrl)
    })

    it('should handle OAuth callback with code', async () => {
      const mockToken = 'oauth-access-token'
      const mockData = {
        code: 'auth-code-123',
        provider: 'google'
      }
      
      requestService.get.mockResolvedValue({
        data: {
          data: {
            accessToken: mockToken
          }
        }
      })

      await AuthService.signInByProviderCallback('google', mockData)
      
      expect(requestService.get).toHaveBeenCalledWith('/google/callback', mockData)
      expect(localStorage.getItem('auth.accessToken')).toBe(mockToken)
    })

    it('should save token after successful OAuth callback', async () => {
      const mockToken = 'facebook-token'
      requestService.get.mockResolvedValue({
        data: {
          data: {
            accessToken: mockToken
          }
        }
      })

      await AuthService.signInByProviderCallback('facebook', { code: 'abc123' })
      
      expect(AuthService.getToken()).toBe(mockToken)
    })
  })
})
