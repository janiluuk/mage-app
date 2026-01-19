import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import VideoEdit from '@/components/video/VideoEdit.vue';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';

// Constants matching the component implementation
const POLLING_START_DELAY = 100; // milliseconds - matches VideoEdit.vue timeout

describe('VideoEdit', () => {
  let store;
  let router;
  let wrapper;

  beforeEach(() => {
    vi.useFakeTimers();
    
    // Create a mock store with necessary modules
    store = createStore({
      modules: {
        videojobs: {
          namespaced: true,
          state: {
            job: {
              id: 1,
              status: 'pending',
              model_id: 1,
              model_name: 'Test Model',
              prompt: 'Test prompt',
              negative_prompt: '',
              denoising: 0.4,
              seed: -1,
              cfg_scale: 7,
              progress: 1,
              estimated_time_left: 0,
              job_time: 0,
              filename: 'test.mp4'
            },
            progress: { loading: false }
          },
          getters: {
            job: (state) => state.job,
            progress: (state) => state.progress
          },
          actions: {
            fetchVideoJob: vi.fn(() => Promise.resolve()),
            cancelJob: vi.fn(() => Promise.resolve()),
            finalizeJob: vi.fn(() => Promise.resolve()),
            previewJob: vi.fn(() => Promise.resolve())
          }
        }
      }
    });

    // Create a mock router
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/video/:id', component: VideoEdit }
      ]
    });
    router.push('/video/1');
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createWrapper = async (options = {}) => {
    const wrapper = mount(VideoEdit, {
      global: {
        plugins: [store, router],
        stubs: {
          Sidebar: { template: '<div><slot /></div>' },
          VideoEditOverlay: { template: '<div />' },
          VideoEditToolbar: { template: '<div />' },
          VideoEditPreview: { template: '<div />' },
          Splitter: { template: '<div><slot /></div>' },
          SplitterPanel: { template: '<div><slot /></div>' },
          ModelfileSelector: { template: '<div />' },
          Textarea: { template: '<textarea />' },
          InputNumber: { template: '<input type="number" />' },
          Slider: { template: '<input type="range" />' },
          InputSwitch: { template: '<input type="checkbox" />' },
          InputText: { template: '<input type="text" />' },
          OverlayPanel: { template: '<div />' },
          SoundtrackDialog: { template: '<div />' }
        }
      },
      ...options
    });
    await flushPromises();
    return wrapper;
  };

  describe('pollingStartTimeout cleanup', () => {
    it('clears pollingStartTimeout when component is destroyed before timeout executes', async () => {
      wrapper = await createWrapper();
      
      // Verify timeout was set
      expect(wrapper.vm.pollingStartTimeout).not.toBe(null);
      
      // Store the timeout ID
      const timeoutId = wrapper.vm.pollingStartTimeout;
      
      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      // Unmount component before timeout executes
      wrapper.unmount();
      
      // Verify clearTimeout was called with the correct timeout ID
      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeoutId);
      
      // Verify timeout is set to null after cleanup
      expect(wrapper.vm.pollingStartTimeout).toBe(null);
    });

    it('sets pollingStartTimeout on component creation', async () => {
      wrapper = await createWrapper();
      
      // Verify timeout is set (can be a number or object depending on environment)
      expect(wrapper.vm.pollingStartTimeout).not.toBe(null);
      expect(wrapper.vm.pollingStartTimeout).toBeDefined();
    });

    it('prevents polling from starting when component is destroyed before timeout', async () => {
      // Mock startPollingVideoJob to track if it was called
      const startPollingMock = vi.fn();
      
      wrapper = await createWrapper();
      wrapper.vm.startPollingVideoJob = startPollingMock;
      
      // Unmount component before timeout executes
      wrapper.unmount();
      
      // Fast-forward time past the timeout
      vi.advanceTimersByTime(POLLING_START_DELAY + 50);
      
      // Verify startPollingVideoJob was not called after unmount
      expect(startPollingMock).not.toHaveBeenCalled();
    });

    it('starts polling after timeout if component is not destroyed', async () => {
      // Mock startPollingVideoJob to track if it was called
      const startPollingMock = vi.fn();
      
      wrapper = await createWrapper();
      wrapper.vm.startPollingVideoJob = startPollingMock;
      
      // Fast-forward time past the timeout
      vi.advanceTimersByTime(POLLING_START_DELAY + 50);
      
      // Verify startPollingVideoJob was called
      expect(startPollingMock).toHaveBeenCalled();
    });

    it('clears both pollingStartTimeout and interval on beforeUnmount', async () => {
      wrapper = await createWrapper();
      
      // Set up interval to simulate active polling
      wrapper.vm.interval = setInterval(() => {}, 1000);
      const intervalId = wrapper.vm.interval;
      
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      // Unmount component
      wrapper.unmount();
      
      // Verify both timeout and interval were cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
      expect(wrapper.vm.pollingStartTimeout).toBe(null);
      expect(wrapper.vm.interval).toBe(false);
    });
  });

  describe('component initialization', () => {
    it('initializes with correct data properties', async () => {
      wrapper = await createWrapper();
      
      // Verify initial data state
      expect(wrapper.vm.overlayActive).toBe(false);
      expect(wrapper.vm.showOriginal).toBe(false);
      expect(wrapper.vm.showSoundtrackDialog).toBe(false);
      expect(wrapper.vm.isLoading).toBe(false);
      expect(wrapper.vm.isFetching).toBe(false);
      expect(wrapper.vm.errorMessage).toBe('');
      expect(wrapper.vm.switchValue).toBe(false);
      expect(wrapper.vm.formChanged).toBe(false);
      expect(wrapper.vm.interval).toBe(false);
      expect(wrapper.vm.pollingStartTimeout).not.toBe(null);
    });
  });
});
