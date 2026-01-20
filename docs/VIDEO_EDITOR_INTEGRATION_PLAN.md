# Video Editor Integration Plan

## Overview
This document outlines the plan to integrate the movie-maker video editor into mage-app. When users click "Edit" on a video in the browser, they will be taken to a full-featured video editor integrated with their user files.

## Current State

### mage-app
- Vue 3 application with PrimeVue UI
- Video browser/library with context menu
- "Edit" action currently routes to `/edit/${generator}/${id}` (vid2vid/deforum editors)
- Videos stored via API with properties: `id`, `fullPath`, `url`, `previewUrl`, `filename`
- Uses Vuex for state management
- File service API for file operations

### movie-maker
- Vue 2 Electron application with Vuetify UI
- Full video editor with timeline, player, fragments
- Uses ffmpeg for video processing
- Works with local file paths
- Vuex store with video fragments, timeline, commands

## Integration Strategy

### Phase 1: Component Porting & Adaptation

#### 1.1 Port movie-maker components to Vue 3
**Location**: `src/components/videoeditor/` (already exists but needs updating)

**Components to port/update**:
- `Editor.vue` - Main editor container
- `VideoPlayer.vue` - Video playback component
- `Timeline.vue` - Timeline with fragments
- `EditButtons.vue` - Edit action buttons
- `SeekBar.vue` - Seek control
- `VolumeSlider.vue` - Volume control
- `PlaybackRateSlider.vue` - Playback rate control
- `VideoInfoFooter.vue` - Video info display
- `History.vue` - Undo/redo history
- `ExportDialog.vue` - Export options
- `ExportStatus.vue` - Export progress
- `FilterGraph.vue` - Filter visualization
- `CustomHeader.vue` - Editor header
- `CustomDialog.vue` - Dialog component
- `CustomPrompt.vue` - Prompt component

**Changes needed**:
- Convert Vue 2 syntax to Vue 3 (Composition API or Options API)
- Replace Vuetify components with PrimeVue equivalents
- Update imports and dependencies
- Remove Electron-specific code (file system access)

#### 1.2 Create Video File Adapter
**Location**: `src/services/videoeditor/VideoFileAdapter.js`

**Purpose**: Adapt movie-maker's VideoFile class to work with mage-app's API-based file system

**Key changes**:
- Replace local file paths with API URLs
- Load video metadata from API instead of ffprobe
- Handle video loading via fetch/axios
- Support CORS and authentication headers

#### 1.3 Create Video Fragment Adapter
**Location**: `src/services/videoeditor/VideoFragmentAdapter.js`

**Purpose**: Adapt movie-maker's VideoFragment to work with web-based video elements

**Key changes**:
- Use HTML5 video elements instead of Electron file paths
- Handle video URL loading and CORS
- Adapt fragment operations for web environment

### Phase 2: State Management

#### 2.1 Create Video Editor Vuex Module
**Location**: `src/store/videoeditor.module.js`

**State structure** (based on movie-maker store):
```javascript
{
  timeline: [], // Array of video fragments
  activeFragment: null,
  videoFiles: [], // Array of loaded video files
  player: {
    progress: 0,
    playing: false,
    volume: 1,
    widthPercent: 0.5
  },
  configTimeline: {
    minFragmentWidth: 90,
    widthPerSecond: 3.5
  },
  export: {
    showDialog: false,
    fps: '',
    bitrate: '',
    outputPath: '',
    filters: []
  },
  exportStatus: {
    show: false,
    progress: 0,
    done: false,
    error: ''
  }
}
```

**Actions needed**:
- `importVideo(videoId)` - Load video from API
- `addFragment(fragment)` - Add fragment to timeline
- `removeFragment(fragment)` - Remove fragment
- `splitFragment(fragment, time)` - Split fragment
- `setStartPoint(fragment, time)` - Set fragment start
- `setEndPoint(fragment, time)` - Set fragment end
- `setVolume(fragment, volume)` - Set fragment volume
- `setPlaybackRate(fragment, rate)` - Set playback rate
- `exportVideo(options)` - Export edited video
- `undo()` / `redo()` - Undo/redo operations

#### 2.2 Command Pattern Implementation
**Location**: `src/services/videoeditor/commands/`

**Commands to implement**:
- `AddFragment.js`
- `DeleteFragment.js`
- `SplitFragment.js`
- `SetStartPoint.js`
- `SetEndPoint.js`
- `SetVolume.js`
- `SetPlaybackRate.js`
- `MoveFragment.js`
- `DuplicateFragment.js`

