# Video Editing Features - Technical Architecture

## System Architecture Overview

This document provides the technical architecture for the 8 new video editing features.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                          │
│                                                                  │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Video Trimmer  │  │ Batch Queue  │  │ Preset Library   │   │
│  └────────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  └────────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                  │
│  ┌────────────────┐                                             │
│  │ Cloud Storage  │                                             │
│  └────────────────┘                                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTP/REST + WebSocket
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                     Backend API Server                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Job Queue   │  │ FFmpeg       │  │ Preview Generator  │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Presets DB  │  │ Shares DB    │  │ WebSocket Server   │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ S3 API
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                     Cloud Storage (S3)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  User Videos │ Presets │ Projects │ Shared Content        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature: Video Trimming/Clipping

### Component Hierarchy
```
VideoEditor.vue
  └── VideoTrimmer.vue
      ├── Timeline (PrimeVue Slider)
      ├── TrimPreview.vue
      │   └── Video Element
      └── Controls
          ├── Start Time Input
          ├── End Time Input
          └── Duration Display
```

### Data Flow
```
User adjusts trim handles
    ↓
Update trim_start, trim_end state
    ↓
Debounce (300ms)
    ↓
Generate preview thumbnail
    ↓
Update preview component
    ↓
On Submit: Send trim params to API
    ↓
Backend: FFmpeg trim operation
    ↓
Return processed video
```

### State Management
```javascript
// Vuex Store Module: video/trim
{
  state: {
    trimStart: 0,        // seconds
    trimEnd: 0,          // seconds
    duration: 0,         // total duration
    thumbnails: [],      // preview thumbnails
    isPreviewReady: false
  },
  
  mutations: {
    SET_TRIM_START,
    SET_TRIM_END,
    SET_DURATION,
    SET_THUMBNAILS,
    SET_PREVIEW_READY
  },
  
  actions: {
    updateTrimStart,
    updateTrimEnd,
    generateThumbnails,
    submitTrimJob
  }
}
```

### FFmpeg Command (Backend)
```bash
ffmpeg -i input.mp4 \
  -ss <trim_start> \
  -t <duration> \
  -c:v libx264 \
  -c:a aac \
  output.mp4
```

---

## Feature: Batch Processing

### Component Hierarchy
```
BatchProcessor.vue
  ├── DropZone (Multi-file upload)
  ├── BatchSettingsPanel.vue
  │   ├── Model Selector
  │   ├── Prompt Input
  │   └── Parameter Controls
  ├── BatchQueue
  │   └── BatchQueueItem.vue (× N files)
  │       ├── File Preview
  │       ├── Status Badge
  │       ├── Progress Bar
  │       └── Actions Menu
  └── Batch Controls
      ├── Submit All
      ├── Pause/Resume
      └── Cancel All
```

### Queue State Machine
```
┌─────────┐
│ Pending │
└────┬────┘
     │ start
     ↓
┌─────────┐     ┌──────────┐
│Uploading│────→│ Queued   │
└─────────┘     └────┬─────┘
                     │ process
                     ↓
                ┌──────────┐
                │Processing│
                └────┬─────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ↓                   ↓
      ┌─────────┐         ┌───────┐
      │Complete │         │ Error │
      └─────────┘         └───────┘
```

### Batch Processing Algorithm
```javascript
async function processBatch(files, settings) {
  const batchId = generateBatchId();
  const jobs = [];
  
  // 1. Upload all files
  for (const file of files) {
    const uploadedFile = await uploadFile(file);
    jobs.push({
      fileId: uploadedFile.id,
      status: 'queued',
      settings: { ...settings, ...file.customSettings }
    });
  }
  
  // 2. Create batch job
  const batch = await createBatch(batchId, jobs);
  
  // 3. Process jobs (parallel or sequential)
  const concurrency = 3; // Process 3 at a time
  const results = await processJobsWithConcurrency(
    batch.jobs, 
    concurrency
  );
  
  return {
    batchId,
    total: files.length,
    successful: results.filter(r => r.status === 'complete').length,
    failed: results.filter(r => r.status === 'error').length
  };
}
```

