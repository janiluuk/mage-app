/**
 * Centralized error handling utility
 * Provides consistent error formatting and logging across the application
 * @module errorHandler
 */

/**
 * Normalize error to a standard format
 * @param {Error|string|Object} error - The error to normalize
 * @param {string} context - Context where the error occurred (e.g., 'VideoJobService.list')
 * @param {boolean} skipLogging - Skip console logging (used internally to prevent duplicate logs)
 * @returns {Object} Normalized error object with message, code, and context
 * @property {string} message - Human-readable error message
 * @property {number|null} code - HTTP status code or error code
 * @property {string} context - Context where error occurred
 * @property {Error|Object} original - Original error object
 * @property {string} timestamp - ISO timestamp of when error occurred
 */
export function normalizeError(error, context = '', skipLogging = false) {
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
    // Extract message from API error responses first
    if (error.response?.data) {
      const data = error.response.data;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        message = data.errors[0].detail || data.errors[0].title || message;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      }
      code = error.response.status || code;
    } else {
      // Only use toString() as last resort for non-API errors with actual content
      const errorStr = error.error || error.message;
      if (errorStr) {
        message = errorStr;
      }
    }
    code = code || error.code || error.status || null;
    originalError = error;
  }

  const normalized = {
    message,
    code,
    context,
    original: originalError,
    timestamp: new Date().toISOString()
  };

  // Log in development (unless explicitly skipped to prevent duplicates)
  if (!skipLogging && import.meta.env.DEV) {
    console.error(`[ErrorHandler] ${context}:`, normalized);
  }

  return normalized;
}

/**
 * Create a user-friendly error message
 * @param {Error|string|Object} error - The error to format
 * @param {string} defaultMessage - Default message if error cannot be parsed
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error, defaultMessage = 'Something went wrong. Please try again.') {
  // Extract status code directly if available
  const statusCode = error?.response?.status || error?.status || error?.code;
  
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

  // Return code-specific message if available
  if (statusCode && codeMessages[statusCode]) {
    return codeMessages[statusCode];
  }

  // Normalize error to extract message
  const normalized = normalizeError(error, '', true); // Skip logging here to avoid duplicates
  
  // Return the error message if it's user-friendly, otherwise return default
  if (normalized.message && normalized.message !== 'An unexpected error occurred' && normalized.message.length < 200) {
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

  // Normalize error (skip internal logging, we'll log once below)
  const normalized = normalizeError(error, context, true);
  const userMessage = getUserFriendlyMessage(error, defaultMessage);

  if (toast && typeof toast.add === 'function') {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: userMessage,
      life: 5000
    });
  }

  // Log once, respecting the logError option
  if (logError) {
    console.error(`[ErrorHandler] ${context}:`, normalized);
  }

  return normalized;
}

export default {
  normalizeError,
  getUserFriendlyMessage,
  handleError
};
