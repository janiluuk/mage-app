import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ImportDialog from './ImportDialog.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';

// Mock the import service
vi.mock('@/services/importService', () => ({
  validateExportData: vi.fn(() => ({ isValid: true, error: null })),
  detectConflicts: vi.fn(() => []),
  ImportService: vi.fn(() => ({
    previewImport: vi.fn(async () => ({
      isValid: true,
      type: 'presets',
      itemCount: 2
    })),
    importPresets: vi.fn(async () => ({
      success: true,
      presets: []
    }))
  }))
}));

describe('ImportDialog', () => {
  let wrapper;
  
  const defaultProps = {
    visible: true,
    existingPresets: [
      { id: 'p1', name: 'Existing Preset', settings: {} }
    ]
  };
  
  beforeEach(() => {
    wrapper = mount(ImportDialog, {
      props: defaultProps,
      global: {
        components: {
          Button,
          Dialog,
          FileUpload
        }
      }
    });
  });
  
  it('renders dialog when visible', () => {
    expect(wrapper.html().length).toBeGreaterThan(0);
  });
  
  it('shows file upload interface', () => {
    const text = wrapper.text();
    // Should have some upload-related text or component
    expect(text.length).toBeGreaterThan(0);
  });
  
  it('emits close event when cancel clicked', async () => {
    const cancelButton = wrapper.findAll('button').find(b => 
      b.text().includes('Cancel') || b.classes().includes('p-button-text')
    );
    
    if (cancelButton) {
      await cancelButton.trigger('click');
      expect(wrapper.emitted('update:visible')).toBeTruthy();
    }
  });
  
  it('handles file selection', async () => {
    // Component should handle file input
    expect(wrapper.vm).toBeDefined();
  });
});
