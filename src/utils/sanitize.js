import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Potentially dangerous HTML
 * @param {object} options - Sanitization options
 * @returns {string} - Safe HTML
 */
export function sanitize(dirty, options = {}) {
  const defaultOptions = {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'span': ['class'],
      'div': ['class'],
      'code': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {},
    selfClosing: ['br'],
  };

  return sanitizeHtml(dirty, { ...defaultOptions, ...options });
}

/**
 * Sanitize text content (removes all HTML tags)
 * @param {string} dirty - Potentially dangerous text
 * @returns {string} - Plain text with no HTML
 */
export function sanitizeText(dirty) {
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

/**
 * Sanitize user input for display
 * Removes dangerous characters while preserving basic formatting
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
export function sanitizeUserInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters
  let cleaned = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Sanitize HTML
  cleaned = sanitize(cleaned, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br'],
    allowedAttributes: {}
  });

  return cleaned;
}

/**
 * Escape HTML special characters
 * Use this when you need to display user content as plain text
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: schemes
 * @param {string} url - URL to sanitize
 * @returns {string} - Safe URL or empty string
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }

  // Remove whitespace
  url = url.trim();

  // Check for dangerous protocols
  const lowerUrl = url.toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasProtocol = allowedProtocols.some(p => lowerUrl.startsWith(p));
  
  // If it starts with //, it's protocol-relative
  if (!hasProtocol && !url.startsWith('//') && !url.startsWith('/') && !url.startsWith('#')) {
    // Relative URL without protocol - prepend https://
    url = 'https://' + url;
  }

  return url;
}

export default {
  sanitize,
  sanitizeText,
  sanitizeUserInput,
  escapeHtml,
  sanitizeUrl
};
