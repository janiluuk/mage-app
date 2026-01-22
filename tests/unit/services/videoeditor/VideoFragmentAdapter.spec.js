/**
 * Unit tests for VideoFragmentAdapter
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';

describe('VideoFragmentAdapter', () => {
  let fragment;
  let videoFile;

  beforeEach(() => {
    videoFile = new VideoFileAdapter({
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });
    fragment = new VideoFragmentAdapter(videoFile);
  });

  describe('constructor', () => {
    it('creates fragment with default values', () => {
      expect(fragment.start).toBe(0);
      expect(fragment.end).toBe(1);
      expect(fragment.playbackRate).toBe(1);
      expect(fragment.volume).toBe(1);
      expect(fragment.video).toBe(videoFile);
    });

    it('assigns unique ID', () => {
      const frag1 = new VideoFragmentAdapter(videoFile);
      const frag2 = new VideoFragmentAdapter(videoFile);
      expect(frag1.id).not.toBe(frag2.id);
    });

    it('accepts custom ID', () => {
      const customId = 100;
      const frag = new VideoFragmentAdapter(videoFile, customId);
      expect(frag.id).toBe(customId);
    });
  });

  describe('portion', () => {
    it('calculates portion correctly', () => {
      fragment.start = 0.2;
      fragment.end = 0.8;
      expect(fragment.portion).toBeCloseTo(0.6, 10);
    });

    it('returns 1 when start is 0 and end is 1', () => {
      fragment.start = 0;
      fragment.end = 1;
      expect(fragment.portion).toBe(1);
    });

    it('returns 0 when start equals end', () => {
      fragment.start = 0.5;
      fragment.end = 0.5;
      expect(fragment.portion).toBe(0);
    });
  });

  describe('adjustedDuration', () => {
    it('calculates adjusted duration with playback rate', () => {
      fragment.start = 0;
      fragment.end = 0.5; // 30 seconds
      fragment.playbackRate = 2; // 2x speed
      expect(fragment.adjustedDuration).toBe(15); // 30 / 2
    });

    it('calculates adjusted duration considering portion', () => {
      fragment.start = 0.2; // Start at 20%
      fragment.end = 0.8; // End at 80% (60% of video = 36 seconds)
      fragment.playbackRate = 1.5; // 1.5x speed
      expect(fragment.adjustedDuration).toBeCloseTo(24, 10); // 36 / 1.5
    });

    it('returns 0 when video duration is 0', () => {
      const noDurationVideo = new VideoFileAdapter({ url: 'test.mp4', duration: 0 });
      const frag = new VideoFragmentAdapter(noDurationVideo);
      expect(frag.adjustedDuration).toBe(0);
    });

    it('handles NaN gracefully', () => {
      fragment.start = 0;
      fragment.end = 1;
      fragment.playbackRate = 0; // This would cause division issues
      const duration = fragment.adjustedDuration;
      expect(isNaN(duration) || duration === 0).toBe(true);
    });
  });

  describe('progress', () => {
    it('calculates progress within fragment', () => {
      fragment.start = 0.2;
      fragment.end = 0.8;
      
      // Mock video element
      const mockElement = {
        currentTime: 30, // 50% through video (0.5)
        duration: 60,
      };
      videoFile._element = mockElement;
      
      // Progress should be: (0.5 - 0.2) / 0.6 = 0.5
      expect(fragment.progress).toBeCloseTo(0.5, 2);
    });

    it('returns 0 when currentTime is before start', () => {
      fragment.start = 0.3;
      fragment.end = 0.8;
      
      const mockElement = {
        currentTime: 10, // Before start (0.167)
        duration: 60,
      };
      videoFile._element = mockElement;
      
      expect(fragment.progress).toBe(0);
    });

    it('returns 1 when currentTime is after end', () => {
      fragment.start = 0.2;
      fragment.end = 0.8;
      
      const mockElement = {
        currentTime: 50, // After end (0.833)
        duration: 60,
      };
      videoFile._element = mockElement;
      
      expect(fragment.progress).toBe(1);
    });

    it('returns 0 when element does not exist', () => {
      fragment.start = 0.2;
      fragment.end = 0.8;
      videoFile._element = null;
      
      expect(fragment.progress).toBe(0);
    });

    it('returns 0 when duration is 0', () => {
      fragment.start = 0.2;
      fragment.end = 0.8;
      
      const mockElement = {
        currentTime: 30,
        duration: 0,
      };
      videoFile._element = mockElement;
      
      expect(fragment.progress).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets video element to start point', () => {
      const mockElement = {
        pause: vi.fn(),
        currentTime: 30,
      };
      videoFile._element = mockElement;
      
      fragment.start = 0.3; // 18 seconds
      fragment.reset();
      
      expect(mockElement.pause).toHaveBeenCalled();
      expect(mockElement.currentTime).toBe(18);
    });

    it('handles reset when element does not exist', () => {
      videoFile._element = null;
      fragment.reset(); // Should not throw
    });
  });

  describe('fromObject', () => {
    it('creates fragment from object', () => {
      const obj = {
        id: 5,
        start: 0.3,
        end: 0.7,
        volume: 0.8,
        playbackRate: 1.5,
      };
      const frag = VideoFragmentAdapter.fromObject(videoFile, obj);
      
      expect(frag.id).toBe(5);
      expect(frag.start).toBe(0.3);
      expect(frag.end).toBe(0.7);
      expect(frag.volume).toBe(0.8);
      expect(frag.playbackRate).toBe(1.5);
      expect(frag.video).toBe(videoFile);
    });

    it('uses default values for missing properties', () => {
      const obj = {
        id: 10,
      };
      const frag = VideoFragmentAdapter.fromObject(videoFile, obj);
      
      expect(frag.start).toBe(0);
      expect(frag.end).toBe(1);
      expect(frag.volume).toBe(1);
      expect(frag.playbackRate).toBe(1);
    });
  });

  describe('toObject', () => {
    it('serializes fragment to object', () => {
      fragment.start = 0.3;
      fragment.end = 0.7;
      fragment.volume = 0.8;
      fragment.playbackRate = 1.5;
      
      const obj = fragment.toObject();
      
      expect(obj.id).toBe(fragment.id);
      expect(obj.start).toBe(0.3);
      expect(obj.end).toBe(0.7);
      expect(obj.volume).toBe(0.8);
      expect(obj.playbackRate).toBe(1.5);
      expect(obj.videoUrl).toBe(videoFile.videoUrl);
    });
  });
});

