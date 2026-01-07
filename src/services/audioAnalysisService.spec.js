import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VisualizationMode,
  ColorScheme,
  AudioAnalysisService,
  drawWaveform,
  drawSpectrum,
  useAudioAnalysisService
} from './audioAnalysisService';

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
  }
  
  createAnalyser() {
    return new MockAnalyser();
  }
  
  createMediaElementSource() {
    return new MockMediaElementSource();
  }
  
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

class MockAnalyser {
  constructor() {
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
    this.smoothingTimeConstant = 0.8;
    this.minDecibels = -90;
    this.maxDecibels = -10;
  }
  
  connect() {}
  disconnect() {}
  
  getByteTimeDomainData(array) {
    // Fill with mock waveform data (centered around 128)
    for (let i = 0; i < array.length; i++) {
      array[i] = 128 + Math.sin(i * 0.1) * 20;
    }
  }
  
  getByteFrequencyData(array) {
    // Fill with mock frequency data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 255);
    }
  }
}

class MockMediaElementSource {
  connect() {}
  disconnect() {}
}

describe('audioAnalysisService', () => {
  let originalAudioContext;
  
  beforeEach(() => {
    // Mock AudioContext
    originalAudioContext = global.AudioContext;
    global.AudioContext = MockAudioContext;
    global.webkitAudioContext = MockAudioContext;
  });
  
  afterEach(() => {
    global.AudioContext = originalAudioContext;
  });
  
  describe('VisualizationMode', () => {
    it('defines visualization modes', () => {
      expect(VisualizationMode.WAVEFORM).toBe('waveform');
      expect(VisualizationMode.SPECTRUM).toBe('spectrum');
      expect(VisualizationMode.SPECTROGRAM).toBe('spectrogram');
      expect(VisualizationMode.BARS).toBe('bars');
    });
  });
  
  describe('ColorScheme', () => {
    it('defines color schemes', () => {
      expect(ColorScheme.DEFAULT).toBe('default');
      expect(ColorScheme.RAINBOW).toBe('rainbow');
      expect(ColorScheme.MONOCHROME).toBe('monochrome');
      expect(ColorScheme.HEATMAP).toBe('heatmap');
    });
  });
  
  describe('AudioAnalysisService', () => {
    let service;
    let mockAudioElement;
    
    beforeEach(() => {
      service = new AudioAnalysisService();
      mockAudioElement = document.createElement('audio');
    });
    
    afterEach(() => {
      service.cleanup();
    });
    
    describe('constructor', () => {
      it('initializes with default values', () => {
        expect(service.audioContext).toBeNull();
        expect(service.analyser).toBeNull();
        expect(service.source).toBeNull();
        expect(service.audioElement).toBeNull();
        expect(service.isInitialized).toBe(false);
        expect(service.fftSize).toBe(2048);
      });
    });
    
    describe('initialize', () => {
      it('initializes audio context and analyser', () => {
        service.initialize(mockAudioElement);
        
        expect(service.audioContext).toBeDefined();
        expect(service.analyser).toBeDefined();
        expect(service.source).toBeDefined();
        expect(service.audioElement).toBe(mockAudioElement);
        expect(service.isInitialized).toBe(true);
      });
      
      it('uses custom options', () => {
        const options = {
          fftSize: 4096,
          smoothing: 0.5,
          minDecibels: -100,
          maxDecibels: -10
        };
        
        service.initialize(mockAudioElement, options);
        
        expect(service.analyser.fftSize).toBe(4096);
        expect(service.analyser.smoothingTimeConstant).toBe(0.5);
        expect(service.analyser.minDecibels).toBe(-100);
        expect(service.analyser.maxDecibels).toBe(-10);
      });
      
      it('cleans up previous initialization', () => {
        service.initialize(mockAudioElement);
        const firstContext = service.audioContext;
        
        service.initialize(mockAudioElement);
        
        expect(service.audioContext).not.toBe(firstContext);
      });
      
      it('throws error on initialization failure', () => {
        global.AudioContext = undefined;
        global.webkitAudioContext = undefined;
        
        expect(() => {
          service.initialize(mockAudioElement);
        }).toThrow('Audio analysis initialization failed');
      });
    });
    
    describe('getWaveformData', () => {
      it('returns empty array when not initialized', () => {
        const data = service.getWaveformData();
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBe(0);
      });
      
      it('returns waveform data when initialized', () => {
        service.initialize(mockAudioElement);
        const data = service.getWaveformData();
        
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBeGreaterThan(0);
      });
    });
    
    describe('getFrequencyData', () => {
      it('returns empty array when not initialized', () => {
        const data = service.getFrequencyData();
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBe(0);
      });
      
      it('returns frequency data when initialized', () => {
        service.initialize(mockAudioElement);
        const data = service.getFrequencyData();
        
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBeGreaterThan(0);
      });
    });
    
    describe('getVolumeLevel', () => {
      it('returns 0 when not initialized', () => {
        expect(service.getVolumeLevel()).toBe(0);
      });
      
      it('returns volume level when initialized', () => {
        service.initialize(mockAudioElement);
        const volume = service.getVolumeLevel();
        
        expect(volume).toBeGreaterThanOrEqual(0);
        expect(volume).toBeLessThanOrEqual(100);
      });
    });
    
    describe('detectPeak', () => {
      it('returns false when not initialized', () => {
        expect(service.detectPeak()).toBe(false);
      });
      
      it('detects peaks in frequency data', () => {
        service.initialize(mockAudioElement);
        
        // Mock high frequency value
        service.analyser.getByteFrequencyData = (array) => {
          array[0] = 250; // High value
        };
        
        expect(service.detectPeak(200)).toBe(true);
      });
      
      it('returns false when no peaks detected', () => {
        service.initialize(mockAudioElement);
        
        // Mock low frequency values
        service.analyser.getByteFrequencyData = (array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = 50;
          }
        };
        
        expect(service.detectPeak(200)).toBe(false);
      });
    });
    
    describe('getFrequencyBands', () => {
      it('returns zero-filled array when not initialized', () => {
        const bands = service.getFrequencyBands(8);
        
        expect(bands).toHaveLength(8);
        expect(bands.every(b => b === 0)).toBe(true);
      });
      
      it('returns frequency bands when initialized', () => {
        service.initialize(mockAudioElement);
        const bands = service.getFrequencyBands(8);
        
        expect(bands).toHaveLength(8);
        expect(bands.every(b => b >= 0 && b <= 255)).toBe(true);
      });
      
      it('supports custom band count', () => {
        service.initialize(mockAudioElement);
        
        expect(service.getFrequencyBands(4)).toHaveLength(4);
        expect(service.getFrequencyBands(16)).toHaveLength(16);
      });
    });
    
    describe('getDominantFrequency', () => {
      it('returns 0 when not initialized', () => {
        expect(service.getDominantFrequency()).toBe(0);
      });
      
      it('returns dominant frequency when initialized', () => {
        service.initialize(mockAudioElement);
        const freq = service.getDominantFrequency();
        
        expect(freq).toBeGreaterThanOrEqual(0);
      });
    });
    
    describe('cleanup', () => {
      it('cleans up resources', () => {
        service.initialize(mockAudioElement);
        service.cleanup();
        
        expect(service.source).toBeNull();
        expect(service.analyser).toBeNull();
        expect(service.audioContext).toBeNull();
        expect(service.audioElement).toBeNull();
        expect(service.isInitialized).toBe(false);
      });
      
      it('handles cleanup when not initialized', () => {
        expect(() => service.cleanup()).not.toThrow();
      });
    });
    
    describe('isReady', () => {
      it('returns false when not initialized', () => {
        expect(service.isReady()).toBe(false);
      });
      
      it('returns true when initialized', () => {
        service.initialize(mockAudioElement);
        expect(service.isReady()).toBe(true);
      });
    });
    
    describe('getBufferLength', () => {
      it('returns 0 when not initialized', () => {
        expect(service.getBufferLength()).toBe(0);
      });
      
      it('returns buffer length when initialized', () => {
        service.initialize(mockAudioElement);
        const length = service.getBufferLength();
        
        expect(length).toBeGreaterThan(0);
      });
    });
  });
  
  describe('drawWaveform', () => {
    let canvas;
    let ctx;
    
    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 300;
      ctx = canvas.getContext('2d');
      
      // Mock canvas context methods if null (JSDOM limitation)
      if (!ctx) {
        ctx = {
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          strokeStyle: '',
          lineWidth: 1
        };
      }
    });
    
    it('draws waveform to canvas', () => {
      const waveformData = new Uint8Array(100);
      for (let i = 0; i < 100; i++) {
        waveformData[i] = 128 + Math.sin(i * 0.1) * 50;
      }
      
      expect(() => {
        drawWaveform(ctx, waveformData, 800, 300, '#00ff00');
      }).not.toThrow();
    });
    
    it('uses custom color', () => {
      const waveformData = new Uint8Array(100);
      const spy = vi.spyOn(ctx, 'stroke');
      
      drawWaveform(ctx, waveformData, 800, 300, '#ff0000');
      
      expect(ctx.strokeStyle).toContain('ff0000');
      expect(spy).toHaveBeenCalled();
    });
  });
  
  describe('drawSpectrum', () => {
    let canvas;
    let ctx;
    
    beforeEach(() => {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 300;
      ctx = canvas.getContext('2d');
      
      // Mock canvas context methods if null (JSDOM limitation)
      if (!ctx) {
        ctx = {
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          stroke: vi.fn(),
          fillStyle: ''
        };
      }
    });
    
    it('draws spectrum bars to canvas', () => {
      const frequencyData = new Uint8Array(100);
      for (let i = 0; i < 100; i++) {
        frequencyData[i] = Math.random() * 255;
      }
      
      expect(() => {
        drawSpectrum(ctx, frequencyData, 800, 300, ColorScheme.RAINBOW);
      }).not.toThrow();
    });
    
    it('supports rainbow color scheme', () => {
      const frequencyData = new Uint8Array(10);
      const spy = vi.spyOn(ctx, 'fillRect');
      
      drawSpectrum(ctx, frequencyData, 800, 300, ColorScheme.RAINBOW);
      
      expect(spy).toHaveBeenCalled();
    });
    
    it('supports monochrome color scheme', () => {
      const frequencyData = new Uint8Array(10);
      
      expect(() => {
        drawSpectrum(ctx, frequencyData, 800, 300, ColorScheme.MONOCHROME);
      }).not.toThrow();
    });
    
    it('supports heatmap color scheme', () => {
      const frequencyData = new Uint8Array(10);
      
      expect(() => {
        drawSpectrum(ctx, frequencyData, 800, 300, ColorScheme.HEATMAP);
      }).not.toThrow();
    });
    
    it('supports default color scheme', () => {
      const frequencyData = new Uint8Array(10);
      
      expect(() => {
        drawSpectrum(ctx, frequencyData, 800, 300, ColorScheme.DEFAULT);
      }).not.toThrow();
    });
  });
  
  describe('useAudioAnalysisService', () => {
    it('creates a new service instance', () => {
      const service = useAudioAnalysisService();
      
      expect(service).toBeInstanceOf(AudioAnalysisService);
    });
  });
});
