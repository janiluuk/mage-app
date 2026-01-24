import { describe, it, expect } from 'vitest';
import { formatProcessingTime, formatDate, formatTime, getRelativeTime } from '@/utils/timeFormatters';

describe('timeFormatters', () => {
  describe('formatProcessingTime', () => {
    it('formats seconds to time string', () => {
      expect(formatProcessingTime(45)).toBe('45s');
    });

    it('formats minutes and seconds', () => {
      expect(formatProcessingTime(125)).toBe('2m 5s');
    });

    it('handles zero seconds', () => {
      expect(formatProcessingTime(0)).toBe('0s');
    });

    it('handles exactly one minute', () => {
      expect(formatProcessingTime(60)).toBe('1m 0s');
    });

    it('returns N/A for null or undefined', () => {
      expect(formatProcessingTime(null)).toBe('N/A');
      expect(formatProcessingTime(undefined)).toBe('N/A');
    });

    it('rounds fractional seconds', () => {
      expect(formatProcessingTime(45.7)).toBe('46s');
      expect(formatProcessingTime(125.4)).toBe('2m 5s');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string', () => {
      const dateStr = '2024-01-24T12:30:00Z';
      const result = formatDate(dateStr);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns N/A for null or undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });

    it('accepts custom formatting options', () => {
      const dateStr = '2024-01-24T12:30:00Z';
      const result = formatDate(dateStr, { year: 'numeric', month: 'numeric' });
      expect(result).toBeTruthy();
    });
  });

  describe('formatTime', () => {
    it('formats ISO date string to time only', () => {
      const dateStr = '2024-01-24T12:30:45Z';
      const result = formatTime(dateStr);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns N/A for null or undefined', () => {
      expect(formatTime(null)).toBe('N/A');
      expect(formatTime(undefined)).toBe('N/A');
      expect(formatTime('')).toBe('N/A');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "just now" for recent timestamps', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 30000); // 30 seconds ago
      expect(getRelativeTime(recentDate.toISOString())).toBe('just now');
    });

    it('returns minutes ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 120000); // 2 minutes ago
      expect(getRelativeTime(date.toISOString())).toBe('2 minutes ago');
    });

    it('returns hours ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 7200000); // 2 hours ago
      expect(getRelativeTime(date.toISOString())).toBe('2 hours ago');
    });

    it('returns days ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 172800000); // 2 days ago
      expect(getRelativeTime(date.toISOString())).toBe('2 days ago');
    });

    it('returns N/A for null or undefined', () => {
      expect(getRelativeTime(null)).toBe('N/A');
      expect(getRelativeTime(undefined)).toBe('N/A');
      expect(getRelativeTime('')).toBe('N/A');
    });

    it('uses singular form for 1 unit', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneDayAgo = new Date(now.getTime() - 86400000);

      expect(getRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');
      expect(getRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');
      expect(getRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');
    });
  });
});
