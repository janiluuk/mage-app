# Mage AI Studio Frontend

Vue 3 + Vite frontend for Mage AI Studio. Focused on AI video workflows, a rich media browser, Story Creator, and Film Projects management, backed by the Mage API.

## Practical Overview

- Media Library & Browser: tagging, filtering, sortable grids, metadata, and previews.
- Story Creator: multi-scene builder with live status, saved configs, and exports.
- Film Projects: manage projects, sequences, and shots with AI script/scene generation.
- Audio Tools: Soundscape Creator with queue/status feedback.
- Admin & Ops: instance management, processing queues, and diagnostics.

## Setup (Summary)

- Requires Node.js 18+, a running Mage API backend, and optional Docker for containers.
- Configure VITE_API_URL and VITE_API_BASE_URL in .env.
- Start the dev server with the standard Vite workflow.

## Tech Stack

- Vue 3 + Vite, Vue Router, Vuex
- PrimeVue + PrimeFlex + PrimeIcons
- Media playback helpers (Vue Plyr, vue-audio-visual)
- Optional Node helper in backend/ for FFmpeg/ComfyUI audio streaming

## Related Docs

### User Guides
- [Admin Panel User Guide](docs/ADMIN_PANEL_USER_GUIDE.md) - Complete guide for instance management features
- [Screenshot Guide](docs/SCREENSHOT_GUIDE.md) - How to capture screenshots of admin features

### Technical Documentation
- docs/STORY_CREATOR.md
- docs/PRIMEVUE_ENHANCEMENTS.md
- ADMIN_PANEL_IMPLEMENTATION.md
- FILM_PROJECT_API_NAMESPACE.md
