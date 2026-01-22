/**
 * Utility functions for video editor
 * Adapted from movie-maker's Utils.js
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value (default: 0)
 * @param {number} max - Maximum value (default: 1)
 * @returns {number} Clamped value
 */
export function clamp(value, min = 0, max = 1) {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Get base filename from path
 * @param {string} filePath - Full file path
 * @returns {string} Base filename
 */
export function baseFileName(filePath) {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

/**
 * Check if file is a project file
 * @param {string} filePath - File path to check
 * @returns {boolean} True if project file
 */
export function isProjectFile(filePath) {
  if (!filePath) return false;
  return filePath.endsWith('.rmm') || filePath.endsWith('.movie-maker');
}

/**
 * Format time to H:MM:SS or MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00.00';
  }
  const hms = new Date(seconds * 1000).toISOString().substr(11, 11);
  if (hms.startsWith('00')) {
    return hms.substr(3);
  }
  return hms;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function readableBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default {
  clamp,
  baseFileName,
  isProjectFile,
  formatTime,
  readableBytes,
};

