import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import PresetLibrary from './PresetLibrary.vue';
import { PresetCategory } from '@/services/presetService';

// Mock the preset service
vi.mock('@/services/presetService', () => ({
  usePresetService: vi.fn(() => ({
    getAll: vi.fn(() => [
      {
        id: 'preset_1',
        name: 'Zoom In',
        description: 'Slow zoom in effect',
        category: PresetCategory.CAMERA_MOVEMENTS,
        tags: ['zoom', 'camera'],
        settings: { zoom: 1.5 },
        isPublic: true,
        isSystem: false,
        lastUsed: '2026-01-01T10:00:00Z',
        useCount: 5
      },
      {
        id: 'preset_2',
        name: 'Blur Effect',
        description: 'Gaussian blur',
        category: PresetCategory.EFFECTS,
        tags: ['blur', 'effect'],
        settings: { blur: 2.0 },
        isPublic: false,
        isSystem: true,
        lastUsed: null,
        useCount: 0
      }
    ]),
    markAsUsed: vi.fn(),
    duplicate: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  })),
  PresetCategory: {
    CAMERA_MOVEMENTS: 'camera_movements',
    EFFECTS: 'effects',
    STYLES: 'styles',
    GENERAL: 'general',
    CUSTOM: 'custom'
  }
}));

