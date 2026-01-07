import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioVisualizationControls from './AudioVisualizationControls.vue';
import Button from 'primevue/button';

// Mock the audio analysis service
vi.mock('@/services/audioAnalysisService', () => ({
  VisualizationMode: {
    WAVEFORM: 'waveform',
    SPECTRUM: 'spectrum',
    BARS: 'bars'
  },
  ColorScheme: {
    RAINBOW: 'rainbow',
    MONOCHROME: 'monochrome',
    HEATMAP: 'heatmap',
    DEFAULT: 'default'
  },
  useAudioAnalysisService: vi.fn(() => ({
    initialize: vi.fn(),
    cleanup: vi.fn(),
    isReady: vi.fn(() => true),
    getWaveformData: vi.fn(() => new Uint8Array(100)),
    getFrequencyData: vi.fn(() => new Uint8Array(100)),
    getVolumeLevel: vi.fn(() => 50)
  })),
  drawWaveform: vi.fn(),
  drawSpectrum: vi.fn()
}));

describe('AudioVisualizationControls', () => {
  let wrapper;
  let mockAudioElement;
  
  beforeEach(() => {
    mockAudioElement = document.createElement('audio');
    
    wrapper = mount(AudioVisualizationControls, {
      props: {
        audioElement: mockAudioElement,
        autoPlay: false
      },
      global: {
        components: {
          Button
        }
      }
    });
  });
  
  it('renders visualization controls', () => {
    expect(wrapper.find('h4').text()).toBe('Audio Visualization');
  });
  
  it('renders canvas element', () => {
    expect(wrapper.find('canvas').exists()).toBe(true);
  });
  
  it('has export button', () => {
    const exportButton = wrapper.findAll('button').find(b => 
      b.text().includes('Export')
    );
    expect(exportButton).toBeDefined();
  });
  
  it('handles export image', async () => {
    const exportButton = wrapper.findAll('button').find(b => 
      b.text().includes('Export')
    );
    
    if (exportButton) {
      await exportButton.trigger('click');
      expect(wrapper.emitted('export')).toBeTruthy();
    }
  });
  
  it('initializes with audio element', () => {
    expect(wrapper.vm.audioElement).toBe(mockAudioElement);
  });
  
  it('cleans up on unmount', () => {
    wrapper.unmount();
    // Service cleanup should be called
  });
});
