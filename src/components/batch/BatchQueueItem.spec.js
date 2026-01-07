import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import BatchQueueItem from './BatchQueueItem.vue';
import { FileStatus } from '@/services/batchProcessingService';

describe('BatchQueueItem', () => {
  let wrapper;
  let mockConfirm;
  
  const createWrapper = (props = {}) => {
    mockConfirm = {
      require: vi.fn()
    };

    return mount(BatchQueueItem, {
      props,
      global: {
        plugins: [
          PrimeVue,
          ConfirmationService
        ],
        mocks: {
          $confirm: mockConfirm
        },
        stubs: {
          Tag: {
            template: '<span>{{ value }}</span>',
            props: ['value', 'severity']
          },
          Button: {
            template: '<button @click="$emit(\'click\')"><slot></slot></button>',
            props: ['icon', 'disabled']
          },
          ProgressBar: {
            template: '<div>{{ value }}%</div>',
            props: ['value', 'showValue']
          }
        }
      }
    });
  };

  const mockFile = {
    id: 'file_1',
    fileName: 'video.mp4',
    fileSize: 1048576, // 1 MB
    status: FileStatus.PENDING,
    progress: 0,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders file information', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.text()).toContain('video.mp4');
      expect(wrapper.text()).toContain('MB');
    });

    it('displays file status', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.text()).toContain(FileStatus.PENDING.toUpperCase());
    });

    it('shows error message when present', () => {
      const fileWithError = {
        ...mockFile,
        status: FileStatus.ERROR,
        error: 'Upload failed'
      };
      wrapper = createWrapper({ file: fileWithError });
      expect(wrapper.text()).toContain('Upload failed');
    });

    it('does not show error message when no error', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.text()).not.toContain('Upload failed');
    });
  });

  describe('progress bar', () => {
    it('shows progress bar for processing files', () => {
      const processingFile = {
        ...mockFile,
        status: FileStatus.PROCESSING,
        progress: 50
      };
      wrapper = createWrapper({ file: processingFile });
      const progressBar = wrapper.find('div');
      expect(progressBar.text()).toContain('50');
    });

    it('shows progress bar for uploading files', () => {
      const uploadingFile = {
        ...mockFile,
        status: FileStatus.UPLOADING,
        progress: 75
      };
      wrapper = createWrapper({ file: uploadingFile });
      const progressBar = wrapper.find('div');
      expect(progressBar.text()).toContain('75');
    });

    it('does not show progress bar for pending files', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.html()).not.toContain('ProgressBar');
    });

    it('does not show progress bar for complete files', () => {
      const completeFile = { ...mockFile, status: FileStatus.COMPLETE };
      wrapper = createWrapper({ file: completeFile });
      expect(wrapper.html()).not.toContain('ProgressBar');
    });
  });

  describe('actions', () => {
    it('shows retry button for error status', () => {
      const errorFile = {
        ...mockFile,
        status: FileStatus.ERROR,
        error: 'Processing failed'
      };
      wrapper = createWrapper({ file: errorFile });
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('shows remove button for removable files', () => {
      wrapper = createWrapper({ file: mockFile });
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('does not show remove button for processing files', () => {
      const processingFile = {
        ...mockFile,
        status: FileStatus.PROCESSING
      };
      wrapper = createWrapper({ file: processingFile });
      expect(wrapper.vm.canRemove).toBe(false);
    });

    it('emits retry event when retry button clicked', async () => {
      const errorFile = {
        ...mockFile,
        status: FileStatus.ERROR,
        error: 'Failed'
      };
      wrapper = createWrapper({ file: errorFile });
      const retryButton = wrapper.findAll('button')[0];
      await retryButton.trigger('click');
      expect(wrapper.emitted('retry')).toBeTruthy();
      expect(wrapper.emitted('retry')[0]).toEqual([mockFile.id]);
    });
  });

  describe('file size formatting', () => {
    it('formats bytes correctly', () => {
      wrapper = createWrapper({ file: { ...mockFile, fileSize: 1024 } });
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB');
    });

    it('formats KB correctly', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.vm.formatFileSize(1048576)).toBe('1 MB');
    });

    it('formats MB correctly', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.vm.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('handles zero bytes', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.vm.formatFileSize(0)).toBe('0 B');
    });

    it('handles undefined size', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.vm.formatFileSize(undefined)).toBe('0 B');
    });
  });

  describe('status icons', () => {
    beforeEach(() => {
      wrapper = createWrapper({ file: mockFile });
    });

    it('returns correct icon for pending status', () => {
      expect(wrapper.vm.getStatusIcon('pending')).toBe('pi pi-clock');
    });

    it('returns correct icon for uploading status', () => {
      expect(wrapper.vm.getStatusIcon('uploading')).toBe('pi pi-cloud-upload');
    });

    it('returns correct icon for processing status', () => {
      expect(wrapper.vm.getStatusIcon('processing')).toBe('pi pi-spin pi-spinner');
    });

    it('returns correct icon for complete status', () => {
      expect(wrapper.vm.getStatusIcon('complete')).toBe('pi pi-check-circle');
    });

    it('returns correct icon for error status', () => {
      expect(wrapper.vm.getStatusIcon('error')).toBe('pi pi-times-circle');
    });

    it('returns correct icon for cancelled status', () => {
      expect(wrapper.vm.getStatusIcon('cancelled')).toBe('pi pi-ban');
    });

    it('returns default icon for unknown status', () => {
      expect(wrapper.vm.getStatusIcon('unknown')).toBe('pi pi-circle');
    });
  });

  describe('status colors', () => {
    beforeEach(() => {
      wrapper = createWrapper({ file: mockFile });
    });

    it('returns correct color for pending status', () => {
      expect(wrapper.vm.getStatusColor('pending')).toBe('#6c757d');
    });

    it('returns correct color for processing status', () => {
      expect(wrapper.vm.getStatusColor('processing')).toBe('#fd7e14');
    });

    it('returns correct color for complete status', () => {
      expect(wrapper.vm.getStatusColor('complete')).toBe('#28a745');
    });

    it('returns correct color for error status', () => {
      expect(wrapper.vm.getStatusColor('error')).toBe('#dc3545');
    });

    it('returns default color for unknown status', () => {
      expect(wrapper.vm.getStatusColor('unknown')).toBe('#6c757d');
    });
  });

  describe('status severity', () => {
    beforeEach(() => {
      wrapper = createWrapper({ file: mockFile });
    });

    it('returns correct severity for pending status', () => {
      expect(wrapper.vm.getStatusSeverity('pending')).toBe('info');
    });

    it('returns correct severity for processing status', () => {
      expect(wrapper.vm.getStatusSeverity('processing')).toBe('warning');
    });

    it('returns correct severity for complete status', () => {
      expect(wrapper.vm.getStatusSeverity('complete')).toBe('success');
    });

    it('returns correct severity for error status', () => {
      expect(wrapper.vm.getStatusSeverity('error')).toBe('danger');
    });

    it('returns default severity for unknown status', () => {
      expect(wrapper.vm.getStatusSeverity('unknown')).toBe('info');
    });
  });

  describe('computed properties', () => {
    it('canRemove is true for pending files', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.vm.canRemove).toBe(true);
    });

    it('canRemove is false for processing files', () => {
      const processingFile = { ...mockFile, status: FileStatus.PROCESSING };
      wrapper = createWrapper({ file: processingFile });
      expect(wrapper.vm.canRemove).toBe(false);
    });

    it('canRemove is false for uploading files', () => {
      const uploadingFile = { ...mockFile, status: FileStatus.UPLOADING };
      wrapper = createWrapper({ file: uploadingFile });
      expect(wrapper.vm.canRemove).toBe(false);
    });

    it('canRemove is true for complete files', () => {
      const completeFile = { ...mockFile, status: FileStatus.COMPLETE };
      wrapper = createWrapper({ file: completeFile });
      expect(wrapper.vm.canRemove).toBe(true);
    });

    it('canRemove is true for error files', () => {
      const errorFile = { ...mockFile, status: FileStatus.ERROR };
      wrapper = createWrapper({ file: errorFile });
      expect(wrapper.vm.canRemove).toBe(true);
    });
  });

  describe('hover effects', () => {
    it('applies hover class on component', () => {
      wrapper = createWrapper({ file: mockFile });
      expect(wrapper.find('.batch-queue-item').exists()).toBe(true);
    });
  });
});
