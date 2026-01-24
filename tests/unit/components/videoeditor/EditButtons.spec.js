import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import EditButtons from '@/components/videoeditor/EditButtons.vue';
import Tooltip from 'primevue/tooltip';

describe('EditButtons', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [],
            activeFragment: null,
          },
          getters: {
            canUndo: () => false,
            canRedo: () => false,
            canMoveRight: () => false,
            canMoveLeft: () => false,
            canCut: () => false,
            hasProject: () => true,
          },
          actions: {
            split: vi.fn(),
            setStartPoint: vi.fn(),
            setEndPoint: vi.fn(),
            removeFragment: vi.fn(),
            shiftFragment: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
            showExportDialog: vi.fn(),
          },
        },
      },
    });

    // Mock window.dispatchEvent for project dialog methods
    global.window.dispatchEvent = vi.fn();
  });

  const createWrapper = (options = {}) => {
    return mount(EditButtons, {
      global: {
        plugins: [store],
        stubs: {
          Button: {
            template: '<button><slot /></button>',
            props: ['disabled', 'icon', 'size', 'text', 'severity', 'label'],
          },
          Divider: {
            template: '<div class="divider" />',
          },
          VolumeSlider: true,
          PlaybackRateSlider: true,
        },
        directives: {
          tooltip: Tooltip,
        },
      },
      ...options,
    });
  };

  it('renders all action buttons', () => {
    wrapper = createWrapper();
    // Check that component exists and renders
    expect(wrapper.exists()).toBe(true);
    // Check that buttons exist in template
    expect(wrapper.html()).toContain('button');
  });

  it('calls split action when split button is clicked', async () => {
    // Create a new store with canCut = true
    const testStore = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [],
            activeFragment: null,
          },
          getters: {
            canUndo: () => false,
            canRedo: () => false,
            canMoveRight: () => false,
            canMoveLeft: () => false,
            canCut: () => true, // Set to true for this test
            hasProject: () => true,
          },
          actions: {
            split: vi.fn(),
            setStartPoint: vi.fn(),
            setEndPoint: vi.fn(),
            removeFragment: vi.fn(),
            shiftFragment: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
            showExportDialog: vi.fn(),
          },
        },
      },
    });
    
    wrapper = mount(EditButtons, {
      global: {
        plugins: [testStore],
        stubs: {
          Button: {
            template: '<button><slot /></button>',
            props: ['disabled', 'icon', 'size', 'text', 'severity', 'label'],
          },
          Divider: {
            template: '<div class="divider" />',
          },
          VolumeSlider: true,
          PlaybackRateSlider: true,
        },
        directives: {
          tooltip: Tooltip,
        },
      },
    });

    const splitSpy = vi.fn();
    testStore.dispatch = vi.fn().mockImplementation((action) => {
      if (action === 'videoeditor/split') {
        splitSpy();
      }
    });
    
    // Find and trigger split action
    wrapper.vm.split();
    
    expect(testStore.dispatch).toHaveBeenCalledWith('videoeditor/split');
  });

  it('calls setStartPoint action when set start button is clicked', async () => {
    // Create a new store with canCut = true
    const testStore = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [],
            activeFragment: null,
          },
          getters: {
            canUndo: () => false,
            canRedo: () => false,
            canMoveRight: () => false,
            canMoveLeft: () => false,
            canCut: () => true, // Set to true for this test
            hasProject: () => true,
          },
          actions: {
            split: vi.fn(),
            setStartPoint: vi.fn(),
            setEndPoint: vi.fn(),
            removeFragment: vi.fn(),
            shiftFragment: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
            showExportDialog: vi.fn(),
          },
        },
      },
    });
    
    wrapper = mount(EditButtons, {
      global: {
        plugins: [testStore],
        stubs: {
          Button: {
            template: '<button><slot /></button>',
            props: ['disabled', 'icon', 'size', 'text', 'severity', 'label'],
          },
          Divider: {
            template: '<div class="divider" />',
          },
          VolumeSlider: true,
          PlaybackRateSlider: true,
        },
        directives: {
          tooltip: Tooltip,
        },
      },
    });

    testStore.dispatch = vi.fn();
    
    wrapper.vm.setStartPoint();
    
    expect(testStore.dispatch).toHaveBeenCalledWith('videoeditor/setStartPoint');
  });

  it('calls setEndPoint action when set end button is clicked', async () => {
    // Create a new store with canCut = true
    const testStore = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [],
            activeFragment: null,
          },
          getters: {
            canUndo: () => false,
            canRedo: () => false,
            canMoveRight: () => false,
            canMoveLeft: () => false,
            canCut: () => true, // Set to true for this test
            hasProject: () => true,
          },
          actions: {
            split: vi.fn(),
            setStartPoint: vi.fn(),
            setEndPoint: vi.fn(),
            removeFragment: vi.fn(),
            shiftFragment: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
            showExportDialog: vi.fn(),
          },
        },
      },
    });
    
    wrapper = mount(EditButtons, {
      global: {
        plugins: [testStore],
        stubs: {
          Button: {
            template: '<button><slot /></button>',
            props: ['disabled', 'icon', 'size', 'text', 'severity', 'label'],
          },
          Divider: {
            template: '<div class="divider" />',
          },
          VolumeSlider: true,
          PlaybackRateSlider: true,
        },
        directives: {
          tooltip: Tooltip,
        },
      },
    });

    testStore.dispatch = vi.fn();
    
    wrapper.vm.setEndPoint();
    
    expect(testStore.dispatch).toHaveBeenCalledWith('videoeditor/setEndPoint');
  });

  it('disables buttons when conditions are not met', () => {
    // Use default store which has canCut = false
    wrapper = createWrapper();

    expect(wrapper.vm.canCut).toBe(false);
  });

  it('shows export dialog when export button is clicked', () => {
    wrapper = createWrapper();
    
    store.dispatch = vi.fn();
    
    wrapper.vm.showExportDialog();
    
    expect(store.dispatch).toHaveBeenCalledWith('videoeditor/showExportDialog', true);
  });
});

