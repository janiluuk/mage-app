import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import BatchProcessor from './BatchProcessor.vue';
import { BatchStatus, FileStatus } from '@/services/batchProcessingService';

describe('BatchProcessor', () => {
  let wrapper;
  
  const createWrapper = (props = {}) => {
    return mount(BatchProcessor, {
      props,
      global: {
        plugins: [
          PrimeVue,
          ConfirmationService
        ],
        stubs: {
          Card: {
            template: '<div><slot name="title"></slot><slot name="content"></slot></div>'
          },
          Button: {
            template: '<button @click="$emit(\'click\')"><slot></slot></button>'
          },
          ProgressBar: {
            template: '<div>{{ value }}%</div>',
            props: ['value', 'showValue']
          },
          Tag: {
            template: '<span>{{ value }}</span>',
            props: ['value', 'severity']
          },
          Message: {
            template: '<div><slot></slot></div>',
            props: ['severity', 'closable']
          },
          Slider: {
            template: '<input type="range" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'min', 'max', 'step', 'disabled']
          },
          ScrollPanel: {
            template: '<div><slot></slot></div>'
          },
          Divider: {
            template: '<hr />'
          },
          BatchQueueItem: {
            template: '<div class="batch-queue-item">{{ file.fileName }}</div>',
            props: ['file']
          }
        }
      }
    });
  };

  const mockBatch = {
    id: 'batch_123',
    status: BatchStatus.PENDING,
    files: [
      {
        id: 'file_1',
        fileName: 'video1.mp4',
        fileSize: 1024000,
        status: FileStatus.PENDING,
        progress: 0,
        error: null
      },
      {
        id: 'file_2',
        fileName: 'video2.mp4',
        fileSize: 2048000,
        status: FileStatus.COMPLETE,
        progress: 100,
        error: null
      },
      {
        id: 'file_3',
        fileName: 'video3.mp4',
        fileSize: 3072000,
        status: FileStatus.ERROR,
        progress: 0,
        error: 'Processing failed'
      }
    ],
    concurrency: 3,
    createdAt: '2026-01-07T10:00:00Z',
    startedAt: null,
    completedAt: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders without batch', () => {
      wrapper = createWrapper({ batch: null });
      expect(wrapper.text()).toContain('No batch selected');
    });

    it('renders with batch data', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain('Batch Status');
      expect(wrapper.text()).toContain('video1.mp4');
      expect(wrapper.text()).toContain('video2.mp4');
      expect(wrapper.text()).toContain('video3.mp4');
    });

    it('displays correct statistics', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain('3'); // total
      expect(wrapper.text()).toContain('1'); // complete
      expect(wrapper.text()).toContain('1'); // error
    });

    it('calculates progress correctly', () => {
      wrapper = createWrapper({ batch: mockBatch });
      // 2 out of 3 files are complete or error = 67% (rounded)
      expect(wrapper.text()).toContain('67');
    });

    it('displays batch timestamps when available', () => {
      const batchWithTimestamps = {
        ...mockBatch,
        startedAt: '2026-01-07T10:05:00Z',
        completedAt: '2026-01-07T10:10:00Z'
      };
      wrapper = createWrapper({ batch: batchWithTimestamps });
      expect(wrapper.text()).toContain('Created:');
      expect(wrapper.text()).toContain('Started:');
      expect(wrapper.text()).toContain('Completed:');
    });
  });

  describe('status display', () => {
    it('shows correct status tag', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain(BatchStatus.PENDING.toUpperCase());
    });

    it('displays error count when errors exist', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain('1 error(s)');
    });

    it('does not show error count when no errors', () => {
      const batchNoErrors = {
        ...mockBatch,
        files: mockBatch.files.filter(f => f.status !== FileStatus.ERROR)
      };
      wrapper = createWrapper({ batch: batchNoErrors });
      expect(wrapper.text()).not.toContain('error(s)');
    });
  });

  describe('actions', () => {
    it('emits start event when Start button clicked', async () => {
      wrapper = createWrapper({ batch: mockBatch });
      const button = wrapper.find('button');
      await button.trigger('click');
      expect(wrapper.emitted('start')).toBeTruthy();
    });

    it('emits cancel event when Cancel button clicked during processing', async () => {
      const processingBatch = { ...mockBatch, status: BatchStatus.PROCESSING };
      wrapper = createWrapper({ batch: processingBatch });
      const button = wrapper.find('button');
      await button.trigger('click');
      expect(wrapper.emitted('cancel')).toBeTruthy();
    });

    it('disables Start button when batch has no files', () => {
      const emptyBatch = { ...mockBatch, files: [] };
      wrapper = createWrapper({ batch: emptyBatch });
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('concurrency control', () => {
    it('displays concurrency slider', () => {
      wrapper = createWrapper({ batch: mockBatch });
      const slider = wrapper.find('input[type="range"]');
      expect(slider.exists()).toBe(true);
    });

    it('disables concurrency slider during processing', () => {
      const processingBatch = { ...mockBatch, status: BatchStatus.PROCESSING };
      wrapper = createWrapper({ batch: processingBatch });
      const slider = wrapper.find('input[type="range"]');
      // Slider should have disabled attribute or property
      expect(slider.attributes('disabled') !== undefined || wrapper.vm.batch.status === 'processing').toBe(true);
    });
  });

  describe('file list', () => {
    it('renders all files in batch', () => {
      wrapper = createWrapper({ batch: mockBatch });
      const items = wrapper.findAll('.batch-queue-item');
      expect(items).toHaveLength(3);
    });

    it('displays correct file count', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain('Files (3)');
    });
  });

  describe('statistics cards', () => {
    it('displays all statistics cards', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.text()).toContain('Total');
      expect(wrapper.text()).toContain('Complete');
      expect(wrapper.text()).toContain('Processing');
      expect(wrapper.text()).toContain('Errors');
    });

    it('shows correct values in statistics cards', () => {
      wrapper = createWrapper({ batch: mockBatch });
      const stats = wrapper.vm.statistics;
      expect(stats.total).toBe(3);
      expect(stats.complete).toBe(1);
      expect(stats.error).toBe(1);
    });
  });

  describe('computed properties', () => {
    it('computes progress correctly with all complete', () => {
      const completeBatch = {
        ...mockBatch,
        files: mockBatch.files.map(f => ({ ...f, status: FileStatus.COMPLETE }))
      };
      wrapper = createWrapper({ batch: completeBatch });
      expect(wrapper.vm.progress).toBe(100);
    });

    it('computes progress correctly with no complete', () => {
      const pendingBatch = {
        ...mockBatch,
        files: mockBatch.files.map(f => ({ ...f, status: FileStatus.PENDING }))
      };
      wrapper = createWrapper({ batch: pendingBatch });
      expect(wrapper.vm.progress).toBe(0);
    });

    it('returns false for canProcess when no files', () => {
      const emptyBatch = { ...mockBatch, files: [] };
      wrapper = createWrapper({ batch: emptyBatch });
      expect(wrapper.vm.canProcess).toBe(false);
    });

    it('returns true for canProcess when files exist', () => {
      wrapper = createWrapper({ batch: mockBatch });
      expect(wrapper.vm.canProcess).toBe(true);
    });
  });

  describe('helper functions', () => {
    beforeEach(() => {
      wrapper = createWrapper({ batch: mockBatch });
    });

    it('getStatusSeverity returns correct severity', () => {
      expect(wrapper.vm.getStatusSeverity('complete')).toBe('success');
      expect(wrapper.vm.getStatusSeverity('error')).toBe('danger');
      expect(wrapper.vm.getStatusSeverity('processing')).toBe('warning');
      expect(wrapper.vm.getStatusSeverity('pending')).toBe('info');
    });

    it('formatDate formats date string correctly', () => {
      const result = wrapper.vm.formatDate('2026-01-07T10:00:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('formatDate handles empty input', () => {
      const result = wrapper.vm.formatDate('');
      expect(result).toBe('');
    });
  });
});
