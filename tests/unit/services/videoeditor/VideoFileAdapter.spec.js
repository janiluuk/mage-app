/**
 * Unit tests for VideoFileAdapter
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';

describe('VideoFileAdapter', () => {
  let adapter;
  const mockVideoData = {
    id: '123',
    url: 'https://example.com/video.mp4',
    fullPath: 'https://example.com/video.mp4',
    duration: 60,
    fps: 30,
    width: 1920,
    height: 1080,
    has_audio: true,
  };

  const mockMetadata = {
    format: {
      duration: 60,
      filename: 'video.mp4',
      format_name: 'mp4',
    },
    videoStream: {
      width: 1920,
      height: 1080,
      codec_name: 'h264',
      bit_rate: 5000000,
      avg_frame_rate: '30/1',
    },
    audioStream: {},
    hasAudio: true,
    fps: 30,
    duration: 60,
  };

  beforeEach(() => {
    // Mock AudioContext
    global.AudioContext = vi.fn(() => ({
      createMediaElementSource: vi.fn(() => ({
        connect: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        connect: vi.fn(),
        gain: { value: 1 },
      })),
      createAnalyser: vi.fn(() => ({
        connect: vi.fn(),
        frequencyBinCount: 256,
        getByteTimeDomainData: vi.fn(),
      })),
      destination: {},
    }));

    // Mock document.createElement
    const mockVideoElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      load: vi.fn(),
      crossOrigin: '',
      preload: '',
      src: '',
      currentTime: 0,
      duration: 60,
      paused: true,
      playbackRate: 1,
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'video') {
        return mockVideoElement;
      }
      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (adapter) {
      adapter.destroy();
      adapter = null;
    }
  });

  describe('constructor', () => {
    it('creates adapter with video data', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.videoData).toEqual(mockVideoData);
      expect(adapter.metadata).toEqual(mockMetadata);
    });

    it('creates adapter with default metadata if not provided', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      expect(adapter.videoData).toEqual(mockVideoData);
      expect(adapter.metadata).toBeDefined();
    });

    it('initializes with canPlay false', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      expect(adapter.canPlay).toBe(false);
    });
  });

  describe('videoUrl', () => {
    it('extracts URL from videoData.url', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      expect(adapter.videoUrl).toBe('https://example.com/video.mp4');
    });

    it('tries fullPath if url is not available', () => {
      const data = { fullPath: 'https://example.com/full.mp4' };
      adapter = new VideoFileAdapter(data);
      expect(adapter.videoUrl).toBe('https://example.com/full.mp4');
    });

    it('tries previewUrl if url and fullPath are not available', () => {
      const data = { previewUrl: 'https://example.com/preview.mp4' };
      adapter = new VideoFileAdapter(data);
      expect(adapter.videoUrl).toBe('https://example.com/preview.mp4');
    });

    it('returns null if no URL is available', () => {
      const data = { id: '123' };
      adapter = new VideoFileAdapter(data);
      expect(adapter.videoUrl).toBeNull();
    });
  });

  describe('element', () => {
    it('creates video element when accessed', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      const element = adapter.element;
      expect(element).toBeDefined();
      expect(document.createElement).toHaveBeenCalledWith('video');
    });

    it('sets video element properties correctly', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      const element = adapter.element;
      expect(element.crossOrigin).toBe('anonymous');
      expect(element.preload).toBe('auto');
      expect(element.src).toBe(mockVideoData.url);
    });

    it('returns same element on subsequent calls', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      const element1 = adapter.element;
      const element2 = adapter.element;
      expect(element1).toBe(element2);
    });

    it('does not create element if videoUrl is null', () => {
      const data = { id: '123' };
      adapter = new VideoFileAdapter(data);
      expect(adapter.element).toBeNull();
    });
  });

  describe('metadata properties', () => {
    it('returns correct duration from metadata', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.duration).toBe(60);
    });

    it('returns duration from videoData if metadata not available', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      expect(adapter.duration).toBe(60);
    });

    it('returns correct fps from metadata', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.fps).toBe(30);
    });

    it('returns correct dimensions from metadata', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.width).toBe(1920);
      expect(adapter.height).toBe(1080);
    });

    it('calculates aspect ratio correctly', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.aspectRatio).toBeCloseTo(1920 / 1080, 2);
    });

    it('returns hasAudio from metadata', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.hasAudio).toBe(true);
    });

    it('returns isAudio as false for video files', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      expect(adapter.isAudio).toBe(false);
    });
  });

  describe('setupAudioContext', () => {
    it('sets up audio context when element is ready', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      adapter.element; // Create element
      adapter.setupAudioContext();
      expect(adapter.audioContext).toBeDefined();
    });

    it('does not setup audio context if no element', () => {
      adapter = new VideoFileAdapter(mockVideoData, mockMetadata);
      adapter.setupAudioContext();
      // Should not throw error
      expect(adapter.audioContext).toBeDefined();
    });

    it('does not setup audio context if no audio', () => {
      const noAudioMetadata = { ...mockMetadata, hasAudio: false };
      adapter = new VideoFileAdapter(mockVideoData, noAudioMetadata);
      adapter.element;
      adapter.setupAudioContext();
      // Should handle gracefully
      expect(adapter._gainNode).toBeNull();
    });
  });

  describe('destroy', () => {
    it('cleans up resources', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      adapter.element; // Create element
      adapter.destroy();
      expect(adapter._element).toBeNull();
      expect(adapter._source).toBeNull();
    });

    it('handles destroy when element does not exist', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      adapter.destroy(); // Should not throw
      expect(adapter._element).toBeNull();
    });
  });

  describe('event emitter', () => {
    it('emits canplay event', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      const canplayHandler = vi.fn();
      adapter.on('canplay', canplayHandler);
      adapter.emit('canplay');
      expect(canplayHandler).toHaveBeenCalled();
    });

    it('sets canPlay to true when canplay event is emitted', () => {
      adapter = new VideoFileAdapter(mockVideoData);
      adapter.emit('canplay');
      expect(adapter.canPlay).toBe(true);
    });
  });
});

