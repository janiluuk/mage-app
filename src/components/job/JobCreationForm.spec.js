import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import JobCreationForm from './JobCreationForm.vue';
import AudioFileUpload from './AudioFileUpload.vue';
import MotionStyleSelector from './MotionStyleSelector.vue';
import Button from 'primevue/button';

// Mock child components
vi.mock('./AudioFileUpload.vue', () => ({
  default: {
    name: 'AudioFileUpload',
    template: '<div class="audio-file-upload"><slot /></div>',
    emits: ['file-selected', 'file-removed']
  }
}));

vi.mock('./MotionStyleSelector.vue', () => ({
  default: {
    name: 'MotionStyleSelector',
    template: '<div class="motion-style-selector"><slot /></div>',
    emits: ['style-selected', 'preset-selected', 'bpm-changed']
  }
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /></button>',
    props: ['label', 'icon', 'disabled']
  }
}));

describe('JobCreationForm', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(JobCreationForm, {
      global: {
        components: {
          AudioFileUpload,
          MotionStyleSelector,
          Button
        }
      }
    });
  });

  it('renders audio file upload section', () => {
    expect(wrapper.find('.audio-file-upload').exists()).toBe(true);
  });

  it('does not show motion settings initially', () => {
    expect(wrapper.find('.motion-style-selector').exists()).toBe(false);
  });

  it('shows motion settings after audio file is selected', async () => {
    const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.onAudioFileSelected(audioFile);
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.audioFile).toBe(audioFile);
    expect(wrapper.find('.motion-style-selector').exists()).toBe(true);
  });

  it('hides motion settings when audio file is removed', async () => {
    const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.audioFile = audioFile;
    await wrapper.vm.$nextTick();
    
    wrapper.vm.onAudioFileRemoved();
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.audioFile).toBeNull();
  });

  it('shows form actions when both audio and motion style are set', async () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'audio_sync';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.form-actions').exists()).toBe(true);
  });

  it('does not show form actions without audio file', async () => {
    wrapper.vm.audioFile = null;
    wrapper.vm.motionStyle = 'audio_sync';
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.form-actions').exists()).toBe(false);
  });

  it('does not show form actions without motion style', async () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = null;
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.form-actions').exists()).toBe(false);
  });

  it('canCreateJob is false without audio file', () => {
    wrapper.vm.audioFile = null;
    wrapper.vm.motionStyle = 'audio_sync';
    
    expect(wrapper.vm.canCreateJob).toBe(false);
  });

  it('canCreateJob is false without motion style', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = null;
    
    expect(wrapper.vm.canCreateJob).toBe(false);
  });

  it('canCreateJob is false for classic without preset', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'classic';
    wrapper.vm.selectedPreset = null;
    
    expect(wrapper.vm.canCreateJob).toBe(false);
  });

  it('canCreateJob is true for classic with preset', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'classic';
    wrapper.vm.selectedPreset = { id: 1, name: 'Test Preset' };
    
    expect(wrapper.vm.canCreateJob).toBe(true);
  });

  it('canCreateJob is false for bpm without valid bpm value', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'bpm';
    wrapper.vm.bpmValue = null;
    
    expect(wrapper.vm.canCreateJob).toBe(false);
  });

  it('canCreateJob is false for bpm with out of range value', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'bpm';
    wrapper.vm.bpmValue = 50; // Below minimum of 60
    
    expect(wrapper.vm.canCreateJob).toBe(false);
  });

  it('canCreateJob is true for bpm with valid value', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'bpm';
    wrapper.vm.bpmValue = 120;
    
    expect(wrapper.vm.canCreateJob).toBe(true);
  });

  it('canCreateJob is true for audio_sync', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'audio_sync';
    
    expect(wrapper.vm.canCreateJob).toBe(true);
  });

  it('onStyleSelected updates motion style', () => {
    const styleData = { style: 'bpm', bpm: 140 };
    wrapper.vm.onStyleSelected(styleData);
    
    expect(wrapper.vm.motionStyle).toBe('bpm');
    expect(wrapper.vm.bpmValue).toBe(140);
  });

  it('onStyleSelected resets preset when not classic', () => {
    wrapper.vm.selectedPreset = { id: 1, name: 'Test' };
    wrapper.vm.onStyleSelected({ style: 'bpm', bpm: 120 });
    
    expect(wrapper.vm.selectedPreset).toBeNull();
  });

  it('onPresetSelected updates selected preset', () => {
    const preset = { id: 1, name: 'Test Preset' };
    wrapper.vm.onPresetSelected(preset);
    
    expect(wrapper.vm.selectedPreset).toStrictEqual(preset);
  });

  it('onBpmChanged updates bpm value', () => {
    wrapper.vm.onBpmChanged(140);
    
    expect(wrapper.vm.bpmValue).toBe(140);
  });

  it('createJob emits job-created with correct data', () => {
    const audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    const preset = { id: 1, name: 'Test Preset' };
    
    wrapper.vm.audioFile = audioFile;
    wrapper.vm.motionStyle = 'classic';
    wrapper.vm.selectedPreset = preset;
    
    wrapper.vm.createJob();
    
    expect(wrapper.emitted('job-created')).toBeTruthy();
    const emittedData = wrapper.emitted('job-created')[0][0];
    expect(emittedData.audioFile).toBe(audioFile);
    expect(emittedData.motionStyle).toBe('classic');
    expect(emittedData.preset).toStrictEqual(preset);
  });

  it('resetForm clears all form data', () => {
    wrapper.vm.audioFile = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    wrapper.vm.motionStyle = 'classic';
    wrapper.vm.selectedPreset = { id: 1, name: 'Test' };
    wrapper.vm.bpmValue = 140;
    
    wrapper.vm.resetForm();
    
    expect(wrapper.vm.audioFile).toBeNull();
    expect(wrapper.vm.motionStyle).toBeNull();
    expect(wrapper.vm.selectedPreset).toBeNull();
    expect(wrapper.vm.bpmValue).toBeNull();
  });

  it('resetForm emits form-cancelled', () => {
    wrapper.vm.resetForm();
    
    expect(wrapper.emitted('form-cancelled')).toBeTruthy();
  });

  it('resetMotionSettings clears motion-related data', () => {
    wrapper.vm.motionStyle = 'bpm';
    wrapper.vm.selectedPreset = { id: 1, name: 'Test' };
    wrapper.vm.bpmValue = 140;
    
    wrapper.vm.resetMotionSettings();
    
    expect(wrapper.vm.motionStyle).toBeNull();
    expect(wrapper.vm.selectedPreset).toBeNull();
    expect(wrapper.vm.bpmValue).toBeNull();
  });
});