### Phase 3: Video Loading & API Integration

#### 3.1 Video Loading Service
**Location**: `src/services/videoeditor/VideoLoader.js`

**Functionality**:
- Load video from mage-app API using video ID
- Fetch video metadata (duration, fps, resolution, etc.)
- Create video element with proper CORS headers
- Handle authentication tokens
- Support both video jobs and file-based videos

**API Integration**:
```javascript
// For video jobs
GET /api/v1/video-jobs/:id

// For files
GET /api/files/:id

// Video URL access
// Use fullPath or previewUrl from video object
```

#### 3.2 FFmpeg Integration
**Location**: `src/services/videoeditor/FFmpegService.js`

**Options**:
1. **Client-side**: Use `@ffmpeg/ffmpeg` (already in dependencies)
   - Pros: No server load, works offline
   - Cons: Large bundle size, slower processing
   
2. **Server-side**: Use backend API endpoint
   - Pros: Faster, no client bundle size
   - Cons: Requires backend changes, server load

**Recommendation**: Start with client-side for MVP, add server-side option later

**FFmpeg operations needed**:
- Video trimming/cutting
- Fragment concatenation
- Volume adjustment
- Playback rate change
- Export final video

### Phase 4: Routing & Navigation

#### 4.1 Add Editor Route
**Location**: `src/router/index.js`

**New route**:
```javascript
{
  path: "/editor/:videoId",
  name: "VideoEditor",
  meta: { requiresAuth: true },
  component: () => import("@/views/pages/video/VideoEditor.vue"),
}
```

#### 4.2 Update Context Menu Action
**Location**: `src/views/pages/Browser.vue`

**Change edit action**:
```javascript
case "edit":
  if (primaryVideo) {
    // Check if it's a file or video job
    if (primaryVideo.file?.id) {
      router.push(`/editor/file/${primaryVideo.file.id}`);
    } else if (primaryVideo.job?.id) {
      router.push(`/editor/job/${primaryVideo.job.id}`);
    }
  }
  break;
```

### Phase 5: Video Editor View

#### 5.1 Create Main Editor View
**Location**: `src/views/pages/video/VideoEditor.vue`

**Structure**:
- Load video on mount using route parameter
- Display Editor component
- Handle video loading states
- Handle export and save operations
- Navigation back to browser

**Props/Route params**:
- `videoId` - ID of video to edit
- `type` - 'file' or 'job' (optional, can be inferred)

### Phase 6: Export & Save Integration

#### 6.1 Export Service
**Location**: `src/services/videoeditor/ExportService.js`

**Functionality**:
- Generate edited video using FFmpeg
- Upload exported video to mage-app API
- Create new file entry or update existing
- Show progress during export
- Handle errors gracefully

**API Integration**:
```javascript
// Upload exported video
POST /api/files
// With FormData containing the video file
```

#### 6.2 Save Project (Optional)
**Location**: `src/services/videoeditor/ProjectService.js`

**Functionality**:
- Save editor state (timeline, fragments) as project file
- Load saved projects
- Store in user's account

**API Integration**:
```javascript
// Save project
POST /api/projects
// Load project
GET /api/projects/:id
```

### Phase 7: UI/UX Adaptations

#### 7.1 Replace Vuetify with PrimeVue
**Components mapping**:
- `v-btn` → `Button`
- `v-slider` → `Slider`
- `v-dialog` → `Dialog`
- `v-snackbar` → `Toast`
- `v-icon` → PrimeIcons or custom icons
- `v-app-bar` → Custom header component
- `v-footer` → Custom footer component

#### 7.2 Styling
**Location**: `src/assets/videoeditor.css`

**Tasks**:
- Port movie-maker styles to work with PrimeVue
- Ensure responsive design
- Match mage-app theme
- Handle dark/light mode

### Phase 8: Testing & Refinement

#### 8.1 Unit Tests
- Test video loading
- Test fragment operations
- Test export functionality
- Test undo/redo

#### 8.2 Integration Tests
- Test full edit workflow
- Test API integration
- Test error handling

#### 8.3 Performance Optimization
- Lazy load video editor components
- Optimize video element management
- Implement virtual scrolling for timeline if needed
- Cache video metadata

## Implementation Order

### Phase 1 (Foundation)
1. Create VideoFileAdapter
2. Create VideoFragmentAdapter
3. Create basic Vuex module structure
4. Port Editor.vue component

