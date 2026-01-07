/**
 * Audio Analysis Service
 * Provides advanced audio analysis capabilities using Web Audio API
 * Supports waveform, frequency spectrum, and beat detection
 */

/**
 * Visualization modes
 */
export const VisualizationMode = {
  WAVEFORM: 'waveform',
  SPECTRUM: 'spectrum',
  SPECTROGRAM: 'spectrogram',
  BARS: 'bars'
};

/**
 * Color schemes for visualization
 */
export const ColorScheme = {
  DEFAULT: 'default',
  RAINBOW: 'rainbow',
  MONOCHROME: 'monochrome',
  HEATMAP: 'heatmap'
};

/**
 * AudioAnalysisService class
 * Main service for audio analysis and visualization
 */
export class AudioAnalysisService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.audioElement = null;
    this.isInitialized = false;
    this.fftSize = 2048;
  }
  
  /**
   * Initialize audio context and analyser
   * @param {HTMLAudioElement} audioElement - Audio element to analyze
   * @param {object} options - Configuration options
   */
  initialize(audioElement, options = {}) {
    if (this.isInitialized) {
      this.cleanup();
    }
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.fftSize = options.fftSize || 2048;
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = options.smoothing || 0.8;
      this.analyser.minDecibels = options.minDecibels || -90;
      this.analyser.maxDecibels = options.maxDecibels || -10;
      
      // Connect audio element
      this.audioElement = audioElement;
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error);
      throw new Error('Audio analysis initialization failed');
    }
  }
  
  /**
   * Get waveform data (time domain)
   * @returns {Uint8Array} Waveform data
   */
  getWaveformData() {
    if (!this.isInitialized) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }
  
  /**
   * Get frequency data (frequency domain)
   * @returns {Uint8Array} Frequency data
   */
  getFrequencyData() {
    if (!this.isInitialized) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    return dataArray;
  }
  
  /**
   * Get current volume level
   * @returns {number} Volume level (0-100)
   */
  getVolumeLevel() {
    const waveform = this.getWaveformData();
    if (waveform.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < waveform.length; i++) {
      const value = (waveform[i] - 128) / 128;
      sum += value * value;
    }
    
    const rms = Math.sqrt(sum / waveform.length);
    return Math.min(100, Math.round(rms * 100));
  }
  
  /**
   * Detect peaks in audio
   * @param {number} threshold - Peak detection threshold (0-255)
   * @returns {boolean} True if peak detected
   */
  detectPeak(threshold = 200) {
    const frequency = this.getFrequencyData();
    if (frequency.length === 0) return false;
    
    for (let i = 0; i < frequency.length; i++) {
      if (frequency[i] > threshold) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get frequency bands
   * @param {number} bands - Number of frequency bands
   * @returns {Array} Array of band values (0-255)
   */
  getFrequencyBands(bands = 8) {
    const frequency = this.getFrequencyData();
    if (frequency.length === 0) return new Array(bands).fill(0);
    
    const bandSize = Math.floor(frequency.length / bands);
    const result = [];
    
    for (let i = 0; i < bands; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      let sum = 0;
      
      for (let j = start; j < end && j < frequency.length; j++) {
        sum += frequency[j];
      }
      
      result.push(Math.round(sum / bandSize));
    }
    
    return result;
  }
  
  /**
   * Get dominant frequency
   * @returns {number} Dominant frequency in Hz
   */
  getDominantFrequency() {
    const frequency = this.getFrequencyData();
    if (frequency.length === 0) return 0;
    
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < frequency.length; i++) {
      if (frequency[i] > maxValue) {
        maxValue = frequency[i];
        maxIndex = i;
      }
    }
    
    const nyquist = this.audioContext.sampleRate / 2;
    return (maxIndex / frequency.length) * nyquist;
  }
  
  /**
   * Cleanup and release resources
   */
  cleanup() {
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.source = null;
    }
    
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.analyser = null;
    }
    
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    
    this.audioElement = null;
    this.isInitialized = false;
  }
  
  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }
  
  /**
   * Get buffer length
   * @returns {number} Buffer length
   */
  getBufferLength() {
    return this.analyser ? this.analyser.frequencyBinCount : 0;
  }
}

/**
 * Visualization utility functions
 */

/**
 * Draw waveform to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Uint8Array} waveformData - Waveform data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} color - Line color
 */
export function drawWaveform(ctx, waveformData, width, height, color = '#00ff00') {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  
  const sliceWidth = width / waveformData.length;
  let x = 0;
  
  for (let i = 0; i < waveformData.length; i++) {
    const v = waveformData[i] / 128.0;
    const y = v * height / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

/**
 * Draw frequency spectrum bars
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Uint8Array} frequencyData - Frequency data
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} colorScheme - Color scheme
 */
export function drawSpectrum(ctx, frequencyData, width, height, colorScheme = ColorScheme.RAINBOW) {
  ctx.clearRect(0, 0, width, height);
  
  const barWidth = (width / frequencyData.length) * 2.5;
  let x = 0;
  
  for (let i = 0; i < frequencyData.length; i++) {
    const barHeight = (frequencyData[i] / 255) * height;
    
    // Color based on scheme
    let color;
    switch (colorScheme) {
      case ColorScheme.RAINBOW:
        const hue = (i / frequencyData.length) * 360;
        color = `hsl(${hue}, 100%, 50%)`;
        break;
      case ColorScheme.MONOCHROME:
        const intensity = Math.round((frequencyData[i] / 255) * 255);
        color = `rgb(${intensity}, ${intensity}, ${intensity})`;
        break;
      case ColorScheme.HEATMAP:
        color = valueToHeatmapColor(frequencyData[i]);
        break;
      default:
        color = '#00ff00';
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    
    x += barWidth + 1;
  }
}

/**
 * Convert value to heatmap color
 * @param {number} value - Value (0-255)
 * @returns {string} RGB color string
 */
function valueToHeatmapColor(value) {
  const normalized = value / 255;
  
  if (normalized < 0.25) {
    return `rgb(0, 0, ${Math.round(normalized * 4 * 255)})`;
  } else if (normalized < 0.5) {
    return `rgb(0, ${Math.round((normalized - 0.25) * 4 * 255)}, 255)`;
  } else if (normalized < 0.75) {
    return `rgb(${Math.round((normalized - 0.5) * 4 * 255)}, 255, 0)`;
  } else {
    return `rgb(255, ${Math.round((1 - normalized) * 4 * 255)}, 0)`;
  }
}

/**
 * Create audio analysis service instance
 * @returns {AudioAnalysisService} Service instance
 */
export function useAudioAnalysisService() {
  return new AudioAnalysisService();
}

export default {
  VisualizationMode,
  ColorScheme,
  AudioAnalysisService,
  drawWaveform,
  drawSpectrum,
  useAudioAnalysisService
};
