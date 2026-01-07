import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateExportData,
  validatePreset,
  detectConflicts,
  resolveConflict,
  sanitizePreset,
  ImportService,
  ImportError
} from './importService';

describe('importService', () => {
  describe('validateExportData', () => {
    it('validates correct export data', () => {
      const data = {
        mage_export_version: '1.0',
        export_type: 'presets',
        data: { presets: [] }
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
    
    it('rejects invalid format', () => {
      const result = validateExportData(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ImportError.INVALID_FORMAT);
    });
    
    it('rejects unsupported version', () => {
      const data = {
        mage_export_version: '2.0',
        export_type: 'presets',
        data: { presets: [] }
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ImportError.UNSUPPORTED_VERSION);
    });
    
    it('rejects missing data', () => {
      const data = {
        mage_export_version: '1.0',
        export_type: 'presets'
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ImportError.MISSING_DATA);
    });
  });
  
  describe('validatePreset', () => {
    it('validates correct preset', () => {
      const preset = {
        name: 'Test Preset',
        settings: { zoom: 1.2 }
      };
      
      expect(validatePreset(preset)).toBe(true);
    });
    
    it('rejects preset without name', () => {
      const preset = { settings: {} };
      expect(validatePreset(preset)).toBe(false);
    });
    
    it('rejects preset without settings', () => {
      const preset = { name: 'Test' };
      expect(validatePreset(preset)).toBe(false);
    });
  });
  
  describe('detectConflicts', () => {
    it('detects ID conflicts', () => {
      const imported = [{ id: 'p1', name: 'Preset 1' }];
      const existing = [{ id: 'p1', name: 'Different Name' }];
      
      const conflicts = detectConflicts(imported, existing);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('id');
    });
    
    it('detects name conflicts', () => {
      const imported = [{ id: 'p1', name: 'Preset Name' }];
      const existing = [{ id: 'p2', name: 'Preset Name' }];
      
      const conflicts = detectConflicts(imported, existing);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('name');
    });
    
    it('returns empty array when no conflicts', () => {
      const imported = [{ id: 'p1', name: 'Preset 1' }];
      const existing = [{ id: 'p2', name: 'Preset 2' }];
      
      const conflicts = detectConflicts(imported, existing);
      
      expect(conflicts).toHaveLength(0);
    });
  });
  
  describe('resolveConflict', () => {
    const imported = { id: 'p1', name: 'Imported' };
    const existing = { id: 'p1', name: 'Existing' };
    
    it('skips on skip strategy', () => {
      const result = resolveConflict(imported, existing, 'skip');
      expect(result).toBeNull();
    });
    
    it('replaces on replace strategy', () => {
      const result = resolveConflict(imported, existing, 'replace');
      expect(result.id).toBe(existing.id);
      expect(result.name).toBe('Imported');
    });
    
    it('keeps both on keep_both strategy', () => {
      const result = resolveConflict(imported, existing, 'keep_both');
      expect(result.id).not.toBe(imported.id);
      expect(result.name).toContain('imported');
    });
  });
  
  describe('sanitizePreset', () => {
    it('adds missing fields', () => {
      const preset = {
        name: 'Test',
        settings: {}
      };
      
      const sanitized = sanitizePreset(preset);
      
      expect(sanitized.id).toBeDefined();
      expect(sanitized.description).toBeDefined();
      expect(sanitized.category).toBeDefined();
      expect(sanitized.tags).toBeInstanceOf(Array);
      expect(sanitized.createdAt).toBeDefined();
    });
    
    it('preserves existing fields', () => {
      const preset = {
        id: 'custom_id',
        name: 'Test',
        description: 'Description',
        settings: { zoom: 1.2 }
      };
      
      const sanitized = sanitizePreset(preset);
      
      expect(sanitized.id).toBe('custom_id');
      expect(sanitized.description).toBe('Description');
    });
  });
  
  describe('ImportService', () => {
    let service;
    
    beforeEach(() => {
      service = new ImportService();
    });
    
    it('imports presets from file', async () => {
      const fileContent = JSON.stringify({
        mage_export_version: '1.0',
        export_type: 'presets',
        data: {
          presets: [
            { name: 'Preset 1', settings: {} },
            { name: 'Preset 2', settings: {} }
          ]
        }
      });
      
      const file = new File([fileContent], 'test.json', { type: 'application/json' });
      const result = await service.importPresets(file);
      
      expect(result.success).toBe(true);
      expect(result.presets).toHaveLength(2);
    });
    
    it('handles invalid file', async () => {
      const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
      const result = await service.importPresets(file);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('imports settings from file', async () => {
      const fileContent = JSON.stringify({
        mage_export_version: '1.0',
        export_type: 'settings',
        data: {
          settings: {
            editorType: 'deforum',
            prompt: 'test'
          }
        }
      });
      
      const file = new File([fileContent], 'test.json', { type: 'application/json' });
      const result = await service.importSettings(file);
      
      expect(result.success).toBe(true);
      expect(result.settings.prompt).toBe('test');
    });
    
    it('previews import data', async () => {
      const fileContent = JSON.stringify({
        mage_export_version: '1.0',
        export_type: 'presets',
        data: { presets: [{ name: 'Test', settings: {} }] }
      });
      
      const file = new File([fileContent], 'test.json', { type: 'application/json' });
      const preview = await service.previewImport(file);
      
      expect(preview.isValid).toBe(true);
      expect(preview.type).toBe('presets');
      expect(preview.itemCount).toBe(1);
    });
  });
});