describe('PresetLibrary', () => {
  let wrapper;
  
  const createWrapper = (props = {}) => {
    return mount(PresetLibrary, {
      props,
      global: {
        plugins: [
          PrimeVue
        ],
        stubs: {
          Card: {
            template: '<div><slot name="title"></slot><slot name="content"></slot></div>'
          },
          Button: {
            template: '<button @click="$emit(\'click\')"><slot></slot></button>',
            props: ['label', 'icon', 'class']
          },
          InputText: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder']
          },
          SelectButton: {
            template: '<div><button v-for="opt in options" :key="opt.value" @click="$emit(\'update:modelValue\', opt.value)">{{ opt.label }}</button></div>',
            props: ['modelValue', 'options', 'optionLabel', 'optionValue']
          },
          PresetCard: {
            template: '<div class="preset-card" @click="$emit(\'select\', preset)">{{ preset.name }}</div>',
            props: ['preset', 'compact']
          },
          PresetDialog: {
            template: '<div v-if="visible"><slot></slot></div>',
            props: ['visible', 'preset', 'mode']
          }
        }
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders preset library', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Preset Library');
    });

    it('displays New Preset button', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('New Preset');
    });

    it('renders search input', () => {
      wrapper = createWrapper();
      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
    });

    it('displays category filters', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('All');
      expect(wrapper.text()).toContain('Camera Movements');
      expect(wrapper.text()).toContain('Effects');
    });

    it('shows preset count', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('preset(s)');
    });
  });

  describe('presets display', () => {
    it('displays presets in grid view', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      const presetCards = wrapper.findAll('.preset-card');
      expect(presetCards.length).toBeGreaterThan(0);
    });

    it('displays presets in list view', async () => {
      wrapper = createWrapper();
      wrapper.vm.viewMode = 'list';
      await wrapper.vm.$nextTick();
      const presetCards = wrapper.findAll('.preset-card');
      expect(presetCards.length).toBeGreaterThan(0);
    });

    it('shows empty state when no presets', () => {
      const { usePresetService } = require('@/services/presetService');
      usePresetService.mockReturnValueOnce({
        getAll: vi.fn(() => []),
        markAsUsed: vi.fn(),
        duplicate: vi.fn(),
        delete: vi.fn()
      });
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('No presets available');
    });
  });

  describe('search functionality', () => {
    it('filters presets by search query', async () => {
      wrapper = createWrapper();
      const input = wrapper.find('input');
      await input.setValue('zoom');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredPresets.length).toBe(1);
      expect(wrapper.vm.filteredPresets[0].name).toBe('Zoom In');
    });

    it('shows empty state when search returns no results', async () => {
      wrapper = createWrapper();
      const input = wrapper.find('input');
      await input.setValue('nonexistent');
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('No presets found matching your search');
    });

    it('clears search when clear button clicked', async () => {
      wrapper = createWrapper();
      wrapper.vm.searchQuery = 'test';
      await wrapper.vm.$nextTick();
      wrapper.vm.clearSearch();
      expect(wrapper.vm.searchQuery).toBe('');
    });
  });

  describe('category filtering', () => {
    it('filters presets by category', async () => {
      wrapper = createWrapper();
      wrapper.vm.filterByCategory(PresetCategory.CAMERA_MOVEMENTS);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredPresets.length).toBe(1);
      expect(wrapper.vm.filteredPresets[0].category).toBe(PresetCategory.CAMERA_MOVEMENTS);
    });

    it('shows all presets when All category selected', async () => {
      wrapper = createWrapper();
      wrapper.vm.filterByCategory(null);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredPresets.length).toBe(2);
    });

    it('formats category names correctly', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formatCategory('camera_movements')).toBe('Camera Movements');
      expect(wrapper.vm.formatCategory('effects')).toBe('Effects');
    });
  });

  describe('view mode toggle', () => {
    it('switches between grid and list view', async () => {
      wrapper = createWrapper();
      expect(wrapper.vm.viewMode).toBe('grid');
      wrapper.vm.viewMode = 'list';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.viewMode).toBe('list');
    });
  });

  describe('preset actions', () => {
    it('opens create dialog when New Preset clicked', async () => {
      wrapper = createWrapper();
      const buttons = wrapper.findAll('button');
      const newButton = buttons.find(b => b.text().includes('New Preset'));
      await newButton.trigger('click');
      expect(wrapper.vm.dialogVisible).toBe(true);
      expect(wrapper.vm.dialogMode).toBe('create');
    });

    it('emits select-preset event when preset selected', async () => {
      wrapper = createWrapper();
      const preset = wrapper.vm.filteredPresets[0];
      wrapper.vm.selectPreset(preset);
      expect(wrapper.emitted('select-preset')).toBeTruthy();
      expect(wrapper.emitted('select-preset')[0]).toEqual([preset]);
    });

    it('opens edit dialog when edit action triggered', async () => {
      wrapper = createWrapper();
      const preset = wrapper.vm.filteredPresets[0];
      wrapper.vm.editPreset(preset);
      expect(wrapper.vm.dialogVisible).toBe(true);
      expect(wrapper.vm.dialogMode).toBe('edit');
      expect(wrapper.vm.selectedPresetForEdit).toBe(preset);
    });

    it('duplicates preset when duplicate action triggered', () => {
      wrapper = createWrapper();
      const preset = wrapper.vm.filteredPresets[0];
      wrapper.vm.duplicatePreset(preset);
      const { usePresetService } = require('@/services/presetService');
      const service = usePresetService();
      expect(service.duplicate).toHaveBeenCalledWith(preset.id);
    });

    it('deletes preset when delete action triggered', () => {
      wrapper = createWrapper();
      const preset = wrapper.vm.filteredPresets[0];
      wrapper.vm.deletePreset(preset);
      const { usePresetService } = require('@/services/presetService');
      const service = usePresetService();
      expect(service.delete).toHaveBeenCalledWith(preset.id);
    });
  });

  describe('preset dialog', () => {
    it('closes dialog after successful save', async () => {
      wrapper = createWrapper();
      wrapper.vm.dialogVisible = true;
      wrapper.vm.dialogMode = 'create';
      await wrapper.vm.$nextTick();
      
      const presetData = {
        name: 'New Preset',
        description: 'Test',
        category: PresetCategory.GENERAL,
        settings: {}
      };
      
      wrapper.vm.handleSavePreset(presetData);
      expect(wrapper.vm.dialogVisible).toBe(false);
    });

    it('creates preset when in create mode', () => {
      wrapper = createWrapper();
      wrapper.vm.dialogMode = 'create';
      const presetData = {
        name: 'New Preset',
        settings: {}
      };
      
      wrapper.vm.handleSavePreset(presetData);
      const { usePresetService } = require('@/services/presetService');
      const service = usePresetService();
      expect(service.create).toHaveBeenCalledWith(presetData);
    });

    it('updates preset when in edit mode', () => {
      wrapper = createWrapper();
      const preset = wrapper.vm.filteredPresets[0];
      wrapper.vm.selectedPresetForEdit = preset;
      wrapper.vm.dialogMode = 'edit';
      
      const updates = {
        name: 'Updated Name',
        description: 'Updated description'
      };
      
      wrapper.vm.handleSavePreset(updates);
      const { usePresetService } = require('@/services/presetService');
      const service = usePresetService();
      expect(service.update).toHaveBeenCalledWith(preset.id, updates);
    });
  });

  describe('computed properties', () => {
    it('filteredPresets combines search and category filters', async () => {
      wrapper = createWrapper();
      wrapper.vm.searchQuery = 'zoom';
      wrapper.vm.selectedCategory = PresetCategory.CAMERA_MOVEMENTS;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.filteredPresets.length).toBe(1);
    });

    it('filteredPresets returns all when no filters', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.filteredPresets.length).toBe(2);
    });
  });
});
