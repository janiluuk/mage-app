/**
 * Export Service
 * Handles exporting presets and settings to various formats (JSON, YAML)
 */

/**
 * Export format version
 */
const EXPORT_VERSION = '1.0';

/**
 * Export types
 */
export const ExportType = {
  PRESETS: 'presets',
  SETTINGS: 'settings',
  PROJECT: 'project'
};

/**
 * Create export metadata
 * @returns {object} Export metadata
 */
function createExportMetadata() {
  return {
    mage_export_version: EXPORT_VERSION,
    export_date: new Date().toISOString(),
    app_version: '1.0.0'
  };
}

/**
 * Export presets to JSON format
 * @param {Array} presets - Array of preset objects
 * @returns {string} JSON string
 */
export function exportPresetsToJSON(presets) {
  const exportData = {
    ...createExportMetadata(),
    export_type: ExportType.PRESETS,
    data: {
      presets: presets.map(preset => ({
        ...preset,
        // Remove any internal IDs or metadata that shouldn't be exported
        exported: true
      }))
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export settings to JSON format
 * @param {object} settings - Settings object
 * @param {string} editorType - Type of editor (deforum, vid2vid, etc.)
 * @returns {string} JSON string
 */
export function exportSettingsToJSON(settings, editorType = 'deforum') {
  const exportData = {
    ...createExportMetadata(),
    export_type: ExportType.SETTINGS,
    data: {
      settings: {
        ...settings,
        editorType
      }
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download exported data as a file
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type (default: application/json)
 */
export function downloadExportFile(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export
 * @param {string} type - Export type
 * @param {string} format - File format (json, yaml)
 * @returns {string} Generated filename
 */
export function generateExportFilename(type, format = 'json') {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `mage-${type}-${timestamp}.${format}`;
}

/**
 * ExportService class
 * Main service for exporting data
 */
export class ExportService {
  /**
   * Export single preset
   * @param {object} preset - Preset object
   */
  exportPreset(preset) {
    const json = exportPresetsToJSON([preset]);
    const filename = generateExportFilename(`preset-${preset.name}`, 'json');
    downloadExportFile(json, filename);
  }
  
  /**
   * Export multiple presets
   * @param {Array} presets - Array of preset objects
   */
  exportPresets(presets) {
    const json = exportPresetsToJSON(presets);
    const filename = generateExportFilename('presets', 'json');
    downloadExportFile(json, filename);
  }
  
  /**
   * Export current editor settings
   * @param {object} settings - Settings object
   * @param {string} editorType - Editor type
   */
  exportSettings(settings, editorType = 'deforum') {
    const json = exportSettingsToJSON(settings, editorType);
    const filename = generateExportFilename(`settings-${editorType}`, 'json');
    downloadExportFile(json, filename);
  }
  
  /**
   * Generate preview of export data
   * @param {object} data - Data to preview
   * @returns {string} Formatted JSON preview
   */
  generatePreview(data) {
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Create export service instance
 * @returns {ExportService} Export service
 */
export function useExportService() {
  return new ExportService();
}

export default {
  ExportType,
  exportPresetsToJSON,
  exportSettingsToJSON,
  downloadExportFile,
  generateExportFilename,
  ExportService,
  useExportService
};
