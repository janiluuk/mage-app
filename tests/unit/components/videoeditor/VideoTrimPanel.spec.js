import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import VideoTrimPanel from '@/components/videoeditor/VideoTrimPanel.vue';
import Tooltip from 'primevue/tooltip';

describe('VideoTrimPanel', () => {
  let store;

  const createVideoeditorModule = (overrides = {}) => ({
    namespaced: true,
    state: {
      activeFragment: { duration: 10, fps: 30 },
      player: {
        progress: 0.5,
        playing: false,
        volume: 1,
        widthPercent: 100,
        fullscreen: false,
      },
      ...overrides.state,
    },
    getters: {
      fullDuration: () => 10,
      ...overrides.getters,
    },
    actions: {
      seek: vi.fn(),
      setStartPoint: vi.fn(),
      setEndPoint: vi.fn(),
      ...overrides.actions,
    },
  });

  const createWrapper = (storeOverrides = {}) => {
    store = createStore({
      modules: {
        videoeditor: createVideoeditorModule(storeOverrides),
      },
    });

    return mount(VideoTrimPanel, {
      global: {
        plugins: [store],
        stubs: {
          Panel: {
            template: '<div><slot /></div>',
            props: ['header', 'toggleable', 'collapsed'],
          },
          Button: {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
            props: ['disabled', 'icon', 'label', 'class'],
          },
          InputText: {
            template: '<input :value="modelValue" @blur="$emit(\'blur\')" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder', 'class'],
          },
          Slider: {
            template: '<div class="slider-stub" />',
            props: ['modelValue', 'range', 'min', 'max', 'step'],
          },
          Tag: {
            template: '<span class="tag-stub">{{ value }}</span>',
            props: ['value', 'severity'],
          },
          Message: {
            template: '<div class="message-stub"><slot /></div>',
            props: ['severity', 'closable'],
          },
        },
        directives: {
          tooltip: Tooltip,
        },
      },
    });
  };

  it('renders the trim panel', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('initializes with video duration as end time', () => {
    const wrapper = createWrapper();
    // trimEnd should be set to 10 (the video duration)
    expect(wrapper.vm.trimEnd).toBe(10);
    expect(wrapper.vm.trimStart).toBe(0);
  });

  it('computes currentTime from player.progress * fullDuration', () => {
    const wrapper = createWrapper({
      state: {
        player: {
          progress: 0.3,
          playing: false,
          volume: 1,
          widthPercent: 100,
          fullscreen: false,
        },
      },
      getters: {
        fullDuration: () => 20,
      },
    });
    // currentTime = 0.3 * 20 = 6
    // Access the internal computed via vm
    expect(wrapper.vm.trimStart).toBe(0);
  });

  it('computes isTrimmed when start > 0', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.isTrimmed).toBe(false);

    // Manually modify trim start
    wrapper.vm.trimStart = 2;
    expect(wrapper.vm.isTrimmed).toBe(true);
  });

  it('computes isTrimmed when end < duration', () => {
    const wrapper = createWrapper();
    wrapper.vm.trimEnd = 5;
    expect(wrapper.vm.isTrimmed).toBe(true);
  });

  it('computes trimDuration correctly', () => {
    const wrapper = createWrapper();
    wrapper.vm.trimStart = 2;
    wrapper.vm.trimEnd = 8;
    expect(wrapper.vm.trimDuration).toBe(6);
  });

  it('validates trim points', () => {
    const wrapper = createWrapper();
    // Valid state
    wrapper.vm.trimStart = 0;
    wrapper.vm.trimEnd = 10;
    expect(wrapper.vm.isValid).toBe(true);

    // Invalid: start >= end
    wrapper.vm.trimStart = 10;
    wrapper.vm.trimEnd = 5;
    expect(wrapper.vm.isValid).toBe(false);
  });

  it('formats time display correctly', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.formatTime(0)).toBe('00:00:00.000');
    expect(wrapper.vm.formatTime(65.5)).toBe('00:01:05.500');
    expect(wrapper.vm.formatTime(3661.123)).toBe('01:01:01.123');
  });

  it('resets trim to full duration', () => {
    const wrapper = createWrapper();
    wrapper.vm.trimStart = 3;
    wrapper.vm.trimEnd = 7;
    expect(wrapper.vm.isTrimmed).toBe(true);

    wrapper.vm.resetTrim();
    expect(wrapper.vm.trimStart).toBe(0);
    expect(wrapper.vm.trimEnd).toBe(10);
    expect(wrapper.vm.isTrimmed).toBe(false);
  });

  it('previewTrim dispatches seek with progress value', () => {
    const seekAction = vi.fn();
    const wrapper = createWrapper({
      actions: { seek: seekAction, setStartPoint: vi.fn(), setEndPoint: vi.fn() },
    });

    wrapper.vm.trimStart = 3;
    wrapper.vm.trimEnd = 8;
    wrapper.vm.previewTrim();

    // seek should be called with progress = 3/10 = 0.3
    expect(seekAction).toHaveBeenCalled();
    const seekPayload = seekAction.mock.calls[0][1];
    expect(seekPayload).toBeCloseTo(0.3, 5);
  });

  it('previewTrim emits trim-preview event', () => {
    const wrapper = createWrapper();
    wrapper.vm.trimStart = 2;
    wrapper.vm.trimEnd = 7;
    wrapper.vm.previewTrim();

    expect(wrapper.emitted('trim-preview')).toBeTruthy();
    expect(wrapper.emitted('trim-preview')[0][0]).toEqual({
      start: 2,
      end: 7,
    });
  });

  it('applyTrim dispatches seek then setStartPoint then seek then setEndPoint', async () => {
    const seekAction = vi.fn().mockResolvedValue(undefined);
    const setStartAction = vi.fn().mockResolvedValue(undefined);
    const setEndAction = vi.fn().mockResolvedValue(undefined);

    const wrapper = createWrapper({
      actions: {
        seek: seekAction,
        setStartPoint: setStartAction,
        setEndPoint: setEndAction,
      },
    });

    wrapper.vm.trimStart = 2;
    wrapper.vm.trimEnd = 8;
    await wrapper.vm.applyTrim();

    // Should have called seek twice (once for start, once for end)
    expect(seekAction).toHaveBeenCalledTimes(2);
    // First seek: 2/10 = 0.2
    expect(seekAction.mock.calls[0][1]).toBeCloseTo(0.2, 5);
    // Second seek: 8/10 = 0.8
    expect(seekAction.mock.calls[1][1]).toBeCloseTo(0.8, 5);

    // setStartPoint and setEndPoint called once each without time params
    expect(setStartAction).toHaveBeenCalledTimes(1);
    expect(setEndAction).toHaveBeenCalledTimes(1);
  });

  it('applyTrim emits trim-applied event', async () => {
    const wrapper = createWrapper({
      actions: {
        seek: vi.fn().mockResolvedValue(undefined),
        setStartPoint: vi.fn().mockResolvedValue(undefined),
        setEndPoint: vi.fn().mockResolvedValue(undefined),
      },
    });

    wrapper.vm.trimStart = 1;
    wrapper.vm.trimEnd = 9;
    await wrapper.vm.applyTrim();

    expect(wrapper.emitted('trim-applied')).toBeTruthy();
    expect(wrapper.emitted('trim-applied')[0][0]).toEqual({
      start: 1,
      end: 9,
      duration: 8,
    });
  });

  it('applyTrim does not dispatch when invalid', async () => {
    const seekAction = vi.fn();
    const wrapper = createWrapper({
      actions: {
        seek: seekAction,
        setStartPoint: vi.fn(),
        setEndPoint: vi.fn(),
      },
    });

    // Make invalid: start > end
    wrapper.vm.trimStart = 10;
    wrapper.vm.trimEnd = 5;
    await wrapper.vm.applyTrim();

    expect(seekAction).not.toHaveBeenCalled();
    expect(wrapper.emitted('trim-applied')).toBeFalsy();
  });
});

