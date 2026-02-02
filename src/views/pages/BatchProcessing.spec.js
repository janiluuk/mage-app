import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BatchProcessing from './BatchProcessing.vue';

vi.mock('@/components/batch/BatchProcessor.vue', () => ({
  default: {
    name: 'BatchProcessor',
    template: '<div data-testid="batch-processor">BatchProcessor</div>'
  }
}));

describe('BatchProcessing', () => {
  it('renders page header and batch processor', () => {
    const wrapper = mount(BatchProcessing);
    expect(wrapper.text()).toContain('Batch Processing');
    expect(wrapper.find('[data-testid="batch-processor"]').exists()).toBe(true);
  });
});

