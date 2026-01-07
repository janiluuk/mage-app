# Video Editing Features - Quick Reference Guide

## Overview
Quick reference for implementing the 8 new video editing features. See [VIDEO_EDITING_FEATURES_PLAN.md](./VIDEO_EDITING_FEATURES_PLAN.md) for full details.

---

## Feature Summary Table

| Feature | Priority | Complexity | Estimated Days | Dependencies |
|---------|----------|------------|----------------|--------------|
| Video Trimming | P0 | Medium | 4.5 | FFmpeg |
| Export Presets | P0 | Low | 3.5 | None |
| Batch Processing | P1 | High | 6.5 | Queue system |
| Preset Library | P1 | Medium | 4.5 | LocalStorage/API |
| Audio Visualization | P2 | Medium | 4.5 | Web Audio API |
| Real-time Preview | P2 | High | 6.0 | WebSocket, FFmpeg |
| Collaboration | P3 | High | 7.5 | WebSocket, Auth |
| Cloud Storage | P3 | High | 9.0 | S3-compatible API |

---

## Component Architecture

### Feature 1: Video Trimming
```
src/components/
  ├── video/
  │   ├── VideoTrimmer.vue          (NEW)
  │   └── TrimPreview.vue           (NEW)
  └── services/
      └── videoTrimService.js       (NEW)

Integration: VideoEditor.vue
```

### Feature 2: Batch Processing
```
src/components/
  ├── batch/
  │   ├── BatchProcessor.vue        (NEW)
  │   ├── BatchQueueItem.vue        (NEW)
  │   └── BatchSettingsPanel.vue    (NEW)
  └── services/
      └── batchProcessingService.js (NEW)

Route: /batch-upload
```

### Feature 3: Preset Library
```
src/components/
  ├── presets/
  │   ├── PresetLibrary.vue         (NEW)
  │   ├── PresetCard.vue            (NEW)
  │   ├── PresetDialog.vue          (NEW)
  │   └── PresetSelector.vue        (NEW)
  └── services/
      └── presetService.js          (NEW)

Route: /presets
```

### Feature 4: Export/Import
```
src/services/
  ├── exportService.js              (NEW)
  └── importService.js              (NEW)

src/components/
  ├── export/
  │   ├── ExportDialog.vue          (NEW)
  │   └── ImportDialog.vue          (NEW)

Integration: PresetLibrary, VideoEditor
```

### Feature 5: Audio Visualization
```
src/components/
  ├── AudioVisualizer.vue           (ENHANCE)
  └── audio/
      └── AudioVisualizationControls.vue (NEW)

src/services/
  └── audioAnalysisService.js       (NEW)

Integration: SoundscapeCreator
```

### Feature 6: Real-time Preview
```
src/components/
  ├── preview/
  │   ├── RealtimePreview.vue       (NEW)
  │   └── PreviewControls.vue       (NEW)
  └── services/
      └── realtimePreviewService.js (NEW)

Integration: VideoEditor, Deforum, Vid2Vid
```

### Feature 7: Collaboration
```
src/components/
  ├── collaboration/
  │   ├── ShareDialog.vue           (NEW)
  │   ├── SharedProjectView.vue     (NEW)
  │   └── CollaborationPanel.vue    (NEW)
  └── services/
      ├── sharingService.js         (NEW)
      └── collaborationService.js   (NEW)

Route: /shared/:share_id
```

### Feature 8: Cloud Storage
```
src/components/
  ├── cloud/
  │   ├── CloudStorageSettings.vue  (NEW)
  │   ├── CloudSyncPanel.vue        (NEW)
  │   └── CloudBrowser.vue          (NEW)
  └── services/
      ├── cloudStorageService.js    (NEW)
      ├── syncService.js            (NEW)
      └── adapters/
          ├── S3Adapter.js          (NEW)
          ├── GoogleCloudAdapter.js (NEW)
          └── AzureAdapter.js       (NEW)

Route: /cloud
```

---

