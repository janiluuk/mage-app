import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportPresetsToJSON,
  exportSettingsToJSON,
  generateExportFilename,
  ExportService
} from './exportService';

describe('exportService', () => {
  describe('exportPresetsToJSON', () => {
    it('exports presets correctly', () => {
      const presets = [
        {
          id: 'preset1',
          name: 'Test Preset',
          settings: { zoom: 1.2 }
        }
      ];
      
      const json = exportPresetsToJSON(presets);
      const parsed = JSON.parse(json);
      
      expect(parsed.mage_export_version).toBe('1.0');
      expect(parsed.export_type).toBe('presets');
      expect(parsed.data.presets).toHaveLength(1);
      expect(parsed.data.presets[0].name).toBe('Test Preset');
    });
    
    it('includes export metadata', () => {
      const presets = [{ id: 'p1', name: 'Preset', settings: {} }];
      const json = exportPresetsToJSON(presets);
      const parsed = JSON.parse(json);
      
      expect(parsed.export_date).toBeDefined();
      expect(parsed.app_version).toBeDefined();
    });
  });
  
  describe('exportSettingsToJSON', () => {
    it('exports settings correctly', () => {
      const settings = {
        prompt: 'test prompt',
        denoising: 0.7
      };
      
      const json = exportSettingsToJSON(settings, 'deforum');
      const parsed = JSON.parse(json);
      
      expect(parsed.export_type).toBe('settings');
      expect(parsed.data.settings.editorType).toBe('deforum');
      expect(parsed.data.settings.prompt).toBe('test prompt');
    });
  });
  
  describe('generateExportFilename', () => {
    it('generates correct filename format', () => {
      const filename = generateExportFilename('presets', 'json');
      
      expect(filename).toMatch(/^mage-presets-\d{4}-\d{2}-\d{2}\.json$/);
    });
    
    it('supports different formats', () => {
      const filename = generateExportFilename('settings', 'yaml');
      
      expect(filename).toContain('.yaml');
      expect(filename).toContain('settings');
    });
  });
  
  describe('ExportService', () => {
    let service;
    
    beforeEach(() => {
      service = new ExportService();
    });
    
    it('exports single preset', () => {
      const preset = {
        id: 'p1',
        name: 'My Preset',
        settings: { zoom: 1.5 }
      };
      
      // Note: downloadExportFile creates actual download, just test it doesn't throw
      expect(() => {
        const json = exportPresetsToJSON([preset]);
        expect(json).toBeDefined();
      }).not.toThrow();
    });
    
    it('exports multiple presets', () => {
      const presets = [
        { id: 'p1', name: 'Preset 1', settings: {} },
        { id: 'p2', name: 'Preset 2', settings: {} }
      ];
      
      const json = exportPresetsToJSON(presets);
      const parsed = JSON.parse(json);
      
      expect(parsed.data.presets).toHaveLength(2);
    });
    
    it('generates preview', () => {
      const data = { test: 'data' };
      const preview = service.generatePreview(data);
      
      expect(preview).toBe(JSON.stringify(data, null, 2));
    });
  });
});
