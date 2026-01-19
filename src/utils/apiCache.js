/**
 * Simple in-memory cache for API responses
 * Prevents duplicate requests and provides basic caching
 * @module apiCache
 */

/**
 * API Cache class for managing cached API responses
 * @class ApiCache
 */
class ApiCache {
  /**
   * Create an ApiCache instance
   * @param {number} maxSize - Maximum number of cache entries (default: 100)
   * @param {number} defaultTTL - Default time-to-live in milliseconds (default: 60000)
   */
  constructor(maxSize = 100, defaultTTL = 60000) {
    /** @type {Map<string, Object>} */
    this.cache = new Map();
    /** @type {number} */
    this.maxSize = maxSize;
    /** @type {number} */
    this.defaultTTL = defaultTTL; // 60 seconds default
    /** @type {Map<string, Promise>} */
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicates
  }

  /**
   * Generate cache key from URL and params
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   * @private
   */
  _generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  /**
   * Check if cache entry is expired
   * @param {Object} entry - Cache entry
   * @returns {boolean} True if expired
   * @private
   */
  _isExpired(entry) {
    if (!entry.timestamp || !entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get cached value
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @returns {*} Cached value or null if not found/expired
   */
  get(url, params = {}) {
    const key = this._generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (this._isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached value
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @param {*} value - Value to cache
   * @param {number|null} ttl - Time-to-live in milliseconds (null uses default)
   */
  set(url, params = {}, value, ttl = null) {
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (first in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this._generateKey(url, params);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Remove specific cache entry
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   */
  delete(url, params = {}) {
    const key = this._generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Check if request is pending (prevents duplicate requests)
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @returns {boolean} True if request is pending
   */
  isPending(url, params = {}) {
    const key = this._generateKey(url, params);
    return this.pendingRequests.has(key);
  }

  /**
   * Mark request as pending
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @param {Promise} promise - Promise for the pending request
   * @returns {Promise} The same promise
   */
  setPending(url, params = {}, promise) {
    const key = this._generateKey(url, params);
    this.pendingRequests.set(key, promise);

    // Clean up when promise resolves/rejects
    promise
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    return promise;
  }

  /**
   * Get pending promise (for request deduplication)
   * @param {string} url - API endpoint URL
   * @param {Object} params - Query parameters
   * @returns {Promise|null} Pending promise or null
   */
  getPending(url, params = {}) {
    const key = this._generateKey(url, params);
    return this.pendingRequests.get(key) || null;
  }
}

// Export singleton instance as default, and class for testing
export { ApiCache };
export default new ApiCache(100, 60000); // 100 entries, 60s TTL
