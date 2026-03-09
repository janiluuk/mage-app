# Mage AI Studio - Documentation Hub

This directory contains documentation for features implemented in Mage AI Studio.

## 📚 Documentation Index

### Feature Documentation
| Document | Description |
|----------|-------------|
| [BROWSER_FEATURE.md](./BROWSER_FEATURE.md) | Video Browser — grid views, filtering, sorting, batch operations |
| [STORY_CREATOR.md](./STORY_CREATOR.md) | Story Creator — multi-scene narrative animation builder |
| [AUDIO_ANIMATION_FEATURE.md](./AUDIO_ANIMATION_FEATURE.md) | Audio animation with motion styles and audio sync |
| [ADMIN_PANEL_FEATURES.md](./ADMIN_PANEL_FEATURES.md) | Admin panel — instance management and monitoring |
| [ADMIN_PANEL_USER_GUIDE.md](./ADMIN_PANEL_USER_GUIDE.md) | Admin panel user guide |
| [PRIMEVUE_ENHANCEMENTS.md](./PRIMEVUE_ENHANCEMENTS.md) | PrimeVue component enhancements across the app |
| [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) | Automated release workflow with conventional commits |

### Planning & Architecture
| Document | Description |
|----------|-------------|
| [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) | System architecture, data flows, service design |
| [PLANNING_COMPLETE_SUMMARY.txt](./PLANNING_COMPLETE_SUMMARY.txt) | Full feature list with implementation status |

### Guides
| Document | Description |
|----------|-------------|
| [SCREENSHOT_GUIDE.md](./SCREENSHOT_GUIDE.md) | How to capture screenshots of admin features |

## 🎯 Implemented Features

### Phase 1: Foundation & Quick Wins — ✅ Complete
| Feature | Status | Components |
|---------|--------|------------|
| **Video Trimming** | ✅ Implemented | `VideoTrimPanel.vue` integrated into Editor |
| **Export/Import Presets** | ✅ Implemented | Built into Presets page (Import/Export buttons) |

### Phase 2: Processing & Management — ✅ Complete
| Feature | Status | Components |
|---------|--------|------------|
| **Batch Processing** | ✅ Implemented | Integrated into Browser context menu + Upload batch progress |
| **Preset Library** | ✅ Implemented | `Presets.vue` — CRUD, categories, favorites, import/export |

### Phase 3: Visual & Creative Tools — ✅ Complete
| Feature | Status | Components |
|---------|--------|------------|
| **Audio-Reactive Video Generator** | ✅ Implemented | `AudioVisualization.vue` page — upload audio, map frequency bands to Deforum parameters, generate Parseq keyframes, export config |
| **Movie Editor (Real-time Preview)** | ✅ Implemented | `MovieEditor.vue` — scene organisation, transitions, text overlays with animations, zoomable timeline, JSON export |
| **Ollama Instance Integration** | ✅ Implemented | Admin panel support for Ollama AI instances alongside SD Forge and ComfyUI |

### Not Started
| Feature | Status | Notes |
|---------|--------|-------|
| **Cloud Storage** | ⬜ Planned | P3 — low priority, not yet scheduled |

## 🏗️ Architecture Overview

```
Frontend (Vue 3 + Vite)
  ├── Views & Pages
  │   ├── Browser.vue              — Media browser with batch actions
  │   ├── Upload.vue               — Multi-file upload with batch progress
  │   ├── Presets.vue              — Preset library management
  │   ├── VideoEditor.vue          — Editor with trim panel
  │   ├── AudioVisualization.vue   — Audio-reactive Deforum generator
  │   └── film-project/
  │       ├── Projects.vue         — Film project listing & CRUD
  │       ├── ProjectDetail.vue    — Sequences, AI script generation
  │       ├── SequenceDetail.vue   — Shots, AI scene generation
  │       ├── ShotDetail.vue       — Individual shot with video
  │       └── MovieEditor.vue      — Full movie editor with timeline
  │
  ├── Components
  │   ├── videoeditor/VideoTrimPanel.vue        — Trim start/end with preview
  │   ├── batch/BatchProcessor.vue              — Batch queue + progress widget
  │   ├── AudioVisualizer.vue                   — Three.js waveform visualiser
  │   ├── audio/AudioVisualizationControls.vue  — Visualiser controls
  │   ├── movie-editor/PreviewPlayer.vue        — Canvas-based video player
  │   ├── movie-editor/TransitionPicker.vue     — Clip transition selector
  │   ├── movie-editor/TextOverlayEditor.vue    — Text overlay editor dialog
  │   ├── admin/InstanceCard.vue                — Instance card (SD/ComfyUI/Ollama)
  │   └── browser/BrowserContextMenu.vue        — Context menu with batch ops
  │
  └── Services
      ├── videoTrimService.js          — Time formatting, validation, trim params
      ├── audioDeforumService.js       — Offline FFT, band mapping, Parseq keyframes
      ├── audioAnalysisService.js      — Real-time waveform/spectrum analysis
      ├── realtimePreviewService.js    — Preview debouncing + WebSocket
      ├── batchProcessingService.js    — Batch creation, status tracking
      └── presetService.js             — Preset CRUD API calls

Backend (Laravel 10 API)
  ├── Batch Processing API         — /api/v1/batches/*
  ├── Preset Management API        — /api/v1/presets/*
  ├── Video Trim API               — /api/v1/video-jobs/trim
  ├── Story Sharing API            — /api/story/share
  ├── Generator Instance API       — /api/administration/generator-instances
  └── Services
      ├── OllamaService            — LLM model listing, generation, health checks
      ├── ComfyWebSocketClient     — ComfyUI job management
      └── LoadBalancerService      — Instance routing (SD Forge / ComfyUI / Ollama)
```

