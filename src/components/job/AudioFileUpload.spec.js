import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioFileUpload from './AudioFileUpload.vue';
import Button from 'primevue/button';

// Mock PrimeVue components
vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /></button>'
  }
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn((event, callback) => {
    if (event === 'loadedmetadata') {
      setTimeout(() => callback(), 0);
    }
  }),
  duration: 125,
  src: ''
}));

describe('AudioFileUpload', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(AudioFileUpload, {
      global: {
        components: {
          Button
        },
        directives: {
          tooltip: () => {}
        }
      }
    });
  });

  it('renders upload placeholder when no file is selected', () => {
    expect(wrapper.find('.upload-placeholder').exists()).toBe(true);
    expect(wrapper.text()).toContain('Drag & drop audio file');
  });

  it('shows drag active state', async () => {
    const dropzone = wrapper.find('.audio-dropzone');
    
    await dropzone.trigger('dragover');
    expect(wrapper.vm.isDragActive).toBe(true);
    expect(dropzone.classes()).toContain('drag-active');
  });

  it('removes drag active state on dragleave', async () => {
    const dropzone = wrapper.find('.audio-dropzone');
    
    await dropzone.trigger('dragover');
    await dropzone.trigger('dragleave');
    
    expect(wrapper.vm.isDragActive).toBe(false);
  });

  it('validates audio file type', async () => {
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    wrapper.vm.validateAndSetFile(invalidFile);
    
    expect(wrapper.vm.error).toBe('Please select a valid audio file');
    expect(wrapper.vm.audioFile).toBeNull();
  });

  it('validates file size', async () => {
    const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.mp3', { 
      type: 'audio/mpeg' 
    });
    
    wrapper.vm.validateAndSetFile(largeFile);
    
    expect(wrapper.vm.error).toContain('exceeds');
    expect(wrapper.vm.audioFile).toBeNull();
  });

  it('accepts valid audio file', async () => {
    const validFile = new File(['audio content'], 'test.mp3', { 
      type: 'audio/mpeg' 
    });
    
    wrapper.vm.validateAndSetFile(validFile);
    
    expect(wrapper.vm.error).toBeNull();
    expect(wrapper.vm.audioFile).toBe(validFile);
  });

  it('emits file-selected event when valid file is added', async () => {
    const validFile = new File(['audio content'], 'test.mp3', { 
      type: 'audio/mpeg' 
    });
    
    wrapper.vm.validateAndSetFile(validFile);
    
    expect(wrapper.emitted('file-selected')).toBeTruthy();
    expect(wrapper.emitted('file-selected')[0][0]).toBe(validFile);
  });

  it('displays file preview when file is selected', async () => {
    const validFile = new File(['audio content'], 'test.mp3', { 
      type: 'audio/mpeg' 
    });
    
    wrapper.vm.audioFile = validFile;
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.file-preview').exists()).toBe(true);
    expect(wrapper.find('.file-name').text()).toBe('test.mp3');
  });

  it('removes file and emits file-removed event', async () => {
    const validFile = new File(['audio content'], 'test.mp3', { 
      type: 'audio/mpeg' 
    });
    
    wrapper.vm.audioFile = validFile;
    await wrapper.vm.$nextTick();
    
    wrapper.vm.removeFile();
    
    expect(wrapper.vm.audioFile).toBeNull();
    expect(wrapper.emitted('file-removed')).toBeTruthy();
  });

  it('formats file size correctly', () => {
    expect(wrapper.vm.formatFileSize(0)).toBe('0 Bytes');
    expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB');
    expect(wrapper.vm.formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(wrapper.vm.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('formats duration correctly', () => {
    expect(wrapper.vm.formatDuration(0)).toBe('0:00');
    expect(wrapper.vm.formatDuration(65)).toBe('1:05');
    expect(wrapper.vm.formatDuration(125)).toBe('2:05');
  });
});