### Phase 2 (Core Functionality)
1. Port VideoPlayer component
2. Port Timeline component
3. Implement command pattern
4. Add undo/redo functionality

### Phase 3 (Integration)
1. Create VideoLoader service
2. Integrate with mage-app API
3. Add routing
4. Update context menu

### Phase 4 (Polish)
1. Port remaining UI components
2. Replace Vuetify with PrimeVue
3. Add export functionality
4. Add error handling

### Phase 5 (Testing)
1. Unit tests
2. Integration tests
3. Performance optimization
4. Bug fixes

## Dependencies to Add/Update

### Already in mage-app:
- `@ffmpeg/ffmpeg` ✓
- `fluent-ffmpeg` ✓
- `axios` ✓
- `vuex` ✓

### May need to add:
- `mediainfo.js` (for video metadata parsing)
- Additional PrimeVue components if needed

## File Structure

```
src/
├── components/
│   └── videoeditor/
│       ├── Editor.vue
│       ├── VideoPlayer.vue
│       ├── Timeline.vue
│       ├── EditButtons.vue
│       ├── SeekBar.vue
│       ├── VolumeSlider.vue
│       ├── PlaybackRateSlider.vue
│       ├── VideoInfoFooter.vue
│       ├── History.vue
│       ├── ExportDialog.vue
│       ├── ExportStatus.vue
│       ├── FilterGraph.vue
│       ├── CustomHeader.vue
│       ├── CustomDialog.vue
│       └── CustomPrompt.vue
├── services/
│   └── videoeditor/
│       ├── VideoFileAdapter.js
│       ├── VideoFragmentAdapter.js
│       ├── VideoLoader.js
│       ├── FFmpegService.js
│       ├── ExportService.js
│       ├── ProjectService.js
│       └── commands/
│           ├── AddFragment.js
│           ├── DeleteFragment.js
│           ├── SplitFragment.js
│           ├── SetStartPoint.js
│           ├── SetEndPoint.js
│           ├── SetVolume.js
│           ├── SetPlaybackRate.js
│           ├── MoveFragment.js
│           └── DuplicateFragment.js
├── store/
│   └── videoeditor.module.js
├── views/
│   └── pages/
│       └── video/
│           └── VideoEditor.vue
└── assets/
    └── videoeditor.css
```

## Key Challenges & Solutions

### Challenge 1: File System Access
**Problem**: movie-maker uses Electron's file system, mage-app uses API
**Solution**: Create adapter layer that translates API calls to file operations

### Challenge 2: Video Element Management
**Problem**: movie-maker manages video elements directly, web needs different approach
**Solution**: Use HTML5 video elements with proper CORS and authentication

### Challenge 3: FFmpeg in Browser
**Problem**: FFmpeg is heavy and may be slow in browser
**Solution**: 
- Use `@ffmpeg/ffmpeg` for client-side processing
- Consider server-side option for large videos
- Show progress indicators

### Challenge 4: Vue 2 to Vue 3 Migration
**Problem**: Syntax and API differences
**Solution**: 
- Use Composition API where beneficial
- Keep Options API for complex components initially
- Gradual migration

### Challenge 5: UI Framework Differences
**Problem**: Vuetify vs PrimeVue
**Solution**: 
- Map components systematically
- Create wrapper components if needed
- Maintain similar UX

## Success Criteria

1. ✅ User can click "Edit" on any video in browser
2. ✅ Video editor opens with video loaded
3. ✅ User can trim, split, and edit video fragments
4. ✅ User can adjust volume and playback rate
5. ✅ User can export edited video
6. ✅ Exported video is saved to user's files
7. ✅ Undo/redo works correctly
8. ✅ Editor integrates seamlessly with mage-app UI
9. ✅ Performance is acceptable (< 3s load time)
10. ✅ Works with both video jobs and file-based videos

## Future Enhancements

1. **Multi-video editing**: Edit multiple videos in one timeline
2. **Transitions**: Add transitions between fragments
3. **Filters**: Apply video filters/effects
4. **Audio tracks**: Add separate audio tracks
5. **Titles/Text**: Add text overlays
6. **Collaboration**: Share projects with other users
7. **Templates**: Pre-made editing templates
8. **Cloud processing**: Server-side video processing for large files

## Notes

- Start with MVP: basic trimming and export
- Iterate based on user feedback
- Consider performance implications of client-side FFmpeg
- Maintain backward compatibility with existing video editors
- Document API changes needed on backend (if any)


