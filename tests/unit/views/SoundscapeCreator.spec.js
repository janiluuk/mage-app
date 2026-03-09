import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import SoundscapeCreator from '@/views/SoundscapeCreator.vue';
import MageApiService from '@/services/mage/MageApiService';

vi.mock('@/services/mage/MageApiService', () => ({
  default: {
    isConfigured: vi.fn(),
    getStatus: vi.fn(),
    getQueue: vi.fn(),
  },
}));

describe('SoundscapeCreator', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MageApiService.isConfigured.mockReturnValue(true);
    MageApiService.getStatus.mockResolvedValue({
      processing: null,
      queued: 0,
      recent: [],
    });
    MageApiService.getQueue.mockResolvedValue({ queued: [] });
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    vi.useRealTimers();
  });

  async function createWrapper() {
    wrapper = mount(SoundscapeCreator, {
      global: {
        stubs: {
          SoundscapeGenerator: {
            name: 'SoundscapeGenerator',
            template: '<div class="soundscape-generator-stub" />',
          },
          Card: { template: '<div><slot name="title" /><slot name="content" /></div>' },
          Divider: { template: '<hr />' },
        },
      },
    });
    await flushPromises();
    return wrapper;
  }

  it('polls status/queue on mount when helper API is configured', async () => {
    await createWrapper();
    expect(MageApiService.getStatus).toHaveBeenCalledTimes(1);
    expect(MageApiService.getQueue).toHaveBeenCalledTimes(1);
  });

  it('does not poll on mount when helper API is not configured', async () => {
    MageApiService.isConfigured.mockReturnValue(false);
    await createWrapper();
    expect(MageApiService.getStatus).not.toHaveBeenCalled();
    expect(MageApiService.getQueue).not.toHaveBeenCalled();
  });

  it('continues polling every 5 seconds when configured', async () => {
    await createWrapper();
    vi.advanceTimersByTime(5000);
    await flushPromises();
    expect(MageApiService.getStatus).toHaveBeenCalledTimes(2);
    expect(MageApiService.getQueue).toHaveBeenCalledTimes(2);
  });

  it('refreshes queue when generator emits generated event', async () => {
    await createWrapper();
    const generator = wrapper.findComponent({ name: 'SoundscapeGenerator' });
    generator.vm.$emit('generated', { id: 'job-1' });
    await flushPromises();
    expect(MageApiService.getStatus).toHaveBeenCalledTimes(2);
    expect(MageApiService.getQueue).toHaveBeenCalledTimes(2);
  });
});
