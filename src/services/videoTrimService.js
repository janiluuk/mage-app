/**
 * Video Trimming Service
 * Provides utilities for trimming video segments, calculating trim points,
 * and generating preview thumbnails.
 */

/**
 * Format time in seconds to HH:MM:SS.mmm format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) {
    return '00:00:00.000';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Parse time string (HH:MM:SS.mmm) to seconds
 * @param {string} timeString - Time string in HH:MM:SS.mmm format
 * @returns {number} Time in seconds
 */
export function parseTime(timeString) {
  if (!timeString) return 0;
  
  const parts = timeString.split(':');
  if (parts.length !== 3) return 0;
  
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const secondsParts = parts[2].split('.');
  const seconds = parseInt(secondsParts[0], 10) || 0;
  const milliseconds = secondsParts[1] ? parseInt(secondsParts[1].padEnd(3, '0'), 10) : 0;
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Calculate trim duration
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 * @returns {number} Duration in seconds
 */
export function calculateDuration(start, end) {
  return Math.max(0, end - start);
}

/**
 * Validate trim points
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 * @param {number} videoDuration - Total video duration in seconds
 * @returns {object} Validation result with isValid flag and error message
 */
export function validateTrimPoints(start, end, videoDuration) {
  if (start < 0) {
    return { isValid: false, error: 'Start time cannot be negative' };
  }
  
  if (end > videoDuration) {
    return { isValid: false, error: 'End time cannot exceed video duration' };
  }
  
  if (start >= end) {
    return { isValid: false, error: 'Start time must be before end time' };
  }
  
  const duration = calculateDuration(start, end);
  if (duration < 0.1) {
    return { isValid: false, error: 'Trimmed segment must be at least 0.1 seconds' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Generate thumbnail timestamps for a video segment
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 * @param {number} count - Number of thumbnails to generate
 * @returns {number[]} Array of timestamp positions in seconds
 */
export function generateThumbnailTimestamps(start, end, count = 10) {
  const duration = calculateDuration(start, end);
  const interval = duration / (count + 1);
  const timestamps = [];
  
  for (let i = 1; i <= count; i++) {
    timestamps.push(start + interval * i);
  }
  
  return timestamps;
}

/**
 * Create trim parameters for API submission
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 * @returns {object} Trim parameters object
 */
export function createTrimParams(start, end) {
  return {
    trim_start: start,
    trim_end: end,
    use_trimming: true
  };
}

/**
 * Calculate frame number from time
 * @param {number} time - Time in seconds
 * @param {number} fps - Frames per second (default: 30)
 * @returns {number} Frame number
 */
export function timeToFrame(time, fps = 30) {
  return Math.floor(time * fps);
}

/**
 * Calculate time from frame number
 * @param {number} frame - Frame number
 * @param {number} fps - Frames per second (default: 30)
 * @returns {number} Time in seconds
 */
export function frameToTime(frame, fps = 30) {
  return frame / fps;
}

/**
 * Snap time to nearest frame
 * @param {number} time - Time in seconds
 * @param {number} fps - Frames per second (default: 30)
 * @returns {number} Snapped time in seconds
 */
export function snapToFrame(time, fps = 30) {
  const frame = timeToFrame(time, fps);
  return frameToTime(frame, fps);
}

/**
 * VideoTrimService class
 * Main service for video trimming operations
 */
export class VideoTrimService {
  constructor() {
    this.trimStart = 0;
    this.trimEnd = 0;
    this.videoDuration = 0;
    this.fps = 30;
  }
  
  /**
   * Initialize with video metadata
   * @param {object} videoMeta - Video metadata containing duration and fps
   */
  initialize(videoMeta) {
    this.videoDuration = videoMeta.duration || 0;
    this.fps = videoMeta.fps || 30;
    this.trimStart = 0;
    this.trimEnd = this.videoDuration;
  }
  
  /**
   * Set trim start time
   * @param {number} time - Start time in seconds
   * @returns {boolean} Success flag
   */
  setTrimStart(time) {
    const snapped = snapToFrame(time, this.fps);
    const validation = validateTrimPoints(snapped, this.trimEnd, this.videoDuration);
    
    if (validation.isValid) {
      this.trimStart = snapped;
      return true;
    }
    
    return false;
  }
  
  /**
   * Set trim end time
   * @param {number} time - End time in seconds
   * @returns {boolean} Success flag
   */
  setTrimEnd(time) {
    const snapped = snapToFrame(time, this.fps);
    const validation = validateTrimPoints(this.trimStart, snapped, this.videoDuration);
    
    if (validation.isValid) {
      this.trimEnd = snapped;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get current trim duration
   * @returns {number} Duration in seconds
   */
  getTrimDuration() {
    return calculateDuration(this.trimStart, this.trimEnd);
  }
  
  /**
   * Get trim parameters for API
   * @returns {object} Trim parameters
   */
  getTrimParams() {
    return createTrimParams(this.trimStart, this.trimEnd);
  }
  
  /**
   * Reset trim to full video
   */
  reset() {
    this.trimStart = 0;
    this.trimEnd = this.videoDuration;
  }
  
  /**
   * Check if video is trimmed
   * @returns {boolean} True if video has been trimmed
   */
  isTrimmed() {
    return this.trimStart > 0 || this.trimEnd < this.videoDuration;
  }
}

/**
 * Create a new VideoTrimService instance
 * @returns {VideoTrimService} New service instance
 */
export function useVideoTrimService() {
  return new VideoTrimService();
}

export default {
  formatTime,
  parseTime,
  calculateDuration,
  validateTrimPoints,
  generateThumbnailTimestamps,
  createTrimParams,
  timeToFrame,
  frameToTime,
  snapToFrame,
  VideoTrimService,
  useVideoTrimService
};
