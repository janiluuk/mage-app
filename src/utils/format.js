/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1:05", "12:30")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration with hours if needed (HH:MM:SS)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDurationWithHours(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB", "300 KB")
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Parse duration string (MM:SS or HH:MM:SS) to seconds
 * @param {string} duration - Duration string
 * @returns {number} Duration in seconds
 */
export function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') return 0;
  
  const parts = duration.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}
