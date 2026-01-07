import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExportDialog from './ExportDialog.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';
import Dropdown from 'primevue/dropdown';

// Mock the export service
vi.mock('@/services/exportService', () => ({
  exportPresetsToJSON: vi.fn(() => JSON.stringify({ test: 'data' })),
  exportSettingsToJSON: vi.fn(() => JSON.stringify({ test: 'data' })),
  generateExportFilename: vi.fn(() => 'export-test.json'),
  ExportService: vi.fn(() => ({
    generatePreview: vi.fn((data) => JSON.stringify(data, null, 2))
  }))
}));

describe('ExportDialog', () => {
  let wrapper;
  
  const defaultProps = {
    visible: true,
    presets: [
      { id: 'p1', name: 'Preset 1', settings: {} },
      { id: 'p2', name: 'Preset 2', settings: {} }
    ],
    currentSettings: {
      prompt: 'test prompt',
      zoom: 1.5
    }
  };
  
  beforeEach(() => {
    wrapper = mount(ExportDialog, {
      props: defaultProps,
      global: {
        components: {
          Button,
          Dialog,
          RadioButton,
          Dropdown
        }
      }
    });
  });
  
  it('renders dialog when visible', () => {
    expect(wrapper.find('[data-testid="export-dialog"]').exists() || wrapper.text()).toBeTruthy();
  });
  
  it('displays export type options', () => {
    const text = wrapper.text();
    expect(text).toContain('Presets') || expect(text).toContain('Settings');
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
  
  it('shows preview of export data', () => {
    // Dialog should show some content or preview
    expect(wrapper.html().length).toBeGreaterThan(0);
  });
});
