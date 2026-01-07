/**
 * Real-time Preview Service
 * Handles real-time preview generation with debouncing and WebSocket integration
 */

/**
 * Preview quality levels
 */
export const PreviewQuality = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Preview status
 */
export const PreviewStatus = {
  IDLE: 'idle',
  PENDING: 'pending',
  GENERATING: 'generating',
  READY: 'ready',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

/**
 * Quality configuration
 */
const QUALITY_CONFIG = {
  [PreviewQuality.LOW]: {
    resolution: 256,
    refreshRate: 1000,
    debounce: 300
  },
  [PreviewQuality.MEDIUM]: {
    resolution: 512,
    refreshRate: 1500,
    debounce: 500
  },
  [PreviewQuality.HIGH]: {
    resolution: 1024,
    refreshRate: 2000,
    debounce: 800
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate preview request ID
 * @returns {string} Unique request ID
 */
export function generatePreviewId() {
  return `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get quality configuration
 * @param {string} quality - Quality level
 * @returns {object} Quality config
 */
export function getQualityConfig(quality) {
  return QUALITY_CONFIG[quality] || QUALITY_CONFIG[PreviewQuality.MEDIUM];
}

/**
 * Validate preview settings
 * @param {object} settings - Preview settings
 * @returns {object} Validation result
 */
export function validatePreviewSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { isValid: false, error: 'Invalid settings object' };
  }

  if (settings.quality && !Object.values(PreviewQuality).includes(settings.quality)) {
    return { isValid: false, error: 'Invalid quality level' };
  }

  if (settings.refreshRate && (settings.refreshRate < 500 || settings.refreshRate > 5000)) {
    return { isValid: false, error: 'Refresh rate must be between 500ms and 5000ms' };
  }

  return { isValid: true, error: null };
}

/**
 * RealtimePreviewService class
 * Main service for real-time preview operations
 */
export class RealtimePreviewService {
  constructor() {
    this.ws = null;
    this.previewCache = new Map();
    this.activeRequests = new Map();
    this.quality = PreviewQuality.MEDIUM;
    this.enabled = false;
    this.currentJobId = null;
    this.debouncedRequest = null;
    this.listeners = new Map();
  }

  /**
   * Initialize WebSocket connection
   * @param {string} url - WebSocket URL
   * @returns {Promise} Connection promise
   */
  async connect(url) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          console.log('Preview WebSocket connected');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('Preview WebSocket error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = () => {
          console.log('Preview WebSocket closed');
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cancelAllRequests();
  }

  /**
   * Handle incoming WebSocket message
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'preview_ready') {
        this.handlePreviewReady(data);
      } else if (data.type === 'preview_error') {
        this.handlePreviewError(data);
      }
    } catch (error) {
      console.error('Failed to parse preview message:', error);
    }
  }

  /**
   * Handle preview ready message
   * @param {object} data - Preview data
   */
  handlePreviewReady(data) {
    const { preview_id, preview_url, job_id } = data;
    
    // Update cache
    this.previewCache.set(preview_id, {
      url: preview_url,
      timestamp: Date.now(),
      jobId: job_id
    });

    // Update request status
    const request = this.activeRequests.get(preview_id);
    if (request) {
      request.status = PreviewStatus.READY;
      request.previewUrl = preview_url;
      this.activeRequests.set(preview_id, request);
    }

    // Notify listeners
    this.notifyListeners('preview_ready', data);
  }

  /**
   * Handle preview error message
   * @param {object} data - Error data
   */
  handlePreviewError(data) {
    const { preview_id, error } = data;
    
    const request = this.activeRequests.get(preview_id);
    if (request) {
      request.status = PreviewStatus.ERROR;
      request.error = error;
      this.activeRequests.set(preview_id, request);
    }

    this.notifyListeners('preview_error', data);
  }

  /**
   * Request preview generation
   * @param {number} jobId - Job ID
   * @param {object} settings - Preview settings
   * @returns {string} Preview request ID
   */
  requestPreview(jobId, settings) {
    if (!this.enabled) {
      return null;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return null;
    }

    const previewId = generatePreviewId();
    const config = getQualityConfig(this.quality);

    const request = {
      type: 'preview_request',
      preview_id: previewId,
      job_id: jobId,
      settings,
      preview_quality: this.quality,
      resolution: config.resolution,
      timestamp: Date.now()
    };

    // Store request
    this.activeRequests.set(previewId, {
      id: previewId,
      jobId,
      status: PreviewStatus.PENDING,
      timestamp: Date.now()
    });

    // Send request
    this.ws.send(JSON.stringify(request));

    return previewId;
  }

  /**
   * Request preview with debouncing
   * @param {number} jobId - Job ID
   * @param {object} settings - Preview settings
   */
  requestPreviewDebounced(jobId, settings) {
    if (!this.debouncedRequest) {
      const config = getQualityConfig(this.quality);
      this.debouncedRequest = debounce((id, s) => {
        this.requestPreview(id, s);
      }, config.debounce);
    }

    // Cancel previous requests for this job
    this.cancelRequestsForJob(jobId);

    this.debouncedRequest(jobId, settings);
  }

  /**
   * Cancel preview request
   * @param {string} previewId - Preview ID
   */
  cancelRequest(previewId) {
    const request = this.activeRequests.get(previewId);
    if (request && request.status === PreviewStatus.PENDING) {
      request.status = PreviewStatus.CANCELLED;
      this.activeRequests.set(previewId, request);

      // Send cancellation to server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'cancel_preview',
          preview_id: previewId
        }));
      }
    }
  }

  /**
   * Cancel all requests for a job
   * @param {number} jobId - Job ID
   */
  cancelRequestsForJob(jobId) {
    for (const [previewId, request] of this.activeRequests) {
      if (request.jobId === jobId && request.status === PreviewStatus.PENDING) {
        this.cancelRequest(previewId);
      }
    }
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    for (const previewId of this.activeRequests.keys()) {
      this.cancelRequest(previewId);
    }
  }

  /**
   * Get cached preview
   * @param {string} previewId - Preview ID
   * @returns {object|null} Cached preview or null
   */
  getCachedPreview(previewId) {
    return this.previewCache.get(previewId) || null;
  }

  /**
   * Clear preview cache
   */
  clearCache() {
    this.previewCache.clear();
  }

  /**
   * Set preview quality
   * @param {string} quality - Quality level
   */
  setQuality(quality) {
    if (Object.values(PreviewQuality).includes(quality)) {
      this.quality = quality;
      // Recreate debounced function with new config
      const config = getQualityConfig(quality);
      this.debouncedRequest = debounce((id, s) => {
        this.requestPreview(id, s);
      }, config.debounce);
    }
  }

  /**
   * Enable preview
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable preview
   */
  disable() {
    this.enabled = false;
    this.cancelAllRequests();
  }

  /**
   * Check if preview is enabled
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in preview event listener:', error);
        }
      });
    }
  }

  /**
   * Get active requests count
   * @returns {number} Number of active requests
   */
  getActiveRequestsCount() {
    let count = 0;
    for (const request of this.activeRequests.values()) {
      if (request.status === PreviewStatus.PENDING || request.status === PreviewStatus.GENERATING) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

/**
 * Create real-time preview service instance
 * @returns {RealtimePreviewService} Service instance
 */
export function useRealtimePreviewService() {
  return new RealtimePreviewService();
}

export default {
  PreviewQuality,
  PreviewStatus,
  debounce,
  generatePreviewId,
  getQualityConfig,
  validatePreviewSettings,
  RealtimePreviewService,
  useRealtimePreviewService
};