### Database Schema (Backend)
```sql
CREATE TABLE batches (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'processing', 'complete', 'partial', 'error'),
  total_jobs INT,
  completed_jobs INT,
  failed_jobs INT,
  settings JSON
);

CREATE TABLE batch_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(36),
  video_job_id INT,
  status ENUM('queued', 'processing', 'complete', 'error'),
  error_message TEXT,
  FOREIGN KEY (batch_id) REFERENCES batches(id),
  FOREIGN KEY (video_job_id) REFERENCES video_jobs(id)
);
```

---

## Feature: Preset Library Management

### Component Hierarchy
```
PresetLibrary.vue
  ├── Search Bar
  ├── Filter Panel
  │   ├── Category Filter
  │   ├── Tag Filter
  │   └── Sort Options
  ├── Preset Grid
  │   └── PresetCard.vue (× N presets)
  │       ├── Thumbnail
  │       ├── Name
  │       ├── Description
  │       ├── Tags
  │       └── Actions
  │           ├── Apply
  │           ├── Edit
  │           ├── Duplicate
  │           └── Delete
  └── Floating Action Button
      └── Create New Preset

PresetDialog.vue
  ├── Name Input
  ├── Description Textarea
  ├── Category Dropdown
  ├── Tags Multi-select
  ├── Thumbnail Upload
  └── Settings Preview (JSON)
```

### Preset Data Structure
```typescript
interface Preset {
  id: string;                    // UUID
  name: string;                  // "Cinematic Zoom"
  description: string;           // "Slow zoom with..."
  category: PresetCategory;      // "camera_movements"
  tags: string[];                // ["zoom", "cinematic"]
  settings: PresetSettings;      // All editor settings
  thumbnail: string;             // Base64 or URL
  isPublic: boolean;             // Can others see it?
  isSystem: boolean;             // Built-in preset?
  userId: number;                // Owner
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date;
  useCount: number;
  version: string;               // "1.0" for compatibility
}

interface PresetSettings {
  // Deforum settings
  prompt?: string;
  negativePrompt?: string;
  denoising?: number;
  modelId?: number;
  zoom?: string;
  translation_x?: string;
  translation_y?: string;
  rotation?: string;
  // ... all possible settings
  
  // Vid2Vid settings
  strength?: number;
  guidance_scale?: number;
  // ... etc
  
  // Metadata
  editorType: 'deforum' | 'vid2vid' | 'audio';
  version: string;
}
```

### Storage Strategy

#### LocalStorage (Default)
```javascript
// Store in localStorage for offline access
localStorage.setItem('mage_presets', JSON.stringify(presets));

// Structure:
{
  "version": "1.0",
  "presets": [
    { id: "...", name: "...", ... },
    { id: "...", name: "...", ... }
  ],
  "lastSync": "2026-01-07T10:00:00Z"
}
```

#### API Storage (When authenticated)
```javascript
// Sync to backend for cloud backup
POST /v1/presets
GET /v1/presets
PUT /v1/presets/:id
DELETE /v1/presets/:id

// Sync strategy: Read from API, merge with local, write conflicts
```

### Search & Filter Implementation
```javascript
class PresetSearchEngine {
  constructor(presets) {
    this.presets = presets;
    this.index = this.buildIndex(presets);
  }
  
  search(query) {
    return this.presets.filter(preset => {
      // Full-text search in name, description, tags
      const searchText = `${preset.name} ${preset.description} ${preset.tags.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }
  
  filter(options) {
    let results = this.presets;
    
    if (options.category) {
      results = results.filter(p => p.category === options.category);
    }
    
    if (options.tags?.length) {
      results = results.filter(p => 
        options.tags.some(tag => p.tags.includes(tag))
      );
    }
    
    if (options.editorType) {
      results = results.filter(p => 
        p.settings.editorType === options.editorType
      );
    }
    
    return results;
  }
  
  sort(presets, sortBy) {
    const sorters = {
      'name': (a, b) => a.name.localeCompare(b.name),
      'recent': (a, b) => new Date(b.lastUsed) - new Date(a.lastUsed),
      'popular': (a, b) => b.useCount - a.useCount,
      'newest': (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    };
    
    return [...presets].sort(sorters[sortBy]);
  }
}
```

---

## Feature: Export/Import Presets

### Export Format (JSON)
```json
{
  "mage_export_version": "1.0",
  "export_date": "2026-01-07T10:00:00Z",
  "export_type": "presets",
  "app_version": "1.0.0",
  "data": {
    "presets": [
      {
        "id": "preset_123",
        "name": "Cinematic Zoom",
        "description": "Slow zoom with cinematic feel",
        "category": "camera_movements",
        "tags": ["zoom", "cinematic", "slow"],
        "settings": {
          "editorType": "deforum",
          "prompt": "beautiful cinematic landscape",
          "denoising": 0.7,
          "zoom": "0:(1.0), 30:(1.1)",
          "...": "..."
        },
        "thumbnail": "data:image/png;base64,iVBOR...",
        "createdAt": "2026-01-05T10:00:00Z",
        "version": "1.0"
      }
    ]
  }
}
```

### Export Flow
```
User clicks Export
    ↓
