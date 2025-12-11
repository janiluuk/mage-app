# Audio Animation Feature

## Overview

The Audio Animation feature allows users to create animation jobs synchronized with audio files. Users can upload audio files and choose from different motion styles to create dynamic, audio-responsive animations.

## Features

### 1. Audio File Upload

- **Drag & Drop Support**: Users can drag and drop audio files directly into the upload box
- **File Validation**: 
  - Supported formats: MP3, WAV, OGG, M4A, FLAC
  - Maximum file size: 50MB
- **Audio Metadata Display**:
  - File name
  - File size
  - Audio duration (automatically detected)

### 2. Motion Styles

Users can choose from three motion style options:

#### Audio Sync
Automatically synchronizes motion with audio amplitude and frequency. The animation will respond dynamically to the audio's characteristics, creating reactive motion patterns.

#### BPM (Beats Per Minute)
Synchronizes motion to a specific tempo. Users input the BPM value (60-200), and the system calculates frame timing to match the beat. Ideal for music-driven animations with consistent tempo.

#### Classic
Choose from predefined motion presets stored in the database. Each preset defines specific animation parameters for different motion effects.

### 3. Classic Motion Presets

The following presets are available:

1. **Slow Zoom In**: Gentle zoom in effect with subtle rotation
2. **Fast Zoom Out**: Quick zoom out effect
3. **Rotation Left**: Smooth counterclockwise rotation
4. **Rotation Right**: Smooth clockwise rotation
5. **Pan Left**: Horizontal movement to the left
6. **Pan Right**: Horizontal movement to the right
7. **Dolly In**: Forward movement with perspective change
8. **Spiral Motion**: Combined zoom and rotation creating spiral effect

Each preset includes settings for:
- Animation mode (2D/3D)
- Frame count
- Border handling
- Rotation angles
- Translation values
- Zoom parameters
- Perspective settings
- Noise schedules

## Usage

### Creating an Audio Animation Job

1. Navigate to the upload page
2. Click on the "Audio Animation" card
3. In the dialog that opens:
   - **Upload Audio**: Drag and drop an audio file or click to browse
   - **Select Motion Style**: Choose Audio Sync, BPM, or Classic
   - **Configure Style**:
     - For BPM: Enter the beats per minute value
     - For Classic: Select a preset from the grid
   - **Create Job**: Click "Create Job" to submit

### Database Storage

Motion presets are stored in IndexedDB using Dexie. The database is automatically initialized on first use and seeded with default presets.

#### Database Schema

```javascript
{
  presets: {
    id: auto-increment integer,
    name: string,
    type: string (e.g., 'classic'),
    description: string,
    settings: object {
      animation_mode: string,
      max_frames: number,
      border: string,
      angle: string,
      zoom: string,
      translation_x: string,
      translation_y: string,
      translation_z: string,
      rotation_3d_x: string,
      rotation_3d_y: string,
      rotation_3d_z: string,
      flip_2d_perspective: boolean,
      perspective_flip_theta: string,
      perspective_flip_phi: string,
      perspective_flip_gamma: string,
      perspective_flip_fv: string,
      noise_schedule: string
    }
  }
}
```

## Backend Processing

When a job is created, the backend `DeforumJob` strategy processes the audio file and motion settings:

### Audio Sync Mode
Sets the `motion_type` to `audio_sync` and enables `audio_reactive` flag for dynamic audio analysis.

### BPM Mode
Calculates frame timing based on BPM:
- Converts BPM to beats per second
- Calculates frames per beat (assuming 30 fps)
- Stores BPM and timing information

### Classic Mode
Applies the selected preset's settings to the job configuration.

## Components

### AudioFileUpload.vue
Handles audio file selection with drag-n-drop support, validation, and preview display.

**Events:**
- `file-selected`: Emitted when a valid file is selected
- `file-removed`: Emitted when the file is removed

### MotionStyleSelector.vue
Provides motion style selection and configuration options.

**Events:**
- `style-selected`: Emitted when motion style is selected
- `preset-selected`: Emitted when a preset is selected (classic mode)
- `bpm-changed`: Emitted when BPM value changes

### JobCreationForm.vue
Combines audio upload and motion style selector into a complete job creation form.

**Events:**
- `job-created`: Emitted when job is created with complete data
- `form-cancelled`: Emitted when form is cancelled

## API Integration

The feature integrates with the existing video job API:

```javascript
// Job data structure
{
  audioFile: File,
  motionStyle: 'audio_sync' | 'bpm' | 'classic',
  preset: Object | null,      // For classic mode
  bpm: Number | null           // For BPM mode
}
```

The data is sent via FormData in the `/upload` endpoint with the type set to `'deforum'`.

## Testing

Comprehensive unit tests are included for:
- Audio file upload component (validation, drag-n-drop, events)
- Database operations (CRUD operations on presets)
- Component integration

Run tests with:
```bash
npm run test:frontend
```

## Future Enhancements

Potential future improvements:
1. Custom preset creation and management UI
2. Audio waveform visualization during upload
3. Real-time preview of motion with audio
4. More advanced audio analysis options
5. Import/export presets functionality
6. Preset sharing between users
