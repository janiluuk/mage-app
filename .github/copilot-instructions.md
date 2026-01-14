# Copilot Instructions for Mage AI Studio Frontend

## Project Overview

This is the **Mage AI Studio Frontend** - a Vue 3/Vite-based web application for AI-powered video editing, animation, and media processing. The app provides a comprehensive UI for creating animations, editing videos, generating audio, and managing media content.

**Backend Counterpart:** [janiluuk/mage-api](https://github.com/janiluuk/mage-api) - Use this for all processing, data storage, and backend operations.

## Technology Stack

### Frontend
- **Vue 3** (Composition API and Options API)
- **Vue Router** for routing
- **Vuex** for state management
- **Vite** for dev/build tooling
- **PrimeVue** UI component library with PrimeFlex and PrimeIcons
- **Vitest** for unit testing with Vue Test Utils
- **Playwright** for end-to-end testing

### Backend Helper (Optional)
- **Node.js** with Express for audio streaming
- **FFmpeg** for audio/video processing
- **ComfyUI** integration for AI workflows

### Key Dependencies
- `axios` for API requests
- `vue-plyr`, `vue-audio-visual` for media playback
- `@ffmpeg/ffmpeg` for client-side video processing
- `sanitize-html` for XSS prevention

## Project Structure

```
mage-app/
├── src/
│   ├── assets/           # Global styles, fonts, static media
│   ├── components/       # Reusable Vue components
│   ├── compositions/     # Vue 3 composables
│   ├── layout/           # Shell layout and navigation
│   ├── pages/            # Page components (main routes)
│   ├── views/            # View components (additional routes)
│   ├── router/           # Vue Router configuration
│   ├── services/         # API client helpers
│   ├── store/            # Vuex store modules
│   ├── middleware/       # Route middleware
│   ├── mixins/           # Vue mixins
│   ├── utils/            # Utility functions
│   ├── test/             # Test setup and helpers
│   └── main.js           # App bootstrap
├── backend/              # Optional audio streaming helper
│   ├── app.js            # Express app
│   ├── queueManager.js   # Job queue management
│   └── server.js         # Server entry point
├── e2e/                  # Playwright end-to-end tests
├── public/               # Static assets
└── docs/                 # Project documentation
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 8080)
npm run serve            # Preview production build

# Building
npm run build            # Build for production
npm run lint             # Run linter

# Testing
npm test                 # Run all tests (backend + frontend)
npm run test:backend     # Run backend tests (Node.js test runner)
npm run test:frontend    # Run frontend tests (Vitest)
npm run test:frontend:watch       # Run tests in watch mode
npm run test:frontend:ui          # Run tests with UI
npm run test:frontend:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright tests

# Backend Helper
npm run api              # Start audio streaming helper
```

## Coding Conventions

### Vue Components
- Use **Vue 3 Composition API** for new components
- Existing codebase uses **Options API** - maintain consistency within files
- Register PrimeVue components globally in `main.js`
- Use `@` alias for imports from `src/` directory
- Use PascalCase for component names

### Code Style
- Follow Vue 3 style guide: https://vuejs.org/style-guide/
- ESLint config: `plugin:vue/vue3-essential`, `eslint:recommended`, `@vue/prettier`
- Prettier formatting is disabled (see `.eslintrc.js`)
- Console logs allowed in development, warn in production
- Use single quotes for strings where possible

### API Integration
- All API calls go through services in `src/services/`
- Base API URL: `VITE_API_URL` environment variable
- API endpoints are under `/api/v1/` by default
- Use `requestService` or `ApiRequestService` for HTTP calls
- **Backend API (janiluuk/mage-api)** handles all data processing and storage
- JWT authentication with token storage in localStorage

### State Management
- Use Vuex for global state
- Store modules are in `src/store/`
- Prefer composables for component-level state management

### Routing
- Protected routes use `meta.requiresAuth = true`
- Auth pages (`/login`, `/signup`) use `meta.handleAuth = true`
- Router guards handle authentication redirects

### Security
- **Always** use `sanitize-html` for user-generated HTML content
- Never expose sensitive data or credentials in frontend code
- Use JWT tokens for authentication
- Validate and sanitize all user inputs

## Testing Requirements

### Write Tests for All Code Changes
**All code changes should include tests** - this is a core requirement for maintaining code quality.

### Frontend Tests (Vitest)
- Test files: `*.spec.js` or `*.test.js`
- Location: Co-located with source files
- Use `@vue/test-utils` for component testing
- Mock external dependencies with `vi.mock()`
- Test setup: `src/test/setup.js`

Example:
```javascript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('renders properly', () => {
    const wrapper = mount(MyComponent, {
      props: { msg: 'Hello' }
    });
    expect(wrapper.text()).toContain('Hello');
  });
});
```

### Backend Tests (Node.js)
- Test files: `*.test.js`
- Location: `backend/`
- Use Node.js built-in test runner
- Run with `npm run test:backend`

### E2E Tests (Playwright)
- Test files: `e2e/*.spec.ts`
- Run dev server first: `npm run dev`
- Install browsers: `npx playwright install`
- Run tests: `npm run test:e2e`

### Test Coverage
- Generate frontend coverage: `npm run test:frontend:coverage`
- Reports in `coverage/` directory (HTML, JSON, text)
- Excluded: `node_modules/`, `src/test/`, `**/*.spec.js`, `**/*.test.js`, `backend/**`

## API Endpoints (Backend: janiluuk/mage-api)

### Video Jobs
- `GET /api/v1/video-jobs` - List all jobs
- `GET /api/v1/video-jobs/:id` - Get specific job
- `POST /api/v1/video-jobs` - Create new job
- `DELETE /api/v1/video-jobs/:id` - Delete job
- `POST /api/v1/video-jobs/:id/cancel` - Cancel job
- `POST /api/v1/video-jobs/:id/add-soundtrack` - Add audio to video
- `POST /api/v1/video-jobs/:id/extend` - Extend video duration

### Upload & Processing
- `POST /upload` - Upload media files
- `POST /finalize` - Finalize Vid2Vid job
- `POST /preview` - Preview Vid2Vid job

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Backend Helper (Optional Audio Streaming)
- `GET /api/stream?text=&mood=` - Stream generated audio
- `GET /api/status` - Get processing status
- `GET /api/queue` - Get queue details
- `GET /api/config` - Get configuration

## Environment Variables

Required in `.env`:
- `VITE_API_URL` - Backend API base URL (e.g., `http://localhost:3000`)

Optional:
- `VITE_APP_URL` - Public hostname for sharing
- `VITE_FALLBACK_IMAGE_URL` - Fallback image URL
- `VITE_SAMPLE_PROCESSED_VIDEO_URL` - Sample video URL
- `VITE_STABLE_URL` - Fallback stable URL
- `VITE_IS_DEMO` - Demo mode flag (`1` enables)
- `VITE_APP_DEFORUM_WS_URL` - Deforum websocket URL

## Key Features to Understand

1. **Media Library** - Browse, search, upload, and organize videos
2. **Deforum Editor** - AI-powered animation sequences
3. **Vid2Vid Editor** - Video-to-video transformations
4. **Story Creator** - Multi-scene narrative builder
5. **Soundscape Creator** - AI audio generation
6. **Audio Animation** - Sync animations to audio
7. **Add Soundtrack** - Merge audio with videos
8. **Extend Video** - Frame interpolation for duration extension
9. **Job Queue Management** - Track processing status
10. **Authentication** - JWT-based user management

## Common Patterns

### API Service Pattern
```javascript
// src/services/example.service.js
import requestService from './request-service/ApiRequestService';

export default {
  async getData(id) {
    return await requestService.get(`/endpoint/${id}`);
  },
  
  async postData(data) {
    return await requestService.post('/endpoint', data);
  }
};
```

### Protected Route Pattern
```javascript
{
  path: '/protected',
  name: 'Protected',
  component: () => import('@/pages/ProtectedPage.vue'),
  meta: { requiresAuth: true }
}
```

### PrimeVue Component Usage
```vue
<template>
  <Button label="Click Me" icon="pi pi-check" @click="handleClick" />
  <Dialog v-model:visible="display" header="Title">
    Content here
  </Dialog>
</template>
```

## Important Notes

1. **Backend Processing**: All video/audio processing, data storage, and heavy computations should use the **janiluuk/mage-api** backend
2. **Minimal Frontend Processing**: Frontend handles UI, state management, and light validation only
3. **Authentication**: Always check authentication state before API calls
4. **Error Handling**: Provide user-friendly error messages using PrimeVue Toast
5. **Responsive Design**: Use PrimeFlex utilities for responsive layouts
6. **Testing**: Write tests for all new features and bug fixes
7. **Documentation**: Update relevant docs when adding features

## Docker Support

The project includes Docker setup for full stack development:
```bash
script/setup.sh --detach  # Start all services
docker compose up --scale ffmpeg-worker=6  # Scale workers
```

## Resources

- **Full Documentation**: [README.md](../README.md)
- **Feature Overview**: [FEATURE_OVERVIEW.md](../FEATURE_OVERVIEW.md)
- **Implementation Progress**: [IMPLEMENTATION_PROGRESS.md](../IMPLEMENTATION_PROGRESS.md)
- **Technical Architecture**: [docs/TECHNICAL_ARCHITECTURE.md](../docs/TECHNICAL_ARCHITECTURE.md)
- **Story Creator Docs**: [docs/STORY_CREATOR.md](../docs/STORY_CREATOR.md)

## When Contributing

1. Keep changes minimal and focused
2. Follow existing code patterns and conventions
3. Write tests for all changes
4. Update documentation if needed
5. Use services in `src/services/` for API calls
6. Keep PrimeVue/PrimeFlex patterns consistent
7. **Delegate to backend (janiluuk/mage-api)** for processing and data operations
