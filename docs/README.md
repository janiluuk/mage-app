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

## 📄 Page Descriptions

### Audio-Reactive Video Generator (`/audio-visualizer`)
Upload an audio file (MP3, WAV, etc.) and visualise its waveform and frequency spectrum in real time. The page analyses the audio into seven frequency bands (sub-bass through brilliance) and lets you map each band to a Deforum animation parameter — translation, rotation, strength, noise, contrast, zoom, or angle. Adjust min/max ranges per mapping, preview the generated Parseq-style keyframe schedules, and export the full Deforum configuration as JSON or send it directly to the generation pipeline.

### Movie Editor (`/film-projects/:id/editor`)
A timeline-based editor for assembling film project shots into a finished sequence. Drag-and-drop clips to reorder scenes, pick transitions between clips (cut, crossfade, fade-to-black, wipe, dissolve) with adjustable durations, and add text overlays with customisable position, font, colour, and entrance/exit animations (fade, slide, zoom). The zoomable timeline shows clip and overlay tracks with a red playhead synced to the canvas preview. Export the assembled project configuration (clips, transitions, overlays) to JSON.

### Film Projects (`/film-projects`)
Create and manage film projects with hierarchical organisation: Projects → Sequences → Shots. Each level supports AI-assisted content generation — generate scripts at the project level, scenes at the sequence level, and individual shot videos at the shot level. Navigate to the Movie Editor from any project detail page.

### Preset Library (`/presets`)
Manage generation presets with full CRUD, categories, favorites, usage tracking, and JSON import/export. Search and filter presets, duplicate public presets to your collection, and track which presets are most popular.

### Instance Management (`/admin/instances`)
Monitor and manage generator instances (Stable Diffusion Forge, ComfyUI, Ollama). View real-time status, toggle instances on/off, create new instances, and configure connection URLs. Ollama instances support LLM text generation alongside the image/video backends.

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

**Last Updated:** February 8, 2026