ExportDialog opens
    ↓
User selects what to export:
  - Single preset
  - Selected presets
  - All presets
  - Current editor settings
    ↓
User selects format:
  - JSON (default)
  - YAML
    ↓
Generate export file
    ↓
Validate export data
    ↓
Create Blob
    ↓
Download file
```

### Import Flow
```
User clicks Import
    ↓
ImportDialog opens
    ↓
User uploads file
    ↓
Detect format (JSON/YAML)
    ↓
Parse file
    ↓
Validate structure
    ↓
Check version compatibility
    ↓
Detect conflicts:
  - Preset with same ID exists
  - Preset with same name exists
    ↓
User resolves conflicts:
  - Skip
  - Replace
  - Keep both (rename)
    ↓
Import presets
    ↓
Show success message
```

### Validation Schema
```javascript
const exportSchema = {
  mage_export_version: 'string:required',
  export_date: 'date:required',
  export_type: 'enum:presets,settings,project',
  app_version: 'string',
  data: {
    presets: [{
      id: 'string:required',
      name: 'string:required:min:1:max:100',
      description: 'string:max:500',
      category: 'string',
      tags: 'array:string',
      settings: 'object:required',
      thumbnail: 'string',
      createdAt: 'date',
      version: 'string'
    }]
  }
};
```

---

## Feature: Advanced Audio Visualization

### Visualization Pipeline
```
Audio File/Stream
    ↓
Web Audio API
    ↓
AudioContext
    ↓
AnalyserNode
    ↓
┌───────────────┬───────────────┬─────────────────┐
│  Time Domain  │  Frequency    │   Spectrogram   │
│   (Waveform)  │  (Spectrum)   │  (Time-Freq)    │
└───────┬───────┴───────┬───────┴────────┬────────┘
        │               │                │
        ↓               ↓                ↓
   Canvas Draw     Canvas Draw     Canvas Draw
        │               │                │
        └───────────────┴────────────────┘
                        ↓
              AudioVisualizer Component
```

### Web Audio API Setup
```javascript
class AudioAnalyzer {
  constructor(audioElement) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048; // Power of 2, 32-32768
    
    // Connect audio element to analyser
    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // Data arrays
    this.bufferLength = this.analyser.frequencyBinCount;
    this.waveformData = new Uint8Array(this.bufferLength);
    this.frequencyData = new Uint8Array(this.bufferLength);
  }
  
  getWaveformData() {
    this.analyser.getByteTimeDomainData(this.waveformData);
    return this.waveformData;
  }
  
  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }
  
  getAverageBPM() {
    // Implement beat detection algorithm
    return this.detectBeats();
  }
}
```

### Visualization Rendering

#### Waveform
```javascript
function drawWaveform(canvas, waveformData) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ff00';
  ctx.beginPath();
  
  const sliceWidth = width / waveformData.length;
  let x = 0;
  
  for (let i = 0; i < waveformData.length; i++) {
    const v = waveformData[i] / 128.0; // 0-255 -> 0-2
    const y = v * height / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}
```

#### Frequency Spectrum (Bars)
```javascript
function drawSpectrum(canvas, frequencyData) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  const barWidth = width / frequencyData.length * 2.5;
  let barHeight;
  let x = 0;
  
  for (let i = 0; i < frequencyData.length; i++) {
    barHeight = (frequencyData[i] / 255) * height;
    
    // Color gradient based on frequency
    const hue = (i / frequencyData.length) * 360;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}
