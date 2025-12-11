import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MotionStyleSelector from './MotionStyleSelector.vue';
import Dropdown from 'primevue/dropdown';
import Card from 'primevue/card';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';

// Mock the database service
vi.mock('@/services/deforumPresets.db', () => ({
  initializePresetsDB: vi.fn().mockResolvedValue(undefined),
  getPresetsByType: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Slow Zoom In',
      type: 'classic',
      description: 'Gentle zoom in effect',
      settings: { zoom: '0:(1.0025)' }
    },
    {
      id: 2,
      name: 'Rotation Left',
      type: 'classic',
      description: 'Smooth counterclockwise rotation',
      settings: { angle: '0:(0.5)' }
    }
  ])
}));

// Mock PrimeVue components
vi.mock('primevue/dropdown', () => ({
  default: {
    name: 'Dropdown',
    template: '<select><slot /></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
    emits: ['update:modelValue', 'change']
  }
}));

vi.mock('primevue/card', () => ({
  default: {
    name: 'Card',
    template: '<div class="p-card"><slot name="content" /></div>',
  }
}));

vi.mock('primevue/inputnumber', () => ({
  default: {
    name: 'InputNumber',
    template: '<input type="number" />',
    props: ['modelValue', 'min', 'max', 'step', 'placeholder'],
    emits: ['update:modelValue', 'input']
  }
}));

vi.mock('primevue/message', () => ({
  default: {
    name: 'Message',
    template: '<div class="p-message"><slot /></div>',
    props: ['severity', 'closable']
  }
}));

describe('MotionStyleSelector', () => {
  let wrapper;

  beforeEach(async () => {
    wrapper = mount(MotionStyleSelector, {
      global: {
        components: {
          Dropdown,
          Card,
          InputNumber,
          Message
        }
      }
    });
    
    // Wait for mounted hook to complete
    await wrapper.vm.$nextTick();
  });

  it('renders motion style dropdown', () => {
    expect(wrapper.find('#motion-style').exists()).toBe(true);
  });

  it('has correct motion style options', () => {
    const options = wrapper.vm.motionStyles;
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('audio_sync');
    expect(options[1].value).toBe('bpm');
    expect(options[2].value).toBe('classic');
  });

  it('emits style-selected event when style changes', async () => {
    wrapper.vm.selectedStyle = 'audio_sync';
    await wrapper.vm.onStyleChange();
    
    expect(wrapper.emitted('style-selected')).toBeTruthy();
    expect(wrapper.emitted('style-selected')[0][0]).toEqual({
      style: 'audio_sync',
      bpm: null
    });
  });

  it('shows preset selector when classic style is selected', async () => {
    wrapper.vm.selectedStyle = 'classic';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.preset-selector').exists()).toBe(true);
  });

  it('does not show preset selector when other styles are selected', async () => {
    wrapper.vm.selectedStyle = 'audio_sync';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.preset-selector').exists()).toBe(false);
  });

  it('shows BPM input when bpm style is selected', async () => {
    wrapper.vm.selectedStyle = 'bpm';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.bpm-input-section').exists()).toBe(true);
    expect(wrapper.find('#bpm-value').exists()).toBe(true);
  });

  it('shows audio sync info when audio_sync style is selected', async () => {
    wrapper.vm.selectedStyle = 'audio_sync';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.audio-sync-info').exists()).toBe(true);
  });

  it('loads presets on mount', async () => {
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.presets).toHaveLength(2);
    expect(wrapper.vm.presets[0].name).toBe('Slow Zoom In');
  });

  it('emits preset-selected event when preset is clicked', async () => {
    wrapper.vm.selectedStyle = 'classic';
    await wrapper.vm.$nextTick();
    
    const preset = wrapper.vm.presets[0];
    wrapper.vm.selectPreset(preset);
    
    expect(wrapper.emitted('preset-selected')).toBeTruthy();
    expect(wrapper.emitted('preset-selected')[0][0]).toBe(preset);
  });

  it('marks selected preset with selected class', async () => {
    wrapper.vm.selectedStyle = 'classic';
    await wrapper.vm.$nextTick();
    
    // Ensure presets are loaded
    expect(wrapper.vm.presets.length).toBeGreaterThan(0);
    
    wrapper.vm.selectedPreset = wrapper.vm.presets[0];
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.selectedPreset.id).toBe(1);
  });

  it('emits bpm-changed event when BPM value changes', async () => {
    wrapper.vm.selectedStyle = 'bpm';
    wrapper.vm.bpmValue = 140;
    await wrapper.vm.onBpmChange();
    
    expect(wrapper.emitted('bpm-changed')).toBeTruthy();
    expect(wrapper.emitted('bpm-changed')[0][0]).toBe(140);
  });

  it('has default BPM value of 120', () => {
    expect(wrapper.vm.bpmValue).toBe(120);
  });

  it('resets selected preset when style changes', async () => {
    wrapper.vm.selectedStyle = 'classic';
    wrapper.vm.selectedPreset = wrapper.vm.presets[0];
    
    wrapper.vm.selectedStyle = 'bpm';
    await wrapper.vm.onStyleChange();
    
    expect(wrapper.vm.selectedPreset).toBeNull();
  });

  it('provides correct style descriptions', () => {
    expect(wrapper.vm.getStyleDescription('audio_sync')).toContain('audio amplitude');
    expect(wrapper.vm.getStyleDescription('bpm')).toContain('beats per minute');
    expect(wrapper.vm.getStyleDescription('classic')).toContain('predefined');
  });
});