## API Endpoints Summary

### Video Trimming
```
POST /v1/video-jobs
  + trim_start: number (seconds)
  + trim_end: number (seconds)
  + use_trimming: boolean
```

### Batch Processing
```
POST /v1/video-jobs/batch
  body: { files: [...], shared_settings: {...} }
  response: { batch_id, jobs: [...] }

GET /v1/batches/:batch_id
  response: { status, jobs: [...] }
```

### Presets
```
GET /v1/presets
POST /v1/presets
PUT /v1/presets/:id
DELETE /v1/presets/:id
```

### Real-time Preview
```
WebSocket: ws://api/preview
  → { type: "preview_request", job_id, settings, quality }
  ← { type: "preview_ready", job_id, preview_url, timestamp }
```

### Collaboration
```
POST /v1/shares
  body: { project_id, permission_level, expires_in_days }

GET /v1/shares/:share_id
DELETE /v1/shares/:share_id

POST /v1/shares/:share_id/collaborators
DELETE /v1/shares/:share_id/collaborators/:user_id
```

### Cloud Storage
```
POST /v1/cloud/upload
  body: { job_id, provider, path }

GET /v1/cloud/files
POST /v1/cloud/sync
DELETE /v1/cloud/files/:file_id
```

---

## Testing Checklist

### Per Feature Testing
- [ ] Unit tests for all services (>80% coverage)
- [ ] Component tests for all Vue components
- [ ] Integration tests for API interactions
- [ ] Manual testing with real data
- [ ] Performance testing with large files
- [ ] Security scan with CodeQL
- [ ] Browser compatibility testing

### Test Files Pattern
```
src/components/feature/Component.vue
src/components/feature/Component.spec.js

src/services/featureService.js
src/services/featureService.spec.js
```

---

## Development Workflow

### 1. Start Feature Implementation
```bash
git checkout -b feature/video-trimming
npm run dev
```

### 2. Create Components & Services
- Follow existing patterns in src/components/
- Use PrimeVue components
- Follow Vue 3 Composition API style

### 3. Write Tests
```bash
npm run test:frontend:watch
```

### 4. Manual Testing
```bash
npm run dev
# Open http://localhost:8080
# Test feature end-to-end
```

### 5. Run Full Test Suite
```bash
npm test
npm run lint
npm run build
```

### 6. Security Scan
- CodeQL will run automatically
- Fix any vulnerabilities

### 7. Commit & Push
```bash
git add .
git commit -m "feat: implement video trimming"
git push origin feature/video-trimming
```

---

## Code Style Guidelines

### Vue Component Template
```vue
<template>
  <div class="feature-container">
    <h2>Feature Title</h2>
    <!-- Use PrimeVue components -->
    <Button label="Action" @click="handleAction" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import { useFeatureService } from '@/services/featureService';

export default {
  name: 'FeatureComponent',
  components: { Button },
  props: {
    itemId: {
      type: Number,
      required: true
    }
  },
  emits: ['update', 'error'],
  setup(props, { emit }) {
    const { loadData } = useFeatureService();
    const data = ref(null);
    
    const handleAction = async () => {
      try {
        await loadData(props.itemId);
        emit('update', data.value);
      } catch (error) {
        emit('error', error);
      }
    };
    
    onMounted(() => {
      handleAction();
    });
    
    return {
      data,
      handleAction
    };
  }
};
</script>

<style scoped>
.feature-container {
  padding: 1rem;
}
</style>
```

### Service Pattern
```javascript
// src/services/featureService.js
import axios from 'axios';

export class FeatureService {
  constructor() {
    this.baseUrl = process.env.VUE_APP_API_URL;
  }
  
  async getData(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/feature/${id}`);
      return response.data;
    } catch (error) {
      console.error('FeatureService.getData error:', error);
      throw error;
    }
  }
  
  async saveData(data) {
    const response = await axios.post(`${this.baseUrl}/v1/feature`, data);
    return response.data;
  }
}

