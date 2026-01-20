import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import SoundscapeCreator from '@/views/SoundscapeCreator.vue';
import MageApiService from '@/services/mage/MageApiService';

// Mock env module FIRST before any other imports
vi.mock('@/utils/env', () => ({
  default: {
    VITE_API_URL: 'http://localhost:3000',
  },
}));

// Mock the MageApiService
vi.mock('@/services/mage/MageApiService', () => ({
  default: {
    getStatus: vi.fn(),
    getQueue: vi.fn(),
  },
}));

describe('SoundscapeCreator', () => {
  let wrapper;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    MageApiService.getStatus.mockResolvedValue({
      processing: null,
      queued: 0,
      recent: [],
    });
    MageApiService.getQueue.mockResolvedValue({
      queued: [],
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createWrapper = async (options = {}) => {
    const wrapper = mount(SoundscapeCreator, {
      global: {
        stubs: {
          AudioVisualizer: { template: '<div class="audio-visualizer-stub" />' },
        },
      },
      ...options,
    });
    await flushPromises();
    return wrapper;
  };

  describe('Validation Logic', () => {
    it('should display error message when both prompt and mood are empty', async () => {
      wrapper = await createWrapper();

      // Ensure both prompt and mood are empty
      expect(wrapper.vm.prompt).toBe('');
      expect(wrapper.vm.selectedMood).toBe('');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify error message is displayed
      expect(wrapper.vm.errorMessage).toBe('Please enter a prompt or select a mood');
      
      // Verify error message is rendered in the DOM
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toBe('Please enter a prompt or select a mood');
    });

    it('should display error message when prompt is only whitespace and mood is empty', async () => {
      wrapper = await createWrapper();

      // Set prompt to whitespace only
      await wrapper.find('textarea').setValue('   ');
      expect(wrapper.vm.selectedMood).toBe('');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify error message is displayed
      expect(wrapper.vm.errorMessage).toBe('Please enter a prompt or select a mood');
      
      // Verify error message is rendered in the DOM
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toBe('Please enter a prompt or select a mood');
    });

    it('should not display error when prompt is provided', async () => {
      wrapper = await createWrapper();

      // Set a valid prompt
      await wrapper.find('textarea').setValue('peaceful forest sounds');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify no validation error message
      expect(wrapper.vm.errorMessage).toBe('');
      
      // Verify error element is not visible or doesn't exist
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(false);
    });

    it('should not display error when mood is selected', async () => {
      wrapper = await createWrapper();

      // Select a mood
      const moodButton = wrapper.findAll('.mood-tags button').at(0);
      await moodButton.trigger('click');
      await flushPromises();

      expect(wrapper.vm.selectedMood).toBe('Relaxing');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify no validation error message
      expect(wrapper.vm.errorMessage).toBe('');
      
      // Verify error element is not visible
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(false);
    });

    it('should not display error when both prompt and mood are provided', async () => {
      wrapper = await createWrapper();

      // Set both prompt and mood
      await wrapper.find('textarea').setValue('relaxing ocean waves');
      const moodButton = wrapper.findAll('.mood-tags button').at(1);
      await moodButton.trigger('click');
      await flushPromises();

      expect(wrapper.vm.prompt).toBe('relaxing ocean waves');
      expect(wrapper.vm.selectedMood).toBe('Energizing');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify no validation error message
      expect(wrapper.vm.errorMessage).toBe('');
      
      // Verify error element is not visible
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(false);
    });

    it('should clear previous error message when generate is called with valid input', async () => {
      wrapper = await createWrapper();

      // First, trigger validation error
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      expect(wrapper.vm.errorMessage).toBe('Please enter a prompt or select a mood');

      // Now provide valid input
      await wrapper.find('textarea').setValue('calming rain sounds');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify error message is cleared
      expect(wrapper.vm.errorMessage).toBe('');
    });
  });

  describe('API URL Validation', () => {
    it('should handle invalid URL gracefully', async () => {
      wrapper = await createWrapper();

      // Set valid prompt
      await wrapper.find('textarea').setValue('test prompt');

      // Mock URL constructor to throw error
      const originalURL = global.URL;
      global.URL = class {
        constructor() {
          throw new Error('Invalid URL');
        }
      };

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Restore URL
      global.URL = originalURL;

      // Verify error was set (could be various messages depending on error handling)
      expect(wrapper.vm.errorMessage).toBeTruthy();
    });
  });

  describe('Audio Source Generation', () => {
    it('should set audioSrc when generate is successful with prompt', async () => {
      wrapper = await createWrapper();

      // Set a valid prompt
      await wrapper.find('textarea').setValue('peaceful forest');

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify audioSrc is set
      expect(wrapper.vm.audioSrc).toContain('http://localhost:3000/api/stream');
      expect(wrapper.vm.audioSrc).toContain('text=peaceful+forest');
    });

    it('should set audioSrc when generate is successful with mood', async () => {
      wrapper = await createWrapper();

      // Select a mood
      const moodButton = wrapper.findAll('.mood-tags button').at(0);
      await moodButton.trigger('click');
      await flushPromises();

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify audioSrc is set
      expect(wrapper.vm.audioSrc).toContain('http://localhost:3000/api/stream');
      expect(wrapper.vm.audioSrc).toContain('mood=Relaxing');
    });

    it('should set audioSrc with both prompt and mood parameters', async () => {
      wrapper = await createWrapper();

      // Set both prompt and mood
      await wrapper.find('textarea').setValue('calm atmosphere');
      const moodButton = wrapper.findAll('.mood-tags button').at(1);
      await moodButton.trigger('click');
      await flushPromises();

      // Find and click the generate button
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify audioSrc is set with both parameters
      expect(wrapper.vm.audioSrc).toContain('http://localhost:3000/api/stream');
      expect(wrapper.vm.audioSrc).toContain('text=calm+atmosphere');
      expect(wrapper.vm.audioSrc).toContain('mood=Energizing');
    });
  });

  describe('Component Initialization', () => {
    it('should initialize with empty prompt and errorMessage', async () => {
      wrapper = await createWrapper();

      expect(wrapper.vm.prompt).toBe('');
      expect(wrapper.vm.errorMessage).toBe('');
      expect(wrapper.vm.selectedMood).toBe('');
      expect(wrapper.vm.audioSrc).toBe('');
    });

    it('should call refreshQueue on mount', async () => {
      wrapper = await createWrapper();

      // Verify API calls were made
      expect(MageApiService.getStatus).toHaveBeenCalled();
      expect(MageApiService.getQueue).toHaveBeenCalled();
    });

    it('should set up interval for refreshQueue on mount', async () => {
      wrapper = await createWrapper();

      // Advance timers to trigger interval
      vi.advanceTimersByTime(5000);
      await flushPromises();

      // Verify API calls were made again (initial + first interval)
      expect(MageApiService.getStatus).toHaveBeenCalledTimes(2);
      expect(MageApiService.getQueue).toHaveBeenCalledTimes(2);
    });

    it('should clear interval on unmount', async () => {
      wrapper = await createWrapper();

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      // Unmount component
      wrapper.unmount();

      // Verify clearInterval was called
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Error Message Display', () => {
    it('should render error message in DOM when errorMessage is set', async () => {
      wrapper = await createWrapper();

      // Trigger validation error
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      // Verify error element exists and contains correct text
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(true);
      expect(errorElement.text()).toBe('Please enter a prompt or select a mood');
      expect(errorElement.classes()).toContain('error');
    });

    it('should not render error element when errorMessage is empty', async () => {
      wrapper = await createWrapper();

      // Verify error element doesn't exist initially
      const errorElement = wrapper.find('.error');
      expect(errorElement.exists()).toBe(false);
    });

    it('should update error message display dynamically', async () => {
      wrapper = await createWrapper();

      // Initially no error
      expect(wrapper.find('.error').exists()).toBe(false);

      // Trigger error
      const generateButton = wrapper.findAll('button').find(btn => btn.text() === 'Generate');
      await generateButton.trigger('click');
      await flushPromises();

      expect(wrapper.find('.error').exists()).toBe(true);
      expect(wrapper.find('.error').text()).toBe('Please enter a prompt or select a mood');

      // Clear error by providing valid input
      await wrapper.find('textarea').setValue('test prompt');
      await generateButton.trigger('click');
      await flushPromises();

      expect(wrapper.find('.error').exists()).toBe(false);
    });
  });
});
