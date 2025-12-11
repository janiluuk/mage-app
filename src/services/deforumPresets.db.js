import Dexie from 'dexie';

// Initialize Dexie database for Deforum motion presets
export const db = new Dexie('DeforumPresetsDB');

// Define schema
db.version(1).stores({
  presets: '++id, name, type, description, settings'
});

// Seed data with example presets
export async function seedPresets() {
  const count = await db.presets.count();
  
  // Only seed if database is empty
  if (count === 0) {
    await db.presets.bulkAdd([
      {
        name: 'Slow Zoom In',
        type: 'classic',
        description: 'Gentle zoom in effect with subtle rotation',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0)',
          zoom: '0:(1.0025)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(1.75)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Fast Zoom Out',
        type: 'classic',
        description: 'Quick zoom out effect',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0)',
          zoom: '0:(0.995)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(-2.5)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Rotation Left',
        type: 'classic',
        description: 'Smooth counterclockwise rotation',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0.5)',
          zoom: '0:(1.0)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(0)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(-0.3)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Rotation Right',
        type: 'classic',
        description: 'Smooth clockwise rotation',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(-0.5)',
          zoom: '0:(1.0)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(0)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0.3)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Pan Left',
        type: 'classic',
        description: 'Horizontal movement to the left',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0)',
          zoom: '0:(1.0)',
          translation_x: '0:(-1.5)',
          translation_y: '0:(0)',
          translation_z: '0:(0)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Pan Right',
        type: 'classic',
        description: 'Horizontal movement to the right',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0)',
          zoom: '0:(1.0)',
          translation_x: '0:(1.5)',
          translation_y: '0:(0)',
          translation_z: '0:(0)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Dolly In',
        type: 'classic',
        description: 'Forward movement with perspective change',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0)',
          zoom: '0:(1.01)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(2.5)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0)',
          rotation_3d_z: '0:(0)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      },
      {
        name: 'Spiral Motion',
        type: 'classic',
        description: 'Combined zoom and rotation creating spiral effect',
        settings: {
          animation_mode: '3D',
          max_frames: 120,
          border: 'replicate',
          angle: '0:(0.8)',
          zoom: '0:(1.005)',
          translation_x: '0:(0)',
          translation_y: '0:(0)',
          translation_z: '0:(1.2)',
          rotation_3d_x: '0:(0)',
          rotation_3d_y: '0:(0.5)',
          rotation_3d_z: '0:(0.3)',
          flip_2d_perspective: false,
          perspective_flip_theta: '0:(0)',
          perspective_flip_phi: '0:(0)',
          perspective_flip_gamma: '0:(0)',
          perspective_flip_fv: '0:(53)',
          noise_schedule: '0:(0.065)'
        }
      }
    ]);
    console.log('Deforum presets seeded successfully');
  }
}

// Initialize database and seed presets
export async function initializePresetsDB() {
  try {
    await db.open();
    await seedPresets();
  } catch (error) {
    console.error('Failed to initialize Deforum presets database:', error);
  }
}

// Get all presets
export async function getAllPresets() {
  return await db.presets.toArray();
}

// Get presets by type
export async function getPresetsByType(type) {
  return await db.presets.where('type').equals(type).toArray();
}

// Get preset by ID
export async function getPresetById(id) {
  return await db.presets.get(id);
}

// Add a new preset
export async function addPreset(preset) {
  return await db.presets.add(preset);
}

// Update a preset
export async function updatePreset(id, updates) {
  return await db.presets.update(id, updates);
}

// Delete a preset
export async function deletePreset(id) {
  return await db.presets.delete(id);
}