```

#### Spectrogram (Time-Frequency Heatmap)
```javascript
class SpectrogramRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.imageData = this.ctx.createImageData(canvas.width, canvas.height);
    this.column = 0;
  }
  
  addFrequencyData(frequencyData) {
    // Shift image left by 1 pixel
    this.ctx.drawImage(this.canvas, -1, 0);
    
    // Draw new column on the right
    const x = this.canvas.width - 1;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i];
      const y = this.canvas.height - (i * this.canvas.height / frequencyData.length);
      
      // Map value to color (blue -> green -> yellow -> red)
      const color = this.valueToColor(value);
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, 1, this.canvas.height / frequencyData.length);
    }
  }
  
  valueToColor(value) {
    // 0-255 -> Blue to Red spectrum
    const normalized = value / 255;
    if (normalized < 0.25) return `rgb(0, 0, ${normalized * 4 * 255})`;
    if (normalized < 0.5) return `rgb(0, ${(normalized - 0.25) * 4 * 255}, 255)`;
    if (normalized < 0.75) return `rgb(${(normalized - 0.5) * 4 * 255}, 255, 0)`;
    return `rgb(255, ${(1 - normalized) * 4 * 255}, 0)`;
  }
}
```

---

## Feature: Real-time Preview

### Architecture
```
Frontend                      Backend
┌──────────────────┐         ┌──────────────────┐
│ VideoEditor      │         │ Preview Server   │
│   │              │         │                  │
│   ├─ Settings    │         │                  │
│   │    Change    │──HTTP───▶│ Queue Preview   │
│   │              │         │   Request        │
│   │              │         │      ↓           │
│   │              │         │ Generate Low-Res │
│   │              │         │   Preview        │
│   │              │         │      ↓           │
│   ├─ Preview     │◀─WebSocket─│ Send Preview   │
│   │   Component  │         │   Image          │
│   │              │         │                  │
└──────────────────┘         └──────────────────┘
```

### WebSocket Protocol
```javascript
// Client → Server
{
  type: 'subscribe',
  jobId: 123,
  quality: 'low' // low, medium, high
}

{
  type: 'preview_request',
  jobId: 123,
  settings: {
    prompt: "...",
    denoising: 0.7,
    // ... all settings
  },
  requestId: "req_abc123" // For tracking
}

// Server → Client
{
  type: 'preview_ready',
  jobId: 123,
  requestId: "req_abc123",
  previewUrl: "data:image/jpeg;base64,...",
  timestamp: 1234567890,
  generationTime: 450 // ms
}

{
  type: 'preview_error',
  jobId: 123,
  requestId: "req_abc123",
  error: "Failed to generate preview"
}
```

### Preview Generation Strategy

#### Client-Side (Fast but limited)
```javascript
// Use @ffmpeg/ffmpeg for instant previews
async function generateClientPreview(videoFile, settings) {
  const ffmpeg = createFFmpeg({ log: false });
  await ffmpeg.load();
  
  // Extract single frame
  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
  await ffmpeg.run(
    '-i', 'input.mp4',
    '-vf', `scale=256:256`,
    '-frames:v', '1',
    'output.jpg'
  );
  
  const data = ffmpeg.FS('readFile', 'output.jpg');
  return URL.createObjectURL(new Blob([data.buffer], { type: 'image/jpeg' }));
}
```

#### Server-Side (Slower but accurate)
```javascript
// Backend: Generate preview with actual AI model
async function generateServerPreview(jobId, settings) {
  const job = await getJob(jobId);
  
  // Use low-res version of model for speed
  const previewSettings = {
    ...settings,
    width: 256,
    height: 256,
    steps: 5, // Reduced from 50
    quality: 'draft'
  };
  
  const preview = await runModel(job.inputFile, previewSettings);
  
  return {
    previewUrl: await uploadToTemp(preview),
    generationTime: Date.now() - startTime
  };
}
```

### Debouncing Strategy
```javascript
class PreviewDebouncer {
  constructor(delay = 500) {
    this.delay = delay;
    this.timer = null;
    this.pendingRequest = null;
  }
  
  requestPreview(settings, callback) {
    // Cancel previous request
    if (this.timer) {
      clearTimeout(this.timer);
      this.cancelPendingRequest();
    }
    
    // Schedule new request
    this.timer = setTimeout(() => {
      this.pendingRequest = callback(settings);
    }, this.delay);
  }
  
