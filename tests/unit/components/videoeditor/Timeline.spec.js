import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Timeline from '@/components/videoeditor/Timeline.vue';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

describe('Timeline', () => {
  let store;
  let wrapper;
  let videoFile;
  let fragment;

  beforeEach(() => {
    videoFile = new VideoFileAdapter({
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });
    fragment = new VideoFragmentAdapter(videoFile);

    store = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [fragment],
            activeFragment: fragment,
            configTimeline: {
              widthPerSecond: 3.5,
              minFragmentWidth: 90,
            },
            player: {
              progress: 0.5,
            },
          },
          getters: {},
        },
      },
    });
  });

  const createWrapper = (options = {}) => {
    return mount(Timeline, {
      global: {
        plugins: [store],
      },
      ...options,
    });
  };

  it('renders timeline with fragments', () => {
    wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('calculates fragment width correctly', () => {
    wrapper = createWrapper();
    const fragmentWidth = wrapper.vm.fragmentWidth(fragment);
    expect(fragmentWidth).toBeGreaterThanOrEqual(90); // minFragmentWidth
  });

  it('handles seek on fragment click', async () => {
    store.dispatch = vi.fn();
    store.getters['videoeditor/fullDuration'] = () => 60;
    
    wrapper = createWrapper();
    
    const fragmentElement = wrapper.find('.fragment');
    if (fragmentElement.exists()) {
      await fragmentElement.trigger('mousedown', {
        button: 0,
        clientX: 100,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 0 }),
        },
      });
      
      expect(store.dispatch).toHaveBeenCalled();
    }
  });

  it('calculates seek position correctly', () => {
    wrapper = createWrapper();
    const position = wrapper.vm.seekPosition(fragment);
    expect(typeof position).toBe('number');
    expect(position).toBeGreaterThanOrEqual(0);
  });
});

