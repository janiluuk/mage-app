# Mage AI Studio Frontend

An opinionated Vue 3/Vite frontend for the Mage AI Studio experience. The app bundles media tooling, PrimeVue components, and audio/video workflows into a single dashboard that talks to a JSON API backend and an experimental FFmpeg/ComfyUI helper.

## Features

### Core Features
- **🔐 Authentication & Authorization**
  - JWT-based session handling with secure token storage
  - Protected routes with automatic redirect for unauthenticated users
  - Email verification and password reset workflows
  - Profile management with user settings and preferences

- **📚 Media Library**
  - Browse, search, and organize video content
  - Upload videos with drag-and-drop support
  - Metadata editing and tagging system
  - Thumbnail generation and preview support

- **📖 Story Creator** (NEW)
  - Multi-scene narrative builder for longer animations
  - Pre-built story templates (Hero's Journey, Three-Act Structure, Music Video, Documentary)
  - Live preview with real-time generation monitoring
  - Advanced scene management with keyframes and transitions
  - Batch processing for long sequences
  - Export to Deforum-compatible formats
  - See [Story Creator Documentation](docs/STORY_CREATOR.md) for details

### AI & Media Processing
- **🎬 Video Editing Tools**
  - Vid2Vid editor for video-to-video transformations
  - Deforum editor for AI-powered animation sequences
  - Real-time parameter adjustment and preview
  - Job queue management and status tracking
  - **Add soundtrack to videos** - Merge audio tracks with finished videos
  - **Extend video duration** - Use frame interpolation to smoothly extend videos

- **🎵 Audio Features**
  - **Soundscape Creator** - Generate audio from text prompts using AI
  - Real-time streaming via FFmpeg/ComfyUI pipeline
  - Audio visualization and playback controls
  - Queue management with processing status
  - **Audio animation** - Create animations synced to audio files (Audio Sync, BPM, Classic presets)

- **🤖 Backend Processing Queue**
  - Monitor job status via `/api/status` endpoint
  - View queue and history via `/api/queue` endpoint
  - Track active processing and backlog health
  - Error handling and retry mechanisms

### Development & UI
- **🎨 UI Kit Playground**
  - Comprehensive PrimeVue component examples
  - Interactive forms, tables, and dialogs
  - Charts, overlays, and menu demonstrations
  - Responsive design patterns and layouts

- **🛠 Developer Tools**
  - Webcam capture utilities
  - FFmpeg web-based video transcoding
  - Modal and video component experiments
  - Deforum UI configuration previews
  - Real-time Deforumation QT control panel

- **📱 Responsive Design**
  - Mobile-first layout with PrimeFlex
  - Comprehensive icon set via PrimeIcons
  - Dark mode support
  - Adaptive navigation and sidebar

## Tech Stack
- [Vue 3](https://vuejs.org/) with [Vue Router](https://router.vuejs.org/) and [Vuex](https://vuex.vuejs.org/)
- [Vite](https://vitejs.dev/) dev/build tooling
- [PrimeVue](https://primevue.org/) + [PrimeFlex](https://primeflex.org/) + [PrimeIcons](https://primefaces.org/primeicons/)
- [Vue Plyr](https://github.com/redxtech/vue-plyr) and [vue-audio-visual](https://github.com/staskobzar/vue-audio-visual) for media playback
- Optional Node helper in `backend/` for streaming audio via FFmpeg and ComfyUI

## Getting Started
### Prerequisites
- Node.js **18+** and npm
- A running API server compatible with the routes used in `src/services`
- (Optional) Docker if you prefer containerized development

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
3. Set the URLs in `.env`:
   - **Required:**
     - `VUE_APP_API_URL`: single source of truth for API base URL (e.g. `http://localhost:3000`). All API endpoints are derived from this.
   - **Optional:**
     - `VUE_APP_APP_URL`: canonical public hostname for sharing links (defaults to `VUE_APP_API_URL` if not set).
     - `VUE_APP_MAGE_API_URL`: profile/user service endpoint (e.g. `http://localhost:47860`).
     - `VUE_APP_FALLBACK_IMAGE_URL`: fallback image URL (defaults to `{API_URL}/images/notfound.jpg`).
     - `VUE_APP_SAMPLE_PROCESSED_VIDEO_URL`: sample processed video URL for the dev modal.
     - `STABLE_URL`: stable URL for the Studio iframe (fetched from backend `/api/config` endpoint at runtime).

### Running the app
- Development server with debug logging:
  ```bash
  npm run dev
  ```
- Production build preview with Vite dev server:
  ```bash
  npm run serve
  ```
- Build static assets for deployment:
  ```bash
  npm run build
  ```
- Start the experimental audio helper (requires ComfyUI/FFmpeg):
  ```bash
  npm run api
  ```
- Run all tests (backend + frontend):
  ```bash
  npm test
  ```
- Run only backend tests:
  ```bash
  npm run test:backend
  ```
- Run only frontend tests:
  ```bash
  npm run test:frontend
  ```
- Run frontend tests in watch mode:
  ```bash
  npm run test:frontend:watch
  ```
- Run frontend tests with UI:
  ```bash
  npm run test:frontend:ui
  ```
- Generate frontend test coverage report:
  ```bash
  npm run test:frontend:coverage
  ```

### Docker workflow
1. Ensure Docker is running.
2. Bootstrap the full stack (frontend, helper API, Mage API, MySQL, nginx, and FFmpeg workers):
   ```bash
   script/setup.sh --detach
   ```
   The script will copy `.env.docker.example` into `.env`/`.env.docker` on first run so the containers pick up matching hostnames
   inside the shared Docker network (`app.localhost`, `api.localhost`, `mage-api.localhost`, and `gateway.localhost`).
3. The `ffmpeg-worker` service can be scaled to handle concurrent audio streams:
   ```bash
   docker compose up --build --scale ffmpeg-worker=6
   ```

## Project Structure
```
mage-app/
├── src/
│   ├── assets/               # Global styles, fonts, and static media
│   ├── components/           # Reusable UI components
│   ├── layout/               # Shell layout and navigation
│   ├── pages/ & views/       # Route targets for dashboards, auth, media tools, etc.
│   ├── router/               # Route definitions and auth guards
│   ├── services/             # API client helpers
│   ├── store/                # Vuex store modules
│   └── main.js               # App bootstrap and PrimeVue registration
├── backend/                  # Optional FFmpeg/ComfyUI streaming helper
│   ├── app.js                # Express app exposing /api/stream, /api/status, /api/queue
│   ├── queueManager.js       # In-memory queue tracker for streaming requests
├── public/                   # Static assets served as-is
├── docker-compose.yml        # Container setup (frontend + workers)
└── README.md
```

## Backend helper API
- `GET /api/stream?text=`: stream generated AAC audio for the provided text prompt.
- `GET /api/status`: summarize current processing job, queue length, and recent history for quick health checks.
- `GET /api/queue`: list queued jobs, active processing entries, and the latest completed/failed work items.
- `GET /api/config`: returns instance configuration including the stable URL for the Studio iframe.

## UI additions
- `/story`: Story Creator for building longer, narrative-driven animations with live preview
- `/mage`: Mage helper dashboard that polls `/api/status` and `/api/queue` to surface backlog warnings.
- `/dev/deforumation-qt`: JavaScript port of Deforumation QT for real-time Deforum parameter steering.

## Testing
### Test Structure
The project includes comprehensive test coverage for both backend and frontend:

**Backend Tests** (Node.js built-in test runner)
- `backend/app.test.js` - API endpoint tests
- `backend/queueManager.test.js` - Queue management tests

**Frontend Tests** (Vitest + Vue Test Utils)
- `src/components/*.spec.js` - Component unit tests
- `src/router/*.spec.js` - Router configuration tests
- `src/utils/*.spec.js` - Utility function tests

**End-to-End Tests** (Playwright)
- `e2e/*.spec.ts` - Browser-based tests for critical UI flows

### Running end-to-end tests
1. Start the dev server in one terminal:
   ```bash
   npm run dev
   ```
2. Install Playwright browsers (first run only):
   ```bash
   npx playwright install
   ```
3. Run the tests in another terminal:
   ```bash
   npm run test:e2e
   ```

You can override the base URL with `PLAYWRIGHT_BASE_URL`, for example:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:8080 npm run test:e2e
```

### Writing Tests
Frontend tests use [Vitest](https://vitest.dev/) and [@vue/test-utils](https://test-utils.vuejs.org/):

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: { msg: 'Hello' }
    })
    expect(wrapper.text()).toContain('Hello')
  })
})
```

### Test Configuration
- **Vitest config**: `vitest.config.js` - test environment, setup files, coverage settings
- **Test setup**: `src/test/setup.js` - global mocks and configuration
- **CI/CD**: `.github/workflows/ci.yml` - automated testing on each PR

### Coverage
Run `npm run test:frontend:coverage` to generate a coverage report for frontend tests. Coverage reports are generated in the `coverage/` directory and include HTML, JSON, and text formats.

## Development Notes
- Auth-protected routes use `meta.requiresAuth`; unauthenticated users are redirected to `/login`.
- Auth pages (`/login`, `/signup`, password reset) are guarded with `meta.handleAuth` to redirect authenticated users to the library.
- PrimeVue components and directives are registered globally in `src/main.js` so they are available throughout the app.
- When using the audio streaming page (`/soundscape`), ensure the backend helper and ComfyUI workflow defined in `backend/audio-workflow.json` are running.
- **All code changes should include tests** - write unit tests for components, utilities, and services to maintain code quality.

## Planned Features

The following features are currently in the planning phase. See detailed implementation plans in the `docs/` directory:

- **Video trimming/clipping in editor** - Timeline-based video trimming with frame-accurate preview
- **Batch processing multiple files** - Process multiple videos simultaneously with shared settings
- **Preset library management** - Save, organize, and reuse favorite settings combinations
- **Export presets/settings** - Import/export settings in JSON/YAML format
- **Advanced audio visualization** - Waveform, spectrum, and spectrogram displays
- **Real-time preview during editing** - Immediate visual feedback as parameters change
- **Collaborative project sharing** - Share projects with view/edit permissions
- **Cloud storage integration** - S3-compatible cloud backup and sync

**Implementation Documentation:**
- [Video Editing Features Implementation Plan](docs/VIDEO_EDITING_FEATURES_PLAN.md) - Comprehensive 9-week implementation plan
- [Implementation Quick Reference](docs/IMPLEMENTATION_QUICK_REFERENCE.md) - Quick reference for developers
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - Detailed technical architecture and data flows

## Contributing
Feel free to open issues or pull requests with bug fixes or enhancements. Please keep new components consistent with the existing PrimeVue/PrimeFlex patterns and prefer the services in `src/services` when talking to the API.