  cancelPendingRequest() {
    if (this.pendingRequest) {
      this.pendingRequest.cancel();
      this.pendingRequest = null;
    }
  }
}
```

---


### Share Link Architecture
```
┌────────────────────────────────────────────────────┐
│ Share Link: https://mage.app/shared/abc123        │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│ Share Record in Database                           │
│  - share_id: "abc123"                              │
│  - project_id: 456                                 │
│  - owner_id: 789                                   │
│  - permission: "view" | "edit"                     │
│  - expires_at: 2026-02-07                          │
│  - is_public: false                                │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│ Access Control                                     │
│  - Validate share_id exists                        │
│  - Check not expired                               │
│  - Check user has permission                       │
│  - Load project data                               │
└────────────────────────────────────────────────────┘
```

```javascript
// Presence tracking

io.on('connection', (socket) => {
  socket.on('join_project', ({ projectId, userId }) => {
    socket.join(`project:${projectId}`);
    
    
    // Broadcast to others
    socket.to(`project:${projectId}`).emit('user_joined', {
      userId,
      timestamp: Date.now()
    });
    
      .filter(c => c.projectId === projectId);
  });
  
  socket.on('settings_change', ({ projectId, settings, userId }) => {
    // Broadcast change to all in project except sender
    socket.to(`project:${projectId}`).emit('settings_updated', {
      settings,
      userId,
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
        timestamp: Date.now()
      });
    }
  });
});
```

### Activity Log
```javascript
// Store all activities for audit trail
const activities = [
  {
    id: 1,
    project_id: 456,
    user_id: 789,
    action: 'settings_changed',
    details: {
      field: 'prompt',
      oldValue: 'old prompt',
      newValue: 'new prompt'
    },
    timestamp: '2026-01-07T10:30:00Z'
  },
  {
    id: 2,
    project_id: 456,
    user_id: 789,
    action: 'shared',
    details: {
      with_user_id: 101,
      permission: 'edit'
    },
    timestamp: '2026-01-07T10:31:00Z'
  }
];
```

---

## Feature: Cloud Storage Integration

### Multi-Provider Architecture
```
┌──────────────────────────────────────────────────┐
│            Cloud Storage Abstraction             │
│                                                  │
│  CloudStorageService                             │
│    ├─ upload(file, path)                         │
│    ├─ download(path)                             │
│    ├─ list(path)                                 │
│    ├─ delete(path)                               │
│    └─ getPublicUrl(path)                         │
└────────────────┬─────────────────────────────────┘
                 │
         ┌───────┼───────┬─────────┐
         │       │       │         │
         ↓       ↓       ↓         ↓
    ┌────────┐ ┌────┐ ┌──────┐ ┌──────┐
    │ S3     │ │GCS │ │Azure │ │Local │
    │Adapter │ │    │ │Blob  │ │      │
    └────────┘ └────┘ └──────┘ └──────┘
