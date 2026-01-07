/**
 * Preset Service
 * Handles preset management (CRUD operations, storage, search)
 */

const STORAGE_KEY = 'mage_presets';
const STORAGE_VERSION = '1.0';

/**
 * Preset categories
 */
export const PresetCategory = {
  CAMERA_MOVEMENTS: 'camera_movements',
  EFFECTS: 'effects',
  STYLES: 'styles',
  GENERAL: 'general',
  CUSTOM: 'custom'
};

/**
 * Generate unique preset ID
 * @returns {string} Preset ID
 */
export function generatePresetId() {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate preset object
 * @param {object} preset - Preset to validate
 * @returns {object} Validation result
 */
export function validatePreset(preset) {
  if (!preset || typeof preset !== 'object') {
    return { isValid: false, error: 'Invalid preset object' };
  }
  
  if (!preset.name || preset.name.trim() === '') {
    return { isValid: false, error: 'Preset name is required' };
  }
  
  if (preset.name.length > 100) {
    return { isValid: false, error: 'Preset name too long (max 100 characters)' };
  }
  
  if (!preset.settings || typeof preset.settings !== 'object') {
    return { isValid: false, error: 'Preset settings are required' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Create preset object
 * @param {object} data - Preset data
 * @returns {object} Complete preset object
 */
export function createPreset(data) {
  return {
    id: data.id || generatePresetId(),
    name: data.name || 'Untitled Preset',
    description: data.description || '',
    category: data.category || PresetCategory.GENERAL,
    tags: Array.isArray(data.tags) ? data.tags : [],
    settings: data.settings || {},
    thumbnail: data.thumbnail || '',
    isPublic: data.isPublic || false,
    isSystem: data.isSystem || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    lastUsed: data.lastUsed || null,
    useCount: data.useCount || 0,
    version: data.version || '1.0'
  };
}

/**
 * PresetService class
 * Main service for preset management
 */
export class PresetService {
  constructor() {
    this.presets = [];
    this.loadPresets();
  }
  
  /**
   * Load presets from localStorage
   */
  loadPresets() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === STORAGE_VERSION && Array.isArray(data.presets)) {
          this.presets = data.presets;
        }
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
      this.presets = [];
    }
  }
  
  /**
   * Save presets to localStorage
   */
  savePresets() {
    try {
      const data = {
        version: STORAGE_VERSION,
        presets: this.presets,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  }
  
  /**
   * Create new preset
   * @param {object} presetData - Preset data
   * @returns {object} Created preset
   */
  create(presetData) {
    const validation = validatePreset(presetData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    const preset = createPreset(presetData);
    this.presets.push(preset);
    this.savePresets();
    
    return preset;
  }
  
  /**
   * Get preset by ID
   * @param {string} id - Preset ID
   * @returns {object|null} Preset or null
   */
  getById(id) {
    return this.presets.find(p => p.id === id) || null;
  }
  
  /**
   * Get all presets
   * @returns {Array} Array of presets
   */
  getAll() {
    return [...this.presets];
  }
  
  /**
   * Update preset
   * @param {string} id - Preset ID
   * @param {object} updates - Updates to apply
   * @returns {object|null} Updated preset or null
   */
  update(id, updates) {
    const preset = this.getById(id);
    if (!preset) return null;
    
    // Don't allow updating system presets
    if (preset.isSystem) {
      throw new Error('Cannot update system preset');
    }
    
    // Apply updates
    Object.assign(preset, updates);
    preset.updatedAt = new Date().toISOString();
    
    // Validate
    const validation = validatePreset(preset);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    this.savePresets();
    return preset;
  }
  
  /**
   * Delete preset
   * @param {string} id - Preset ID
   * @returns {boolean} Success flag
   */
  delete(id) {
    const index = this.presets.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    // Don't allow deleting system presets
    if (this.presets[index].isSystem) {
      throw new Error('Cannot delete system preset');
    }
    
    this.presets.splice(index, 1);
    this.savePresets();
    return true;
  }
  
  /**
   * Duplicate preset
   * @param {string} id - Preset ID
   * @returns {object|null} Duplicated preset
   */
  duplicate(id) {
    const original = this.getById(id);
    if (!original) return null;
    
    const duplicated = createPreset({
      ...original,
      id: generatePresetId(),
      name: `${original.name} (Copy)`,
      isSystem: false,
      lastUsed: null,
      useCount: 0
    });
    
    this.presets.push(duplicated);
    this.savePresets();
    
    return duplicated;
  }
  
  /**
   * Mark preset as used
   * @param {string} id - Preset ID
   */
  markAsUsed(id) {
    const preset = this.getById(id);
    if (!preset) return;
    
    preset.lastUsed = new Date().toISOString();
    preset.useCount++;
    this.savePresets();
  }
  
  /**
   * Search presets
   * @param {string} query - Search query
   * @returns {Array} Matching presets
   */
  search(query) {
    if (!query || query.trim() === '') {
      return this.getAll();
    }
    
    const lowerQuery = query.toLowerCase();
    
    return this.presets.filter(preset => {
      const searchText = `${preset.name} ${preset.description} ${preset.tags.join(' ')}`.toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }
  
  /**
   * Filter presets by category
   * @param {string} category - Category
   * @returns {Array} Filtered presets
   */
  filterByCategory(category) {
    if (!category) return this.getAll();
    return this.presets.filter(p => p.category === category);
  }
  
  /**
   * Filter presets by tags
   * @param {Array} tags - Array of tags
   * @returns {Array} Filtered presets
   */
  filterByTags(tags) {
    if (!tags || tags.length === 0) return this.getAll();
    
    return this.presets.filter(preset => {
      return tags.some(tag => preset.tags.includes(tag));
    });
  }
  
  /**
   * Get recent presets
   * @param {number} count - Number of presets to return
   * @returns {Array} Recent presets
   */
  getRecent(count = 10) {
    return [...this.presets]
      .filter(p => p.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, count);
  }
  
  /**
   * Get popular presets
   * @param {number} count - Number of presets to return
   * @returns {Array} Popular presets
   */
  getPopular(count = 10) {
    return [...this.presets]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, count);
  }
  
  /**
   * Import presets
   * @param {Array} presetsToImport - Presets to import
   * @returns {number} Number of imported presets
   */
  import(presetsToImport) {
    let importedCount = 0;
    
    presetsToImport.forEach(preset => {
      try {
        this.create(preset);
        importedCount++;
      } catch (error) {
        console.error(`Failed to import preset ${preset.name}:`, error);
      }
    });
    
    return importedCount;
  }
  
  /**
   * Export all presets
   * @returns {Array} All presets
   */
  export() {
    return this.getAll();
  }
  
  /**
   * Clear all non-system presets
   */
  clearUserPresets() {
    this.presets = this.presets.filter(p => p.isSystem);
    this.savePresets();
  }
  
  /**
   * Get preset count
   * @returns {number} Number of presets
   */
  count() {
    return this.presets.length;
  }
  
  /**
   * Get categories with counts
   * @returns {Array} Array of {category, count}
   */
  getCategoryCounts() {
    const counts = {};
    
    this.presets.forEach(preset => {
      counts[preset.category] = (counts[preset.category] || 0) + 1;
    });
    
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count
    }));
  }
}

/**
 * Create preset service instance
 * @returns {PresetService} Service instance
 */
export function usePresetService() {
  return new PresetService();
}

export default {
  PresetCategory,
  generatePresetId,
  validatePreset,
  createPreset,
  PresetService,
  usePresetService
};
