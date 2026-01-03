import { describe, it, expect, beforeEach, vi } from 'vitest'
import BatchGenerationService from '@/services/story/BatchGenerationService'

describe('BatchGenerationService', () => {
  let service

  beforeEach(() => {
    service = new BatchGenerationService()
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('initialization', () => {
    it('creates a new service instance', () => {
      expect(service).toBeDefined()
      expect(service.batchId).toBeNull()
      expect(service.totalFrames).toBe(0)
      expect(service.completedFrames).toBe(0)
    })

    it('initializes with config', () => {
      const config = {
        totalFrames: 100,
        scenes: [
          {
            id: 'scene1',
            name: 'Test Scene',
            frames: [
              { id: 0, prompt: 'Frame 1' },
              { id: 30, prompt: 'Frame 2' }
            ]
          }
        ]
      }

      const result = service.initialize(config)

      expect(service.batchId).toBeTruthy()
      expect(service.totalFrames).toBe(100)
      expect(result).toHaveProperty('batchId')
      expect(result).toHaveProperty('totalChunks')
      expect(result).toHaveProperty('estimatedDuration')
    })

    it('creates chunks from scenes', () => {
      const config = {
        totalFrames: 100,
        scenes: [
          {
            id: 'scene1',
            name: 'Scene 1',
            frames: Array.from({ length: 50 }, (_, i) => ({ id: i, prompt: `Frame ${i}` }))
          }
        ]
      }

      const options = { chunkSize: 10 }
      service.initialize(config, options)

      expect(service.chunks.length).toBeGreaterThan(0)
      expect(service.chunks[0]).toHaveProperty('frames')
      expect(service.chunks[0].frames.length).toBeLessThanOrEqual(10)
    })
  })

  describe('progress tracking', () => {
    beforeEach(() => {
      const config = {
        totalFrames: 100,
        scenes: [
          {
            id: 'scene1',
            name: 'Test',
            frames: [{ id: 0, prompt: 'Test' }]
          }
        ]
      }
      service.initialize(config)
    })

    it('tracks completion progress', () => {
      service.completedFrames = 50
      const progress = service.getProgress()

      expect(progress.progress).toBe(50)
      expect(progress.completedFrames).toBe(50)
      expect(progress.totalFrames).toBe(100)
    })

    it('calls progress callbacks', () => {
      const callback = vi.fn()
      service.onProgress(callback)

      service._notifyProgress({ status: 'test' })

      expect(callback).toHaveBeenCalledWith({ status: 'test' })
    })

    it('calculates status correctly', () => {
      expect(service._getStatus()).toBe('pending')

      service.completedFrames = 50
      expect(service._getStatus()).toBe('processing')

      service.isPaused = true
      expect(service._getStatus()).toBe('paused')

      service.isPaused = false
      service.isCancelled = true
      expect(service._getStatus()).toBe('cancelled')

      service.isCancelled = false
      service.completedFrames = service.totalFrames
      expect(service._getStatus()).toBe('complete')
    })
  })

  describe('state management', () => {
    it('saves state to localStorage', () => {
      const config = {
        totalFrames: 100,
        scenes: [{ id: 'test', name: 'Test', frames: [] }]
      }
      service.initialize(config)

      service._saveState()

      const stateKey = `batch_generation_${service.batchId}`
      const saved = localStorage.getItem(stateKey)
      expect(saved).toBeTruthy()

      const state = JSON.parse(saved)
      expect(state.batchId).toBe(service.batchId)
      expect(state.totalFrames).toBe(100)
    })

    it('clears state from localStorage', () => {
      const config = {
        totalFrames: 100,
        scenes: [{ id: 'test', name: 'Test', frames: [] }]
      }
      service.initialize(config)

      const stateKey = `batch_generation_${service.batchId}`
      service._saveState()
      expect(localStorage.getItem(stateKey)).toBeTruthy()

      service._clearState()
      expect(localStorage.getItem(stateKey)).toBeNull()
    })

    it('restores from saved state', async () => {
      const config = {
        totalFrames: 100,
        scenes: [{ id: 'test', name: 'Test', frames: [] }]
      }
      service.initialize(config)
      const batchId = service.batchId

      service._saveState()

      const restored = await BatchGenerationService.restore(batchId)

      expect(restored.batchId).toBe(batchId)
      expect(restored.totalFrames).toBe(100)
    })
  })

  describe('generation control', () => {
    beforeEach(() => {
      const config = {
        totalFrames: 10,
        scenes: [
          {
            id: 'scene1',
            name: 'Test',
            frames: [
              { id: 0, prompt: 'Frame 1' },
              { id: 5, prompt: 'Frame 2' }
            ]
          }
        ]
      }
      service.initialize(config, { chunkSize: 5 })
    })

    it('starts generation', async () => {
      expect(service.isPaused).toBe(false)
      expect(service.isCancelled).toBe(false)

      const startPromise = service.start()
      expect(service.isPaused).toBe(false)

      // Don't wait for completion in test
      service.cancel()
    })

    it('pauses generation', () => {
      service.pause()

      expect(service.isPaused).toBe(true)
    })

    it('cancels generation', () => {
      service.cancel()

      expect(service.isCancelled).toBe(true)
      expect(service.isPaused).toBe(false)
    })

    it('handles errors gracefully', () => {
      const errorCallback = vi.fn()
      service.onError(errorCallback)

      const error = new Error('Test error')
      const chunk = { id: 'test', frames: [] }

      service._handleError(error, chunk)

      expect(errorCallback).toHaveBeenCalledWith(error, chunk)
    })
  })

  describe('duration estimation', () => {
    beforeEach(() => {
      const config = {
        totalFrames: 120,
        scenes: [{ id: 'test', name: 'Test', frames: [] }]
      }
      service.initialize(config)
    })

    it('formats duration correctly', () => {
      expect(service._formatDuration(65)).toBe('1m 5s')
      expect(service._formatDuration(3665)).toBe('1h 1m 5s')
      expect(service._formatDuration(30)).toBe('30s')
    })

    it('estimates total duration', () => {
      const estimate = service._estimateDuration()
      expect(estimate).toBeTruthy()
      expect(typeof estimate).toBe('string')
    })

    it('estimates remaining time', () => {
      service.completedFrames = 40
      const remaining = service._estimateTimeRemaining()

      expect(remaining).toBeTruthy()
      expect(typeof remaining).toBe('string')
    })
  })

  describe('callback registration', () => {
    it('registers progress callback', () => {
      const callback = vi.fn()
      service.onProgress(callback)

      expect(service.progressCallbacks).toContain(callback)
    })

    it('registers error callback', () => {
      const callback = vi.fn()
      service.onError(callback)

      expect(service.errorCallbacks).toContain(callback)
    })

    it('registers complete callback', () => {
      const callback = vi.fn()
      service.onComplete(callback)

      expect(service.completeCallbacks).toContain(callback)
    })
  })
})
