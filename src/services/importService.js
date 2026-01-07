/**
 * Import Service
 * Handles importing presets and settings from various formats (JSON, YAML)
 */

/**
 * Supported import versions
 */
const SUPPORTED_VERSIONS = ['1.0'];

/**
 * Validation errors
 */
export const ImportError = {
  INVALID_FORMAT: 'Invalid file format',
  UNSUPPORTED_VERSION: 'Unsupported export version',
  MISSING_DATA: 'Missing required data',
  PARSE_ERROR: 'Failed to parse file'
};

/**
 * Parse JSON file content
 * @param {string} content - File content
 * @returns {object} Parsed data
 * @throws {Error} If parsing fails
 */
function parseJSON(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(ImportError.PARSE_ERROR);
  }
}

/**
 * Validate export structure
 * @param {object} data - Parsed export data
 * @returns {object} Validation result
 */
export function validateExportData(data) {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: ImportError.INVALID_FORMAT };
  }
  
  if (!data.mage_export_version) {
    return { isValid: false, error: ImportError.INVALID_FORMAT };
  }
  
  if (!SUPPORTED_VERSIONS.includes(data.mage_export_version)) {
    return { isValid: false, error: ImportError.UNSUPPORTED_VERSION };
  }
  
  if (!data.export_type || !data.data) {
    return { isValid: false, error: ImportError.MISSING_DATA };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate preset data
 * @param {object} preset - Preset object
 * @returns {boolean} True if valid
 */
export function validatePreset(preset) {
  return (
    preset &&
    typeof preset === 'object' &&
    preset.name &&
    preset.settings &&
    typeof preset.settings === 'object'
  );
}

/**
 * Check for conflicts with existing presets
 * @param {Array} importedPresets - Presets to import
 * @param {Array} existingPresets - Existing presets
 * @returns {Array} Conflicts array with { preset, conflictType, existingPreset }
 */
export function detectConflicts(importedPresets, existingPresets) {
  const conflicts = [];
  
  for (const imported of importedPresets) {
    // Check for ID conflict
    const idConflict = existingPresets.find(p => p.id === imported.id);
    if (idConflict) {
      conflicts.push({
        preset: imported,
        conflictType: 'id',
        existingPreset: idConflict
      });
      continue;
    }
    
    // Check for name conflict
    const nameConflict = existingPresets.find(p => p.name === imported.name);
    if (nameConflict) {
      conflicts.push({
        preset: imported,
        conflictType: 'name',
        existingPreset: nameConflict
      });
    }
  }
  
  return conflicts;
}

/**
 * Resolve conflict by strategy
 * @param {object} imported - Imported preset
 * @param {object} existing - Existing preset
 * @param {string} strategy - Resolution strategy (skip, replace, keep_both)
 * @returns {object|null} Resolved preset or null if skipped
 */
export function resolveConflict(imported, existing, strategy) {
  switch (strategy) {
    case 'skip':
      return null;
    
    case 'replace':
      return { ...imported, id: existing.id };
    
    case 'keep_both':
      return {
        ...imported,
        id: `${imported.id}_imported_${Date.now()}`,
        name: `${imported.name} (imported)`
      };
    
    default:
      return null;
  }
}

/**
 * Generate unique ID for preset
 * @returns {string} Unique ID
 */
function generateUniqueId() {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize imported preset
 * @param {object} preset - Preset to sanitize
 * @returns {object} Sanitized preset
 */
export function sanitizePreset(preset) {
  return {
    id: preset.id || generateUniqueId(),
    name: preset.name || 'Untitled Preset',
    description: preset.description || '',
    category: preset.category || 'general',
    tags: Array.isArray(preset.tags) ? preset.tags : [],
    settings: preset.settings || {},
    thumbnail: preset.thumbnail || '',
    createdAt: preset.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: null,
    useCount: 0,
    version: preset.version || '1.0',
    isPublic: preset.isPublic || false,
    isSystem: false
  };
}

/**
 * ImportService class
 * Main service for importing data
 */
export class ImportService {
  /**
   * Read file content
   * @param {File} file - File object
   * @returns {Promise<string>} File content
   */
  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Import presets from file
   * @param {File} file - File object
   * @returns {Promise<object>} Import result
   */
  async importPresets(file) {
    try {
      const content = await this.readFile(file);
      const data = parseJSON(content);
      
      // Validate structure
      const validation = validateExportData(data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Check export type
      if (data.export_type !== 'presets') {
        throw new Error('File does not contain presets');
      }
      
      // Extract and validate presets
      const presets = data.data.presets || [];
      const validPresets = presets.filter(validatePreset);
      
      if (validPresets.length === 0) {
        throw new Error('No valid presets found in file');
      }
      
      // Sanitize presets
      const sanitizedPresets = validPresets.map(sanitizePreset);
      
      return {
        success: true,
        presets: sanitizedPresets,
        metadata: {
          exportVersion: data.mage_export_version,
          exportDate: data.export_date,
          appVersion: data.app_version
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        presets: []
      };
    }
  }
  
  /**
   * Import settings from file
   * @param {File} file - File object
   * @returns {Promise<object>} Import result
   */
  async importSettings(file) {
    try {
      const content = await this.readFile(file);
      const data = parseJSON(content);
      
      // Validate structure
      const validation = validateExportData(data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Check export type
      if (data.export_type !== 'settings') {
        throw new Error('File does not contain settings');
      }
      
      const settings = data.data.settings;
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings data');
      }
      
      return {
        success: true,
        settings,
        metadata: {
          exportVersion: data.mage_export_version,
          exportDate: data.export_date,
          editorType: settings.editorType
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        settings: null
      };
    }
  }
  
  /**
   * Preview import data without applying
   * @param {File} file - File object
   * @returns {Promise<object>} Preview data
   */
  async previewImport(file) {
    try {
      const content = await this.readFile(file);
      const data = parseJSON(content);
      
      const validation = validateExportData(data);
      
      return {
        isValid: validation.isValid,
        error: validation.error,
        type: data.export_type,
        itemCount: data.export_type === 'presets' 
          ? (data.data.presets || []).length 
          : 1,
        metadata: {
          version: data.mage_export_version,
          date: data.export_date
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: ImportError.PARSE_ERROR
      };
    }
  }
}

/**
 * Create import service instance
 * @returns {ImportService} Import service
 */
export function useImportService() {
  return new ImportService();
}

export default {
  ImportError,
  validateExportData,
  validatePreset,
  detectConflicts,
  resolveConflict,
  sanitizePreset,
  ImportService,
  useImportService
};
