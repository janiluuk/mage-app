/**
 * Service for managing batch generation of long story sequences
 * Handles chunking, progress tracking, and resumable generation
 */

export class BatchGenerationService {
  constructor() {
    this.batchId = null
    this.chunks = []
    this.currentChunk = 0
    this.totalFrames = 0
    this.completedFrames = 0
    this.failedFrames = []
    this.progressCallbacks = []
    this.errorCallbacks = []
    this.completeCallbacks = []
    this.isPaused = false
    this.isCancelled = false
  }

  /**
   * Initialize a new batch generation session
   * @param {Object} config - Story configuration
   * @param {Object} options - Generation options
   */
  initialize(config, options = {}) {
    this.batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    this.totalFrames = config.totalFrames || 0
    this.completedFrames = 0
    this.failedFrames = []
    this.isPaused = false
    this.isCancelled = false

    const {
      chunkSize = 30, // Default: process 30 frames per chunk
      maxRetries = 3,
      retryDelay = 5000,
      saveInterval = 10, // Save progress every 10 frames
      quality = 'medium',
      priority = 'normal'
    } = options

    this.options = {
      chunkSize,
      maxRetries,
      retryDelay,
      saveInterval,
      quality,
      priority
    }

    // Split frames into manageable chunks
    this.chunks = this._createChunks(config.scenes || [], chunkSize)
    this.currentChunk = 0

    // Save initial state
    this._saveState()

    return {
      batchId: this.batchId,
      totalChunks: this.chunks.length,
      totalFrames: this.totalFrames,
      estimatedDuration: this._estimateDuration()
    }
  }

  /**
   * Start or resume batch generation
   */
  async start() {
    if (this.isCancelled) {
      throw new Error('Batch generation was cancelled')
    }

    this.isPaused = false

    for (let i = this.currentChunk; i < this.chunks.length; i++) {
      if (this.isPaused || this.isCancelled) {
        break
      }

      this.currentChunk = i
      const chunk = this.chunks[i]

      try {
        await this._processChunk(chunk)
      } catch (error) {
        this._handleError(error, chunk)
        
        // Decide whether to continue or stop based on error severity
        if (error.fatal) {
          this.cancel()
          break
        }
      }

      // Save progress periodically
      if (this.completedFrames % this.options.saveInterval === 0) {
        this._saveState()
      }
    }

    if (this.completedFrames === this.totalFrames && !this.isCancelled) {
      this._complete()
    }
  }

  /**
   * Pause batch generation
   */
  pause() {
    this.isPaused = true
    this._saveState()
    this._notifyProgress({
      status: 'paused',
      completedFrames: this.completedFrames,
      totalFrames: this.totalFrames,
      currentChunk: this.currentChunk
    })
  }

  /**
   * Resume batch generation
   */
  resume() {
    if (!this.isPaused) {
      return
    }
    this.start()
  }

  /**
   * Cancel batch generation
   */
  cancel() {
    this.isCancelled = true
    this.isPaused = false
    this._clearState()
    this._notifyProgress({
      status: 'cancelled',
      completedFrames: this.completedFrames,
      totalFrames: this.totalFrames
    })
  }

  /**
   * Retry failed frames
   */
  async retryFailed() {
    if (this.failedFrames.length === 0) {
      return
    }

    const failedChunk = {
      id: 'retry_chunk',
      frames: this.failedFrames,
      scene: 'retry'
    }

    this.failedFrames = []
    
    try {
      await this._processChunk(failedChunk)
    } catch (error) {
      this._handleError(error, failedChunk)
    }
  }

  /**
   * Register progress callback
   */
  onProgress(callback) {
    this.progressCallbacks.push(callback)
  }

  /**
   * Register error callback
   */
  onError(callback) {
    this.errorCallbacks.push(callback)
  }

  /**
   * Register completion callback
   */
  onComplete(callback) {
    this.completeCallbacks.push(callback)
  }

  /**
   * Get current progress
   */
  getProgress() {
    return {
      batchId: this.batchId,
      status: this._getStatus(),
      completedFrames: this.completedFrames,
      totalFrames: this.totalFrames,
      progress: Math.floor((this.completedFrames / this.totalFrames) * 100),
      currentChunk: this.currentChunk,
      totalChunks: this.chunks.length,
      failedFrames: this.failedFrames.length,
      estimatedTimeRemaining: this._estimateTimeRemaining()
    }
  }

