import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  db, 
  initializePresetsDB, 
  getAllPresets, 
  getPresetsByType,
  getPresetById,
  addPreset,
  updatePreset,
  deletePreset,
  seedPresets
} from './deforumPresets.db';

describe('DeforumPresetsDB', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.presets.clear();
  });

  afterEach(async () => {
    // Clean up after tests
    await db.presets.clear();
  });

  it('should initialize database and seed presets', async () => {
    await initializePresetsDB();
    const presets = await getAllPresets();
    
    expect(presets).toBeDefined();
    expect(presets.length).toBeGreaterThan(0);
    expect(presets[0]).toHaveProperty('name');
    expect(presets[0]).toHaveProperty('type');
    expect(presets[0]).toHaveProperty('settings');
  });

  it('should only seed presets once', async () => {
    await seedPresets();
    const firstCount = await db.presets.count();
    
    await seedPresets();
    const secondCount = await db.presets.count();
    
    expect(firstCount).toBe(secondCount);
  });

  it('should get presets by type', async () => {
    await seedPresets();
    const classicPresets = await getPresetsByType('classic');
    
    expect(classicPresets).toBeDefined();
    expect(classicPresets.length).toBeGreaterThan(0);
    classicPresets.forEach(preset => {
      expect(preset.type).toBe('classic');
    });
  });

  it('should add a new preset', async () => {
    const newPreset = {
      name: 'Test Preset',
      type: 'classic',
      description: 'Test description',
      settings: {
        zoom: '0:(1.01)'
      }
    };

    const id = await addPreset(newPreset);
    expect(id).toBeDefined();

    const preset = await getPresetById(id);
    expect(preset).toBeDefined();
    expect(preset.name).toBe('Test Preset');
  });

  it('should update a preset', async () => {
    await seedPresets();
    const presets = await getAllPresets();
    const firstPreset = presets[0];

    await updatePreset(firstPreset.id, { name: 'Updated Name' });
    
    const updated = await getPresetById(firstPreset.id);
    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a preset', async () => {
    await seedPresets();
    const presets = await getAllPresets();
    const firstPreset = presets[0];

    await deletePreset(firstPreset.id);
    
    const deleted = await getPresetById(firstPreset.id);
    expect(deleted).toBeUndefined();
  });

  it('should have valid preset settings structure', async () => {
    await seedPresets();
    const presets = await getAllPresets();
    
    presets.forEach(preset => {
      expect(preset.settings).toBeDefined();
      expect(preset.settings).toHaveProperty('animation_mode');
      expect(preset.settings).toHaveProperty('zoom');
      expect(preset.settings).toHaveProperty('translation_x');
    });
  });
});
