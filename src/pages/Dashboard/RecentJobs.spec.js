import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RecentJobs from './RecentJobs.vue';
import { createStore } from 'vuex';

// Mock router
const mockRouter = {
  push: vi.fn()
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}));

describe('RecentJobs.vue', () => {
  let store;
  let actions;
  let getters;

  beforeEach(() => {
    vi.clearAllMocks();
    
    actions = {
      'videojobs/list': vi.fn().mockResolvedValue([]),
      'videojobs/cancel': vi.fn()
    };

    getters = {
      'videojobs/listFinished': () => []
    };

    store = createStore({
      modules: {
        videojobs: {
          namespaced: true,
          actions,
          getters
        }
      }
    });
  });

  it('renders the component', () => {
    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('calls listJobs action on created', async () => {
    mount(RecentJobs, {
      global: {
        plugins: [store],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(actions['videojobs/list']).toHaveBeenCalled();
  });

  it('displays jobs from store', () => {
    const mockJobs = [
      {
        id: 1,
        original_filename: 'test.mp4',
        preview_img: 'http://example.com/img.jpg',
        status: 'finished',
        progress: 100
      }
    ];

    getters['videojobs/listFinished'] = () => mockJobs;
    store = createStore({
      modules: {
        videojobs: {
          namespaced: true,
          actions,
          getters
        }
      }
    });

    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        stubs: {
          DataTable: {
            template: '<div><slot /></div>',
            props: ['value']
          },
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    expect(wrapper.vm.jobs).toEqual(mockJobs);
  });

  it('clears interval on beforeUnmount', () => {
    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    wrapper.vm.interval = setInterval(() => {}, 1000);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    wrapper.unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