export const useFeatureService = () => {
  const service = new FeatureService();
  return {
    getData: (id) => service.getData(id),
    saveData: (data) => service.saveData(data)
  };
};
```

### Test Pattern
```javascript
// src/services/featureService.spec.js
import { describe, it, expect, vi } from 'vitest';
import { FeatureService } from './featureService';
import axios from 'axios';

vi.mock('axios');

describe('FeatureService', () => {
  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    axios.get.mockResolvedValue({ data: mockData });
    
    const service = new FeatureService();
    const result = await service.getData(1);
    
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/v1/feature/1')
    );
  });
  
  it('should handle errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    
    const service = new FeatureService();
    
    await expect(service.getData(1)).rejects.toThrow('Network error');
  });
});
```

---

## Dependencies to Add

### Phase 1-2 (Weeks 1-4)
```bash
# No new dependencies needed - use existing tools
```

### Phase 3 (Weeks 5-6)
```bash
npm install wavesurfer.js@^7.7.0
npm install tone@^14.7.77
```

### Phase 4 (Weeks 7-8)
```bash
npm install aws-sdk@^2.1500.0
npm install js-yaml@^4.1.0
```

---

## Environment Variables

Add to `.env`:
```bash
# WebSocket for real-time preview
VUE_APP_WS_URL=ws://localhost:3000

# Cloud storage (optional)
VUE_APP_CLOUD_ENABLED=false
VUE_APP_S3_BUCKET=mage-videos
VUE_APP_S3_REGION=us-east-1

# Collaboration (optional)
VUE_APP_SHARE_BASE_URL=https://mage.app/shared
```

---

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Preview generation | <500ms | <1000ms |
| Trim UI response | <100ms | <200ms |
| Preset load time | <50ms | <100ms |
| Batch queue update | <200ms | <500ms |
| Cloud upload speed | >5MB/s | >1MB/s |
| Page load time | <2s | <4s |

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | 14+ | ⚠️ Limited |
| Mobile Chrome | 90+ | ⚠️ Limited |

**Limited Features on Mobile:**
- Real-time preview (reduced quality)
- Batch processing (reduced batch size)
- Cloud upload (background not supported)

---

## Troubleshooting Common Issues

### Issue: Preview not generating
- Check WebSocket connection
- Verify backend is running
- Check browser console for errors
- Reduce preview quality setting

### Issue: Batch processing stuck
- Check API rate limits
- Verify backend queue is processing
- Check individual job statuses
- Restart stuck jobs individually

### Issue: Preset not saving
- Check localStorage quota (5-10MB limit)
- Clear old/unused presets
- Check browser privacy settings
- Verify preset data structure

### Issue: Cloud sync failing
- Verify credentials are valid
- Check network connectivity
- Verify storage quota not exceeded
- Check CORS settings on S3

---

## Release Checklist

### Before Release
- [ ] All tests passing (npm test)
- [ ] No linting errors (npm run lint)
- [ ] Build successful (npm run build)
- [ ] CodeQL scan clean
- [ ] Documentation updated
- [ ] Performance targets met
- [ ] Browser testing complete
- [ ] Security review complete

### Release Process
1. Create release branch
2. Update version in package.json
3. Generate changelog
4. Tag release
5. Deploy to staging
6. QA testing
7. Deploy to production
8. Monitor metrics
9. Announce release

---

## Support & Resources

### Documentation
- [Full Implementation Plan](./VIDEO_EDITING_FEATURES_PLAN.md)
- [Feature Overview](../FEATURE_OVERVIEW.md)
- [Main README](../README.md)

### Development
- Vue 3 Docs: https://vuejs.org/
- PrimeVue Docs: https://primevue.org/
- FFmpeg Docs: https://ffmpeg.org/documentation.html

### Testing
- Vitest Docs: https://vitest.dev/
- Vue Test Utils: https://test-utils.vuejs.org/

---

**Last Updated:** January 7, 2026  
**Version:** 1.0
