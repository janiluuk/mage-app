import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import PresetDialog from './PresetDialog.vue';
import { PresetCategory } from '@/services/presetService';

describe('PresetDialog', () => {
  let wrapper;
  
  const createWrapper = (props = {}) => {
    return mount(PresetDialog, {
      props: {
        visible: false,
        mode: 'create',
        ...props
      },
      global: {
        plugins: [
          PrimeVue
        ],
        stubs: {
          Dialog: {
            template: '<div v-if="visible"><slot></slot><slot name="footer"></slot></div>',
            props: ['visible', 'header', 'modal', 'closable', 'style'],
            emits: ['update:visible', 'hide']
          },
          Button: {
            template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot></slot></button>',
            props: ['label', 'icon', 'disabled', 'class']
          },
          InputText: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :class="class" />',
            props: ['modelValue', 'placeholder', 'class']
          },
          Textarea: {
            template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
            props: ['modelValue', 'placeholder', 'rows', 'class']
          },
          Dropdown: {
            template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
            props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder', 'class']
          },
          Chips: {
            template: '<input :value="modelValue?.join(\',\')" @input="$emit(\'update:modelValue\', $event.target.value.split(\',\').filter(Boolean))" />',
            props: ['modelValue', 'placeholder', 'class']
          },
          Checkbox: {
            template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
            props: ['modelValue', 'binary']
          },
          ScrollPanel: {
            template: '<div><slot></slot></div>',
            props: ['style']
          }
        }
      }
    });
  };

  const mockPreset = {
    id: 'preset_1',
    name: 'Test Preset',
    description: 'Test description',
    category: PresetCategory.CAMERA_MOVEMENTS,
    tags: ['tag1', 'tag2'],
    settings: { zoom: 1.5 },
    isPublic: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when visible', () => {
      wrapper = createWrapper({ visible: true });
      expect(wrapper.html()).toBeTruthy();
    });

    it('does not render when not visible', () => {
      wrapper = createWrapper({ visible: false });
      expect(wrapper.html()).toBe('<!--v-if-->');
    });

    it('shows Create title in create mode', () => {
      wrapper = createWrapper({ visible: true, mode: 'create' });
      expect(wrapper.vm.dialogTitle).toBe('Create New Preset');
    });

    it('shows Edit title in edit mode', () => {
      wrapper = createWrapper({ visible: true, mode: 'edit' });
      expect(wrapper.vm.dialogTitle).toBe('Edit Preset');
    });
  });

  describe('form fields', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true });
    });

    it('renders name input', () => {
      const inputs = wrapper.findAll('input[type="text"], input:not([type])');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('renders description textarea', () => {
      const textarea = wrapper.find('textarea');
      expect(textarea.exists()).toBe(true);
    });

    it('renders category dropdown', () => {
      const select = wrapper.find('select');
      expect(select.exists()).toBe(true);
    });

    it('renders tags chips input', () => {
      expect(wrapper.html()).toContain('Chips');
    });

    it('renders public checkbox', () => {
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect(checkbox.exists()).toBe(true);
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true });
    });

    it('is invalid when name is empty', () => {
      wrapper.vm.formData.name = '';
      expect(wrapper.vm.isValid).toBe(false);
    });

    it('is valid when name is provided', () => {
      wrapper.vm.formData.name = 'Test Preset';
      expect(wrapper.vm.isValid).toBe(true);
    });

    it('shows error for empty name on save', () => {
      wrapper.vm.formData.name = '';
      wrapper.vm.onSave();
      expect(wrapper.vm.errors.name).toBe('Preset name is required');
    });

    it('shows error for name too long', () => {
      wrapper.vm.formData.name = 'a'.repeat(101);
      wrapper.vm.onSave();
      expect(wrapper.vm.errors.name).toBe('Preset name is too long (max 100 characters)');
    });

    it('trims whitespace from name', () => {
      wrapper.vm.formData.name = '  Test Preset  ';
      wrapper.vm.onSave();
      expect(wrapper.emitted('save')[0][0].name).toBe('Test Preset');
    });

    it('filters empty tags', () => {
      wrapper.vm.formData.name = 'Test';
      wrapper.vm.formData.tags = ['tag1', '', 'tag2', '  '];
      wrapper.vm.onSave();
      expect(wrapper.emitted('save')[0][0].tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('create mode', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true, mode: 'create' });
    });

    it('initializes with empty form', () => {
      expect(wrapper.vm.formData.name).toBe('');
      expect(wrapper.vm.formData.description).toBe('');
      expect(wrapper.vm.formData.tags).toEqual([]);
    });

    it('uses default category', () => {
      expect(wrapper.vm.formData.category).toBe(PresetCategory.GENERAL);
    });

    it('defaults isPublic to false', () => {
      expect(wrapper.vm.formData.isPublic).toBe(false);
    });

    it('emits save event with form data', async () => {
      wrapper.vm.formData.name = 'New Preset';
      wrapper.vm.formData.description = 'Description';
      wrapper.vm.formData.tags = ['tag1'];
      wrapper.vm.onSave();
      
      expect(wrapper.emitted('save')).toBeTruthy();
      expect(wrapper.emitted('save')[0][0]).toMatchObject({
        name: 'New Preset',
        description: 'Description',
        tags: ['tag1']
      });
    });
  });

  describe('edit mode', () => {
    it('populates form with preset data', async () => {
      wrapper = createWrapper({ 
        visible: true, 
        mode: 'edit',
        preset: mockPreset 
      });
      
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.formData.name).toBe(mockPreset.name);
      expect(wrapper.vm.formData.description).toBe(mockPreset.description);
      expect(wrapper.vm.formData.category).toBe(mockPreset.category);
      expect(wrapper.vm.formData.tags).toEqual(mockPreset.tags);
      expect(wrapper.vm.formData.isPublic).toBe(mockPreset.isPublic);
    });

    it('shows settings preview', () => {
      wrapper = createWrapper({ 
        visible: true, 
        mode: 'edit',
        preset: mockPreset 
      });
      expect(wrapper.text()).toContain('Settings');
    });

    it('does not show settings preview in create mode', () => {
      wrapper = createWrapper({ visible: true, mode: 'create' });
      expect(wrapper.text()).not.toContain('Settings are managed');
    });
  });

  describe('category options', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true });
    });

    it('includes all category options', () => {
      const options = wrapper.vm.categoryOptions;
      expect(options.length).toBeGreaterThan(0);
      expect(options.find(o => o.value === PresetCategory.CAMERA_MOVEMENTS)).toBeTruthy();
      expect(options.find(o => o.value === PresetCategory.EFFECTS)).toBeTruthy();
      expect(options.find(o => o.value === PresetCategory.STYLES)).toBeTruthy();
      expect(options.find(o => o.value === PresetCategory.GENERAL)).toBeTruthy();
      expect(options.find(o => o.value === PresetCategory.CUSTOM)).toBeTruthy();
    });

    it('has proper labels for categories', () => {
      const options = wrapper.vm.categoryOptions;
      const cameraOption = options.find(o => o.value === PresetCategory.CAMERA_MOVEMENTS);
      expect(cameraOption.label).toBe('Camera Movements');
    });
  });

  describe('button actions', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true });
    });

    it('Save button is disabled when form is invalid', () => {
      wrapper.vm.formData.name = '';
      const buttons = wrapper.findAll('button');
      const saveButton = buttons.find(b => b.text().includes('Create') || b.text().includes('Save'));
      expect(saveButton.attributes('disabled')).toBeDefined();
    });

    it('Save button is enabled when form is valid', () => {
      wrapper.vm.formData.name = 'Valid Name';
      const buttons = wrapper.findAll('button');
      const saveButton = buttons.find(b => b.text().includes('Create') || b.text().includes('Save'));
      expect(saveButton.attributes('disabled')).toBeUndefined();
    });

    it('emits update:visible on cancel', async () => {
      const buttons = wrapper.findAll('button');
      const cancelButton = buttons.find(b => b.text().includes('Cancel'));
      await cancelButton.trigger('click');
      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')[0]).toEqual([false]);
    });

    it('emits update:visible on hide', () => {
      wrapper.vm.onHide();
      expect(wrapper.emitted('update:visible')).toBeTruthy();
      expect(wrapper.emitted('update:visible')[0]).toEqual([false]);
    });
  });

  describe('form reset', () => {
    it('resets form when dialog opens', async () => {
      wrapper = createWrapper({ visible: false });
      
      // Set some form data
      wrapper.vm.formData.name = 'Test';
      wrapper.vm.formData.description = 'Description';
      
      // Open dialog
      await wrapper.setProps({ visible: true });
      await wrapper.vm.$nextTick();
      
      // Form should be reset
      expect(wrapper.vm.formData.name).toBe('');
      expect(wrapper.vm.formData.description).toBe('');
    });

    it('loads preset data when opening in edit mode', async () => {
      wrapper = createWrapper({ visible: false, mode: 'edit' });
      
      await wrapper.setProps({ visible: true, preset: mockPreset });
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.formData.name).toBe(mockPreset.name);
    });
  });

  describe('data sanitization', () => {
    beforeEach(() => {
      wrapper = createWrapper({ visible: true });
    });

    it('trims whitespace from name', () => {
      wrapper.vm.formData.name = '  Test Name  ';
      wrapper.vm.onSave();
      expect(wrapper.emitted('save')[0][0].name).toBe('Test Name');
    });

    it('trims whitespace from description', () => {
      wrapper.vm.formData.name = 'Test';
      wrapper.vm.formData.description = '  Test Description  ';
      wrapper.vm.onSave();
      expect(wrapper.emitted('save')[0][0].description).toBe('Test Description');
    });

    it('removes empty tags', () => {
      wrapper.vm.formData.name = 'Test';
      wrapper.vm.formData.tags = ['tag1', '', '  ', 'tag2'];
      wrapper.vm.onSave();
      expect(wrapper.emitted('save')[0][0].tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('button labels', () => {
    it('shows Create button in create mode', () => {
      wrapper = createWrapper({ visible: true, mode: 'create' });
      expect(wrapper.text()).toContain('Create');
    });

    it('shows Save button in edit mode', () => {
      wrapper = createWrapper({ visible: true, mode: 'edit' });
      expect(wrapper.text()).toContain('Save');
    });

    it('always shows Cancel button', () => {
      wrapper = createWrapper({ visible: true });
      expect(wrapper.text()).toContain('Cancel');
    });
  });
});
