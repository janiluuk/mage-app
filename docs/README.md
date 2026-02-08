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
| [PLANNING_COMPLETE_SUMMARY.txt](./PLANNING_COMPLETE_SUMMARY.txt) | Original planning summary with implementation status |

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

### Phase 3: Visual Enhancements — 🔧 In Progress
| Feature | Status | Components |
|---------|--------|------------|
| **Audio Visualizer** | 🔧 Partial | `AudioVisualizer.vue` component + controls; page view pending |
| **Real-time Preview** | 🔧 Partial | `realtimePreviewService.js`; UI integration pending |

### Not Started
| Feature | Status | Notes |
|---------|--------|-------|
| **Cloud Storage** | ⬜ Planned | P3 — low priority, not yet scheduled |

## 🏗️ Architecture Overview

```
Frontend (Vue 3 + Vite)
  ├── Views & Pages
  │   ├── Browser.vue        — Media browser with batch actions
  │   ├── Upload.vue          — Multi-file upload with batch progress
  │   ├── Presets.vue          — Preset library management
  │   └── VideoEditor.vue      — Editor with trim panel
  │
  ├── Components
  │   ├── videoeditor/VideoTrimPanel.vue  — Trim start/end with preview
  │   ├── batch/BatchProcessor.vue       — Batch queue + progress widget
  │   ├── audio/AudioVisualizer.vue      — Audio waveform visualizer
  │   └── browser/BrowserContextMenu.vue — Context menu with batch ops
  │
  └── Services
      ├── videoTrimService.js       — Time formatting, validation, trim params
      ├── batchProcessingService.js — Batch creation, status tracking
      ├── presetService.js          — Preset CRUD API calls
      └── realtimePreviewService.js — Preview debouncing + WebSocket

Backend (Laravel 10 API)
  ├── Batch Processing API      — /api/v1/batches/*
  ├── Preset Management API     — /api/v1/presets/*
  ├── Video Trim API            — /api/v1/video-jobs/trim
  └── Story Sharing API         — /api/story/share
```

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
