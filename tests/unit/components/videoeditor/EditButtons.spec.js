import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import EditButtons from '@/components/videoeditor/EditButtons.vue';

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
  });

  const createWrapper = (options = {}) => {
    return mount(EditButtons, {
      global: {
        plugins: [store],
        stubs: {
          Button: true,
          VolumeSlider: true,
          PlaybackRateSlider: true,
        },
      },
      ...options,
    });
  };

  it('renders all action buttons', () => {
    wrapper = createWrapper();
    const buttons = wrapper.findAllComponents({ name: 'Button' });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls split action when split button is clicked', async () => {
    store.getters['videoeditor/canCut'] = () => true;
    wrapper = createWrapper();

    const splitSpy = vi.spyOn(store._modules.root._children.videoeditor._rawModule.actions, 'split');
    
    // Find and trigger split action
    wrapper.vm.split();
    
    expect(splitSpy).toHaveBeenCalled();
  });

  it('calls setStartPoint action when set start button is clicked', async () => {
    store.getters['videoeditor/canCut'] = () => true;
    wrapper = createWrapper();

    const setStartSpy = vi.spyOn(store._modules.root._children.videoeditor._rawModule.actions, 'setStartPoint');
    
    wrapper.vm.setStartPoint();
    
    expect(setStartSpy).toHaveBeenCalled();
  });

  it('calls setEndPoint action when set end button is clicked', async () => {
    store.getters['videoeditor/canCut'] = () => true;
    wrapper = createWrapper();

    const setEndSpy = vi.spyOn(store._modules.root._children.videoeditor._rawModule.actions, 'setEndPoint');
    
    wrapper.vm.setEndPoint();
    
    expect(setEndSpy).toHaveBeenCalled();
  });

  it('disables buttons when conditions are not met', () => {
    store.getters['videoeditor/canCut'] = () => false;
    wrapper = createWrapper();

    expect(wrapper.vm.canCut).toBe(false);
  });

  it('shows export dialog when export button is clicked', () => {
    wrapper = createWrapper();
    
    wrapper.vm.showExportDialog();
    
    expect(store._modules.root._children.videoeditor._rawModule.actions.showExportDialog).toHaveBeenCalled();
  });
});

