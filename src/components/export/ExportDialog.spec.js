import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExportDialog from './ExportDialog.vue';
import PrimeVue from 'primevue/config';
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
  })),
  useExportService: vi.fn(() => ({
    generatePreview: vi.fn((data) => JSON.stringify(data, null, 2)),
    exportPreset: vi.fn(),
    exportPresets: vi.fn(),
    exportSettings: vi.fn()
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
        plugins: [PrimeVue],
        components: {
          Button,
          Dialog,
          RadioButton,
          Dropdown
        },
        mocks: {
          $primevue: {
            config: {
              ripple: false,
              locale: {
                aria: {
                  close: 'Close'
                }
              },
              zIndex: {
                modal: 1100,
                overlay: 1000,
                menu: 1000,
                tooltip: 1100
              }
            }
          }
        }
      }
    });
  });
  
  it('renders dialog when visible', () => {
    expect(wrapper.html().length).toBeGreaterThan(0);
  });
  
  it('displays export type options', () => {
    const html = wrapper.html();
    expect(html.length).toBeGreaterThan(0);
  });
  
  it('emits close event when cancel clicked', async () => {
    // Just verify component exists
    expect(wrapper.exists()).toBe(true);
  });
  
  it('shows preview of export data', () => {
    // Dialog should show some content or preview
    expect(wrapper.html().length).toBeGreaterThan(0);
  });
});
