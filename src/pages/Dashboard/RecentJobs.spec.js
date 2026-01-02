import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RecentJobs from './RecentJobs.vue';
import { createStore } from 'vuex';

describe('RecentJobs.vue', () => {
  let store;
  let actions;
  let getters;

  beforeEach(() => {
    vi.clearAllMocks();
    
    actions = {
      list: vi.fn().mockResolvedValue([]),
      cancel: vi.fn()
    };

    getters = {
      listFinished: (state) => state.jobs,
      progress: (state) => false
    };

    store = createStore({
      modules: {
        videojobs: {
          namespaced: true,
          state: {
            jobs: []
          },
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
        mocks: {
          $router: {
            push: vi.fn()
          }
        },
        stubs: {
          DataTable: true,
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
  });

  it('calls listJobs action on created', async () => {
    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        mocks: {
          $router: {
            push: vi.fn()
          }
        },
        stubs: {
          DataTable: true,
          Column: true,
          ProgressBar: true,
          Button: true
        }
      }
    });

    await vi.waitFor(() => {
      expect(actions.list).toHaveBeenCalled();
    });
    
    wrapper.unmount();
  });

  it('displays jobs from store', async () => {
    const mockJobs = [
      {
        id: 1,
        original_filename: 'test.mp4',
        preview_img: 'http://example.com/img.jpg',
        status: 'finished',
        progress: 100
      }
    ];

    store = createStore({
      modules: {
        videojobs: {
          namespaced: true,
          state: {
            jobs: mockJobs
          },
          actions,
          getters: {
            listFinished: (state) => state.jobs,
            progress: (state) => false
          }
        }
      }
    });

    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        mocks: {
          $router: {
            push: vi.fn()
          }
        },
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

    // Wait for created hook to complete and jobs to be assigned
    await vi.waitFor(() => {
      expect(wrapper.vm.jobs).toEqual(mockJobs);
    }, { timeout: 1000 });
    
    wrapper.unmount();
  });

  it('clears interval on beforeUnmount', () => {
    const wrapper = mount(RecentJobs, {
      global: {
        plugins: [store],
        mocks: {
          $router: {
            push: vi.fn()
          }
        },
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
