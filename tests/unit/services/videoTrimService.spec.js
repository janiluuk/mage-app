import { describe, it, expect } from 'vitest';
import {
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
} from '@/services/videoTrimService';

describe('videoTrimService', () => {
  describe('formatTime', () => {
    it('formats zero seconds', () => {
      expect(formatTime(0)).toBe('00:00:00.000');
    });

    it('formats null/undefined as zero', () => {
      expect(formatTime(null)).toBe('00:00:00.000');
      expect(formatTime(undefined)).toBe('00:00:00.000');
    });

    it('formats negative as zero', () => {
      expect(formatTime(-5)).toBe('00:00:00.000');
    });

    it('formats seconds correctly', () => {
      expect(formatTime(5.123)).toBe('00:00:05.123');
    });

    it('formats minutes and seconds', () => {
      expect(formatTime(65.5)).toBe('00:01:05.500');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatTime(3661.001)).toBe('01:01:01.001');
    });
  });

  describe('parseTime', () => {
    it('parses null/empty as 0', () => {
      expect(parseTime(null)).toBe(0);
      expect(parseTime('')).toBe(0);
    });

    it('returns 0 for invalid format', () => {
      expect(parseTime('invalid')).toBe(0);
      expect(parseTime('12:34')).toBe(0); // Only 2 parts
    });

    it('parses HH:MM:SS format', () => {
      expect(parseTime('00:01:05.500')).toBeCloseTo(65.5, 3);
    });

    it('parses hours correctly', () => {
      expect(parseTime('01:00:00.000')).toBe(3600);
    });

    it('parses milliseconds', () => {
      expect(parseTime('00:00:01.123')).toBeCloseTo(1.123, 3);
    });
  });

  describe('calculateDuration', () => {
    it('returns difference', () => {
      expect(calculateDuration(2, 8)).toBe(6);
    });

    it('returns 0 when start >= end', () => {
      expect(calculateDuration(8, 2)).toBe(0);
      expect(calculateDuration(5, 5)).toBe(0);
    });
  });

  describe('validateTrimPoints', () => {
    it('returns valid for correct trim points', () => {
      const result = validateTrimPoints(0, 10, 10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects negative start', () => {
      const result = validateTrimPoints(-1, 10, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('rejects end > duration', () => {
      const result = validateTrimPoints(0, 15, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed');
    });

    it('rejects start >= end', () => {
      const result = validateTrimPoints(5, 5, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('before');
    });

    it('rejects segments shorter than 0.1s', () => {
      const result = validateTrimPoints(5, 5.05, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('0.1');
    });
  });

  describe('generateThumbnailTimestamps', () => {
    it('generates evenly spaced timestamps', () => {
      const timestamps = generateThumbnailTimestamps(0, 10, 4);
      expect(timestamps).toHaveLength(4);
      // Interval = 10 / 5 = 2; timestamps at 2, 4, 6, 8
      expect(timestamps[0]).toBeCloseTo(2, 5);
      expect(timestamps[3]).toBeCloseTo(8, 5);
    });

    it('respects start offset', () => {
      const timestamps = generateThumbnailTimestamps(5, 15, 2);
      expect(timestamps).toHaveLength(2);
      // Interval = 10 / 3 ≈ 3.33
      expect(timestamps[0]).toBeGreaterThan(5);
      expect(timestamps[1]).toBeLessThan(15);
    });
  });

  describe('createTrimParams', () => {
    it('returns trim params object', () => {
      const params = createTrimParams(2, 8);
      expect(params).toEqual({
        trim_start: 2,
        trim_end: 8,
        use_trimming: true,
      });
    });
  });

  describe('timeToFrame / frameToTime', () => {
    it('converts time to frame', () => {
      expect(timeToFrame(1, 30)).toBe(30);
      expect(timeToFrame(0.5, 24)).toBe(12);
    });

    it('converts frame to time', () => {
      expect(frameToTime(30, 30)).toBe(1);
      expect(frameToTime(12, 24)).toBe(0.5);
    });
  });

  describe('snapToFrame', () => {
    it('snaps time to nearest frame boundary', () => {
      // At 30fps, frame 0 = 0s, frame 1 = 0.0333s
      // snapToFrame(0.02, 30) → frame 0 → 0s
      expect(snapToFrame(0.02, 30)).toBe(0);
    });

    it('preserves exact frame boundaries', () => {
      expect(snapToFrame(1.0, 30)).toBeCloseTo(1.0, 5);
    });
  });

  describe('VideoTrimService', () => {
    it('initializes with video metadata', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 60, fps: 24 });
      expect(service.videoDuration).toBe(60);
      expect(service.fps).toBe(24);
      expect(service.trimStart).toBe(0);
      expect(service.trimEnd).toBe(60);
    });

    it('sets trim start with frame snapping', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      const result = service.setTrimStart(2.5);
      expect(result).toBe(true);
      expect(service.trimStart).toBeGreaterThanOrEqual(2.4);
      expect(service.trimStart).toBeLessThanOrEqual(2.6);
    });

    it('rejects invalid trim start', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      const result = service.setTrimStart(11); // Beyond end
      expect(result).toBe(false);
      expect(service.trimStart).toBe(0); // Unchanged
    });

    it('sets trim end with frame snapping', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      const result = service.setTrimEnd(7.5);
      expect(result).toBe(true);
      expect(service.trimEnd).toBeGreaterThanOrEqual(7.4);
      expect(service.trimEnd).toBeLessThanOrEqual(7.6);
    });

    it('calculates trim duration', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      service.setTrimStart(2);
      service.setTrimEnd(8);
      expect(service.getTrimDuration()).toBeCloseTo(6, 1);
    });

    it('generates trim params', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      service.setTrimStart(2);
      const params = service.getTrimParams();
      expect(params.use_trimming).toBe(true);
      expect(params.trim_start).toBeGreaterThanOrEqual(1.9);
    });

    it('resets to full duration', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      service.setTrimStart(3);
      service.reset();
      expect(service.trimStart).toBe(0);
      expect(service.trimEnd).toBe(10);
    });

    it('detects trimmed state', () => {
      const service = new VideoTrimService();
      service.initialize({ duration: 10, fps: 30 });
      expect(service.isTrimmed()).toBe(false);
      service.setTrimStart(1);
      expect(service.isTrimmed()).toBe(true);
    });
  });
});

