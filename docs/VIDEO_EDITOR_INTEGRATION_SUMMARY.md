# Video Editor Integration - Quick Summary

## What Needs to Change in mage-app

### 1. Router Changes (`src/router/index.js`)
**Add new route:**
```javascript
{
  path: "/editor/:type/:id",  // type: 'file' or 'job'
  name: "VideoEditor",
  meta: { requiresAuth: true },
  component: () => import("@/views/pages/video/VideoEditor.vue"),
}
```

### 2. Browser Context Menu (`src/views/pages/Browser.vue`)
**Update edit action (line ~1174):**
```javascript
case "edit":
  if (primaryVideo) {
    // Route to new video editor
    if (primaryVideo.file?.id) {
      router.push(`/editor/file/${primaryVideo.file.id}`);
    } else if (primaryVideo.job?.id) {
      router.push(`/editor/job/${primaryVideo.job.id}`);
    } else {
      // Fallback to old editor
      router.push(`/edit/${primaryVideo.generator || "vid2vid"}/${primaryVideo.id}`);
    }
  }
  break;
```

### 3. New Files to Create

#### Core Components (port from movie-maker)
- `src/components/videoeditor/Editor.vue` - Main editor
- `src/components/videoeditor/VideoPlayer.vue` - Video player
- `src/components/videoeditor/Timeline.vue` - Timeline
- `src/components/videoeditor/EditButtons.vue` - Edit controls
- `src/components/videoeditor/SeekBar.vue` - Seek bar
- `src/components/videoeditor/VolumeSlider.vue` - Volume
- `src/components/videoeditor/PlaybackRateSlider.vue` - Playback rate
- `src/components/videoeditor/VideoInfoFooter.vue` - Info footer
- `src/components/videoeditor/History.vue` - Undo/redo
- `src/components/videoeditor/ExportDialog.vue` - Export dialog
- `src/components/videoeditor/ExportStatus.vue` - Export progress

#### Services
- `src/services/videoeditor/VideoFileAdapter.js` - Adapts VideoFile for web
- `src/services/videoeditor/VideoFragmentAdapter.js` - Adapts VideoFragment
- `src/services/videoeditor/VideoLoader.js` - Loads videos from API
- `src/services/videoeditor/FFmpegService.js` - FFmpeg operations
- `src/services/videoeditor/ExportService.js` - Export functionality

#### Commands (Command Pattern)
- `src/services/videoeditor/commands/AddFragment.js`
- `src/services/videoeditor/commands/DeleteFragment.js`
- `src/services/videoeditor/commands/SplitFragment.js`
- `src/services/videoeditor/commands/SetStartPoint.js`
- `src/services/videoeditor/commands/SetEndPoint.js`
- `src/services/videoeditor/commands/SetVolume.js`
- `src/services/videoeditor/commands/SetPlaybackRate.js`
- `src/services/videoeditor/commands/MoveFragment.js`
- `src/services/videoeditor/commands/DuplicateFragment.js`

#### State Management
- `src/store/videoeditor.module.js` - Vuex module for editor state

#### Views
- `src/views/pages/video/VideoEditor.vue` - Main editor view

#### Styles
- `src/assets/videoeditor.css` - Editor-specific styles

### 4. Dependencies
**Already have:**
- `@ffmpeg/ffmpeg` ✓
- `fluent-ffmpeg` ✓
- `axios` ✓
- `vuex` ✓

**May need:**
- `mediainfo.js` (for video metadata)

### 5. Key Adaptations Needed

#### From Electron to Web:
- Replace file paths with API URLs
- Use HTML5 video elements instead of Electron file access
- Handle CORS and authentication
- Use browser APIs instead of Electron APIs

#### From Vue 2 to Vue 3:
- Update component syntax
- Update Vuex usage
- Update lifecycle hooks

#### From Vuetify to PrimeVue:
- Replace `v-btn` → `Button`
- Replace `v-slider` → `Slider`
- Replace `v-dialog` → `Dialog`
- Replace `v-snackbar` → `Toast`
- Replace `v-icon` → PrimeIcons

## Implementation Priority

### Phase 1: MVP (Minimum Viable Product)
1. ✅ Create VideoEditor view
2. ✅ Add route
3. ✅ Update context menu
4. ✅ Port Editor component
5. ✅ Port VideoPlayer component
6. ✅ Port Timeline component (basic)
7. ✅ Implement video loading from API
8. ✅ Basic trim/split functionality
9. ✅ Basic export functionality

### Phase 2: Full Features
1. All edit buttons
2. Volume/playback rate controls
3. Undo/redo
4. Export dialog with options
5. Error handling

### Phase 3: Polish
1. UI/UX improvements
2. Performance optimization
3. Testing
4. Documentation

## Quick Start Checklist

- [ ] Create VideoEditor.vue view
- [ ] Add route to router
- [ ] Update Browser.vue edit action
- [ ] Create videoeditor Vuex module
- [ ] Port Editor.vue component
- [ ] Port VideoPlayer.vue component
- [ ] Port Timeline.vue component
- [ ] Create VideoLoader service
- [ ] Create VideoFileAdapter
- [ ] Implement basic video loading
- [ ] Implement basic trimming
- [ ] Implement basic export
- [ ] Test with real videos

## Estimated Effort

- **Phase 1 (MVP)**: 2-3 weeks
- **Phase 2 (Full Features)**: 2-3 weeks
- **Phase 3 (Polish)**: 1-2 weeks

**Total**: ~6-8 weeks for full integration


