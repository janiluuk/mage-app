import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import EditButtons from './EditButtons.vue';

const dispatch = vi.fn();

const mockStore = {
  dispatch,
  getters: {
    'videoeditor/canUndo': true,
    'videoeditor/canRedo': true,
    'videoeditor/canMoveRight': true,
    'videoeditor/canMoveLeft': true,
    'videoeditor/canCut': true,
    'videoeditor/hasProject': true
  },
  state: {
    videoeditor: {
      activeFragment: {}
    }
  }
};

vi.mock('vuex', () => ({
  useStore: () => mockStore
}));

vi.mock('primevue/tooltip', () => ({
  default: {}
}));

describe('EditButtons', () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  const createWrapper = () => {
    return mount(EditButtons, {
      global: {
        stubs: {
          Button: {
            props: ['icon', 'label', 'disabled'],
            template: '<button :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')"><slot></slot>{{ label }}</button>'
          },
          Divider: { template: '<span />' },
          VolumeSlider: { template: '<div />' },
          PlaybackRateSlider: { template: '<div />' }
        }
      }
    });
  };

  it('dispatches trim actions', async () => {
    const wrapper = createWrapper();

    await wrapper.find('button[data-icon="pi-angle-left"]').trigger('click');
    await wrapper.find('button[data-icon="pi-angle-right"]').trigger('click');

    expect(dispatch).toHaveBeenCalledWith('videoeditor/setStartPoint');
    expect(dispatch).toHaveBeenCalledWith('videoeditor/setEndPoint');
  });

  it('dispatches split action', async () => {
    const wrapper = createWrapper();
    await wrapper.find('button[data-icon="pi-code"]').trigger('click');
    expect(dispatch).toHaveBeenCalledWith('videoeditor/split');
  });
});

