import { describe, it, expect, beforeEach } from 'vitest';
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
  VideoTrimService
} from './videoTrimService';

describe('videoTrimService', () => {
  describe('formatTime', () => {
    it('formats time correctly', () => {
      expect(formatTime(0)).toBe('00:00:00.000');
      expect(formatTime(5.5)).toBe('00:00:05.500');
      expect(formatTime(65.123)).toBe('00:01:05.123');
      expect(formatTime(3661.456)).toBe('01:01:01.456');
    });
    
    it('handles edge cases', () => {
      expect(formatTime(null)).toBe('00:00:00.000');
      expect(formatTime(-1)).toBe('00:00:00.000');
      expect(formatTime(0)).toBe('00:00:00.000');
    });
  });
  
  describe('parseTime', () => {
    it('parses time string correctly', () => {
      expect(parseTime('00:00:00.000')).toBe(0);
      expect(parseTime('00:00:05.500')).toBe(5.5);
      expect(parseTime('00:01:05.123')).toBe(65.123);
      expect(parseTime('01:01:01.456')).toBe(3661.456);
    });
    
    it('handles edge cases', () => {
      expect(parseTime(null)).toBe(0);
      expect(parseTime('')).toBe(0);
      expect(parseTime('invalid')).toBe(0);
    });
  });
  
  describe('calculateDuration', () => {
    it('calculates duration correctly', () => {
      expect(calculateDuration(0, 10)).toBe(10);
      expect(calculateDuration(5, 15)).toBe(10);
      expect(calculateDuration(10, 10)).toBe(0);
    });
    
    it('handles negative durations', () => {
      expect(calculateDuration(15, 10)).toBe(0);
    });
  });
  
  describe('validateTrimPoints', () => {
    it('validates correct trim points', () => {
      const result = validateTrimPoints(5, 15, 30);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('rejects negative start time', () => {
      const result = validateTrimPoints(-1, 10, 30);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('negative');
    });
    
    it('rejects end time beyond video duration', () => {
      const result = validateTrimPoints(5, 35, 30);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed');
    });
    
    it('rejects start time after end time', () => {
      const result = validateTrimPoints(20, 10, 30);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('before');
    });
    
    it('rejects too short duration', () => {
      const result = validateTrimPoints(10, 10.05, 30);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
    });
  });
  
  describe('generateThumbnailTimestamps', () => {
    it('generates correct number of timestamps', () => {
      const timestamps = generateThumbnailTimestamps(0, 10, 5);
      expect(timestamps).toHaveLength(5);
    });
    
    it('generates evenly spaced timestamps', () => {
      const timestamps = generateThumbnailTimestamps(0, 10, 4);
      expect(timestamps[0]).toBeCloseTo(2, 1);
      expect(timestamps[1]).toBeCloseTo(4, 1);
      expect(timestamps[2]).toBeCloseTo(6, 1);
      expect(timestamps[3]).toBeCloseTo(8, 1);
    });
    
    it('handles different start times', () => {
      const timestamps = generateThumbnailTimestamps(5, 15, 4);
      expect(timestamps[0]).toBeCloseTo(7, 1);
      expect(timestamps[3]).toBeCloseTo(13, 1);
    });
  });
  
  describe('createTrimParams', () => {
    it('creates correct trim parameters', () => {
      const params = createTrimParams(5.5, 30.25);
      expect(params).toEqual({
        trim_start: 5.5,
        trim_end: 30.25,
        use_trimming: true
      });
    });
  });
  
  describe('frame conversion', () => {
    it('converts time to frame correctly', () => {
      expect(timeToFrame(1, 30)).toBe(30);
      expect(timeToFrame(0.5, 30)).toBe(15);
      expect(timeToFrame(2, 24)).toBe(48);
    });
    
    it('converts frame to time correctly', () => {
      expect(frameToTime(30, 30)).toBe(1);
      expect(frameToTime(15, 30)).toBe(0.5);
      expect(frameToTime(48, 24)).toBe(2);
    });
    
    it('snaps to nearest frame', () => {
      expect(snapToFrame(1.015, 30)).toBeCloseTo(1.0, 2);
      expect(snapToFrame(0.517, 30)).toBeCloseTo(0.5, 2);
    });
  });
  
  describe('VideoTrimService', () => {
    let service;
    
    beforeEach(() => {
      service = new VideoTrimService();
      service.initialize({ duration: 60, fps: 30 });
    });
    
    it('initializes correctly', () => {
      expect(service.videoDuration).toBe(60);
      expect(service.fps).toBe(30);
      expect(service.trimStart).toBe(0);
      expect(service.trimEnd).toBe(60);
    });
    
    it('sets trim start time', () => {
      const success = service.setTrimStart(10);
      expect(success).toBe(true);
      expect(service.trimStart).toBe(10);
    });
    
    it('sets trim end time', () => {
      const success = service.setTrimEnd(50);
      expect(success).toBe(true);
      expect(service.trimEnd).toBe(50);
    });
    
    it('rejects invalid trim start', () => {
      service.setTrimEnd(20);
      const success = service.setTrimStart(25);
      expect(success).toBe(false);
      expect(service.trimStart).toBe(0);
    });
    
    it('rejects invalid trim end', () => {
      service.setTrimStart(40);
      const success = service.setTrimEnd(30);
      expect(success).toBe(false);
      expect(service.trimEnd).toBe(60);
    });
    
    it('calculates trim duration', () => {
      service.setTrimStart(10);
      service.setTrimEnd(30);
      expect(service.getTrimDuration()).toBe(20);
    });
    
    it('gets trim parameters', () => {
      service.setTrimStart(5);
      service.setTrimEnd(25);
      const params = service.getTrimParams();
      expect(params.trim_start).toBe(5);
      expect(params.trim_end).toBe(25);
      expect(params.use_trimming).toBe(true);
    });
    
    it('resets trim', () => {
      service.setTrimStart(10);
      service.setTrimEnd(30);
      service.reset();
      expect(service.trimStart).toBe(0);
      expect(service.trimEnd).toBe(60);
    });
    
    it('detects if video is trimmed', () => {
      expect(service.isTrimmed()).toBe(false);
      service.setTrimStart(10);
      expect(service.isTrimmed()).toBe(true);
      service.reset();
      service.setTrimEnd(50);
      expect(service.isTrimmed()).toBe(true);
    });
  });
});
