import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PresetCategory,
  generatePresetId,
  validatePreset,
  createPreset,
  PresetService
} from './presetService';

describe('presetService', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value; },
      clear: () => { store = {}; }
    };
  })();
  
  beforeEach(() => {
    global.localStorage = localStorageMock;
    localStorageMock.clear();
  });
  
  describe('generatePresetId', () => {
    it('generates unique preset IDs', () => {
      const id1 = generatePresetId();
      const id2 = generatePresetId();
      
      expect(id1).toMatch(/^preset_/);
      expect(id2).toMatch(/^preset_/);
      expect(id1).not.toBe(id2);
    });
  });
  
  describe('validatePreset', () => {
    it('validates correct preset', () => {
      const preset = {
        name: 'Test Preset',
        settings: { zoom: 1.2 }
      };
      
      const result = validatePreset(preset);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('rejects preset without name', () => {
      const preset = { settings: {} };
      const result = validatePreset(preset);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('name');
    });
    
    it('rejects preset with empty name', () => {
      const preset = { name: '   ', settings: {} };
      const result = validatePreset(preset);
      
      expect(result.isValid).toBe(false);
    });
    
    it('rejects preset with too long name', () => {
      const preset = {
        name: 'a'.repeat(101),
        settings: {}
      };
      const result = validatePreset(preset);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });
    
    it('rejects preset without settings', () => {
      const preset = { name: 'Test' };
      const result = validatePreset(preset);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('settings');
    });
  });
  
  describe('createPreset', () => {
    it('creates preset with default values', () => {
      const data = {
        name: 'Test',
        settings: { zoom: 1.2 }
      };
      
      const preset = createPreset(data);
      
      expect(preset.id).toBeDefined();
      expect(preset.name).toBe('Test');
      expect(preset.description).toBe('');
      expect(preset.category).toBe(PresetCategory.GENERAL);
      expect(preset.tags).toEqual([]);
      expect(preset.isPublic).toBe(false);
      expect(preset.isSystem).toBe(false);
      expect(preset.useCount).toBe(0);
    });
    
    it('preserves provided values', () => {
      const data = {
        id: 'custom_id',
        name: 'Test',
        description: 'Description',
        category: PresetCategory.EFFECTS,
        settings: {}
      };
      
      const preset = createPreset(data);
      
      expect(preset.id).toBe('custom_id');
      expect(preset.description).toBe('Description');
      expect(preset.category).toBe(PresetCategory.EFFECTS);
    });
  });
  
  describe('PresetService', () => {
    let service;
    
    beforeEach(() => {
      service = new PresetService();
    });
    
    describe('create', () => {
      it('creates new preset', () => {
        const presetData = {
          name: 'My Preset',
          settings: { zoom: 1.5 }
        };
        
        const preset = service.create(presetData);
        
        expect(preset.id).toBeDefined();
        expect(preset.name).toBe('My Preset');
        expect(service.count()).toBe(1);
      });
      
      it('throws error for invalid preset', () => {
        const invalidData = { name: '' };
        
        expect(() => service.create(invalidData)).toThrow();
      });
      
      it('saves to localStorage', () => {
        const presetData = {
          name: 'Test',
          settings: {}
        };
        
        service.create(presetData);
        
        const stored = localStorage.getItem('mage_presets');
        expect(stored).toBeDefined();
        
        const parsed = JSON.parse(stored);
        expect(parsed.presets).toHaveLength(1);
      });
    });
    
    describe('getById', () => {
      it('retrieves preset by ID', () => {
        const preset = service.create({
          name: 'Test',
          settings: {}
        });
        
        const retrieved = service.getById(preset.id);
        expect(retrieved).toBe(preset);
      });
      
      it('returns null for non-existent ID', () => {
        const retrieved = service.getById('non_existent');
        expect(retrieved).toBeNull();
      });
    });
    
    describe('getAll', () => {
      it('returns all presets', () => {
        service.create({ name: 'Preset 1', settings: {} });
        service.create({ name: 'Preset 2', settings: {} });
        
        const all = service.getAll();
        expect(all).toHaveLength(2);
      });
      
      it('returns copy of array', () => {
        const all1 = service.getAll();
        const all2 = service.getAll();
        
        expect(all1).not.toBe(all2);
      });
    });
    
    describe('update', () => {
      it('updates preset', () => {
        const preset = service.create({
          name: 'Original',
          settings: {}
        });
        
        const originalUpdatedAt = preset.updatedAt;
        
        // Use vi.useFakeTimers to advance time
        vi.useFakeTimers();
        vi.advanceTimersByTime(1000);
        
        const updated = service.update(preset.id, {
          name: 'Updated'
        });
        
        vi.useRealTimers();
        
        expect(updated.name).toBe('Updated');
        expect(updated.updatedAt).not.toBe(originalUpdatedAt);
      });
      
      it('prevents updating system preset', () => {
        const preset = service.create({
          name: 'System',
          settings: {},
          isSystem: true
        });
        
        expect(() => {
          service.update(preset.id, { name: 'Changed' });
        }).toThrow('system');
      });
      
      it('validates after update', () => {
        const preset = service.create({
          name: 'Test',
          settings: {}
        });
        
        expect(() => {
          service.update(preset.id, { name: '' });
        }).toThrow();
      });
    });
    
    describe('delete', () => {
      it('deletes preset', () => {
        const preset = service.create({
          name: 'To Delete',
          settings: {}
        });
        
        const success = service.delete(preset.id);
        
        expect(success).toBe(true);
        expect(service.count()).toBe(0);
      });
      
      it('prevents deleting system preset', () => {
        const preset = service.create({
          name: 'System',
          settings: {},
          isSystem: true
        });
        
        expect(() => {
          service.delete(preset.id);
        }).toThrow('system');
      });
    });
    
    describe('duplicate', () => {
      it('duplicates preset', () => {
        const original = service.create({
          name: 'Original',
          settings: { zoom: 1.5 }
        });
        
        const duplicate = service.duplicate(original.id);
        
        expect(duplicate.id).not.toBe(original.id);
        expect(duplicate.name).toBe('Original (Copy)');
        expect(duplicate.settings).toEqual(original.settings);
        expect(service.count()).toBe(2);
      });
    });
    
    describe('markAsUsed', () => {
      it('updates usage statistics', () => {
        const preset = service.create({
          name: 'Test',
          settings: {}
        });
        
        expect(preset.useCount).toBe(0);
        expect(preset.lastUsed).toBeNull();
        
        service.markAsUsed(preset.id);
        
        const updated = service.getById(preset.id);
        expect(updated.useCount).toBe(1);
        expect(updated.lastUsed).toBeDefined();
      });
    });
    
    describe('search', () => {
      beforeEach(() => {
        service.create({
          name: 'Cinematic Zoom',
          description: 'Slow zoom effect',
          tags: ['zoom', 'cinematic'],
          settings: {}
        });
        service.create({
          name: 'Fast Pan',
          description: 'Quick panning',
          tags: ['pan', 'fast'],
          settings: {}
        });
      });
      
      it('searches by name', () => {
        const results = service.search('zoom');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Cinematic Zoom');
      });
      
      it('searches by description', () => {
        const results = service.search('panning');
        expect(results).toHaveLength(1);
      });
      
      it('searches by tags', () => {
        const results = service.search('fast');
        expect(results).toHaveLength(1);
      });
      
      it('returns all for empty query', () => {
        const results = service.search('');
        expect(results).toHaveLength(2);
      });
    });
    
    describe('filterByCategory', () => {
      it('filters by category', () => {
        service.create({
          name: 'Effect 1',
          category: PresetCategory.EFFECTS,
          settings: {}
        });
        service.create({
          name: 'Style 1',
          category: PresetCategory.STYLES,
          settings: {}
        });
        
        const filtered = service.filterByCategory(PresetCategory.EFFECTS);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Effect 1');
      });
    });
    
    describe('filterByTags', () => {
      it('filters by tags', () => {
        service.create({
          name: 'Preset 1',
          tags: ['zoom', 'slow'],
          settings: {}
        });
        service.create({
          name: 'Preset 2',
          tags: ['pan', 'fast'],
          settings: {}
        });
        
        const filtered = service.filterByTags(['zoom']);
        expect(filtered).toHaveLength(1);
      });
    });
    
    describe('getRecent', () => {
      it('returns recent presets', () => {
        const p1 = service.create({ name: 'P1', settings: {} });
        const p2 = service.create({ name: 'P2', settings: {} });
        
        service.markAsUsed(p2.id);
        service.markAsUsed(p1.id);
        
        const recent = service.getRecent(2);
        expect(recent[0].name).toBe('P1'); // Most recent first
      });
    });
    
    describe('getPopular', () => {
      it('returns popular presets', () => {
        const p1 = service.create({ name: 'P1', settings: {} });
        const p2 = service.create({ name: 'P2', settings: {} });
        
        service.markAsUsed(p2.id);
        service.markAsUsed(p2.id);
        service.markAsUsed(p1.id);
        
        const popular = service.getPopular(2);
        expect(popular[0].name).toBe('P2'); // Most used first
      });
    });
    
    describe('import and export', () => {
      it('exports presets', () => {
        service.create({ name: 'P1', settings: {} });
        service.create({ name: 'P2', settings: {} });
        
        const exported = service.export();
        expect(exported).toHaveLength(2);
      });
      
      it('imports presets', () => {
        const presets = [
          { name: 'Imported 1', settings: {} },
          { name: 'Imported 2', settings: {} }
        ];
        
        const count = service.import(presets);
        expect(count).toBe(2);
        expect(service.count()).toBe(2);
      });
    });
    
    describe('clearUserPresets', () => {
      it('clears non-system presets', () => {
        service.create({ name: 'User', settings: {} });
        service.create({ name: 'System', settings: {}, isSystem: true });
        
        service.clearUserPresets();
        
        expect(service.count()).toBe(1);
        expect(service.getAll()[0].name).toBe('System');
      });
    });
    
    describe('getCategoryCounts', () => {
      it('returns category counts', () => {
        service.create({
          name: 'E1',
          category: PresetCategory.EFFECTS,
          settings: {}
        });
        service.create({
          name: 'E2',
          category: PresetCategory.EFFECTS,
          settings: {}
        });
        service.create({
          name: 'S1',
          category: PresetCategory.STYLES,
          settings: {}
        });
        
        const counts = service.getCategoryCounts();
        const effectsCount = counts.find(c => c.category === PresetCategory.EFFECTS);
        
        expect(effectsCount.count).toBe(2);
      });
    });
  });
});
