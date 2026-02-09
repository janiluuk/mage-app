import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

const mockService = vi.hoisted(() => ({
  getConfig: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  listFiles: vi.fn(),
  addLocalFile: vi.fn()
}));

vi.mock('@/services/cloudStorageService', () => ({
  default: mockService
}));

import CloudStorage from './CloudStorage.vue';

describe('CloudStorage', () => {
  beforeEach(() => {
    mockService.getConfig.mockReturnValue(null);
    mockService.connect.mockReturnValue({
      provider: 's3',
      mode: 'local',
      bucket: 'mage-bucket'
    });
    mockService.listFiles.mockResolvedValue([
      { path: 'users/1/sample.mp4', size: 100, updatedAt: '2026-02-01T00:00:00Z' }
    ]);
    mockService.addLocalFile.mockReturnValue({
      path: 'users/1/sample.mp4',
      size: 100,
      updatedAt: '2026-02-01T00:00:00Z'
    });
  });

  it('renders connection form', () => {
    const wrapper = mount(CloudStorage, {
      global: {
        stubs: {
          Button: { template: '<button><slot></slot></button>' },
          Card: { template: '<div><slot name="title"></slot><slot name="content"></slot></div>' },
          InputText: { template: '<input />' },
          Message: { template: '<div><slot></slot></div>' }
        }
      }
    });

    expect(wrapper.text()).toContain('Cloud Storage');
    expect(wrapper.find('[data-testid="connect-button"]').exists()).toBe(true);
  });

  it('connects and refreshes files', async () => {
    const wrapper = mount(CloudStorage, {
      global: {
        stubs: {
          Button: {
            template: '<button @click="$emit(\'click\')"><slot></slot></button>'
          },
          Card: { template: '<div><slot name="title"></slot><slot name="content"></slot></div>' },
          InputText: { template: '<input />' },
          Message: { template: '<div><slot></slot></div>' }
        }
      }
    });

    await wrapper.find('[data-testid="connect-button"]').trigger('click');
    await vi.waitFor(() => {
      expect(mockService.connect).toHaveBeenCalled();
    });
    expect(mockService.listFiles).toHaveBeenCalled();
  });
});