## 📸 Screenshots & Page Descriptions

### Authentication

#### Login (`/login`)
Enter your email and password to sign in. Includes a "Forgot Password" link and a registration link.

![Login](screenshots/01-login-page.png)

#### Sign Up (`/signup`)
Create a new account with name, email, and password.

![Sign Up](screenshots/02-signup-page.png)

#### Forgot Password (`/forgot-password`)
Request a password-reset email.

![Forgot Password](screenshots/03-forgot-password.png)

---

### Dashboard (`/`)
Overview of video processing activity: total videos ready, jobs in progress, completed today, and a "Recent Video Jobs" table with pagination.

![Dashboard](screenshots/dashboard.png)

---

### Video Studio

#### Upload / Create (`/upload`)
Choose a workflow — animation, deforum video, or vid2vid — with large preview cards. Drag-and-drop file upload, prompt entry, and multi-file batch support with progress tracking.

![Upload](screenshots/upload.png)

#### My Library (`/library`)
Filterable, sortable grid or list of all generated videos. Filter by generator or status, search by prompt, toggle layouts. Empty state shows a camera icon and "Create your first video!" button.

![Library Empty State](screenshots/library-empty.png)

Each library card shows a thumbnail (animated on hover), status badge, prompt text, duration, and a context menu for download, reprocess, delete, and batch operations.

![Media Library](screenshots/04-media-library.png)

#### Media Browser (`/browser`)
Advanced filtering and sorting with a responsive grid. Filter by tags, status, or generator, and search for specific items.

![Browser Grid View](screenshots/09-browser-grid-view.png)

![Browser Filtered View](screenshots/07-browser-filtered-view.png)

---

### Film Projects & Movie Editor

#### Film Projects (`/projects`)
Manage film projects in a hierarchical structure: **Projects → Sequences → Shots**. DataTable lists all projects with name, description, status, created date, and actions. AI-assisted content generation at every level.

![Film Projects](screenshots/film-projects.png)

#### Movie Editor (`/projects/:id/editor`)
Assemble shots into a finished film:
- **Preview Player** — canvas-based video preview with play/pause and skip controls
- **Clip List** — drag-and-drop scene ordering with configurable transitions (cut, crossfade, fade-to-black, wipe, dissolve)
- **Text Overlays** — animated text with position, font, colour, and entrance/exit animations (fade, slide, zoom)
- **Timeline** — zoomable track view with clip and overlay lanes, red playhead synced to the preview
- **Export** — save the assembled project configuration as JSON

![Movie Editor](screenshots/movie-editor.png)

---

### AI Tools

#### Story Creator (`/story`)
Build multi-scene narrative animations. The Story Builder shows a summary (scenes, frames, duration, keyframes). Tabs for Advanced Settings, Live Preview, and Export & Share. One-click "Generate All Frames" sends the story to the pipeline.

![Story Creator](screenshots/story-creator.png)

#### Soundscape Creator (`/soundscape`)
Create audio-driven animations by describing a mood. Type a description or use speech input, pick "Relaxing" or "Energizing" presets, and generate.

![Soundscape Creator](screenshots/soundscape-creator.png)

#### Audio-Reactive Video Generator (`/audio-visualizer`)
Upload audio (MP3, WAV, OGG), set FPS and keyframe interval, then analyse frequency bands. Maps seven bands (sub-bass through brilliance) to Deforum parameters — translation, rotation, strength, noise, contrast, zoom, angle. Adjust sensitivity, preview Parseq-style keyframe schedules, export config or generate video directly.

![Audio Visualizer](screenshots/audio-visualizer.png)

---

### Tools

#### Preset Library (`/presets`)
Manage generation presets with Import/Export toolbar, summary stats, and searchable list with category filters (All, Camera Movements, Effects, Styles, General, Custom). Grid and list views, favorites.

![Preset Library](screenshots/preset-library.png)

#### Timeline (`/timeline`)
Studio timeline view for sequencing video clips. Upload or select media, arrange on the track, and manage content.

![Timeline](screenshots/timeline.png)

---

### Account

#### User Profile (`/profile`)
Profile tab for viewing/editing personal information. Password tab for changing credentials. Clean tabbed interface.

![Profile](screenshots/profile.png)

---

### Administration

#### Instance Management (`/admin/instances`)
Monitor and manage **Stable Diffusion Forge**, **ComfyUI**, and **Ollama** instances. Add new instances, view real-time status, toggle on/off, retry connections. Ollama supports LLM text generation alongside image/video backends.

![Admin Instances](screenshots/admin-instances.png)

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run dev server
npm run dev

# Run tests
npm run test:frontend

# Build
npm run build
```

## 🧪 Testing

```bash
# All frontend tests
npm run test:frontend

# Watch mode
npm run test:frontend:watch

# With coverage
npm run test:frontend:coverage

# Specific test file
npm run test:frontend -- src/path/to/test.spec.js
```

---

**Last Updated:** February 9, 2026
