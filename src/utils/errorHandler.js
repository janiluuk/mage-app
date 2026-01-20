/**
 * Centralized error handling utility
 * Provides consistent error formatting and logging across the application
 * @module errorHandler
 */

/**
 * Normalize error to a standard format
 * @param {Error|string|Object} error - The error to normalize
 * @param {string} context - Context where the error occurred (e.g., 'VideoJobService.list')
 * @returns {Object} Normalized error object with message, code, and context
 * @property {string} message - Human-readable error message
 * @property {number|null} code - HTTP status code or error code
 * @property {string} context - Context where error occurred
 * @property {Error|Object} original - Original error object
 * @property {string} timestamp - ISO timestamp of when error occurred
 */
export function normalizeError(error, context = '') {
  let message = 'An unexpected error occurred';
  let code = null;
  let originalError = error;

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message || message;
    code = error.code || error.status || null;
    originalError = error;
  } else if (error && typeof error === 'object') {
    // Check for API error response structure first (before toString)
    if (error.response) {
      // Extract status code
      if (error.response.status) {
        code = error.response.status;
      }
      
      // Extract message from response data
      if (error.response.data) {
        const data = error.response.data;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          message = data.errors[0].detail || data.errors[0].title || message;
        } else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        }
      }
      
      // If no message found in data, try error object properties
      if (message === 'An unexpected error occurred') {
        message = error.message || error.error || message;
      }
    } else {
      // Regular object error (no response property)
      message = error.message || error.error;
      if (!message && typeof error.toString === 'function') {
        const str = error.toString();
        // Only use toString if it's not the default [object Object]
        if (str !== '[object Object]') {
          message = str;
        }
      }
      if (!message) {
        message = 'An unexpected error occurred';
      }
      code = error.code || error.status || null;
    }
    originalError = error;
  }

  const normalized = {
    message,
    code,
    context,
    original: originalError,
    timestamp: new Date().toISOString()
  };

  return normalized;
}

/**
 * Create a user-friendly error message
 * @param {Error|string|Object} error - The error to format
 * @param {string} defaultMessage - Default message if error cannot be parsed
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error, defaultMessage = 'Something went wrong. Please try again.') {
  const normalized = normalizeError(error);
  
  // Map common error codes to user-friendly messages
  const codeMessages = {
    400: 'Invalid request. Please check your input.',
    401: 'You are not authorized. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    422: 'The request could not be processed. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'A server error occurred. Please try again later.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service temporarily unavailable. Please try again later.',
  };

  if (normalized.code && codeMessages[normalized.code]) {
    return codeMessages[normalized.code];
  }

  // Return the error message if it's user-friendly, otherwise return default
  if (normalized.message && normalized.message.length < 200) {
    return normalized.message;
  }

  return defaultMessage;
}

/**
 * Handle API error with optional toast notification
 * @param {Error|string|Object} error - The error to handle
 * @param {Object} options - Options for error handling
 * @param {string} options.context - Context where error occurred
 * @param {Object} options.toast - Toast service (optional)
 * @param {string} options.defaultMessage - Default message for toast
 * @param {boolean} options.logError - Whether to log error (default: true in dev)
 * @returns {Object} Normalized error object
 */
export function handleError(error, options = {}) {
  const {
    context = '',
    toast = null,
    defaultMessage = 'An error occurred',
    logError = import.meta.env.DEV
  } = options;

  const normalized = normalizeError(error, context);
  const userMessage = getUserFriendlyMessage(error, defaultMessage);

  if (toast && typeof toast.add === 'function') {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: userMessage,
      life: 5000
    });
  }

  // Log in development or if explicitly requested
  if (logError) {
    if (import.meta.env.DEV) {
      console.error(`[ErrorHandler] ${context}:`, normalized);
    }
  }

  return normalized;
}

export default {
  normalizeError,
  getUserFriendlyMessage,
  handleError
};