  /**
   * Restore from saved state
   */
  static async restore(batchId) {
    const stateKey = `batch_generation_${batchId}`
    const stateData = localStorage.getItem(stateKey)
    
    if (!stateData) {
      throw new Error('Batch generation state not found')
    }

    const state = JSON.parse(stateData)
    const service = new BatchGenerationService()
    
    Object.assign(service, state)
    
    return service
  }

  // Private methods

  _createChunks(scenes, chunkSize) {
    const chunks = []
    let chunkId = 0

    scenes.forEach(scene => {
      const frames = scene.frames || []
      
      for (let i = 0; i < frames.length; i += chunkSize) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          scene: scene.name,
          sceneId: scene.id,
          frames: frames.slice(i, i + chunkSize),
          startFrame: frames[i].id,
          endFrame: frames[Math.min(i + chunkSize - 1, frames.length - 1)].id
        })
      }
    })

    return chunks
  }

  async _processChunk(chunk) {
    this._notifyProgress({
      status: 'processing',
      currentChunk: chunk,
      completedFrames: this.completedFrames,
      totalFrames: this.totalFrames
    })

    // Process each frame in the chunk
    for (const frame of chunk.frames) {
      if (this.isPaused || this.isCancelled) {
        break
      }

      try {
        await this._processFrame(frame, chunk)
        this.completedFrames++
        
        this._notifyProgress({
          status: 'processing',
          frame: frame,
          completedFrames: this.completedFrames,
          totalFrames: this.totalFrames
        })
      } catch (error) {
        this.failedFrames.push({
          frame: frame,
          chunk: chunk.id,
          error: error.message,
          retries: 0
        })
        
        this._notifyError(error, frame)
      }
    }
  }

  async _processFrame(frame, chunk) {
    // Simulate frame processing
    // In real implementation, this would call the actual generation API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error(`Failed to generate frame ${frame.id}`))
        } else {
          resolve({
            frameId: frame.id,
            chunkId: chunk.id,
            scene: chunk.scene,
            prompt: frame.prompt,
            timestamp: Date.now()
          })
        }
      }, 100) // Simulate processing time
    })
  }

  _handleError(error, chunk) {
    this._notifyError(error, chunk)
    
    // Log error for debugging
    console.error(`Batch generation error in chunk ${chunk.id}:`, error)
  }

  _complete() {
    this._notifyProgress({
      status: 'complete',
      completedFrames: this.completedFrames,
      totalFrames: this.totalFrames,
      failedFrames: this.failedFrames.length
    })

    this.completeCallbacks.forEach(callback => {
      callback({
        batchId: this.batchId,
        completedFrames: this.completedFrames,
        totalFrames: this.totalFrames,
        failedFrames: this.failedFrames,
        duration: this._calculateDuration()
      })
    })

    this._clearState()
  }

  _notifyProgress(data) {
    this.progressCallbacks.forEach(callback => callback(data))
  }

  _notifyError(error, context) {
    this.errorCallbacks.forEach(callback => callback(error, context))
  }

  _getStatus() {
    if (this.isCancelled) return 'cancelled'
    if (this.isPaused) return 'paused'
    if (this.completedFrames === this.totalFrames) return 'complete'
    if (this.completedFrames > 0) return 'processing'
    return 'pending'
  }

  _saveState() {
    const stateKey = `batch_generation_${this.batchId}`
    const state = {
      batchId: this.batchId,
      chunks: this.chunks,
      currentChunk: this.currentChunk,
      totalFrames: this.totalFrames,
      completedFrames: this.completedFrames,
      failedFrames: this.failedFrames,
      options: this.options,
      isPaused: this.isPaused,
      savedAt: Date.now()
    }
    
    localStorage.setItem(stateKey, JSON.stringify(state))
  }

  _clearState() {
    const stateKey = `batch_generation_${this.batchId}`
    localStorage.removeItem(stateKey)
  }

  _estimateDuration() {
    // Estimate based on average frame generation time
    const avgTimePerFrame = 3 // seconds
    const totalSeconds = this.totalFrames * avgTimePerFrame
    return this._formatDuration(totalSeconds)
  }

  _estimateTimeRemaining() {
    if (this.completedFrames === 0) {
      return this._estimateDuration()
    }

    const avgTimePerFrame = 3 // This should be calculated from actual generation times
    const remainingFrames = this.totalFrames - this.completedFrames
    const remainingSeconds = remainingFrames * avgTimePerFrame
    
    return this._formatDuration(remainingSeconds)
  }

  _calculateDuration() {
    // Calculate actual duration from start to finish
    // This would use actual timestamps in a real implementation
    return '00:00:00'
  }

  _formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }
}

export default BatchGenerationService