```

### S3 Adapter Implementation
```javascript
class S3Adapter {
  constructor(config) {
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });
    this.bucket = config.bucket;
  }
  
  async upload(file, path, metadata = {}) {
    const params = {
      Bucket: this.bucket,
      Key: path,
      Body: file,
      ContentType: metadata.contentType,
      Metadata: metadata
    };
    
    return await this.s3.upload(params).promise();
  }
  
  async download(path) {
    const params = {
      Bucket: this.bucket,
      Key: path
    };
    
    return await this.s3.getObject(params).promise();
  }
  
  async list(prefix) {
    const params = {
      Bucket: this.bucket,
      Prefix: prefix
    };
    
    const data = await this.s3.listObjectsV2(params).promise();
    return data.Contents.map(item => ({
      path: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    }));
  }
  
  async delete(path) {
    const params = {
      Bucket: this.bucket,
      Key: path
    };
    
    return await this.s3.deleteObject(params).promise();
  }
  
  getPublicUrl(path, expiresIn = 3600) {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: path,
      Expires: expiresIn
    });
  }
}
```

### Sync Algorithm
```javascript
class SyncService {
  async sync(userId) {
    const localFiles = await this.getLocalFiles(userId);
    const cloudFiles = await this.cloudStorage.list(`users/${userId}/`);
    
    const localMap = new Map(localFiles.map(f => [f.path, f]));
    const cloudMap = new Map(cloudFiles.map(f => [f.path, f]));
    
    const toUpload = [];
    const toDownload = [];
    const conflicts = [];
    
    // Find files to upload
    for (const [path, local] of localMap) {
      const cloud = cloudMap.get(path);
      if (!cloud) {
        toUpload.push(local);
      } else if (local.modifiedAt > cloud.lastModified) {
        toUpload.push(local);
      } else if (local.modifiedAt < cloud.lastModified) {
        toDownload.push(cloud);
      }
    }
    
    // Find files to download
    for (const [path, cloud] of cloudMap) {
      if (!localMap.has(path)) {
        toDownload.push(cloud);
      }
    }
    
    // Execute sync
    await Promise.all([
      ...toUpload.map(f => this.uploadFile(f)),
      ...toDownload.map(f => this.downloadFile(f))
    ]);
    
    return {
      uploaded: toUpload.length,
      downloaded: toDownload.length,
      conflicts: conflicts.length
    };
  }
}
```

---

## Performance Optimization

### Lazy Loading
```javascript
// Route-based code splitting
const routes = [
  {
    path: '/batch-upload',
    component: () => import('./components/batch/BatchProcessor.vue')
  },
  {
    path: '/presets',
    component: () => import('./components/presets/PresetLibrary.vue')
  }
];
```

### Virtual Scrolling
```vue
<!-- For large preset lists -->
<template>
  <virtual-scroller
    :items="presets"
    :item-height="120"
    class="preset-list"
  >
    <template #default="{ item }">
      <preset-card :preset="item" />
    </template>
  </virtual-scroller>
</template>
```

### Caching Strategy
```javascript
// Service worker for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/presets')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open('presets-v1').then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});
```

---

## Security Architecture

### Authentication Flow
```
User → Login → JWT Token → Store in memory + httpOnly cookie
                                ↓
                      All API requests include token
                                ↓
                      Backend validates token
                                ↓
                      Check permissions
                                ↓
                      Execute request
```

### Rate Limiting
```javascript
// Backend: Rate limit by user
const rateLimit = require('express-rate-limit');

const previewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many preview requests, please try again later'
});

app.use('/api/preview', previewLimiter);
```

### Data Encryption
```javascript
// Encrypt sensitive data before storing
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData, key) {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Usage: Encrypt cloud storage credentials
const encryptedCreds = encrypt(
  JSON.stringify(userCloudCredentials),
  process.env.ENCRYPTION_KEY
);
```

---

## Monitoring & Logging

### Event Tracking
```javascript
// Track feature usage
analytics.track('preset_applied', {
  presetId: preset.id,
  presetName: preset.name,
  editorType: 'deforum',
  userId: user.id
});

analytics.track('batch_job_submitted', {
  fileCount: batch.files.length,
  batchId: batch.id,
  userId: user.id
});

analytics.track('cloud_sync_completed', {
  uploadedFiles: sync.uploaded,
  downloadedFiles: sync.downloaded,
  duration: sync.duration,
  userId: user.id
});
```

### Error Logging
```javascript
// Centralized error handler
window.addEventListener('error', (event) => {
  logger.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  });
});

// API error tracking
axios.interceptors.response.use(
  response => response,
  error => {
    logger.error('API error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                   CDN (Static Assets)           │
│   - Vue bundle                                  │
│   - Images, fonts, CSS                          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│              Load Balancer                      │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┼────────┐
         │                 │
         ↓                 ↓
┌─────────────────┐ ┌─────────────────┐
│  API Server 1   │ │  API Server 2   │
│  - REST API     │ │  - REST API     │
│  - WebSocket    │ │  - WebSocket    │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────┼─────────┬──────────┐
         │         │         │          │
         ↓         ↓         ↓          ↓
    ┌────────┐ ┌─────┐ ┌────────┐ ┌────────┐
    │Database│ │Redis│ │S3      │ │Worker  │
    │        │ │Cache│ │Storage │ │Queue   │
    └────────┘ └─────┘ └────────┘ └────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** January 7, 2026  
**Author:** GitHub Copilot Agent
