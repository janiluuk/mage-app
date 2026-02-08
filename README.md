# Mage AI Studio Frontend

Vue 3 + Vite frontend for Mage AI Studio. Focused on AI video workflows, a rich media browser, Story Creator, and Film Projects management, backed by the Mage API.

## Features

### 🎬 Video Studio
- **Media Library & Browser**: tagging, filtering, sortable grids, metadata, previews, and batch operations (download, reprocess, apply preset).
- **Upload**: drag-and-drop upload for vid2vid and deforum workflows with multi-file batch progress tracking.
- **Video Editor**: timeline-based editor with trim panel, start/end point editing, fragment splitting, and export.
- **Video Trimming**: integrated trim panel in the editor — set start/end by time or current playback position, preview trim, and apply.

### 🤖 AI Tools
- **Story Creator**: multi-scene narrative builder with live status, saved configs, and exports.
- **Soundscape Creator**: audio-driven animation with queue/status feedback.

### 🛠️ Tools
- **Preset Library**: manage generation presets with categories, favorites, usage tracking, and JSON import/export.
- **Audio Visualizer**: waveform and frequency visualization for audio files.
- **Timeline**: studio timeline view for sequencing.

### 🔧 Admin & Ops
- **Instance Management**: monitor and manage ComfyUI / Stable Diffusion Forge instances with real-time status.
- **Video Processing**: admin queue monitoring and job management.

## Setup

Requires Node.js 18+, a running Mage API backend, and optional Docker for containers.

```bash
# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Set VITE_API_URL and VITE_API_BASE_URL

# Start dev server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Framework**: Vue 3 + Vite, Vue Router, Vuex
- **UI**: PrimeVue + PrimeFlex + PrimeIcons
- **Media**: Vue Plyr, vue-audio-visual
- **Testing**: Vitest + Vue Test Utils
- **Backend helper**: Optional Node server in `backend/` for FFmpeg/ComfyUI audio streaming

## Testing

```bash
# Run all frontend tests
npm run test:frontend

# Watch mode
npm run test:frontend:watch

# With coverage
npm run test:frontend:coverage
```

### Test Structure

- **Unit tests**: `tests/unit/` — components, services, utilities
- **Integration tests**: `tests/integration/` — editor workflows, timeline operations

## Related Docs

### Feature Documentation
- [docs/README.md](docs/README.md) — Documentation hub and feature status
- [docs/BROWSER_FEATURE.md](docs/BROWSER_FEATURE.md) — Video Browser
- [docs/STORY_CREATOR.md](docs/STORY_CREATOR.md) — Story Creator
- [docs/AUDIO_ANIMATION_FEATURE.md](docs/AUDIO_ANIMATION_FEATURE.md) — Audio animation

### Admin & Ops
- [docs/ADMIN_PANEL_USER_GUIDE.md](docs/ADMIN_PANEL_USER_GUIDE.md) — Instance management guide
- [docs/ADMIN_PANEL_FEATURES.md](docs/ADMIN_PANEL_FEATURES.md) — Admin panel features

### Technical
- [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md) — System architecture
- [docs/PRIMEVUE_ENHANCEMENTS.md](docs/PRIMEVUE_ENHANCEMENTS.md) — PrimeVue component usage
- [docs/RELEASE_WORKFLOW.md](docs/RELEASE_WORKFLOW.md) — Automated release workflow
