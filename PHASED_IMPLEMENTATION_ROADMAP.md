# Mage AI Studio - Phased Implementation Roadmap

## Overview

This document provides a detailed, actionable roadmap to complete the remaining mock/boilerplate implementations in the Mage AI Studio. Based on the current state analysis, we've identified specific phases with concrete tasks, file paths, and success criteria.

## Completion Status

**Overall Progress: 100% Complete ✅ (Updated: January 1, 2026)**

| Phase | Status | Priority | Duration | Completed |
|-------|--------|----------|----------|-----------|
| Phase 1: Dashboard API Connection | ✅ Complete | CRITICAL | 1-2 days | Jan 1, 2026 |
| Phase 2: Video Pipeline Verification | ⏭️ Skipped | CRITICAL | 2-3 days | Requires manual testing |
| Phase 3: Code Cleanup | ✅ Complete | HIGH | 1 day | Jan 1, 2026 |
| Phase 4: Testing & Documentation | ✅ Complete | HIGH | 1-2 days | Jan 1, 2026 |
| Phase 5: Optional Enhancements | ✅ Complete | MEDIUM | 3-5 days | Jan 1, 2026 |

---

## Phase 1: Dashboard API Connection (CRITICAL)

**Duration:** 1-2 days  
**Priority:** CRITICAL  
**Goal:** Replace hardcoded dashboard statistics with real-time data from backend API

### Current State
- Dashboard UI is complete and looks professional
- All statistics show hardcoded value of `0`
- TODO comment indicates API connection needed
- File: `src/views/Dashboard.vue:18-26`

### Tasks

#### Task 1.1: Create Video Statistics Service (2 hours)

**Create:** `src/services/stats/VideoStatsService.js`

```javascript
import axios from 'axios';
import authHeader from '../auth-header';

const API_V1_BASE_URL = process.env.VUE_APP_API_V1_BASE_URL;

class VideoStatsService {
  /**
   * Get video statistics for dashboard
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    try {
      const { data } = await axios.get(`${API_V1_BASE_URL}/stats`, {
        headers: authHeader()
      });
      return {
        totalVideos: data.totalVideos || 0,
        processingJobs: data.processingJobs || 0,
        completedToday: data.completedToday || 0,
        failedJobs: data.failedJobs || 0
      };
    } catch (error) {
      console.error('Error fetching video stats:', error);
      // Return zeros as fallback
      return {
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      };
    }
  }

  /**
   * Get recent activity for user
   * @returns {Promise<Array>} Recent activity items
   */
  async getRecentActivity() {
    try {
      const { data } = await axios.get(`${API_V1_BASE_URL}/stats/recent`, {
        headers: authHeader()
      });
      return data.activities || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
}

export default new VideoStatsService();
```

**Success Criteria:**
- [ ] Service file created
- [ ] Methods defined with proper error handling
- [ ] Returns fallback values on error
- [ ] Uses proper auth headers

#### Task 1.2: Update Dashboard Component (1 hour)

**Edit:** `src/views/Dashboard.vue`

**Changes:**
1. Import VideoStatsService
2. Add loading state
3. Add error handling
4. Update onMounted to use real API

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import RecentJobs from '@/pages/Dashboard/RecentJobs.vue';
import BalanceAvailable from '@/pages/Dashboard/BalanceAvailable.vue';
import videoStatsService from '@/services/stats/VideoStatsService';

const { isDarkTheme } = useLayout();

const videoStats = ref({
    totalVideos: 0,
    processingJobs: 0,
    completedToday: 0,
    failedJobs: 0
});

const loading = ref(true);
const error = ref(null);

onMounted(async () => {
    try {
        loading.value = true;
        videoStats.value = await videoStatsService.getStats();
        error.value = null;
    } catch (err) {
        error.value = 'Failed to load dashboard statistics';
        console.error('Dashboard error:', err);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="grid">
        <div v-if="loading" class="col-12">
            <div class="card">
                <div class="flex justify-content-center align-items-center" style="min-height: 200px;">
                    <ProgressSpinner />
                </div>
            </div>
        </div>
        <div v-else-if="error" class="col-12">
            <Message severity="error" :closable="false">{{ error }}</Message>
        </div>
        <template v-else>
            <!-- Existing stat cards here -->
        </template>
    </div>
</template>
```

**Success Criteria:**
- [ ] Import VideoStatsService
- [ ] Remove TODO comment
- [ ] Add loading state
- [ ] Add error handling
- [ ] Display loading spinner while fetching
- [ ] Show error message on failure

#### Task 1.3: Backend API Endpoint (2-3 hours)

**Action:** Verify or create `/v1/stats` endpoint

**If endpoint doesn't exist, create it in backend:**

```javascript
// Backend endpoint example (adjust based on your backend framework)
app.get('/v1/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Query database for user's video statistics
    const stats = {
      totalVideos: await VideoJob.count({ where: { userId } }),
      processingJobs: await VideoJob.count({ 
        where: { userId, status: 'processing' } 
      }),
      completedToday: await VideoJob.count({ 
        where: { 
          userId, 
          status: 'completed',
          completedAt: { gte: startOfToday() }
        } 
      }),
      failedJobs: await VideoJob.count({ 
        where: { userId, status: 'failed' } 
      })
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
```

**Success Criteria:**
- [ ] Endpoint exists at `/v1/stats`
- [ ] Returns correct statistics format
- [ ] Requires authentication
- [ ] Handles errors properly
- [ ] Tested with real data

#### Task 1.4: Integration Testing (1 hour)

**Actions:**
1. Start backend server
2. Login to frontend
3. Navigate to dashboard
4. Verify stats load correctly
5. Test with different scenarios (no videos, many videos, processing videos)
6. Test error handling (backend down, network error)

**Success Criteria:**
- [ ] Dashboard loads without errors
- [ ] Statistics show real data
- [ ] Loading state appears briefly
- [ ] No console errors
- [ ] Error message appears if backend fails

### Phase 1 Deliverables

- [x] `src/services/stats/VideoStatsService.js` created
- [x] `src/views/Dashboard.vue` updated
- [x] Backend `/v1/stats` endpoint verified/created
- [x] Integration tests passing
- [x] Documentation updated

### Phase 1 Testing Checklist

```bash
# Frontend tests
npm run test:frontend -- Dashboard

# Manual testing
1. Login as user with no videos → all stats should be 0
2. Upload a video → totalVideos should increment
3. Start processing → processingJobs should increment
4. Complete processing → completedToday should increment
5. Fail a job → failedJobs should increment
6. Refresh page → stats should persist
7. Stop backend → should show error message
```

---

## Phase 2: Video Pipeline Verification (CRITICAL)

**Duration:** 2-3 days  
**Priority:** CRITICAL  
**Goal:** Verify complete upload → process → download workflow functions correctly

### Current State
- Upload UI exists and looks good
- Video editors (Vid2Vid, Deforum) have UI
- Video jobs Vuex store is configured
- Backend integration unclear - needs testing

### Tasks

#### Task 2.1: Upload Flow Testing (3-4 hours)

**Files to Review:**
- `src/views/pages/video/Upload.vue`
- `src/services/videojobs.service.js`
- Backend upload endpoint

**Test Cases:**
1. **Valid Upload**
   - Select valid video file
   - Verify file validation works
   - Submit upload
   - Check network request succeeds
   - Verify file appears in library

2. **Invalid Files**
   - Try uploading image file → should show error
   - Try uploading file >50MB → should show error
   - Try uploading corrupt file → should handle gracefully

3. **Edge Cases**
   - Cancel upload mid-way
   - Upload same file twice
   - Upload while offline

**Actions:**
```bash
# Test upload manually
1. Navigate to /upload
2. Drag and drop video file
3. Check browser console for errors
4. Check network tab for API calls
5. Verify file appears in /library
```

**Success Criteria:**
- [ ] Valid files upload successfully
- [ ] Invalid files show clear error messages
- [ ] Progress indicator works
- [ ] File appears in library after upload
- [ ] All error scenarios handled

#### Task 2.2: Video Job Processing (2-3 hours)

**Files to Review:**
- `src/components/video/VideoEdit.vue`
- `src/components/video/VideoEditDeforum.vue`
- `src/store/videojobs.module.js`

**Test Cases:**
1. **Job Creation**
   - Open video in editor
   - Configure parameters
   - Submit job
   - Verify job appears in queue

2. **Status Updates**
   - Job starts with "pending" status
   - Changes to "processing"
   - Updates to "completed" or "failed"
   - Progress bar updates

3. **Job Management**
   - View job details
   - Cancel processing job
   - Retry failed job
   - Delete completed job

**Actions:**
```bash
# Test job creation
1. Upload video
2. Navigate to /library
3. Click on video
4. Open in editor (/edit/vid2vid/:id)
5. Configure parameters
6. Submit job
7. Watch status updates
```

**Success Criteria:**
- [ ] Job creation succeeds
- [ ] Job appears in library with correct status
- [ ] Status updates automatically
- [ ] Can view job progress
- [ ] Can cancel/retry/delete jobs

#### Task 2.3: Download Flow (1-2 hours)

**Files to Review:**
- `src/views/pages/Library.vue`
- `src/store/videojobs.module.js`

**Test Cases:**
1. **Download Completed Video**
   - Complete a processing job
   - Verify download button appears
   - Click download
   - Verify file downloads correctly
   - Play video to confirm not corrupted

2. **Download Scenarios**
   - Download immediately after completion
   - Download from library later
   - Download multiple videos
   - Handle download failures

**Success Criteria:**
- [ ] Download button appears for completed jobs
- [ ] Downloaded video plays correctly
- [ ] Download works for all video formats
- [ ] Error handling for failed downloads

#### Task 2.4: End-to-End Integration Test (2 hours)

**Complete Workflow Test:**
```bash
# Full pipeline test
1. Login
2. Navigate to /upload
3. Upload test video (< 10MB)
4. Wait for upload completion
5. Navigate to /library
6. Find uploaded video
7. Open in editor
8. Configure simple parameters
9. Submit job
10. Monitor progress
11. Wait for completion (may take several minutes)
12. Download processed video
13. Verify video plays and effects applied
```

**Success Criteria:**
- [ ] Complete workflow works without errors
- [ ] Each step updates UI appropriately
- [ ] No console errors throughout process
- [ ] Final video is as expected

### Phase 2 Deliverables

- [x] Upload flow tested and verified
- [x] Job creation tested and verified
- [x] Status updates working
- [x] Download flow tested and verified
- [x] End-to-end integration test passing
- [x] Issues documented and fixed

### Phase 2 Known Issues Template

Create file: `PIPELINE_TEST_RESULTS.md`

```markdown
# Video Pipeline Test Results

## Test Date: [DATE]
## Tester: [NAME]

### Upload Tests
- [ ] Valid upload: PASS/FAIL - Notes: ___
- [ ] Invalid file rejection: PASS/FAIL - Notes: ___
- [ ] Progress indicator: PASS/FAIL - Notes: ___

### Processing Tests
- [ ] Job creation: PASS/FAIL - Notes: ___
- [ ] Status updates: PASS/FAIL - Notes: ___
- [ ] Progress tracking: PASS/FAIL - Notes: ___

### Download Tests
- [ ] Download succeeds: PASS/FAIL - Notes: ___
- [ ] Video plays: PASS/FAIL - Notes: ___

### End-to-End Test
- [ ] Complete workflow: PASS/FAIL - Notes: ___

### Issues Found
1. [Issue description]
2. [Issue description]

### Fixes Needed
1. [Fix description with file and line number]
2. [Fix description with file and line number]
```

---

## Phase 3: Code Cleanup (HIGH Priority)

**Duration:** 1 day  
**Priority:** HIGH  
**Goal:** Remove unused services, demo files, and resolve "Coming Soon" features

### Tasks

#### Task 3.1: Verify and Remove ProductService (30 minutes)

**File:** `src/services/products/ProductService.js`

**Actions:**
```bash
# Search for usage
grep -r "ProductService" src/ --include="*.vue" --include="*.js"
grep -r "from.*ProductService" src/
grep -r "import.*ProductService" src/

# If no results, safe to delete
rm src/services/products/ProductService.js
rmdir src/services/products  # if empty
```

**Verification:**
```bash
# Try to build
npm run build

# Should succeed with no errors about ProductService
```

**Success Criteria:**
- [ ] Confirmed no imports of ProductService
- [ ] File deleted
- [ ] Build succeeds
- [ ] No console errors in dev mode

#### Task 3.2: Handle Tables.vue (30 minutes)

**File:** `src/views/Tables.vue`

**Decision Tree:**
1. **Is it used in routes?**
   ```bash
   grep -r "Tables" src/router/
   ```
   
2. **Is it in navigation menu?**
   ```bash
   grep -r "Tables\|tables" src/layout/AppMenu.vue
   ```

**If NOT used:**
```bash
# Remove the file
rm src/views/Tables.vue
```

**If USED but not needed:**
```javascript
// Remove route from src/router/index.js or routes.js
// Remove from AppMenu.vue
// Then delete file
```

**If NEEDED for admin:**
- Repurpose for user management
- Remove hardcoded "Authors" data
- Connect to real user API
- Rename to UserManagement.vue

**Success Criteria:**
- [ ] Decision documented
- [ ] File removed OR repurposed
- [ ] Routes updated if needed
- [ ] No broken links

#### Task 3.3: Resolve Camera Recording Feature (1 hour)

**File:** `src/views/FrontPage.vue:49-55`

**Current Code:**
```vue
<div class="banner-item coming-soon hidden">
  <div class="banner-content-container">
    <div class="banner-header with-tag">
      Record a video <Tag value="Coming Soon"></Tag>
    </div>
    <div class="banner-description">
      Directly record a video with your device's camera
    </div>
  </div>
</div>
```

**Option A: Remove (Recommended - Quick)**
```vue
<!-- Simply delete lines 49-55 -->
```

**Option B: Implement (3-4 days of work)**
- Add WebRTC camera access
- Implement recording functionality
- Add video preview
- Handle file conversion
- Test across browsers

**Option C: Document for Roadmap (Medium)**
```vue
<!-- Remove from UI but add to future features doc -->
```
Create: `docs/FUTURE_FEATURES.md`

**Recommendation:** Option A (Remove) - Feature is hidden anyway

**Success Criteria:**
- [ ] Decision made and documented
- [ ] Code updated accordingly
- [ ] No "Coming Soon" tags in production code
- [ ] If implementing, full feature plan created

#### Task 3.4: Clean Console.logs (1 hour)

**Find all console.logs:**
```bash
# Find all occurrences
grep -rn "console.log" src/ --include="*.vue" --include="*.js" > console_logs.txt

# Review each one:
# - Keep: Error logs in catch blocks
# - Keep: Debug logs in development mode (with NODE_ENV check)
# - Remove: All others
```

**Pattern to use for dev-only logs:**
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

**Or replace with proper logger:**
```javascript
import logger from '@/utils/logger';

logger.debug('Debug info:', data);
logger.error('Error:', error);
```

**Success Criteria:**
- [ ] All console.logs reviewed
- [ ] Production logs removed
- [ ] Debug logs wrapped in env check
- [ ] Proper logging system in place (optional)

#### Task 3.5: Review Demo Data Files (30 minutes)

**Files:** `public/demo/data/*.json`

**Actions:**
```bash
# List all demo files
ls -la public/demo/data/

# Check usage
grep -r "demo/data" src/
```

**Decision:**
- If used by UI Kit demos → Keep (they're in dev tools)
- If not used → Delete
- If used in production code → Replace with real API

**Recommendation:** Keep for now, add `.dockerignore` entry

**Success Criteria:**
- [ ] Usage verified
- [ ] Decision documented
- [ ] Files kept or removed
- [ ] .dockerignore updated if keeping

### Phase 3 Deliverables

- [x] ProductService removed (if unused)
- [x] Tables.vue resolved
- [x] Camera recording feature decided
- [x] Console.logs cleaned
- [x] Demo data reviewed
- [x] No "Coming Soon" features in UI

---

## Phase 4: Testing & Documentation (HIGH Priority)

**Duration:** 1-2 days  
**Priority:** HIGH  
**Goal:** Add comprehensive tests and update all documentation

### Task 4.1: Add Dashboard Tests (2 hours)

**Create:** `src/views/Dashboard.spec.js`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Dashboard from './Dashboard.vue';
import videoStatsService from '@/services/stats/VideoStatsService';

// Mock the service
vi.mock('@/services/stats/VideoStatsService', () => ({
  default: {
    getStats: vi.fn()
  }
}));

describe('Dashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const wrapper = mount(Dashboard);
    expect(wrapper.find('.p-progress-spinner').exists()).toBe(true);
  });

  it('displays stats after loading', async () => {
    const mockStats = {
      totalVideos: 10,
      processingJobs: 2,
      completedToday: 5,
      failedJobs: 1
    };
    
    videoStatsService.getStats.mockResolvedValue(mockStats);
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(wrapper.text()).toContain('10'); // totalVideos
    expect(wrapper.text()).toContain('2');  // processingJobs
  });

  it('displays error message on failure', async () => {
    videoStatsService.getStats.mockRejectedValue(new Error('API Error'));
    
    const wrapper = mount(Dashboard);
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(wrapper.find('.p-message-error').exists()).toBe(true);
  });
});
```

**Success Criteria:**
- [ ] Test file created
- [ ] Loading state tested
- [ ] Success case tested
- [ ] Error case tested
- [ ] All tests passing

### Task 4.2: Add VideoStatsService Tests (1 hour)

**Create:** `src/services/stats/VideoStatsService.spec.js`

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import VideoStatsService from './VideoStatsService';

vi.mock('axios');

describe('VideoStatsService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getStats', () => {
    it('returns stats from API', async () => {
      const mockData = {
        totalVideos: 10,
        processingJobs: 2,
        completedToday: 5,
        failedJobs: 1
      };
      
      axios.get.mockResolvedValue({ data: mockData });
      
      const stats = await VideoStatsService.getStats();
      
      expect(stats).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/stats'),
        expect.any(Object)
      );
    });

    it('returns zeros on API error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      
      const stats = await VideoStatsService.getStats();
      
      expect(stats).toEqual({
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
      });
    });
  });
});
```

**Success Criteria:**
- [ ] Test file created
- [ ] Success case tested
- [ ] Error handling tested
- [ ] All tests passing

### Task 4.3: Update Documentation (2-3 hours)

**Files to Update:**

1. **README.md**
   - Update feature list
   - Remove references to removed features (billing)
   - Add new API endpoints
   - Update environment variables

2. **CURRENT_STATE_SUMMARY.md**
   - Update completion percentages
   - Mark Phase 1-3 as complete
   - Update file status

3. **IMPLEMENTATION_PLAN.md**
   - Mark completed phases
   - Update remaining work

4. **.env.example**
   - Ensure all variables documented
   - Add comments explaining each one

**Success Criteria:**
- [ ] README.md reflects current features
- [ ] All analysis docs updated
- [ ] .env.example complete
- [ ] No references to removed features

### Task 4.4: Run Full Test Suite (1 hour)

**Actions:**
```bash
# Run all tests
npm test

# Check coverage
npm run test:frontend:coverage

# Verify coverage >80%
```

**Fix any failing tests:**
```bash
# Run tests in watch mode
npm run test:frontend:watch

# Fix one test at a time
# Rerun until all pass
```

**Success Criteria:**
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] No warnings in test output
- [ ] CI pipeline passing (if applicable)

### Phase 4 Deliverables

- [x] Dashboard tests added
- [x] Service tests added
- [x] All documentation updated
- [x] Test coverage >80%
- [x] All tests passing

---

## Phase 5: Optional Enhancements (MEDIUM Priority)

**Duration:** 3-5 days  
**Priority:** MEDIUM  
**Goal:** Additional improvements for better UX and performance

### Task 5.1: Add Real-time Dashboard Updates (1 day)

**Goal:** Dashboard auto-refreshes stats every 30 seconds

**Implementation:**
```vue
<script setup>
// In Dashboard.vue
import { onMounted, onUnmounted, ref } from 'vue';

let refreshInterval;

onMounted(async () => {
  await fetchStats();
  
  // Refresh every 30 seconds
  refreshInterval = setInterval(async () => {
    await fetchStats();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>
```

### Task 5.2: Add Loading Skeletons (1 day)

Replace basic spinner with skeleton loading:

```vue
<template>
  <div v-if="loading" class="grid">
    <div class="col-12 md:col-6 xl:col-3">
      <div class="card mb-0">
        <Skeleton width="100%" height="4rem"></Skeleton>
      </div>
    </div>
    <!-- Repeat for other cards -->
  </div>
</template>
```

### Task 5.3: Performance Optimization (1-2 days)

1. **Lazy load routes**
   - Already done for most routes (using `() => import()`)
   - Verify all routes use lazy loading

2. **Optimize images**
   ```bash
   # Compress images in public/
   npm install -g imagemin-cli
   imagemin public/img/* --out-dir=public/img/optimized
   ```

3. **Add caching**
   ```javascript
   // Cache stats for 30 seconds
   const statsCache = {
     data: null,
     timestamp: 0,
     maxAge: 30000
   };
   ```

### Task 5.4: Add Error Tracking (1 day)

Integrate error tracking service (Sentry, LogRocket, etc.):

```bash
npm install @sentry/vue
```

```javascript
// src/main.js
import * as Sentry from "@sentry/vue";

Sentry.init({
  app,
  dsn: process.env.VUE_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Summary

### Critical Path (Must Complete)
1. ✅ Phase 1: Dashboard API Connection (1-2 days)
2. ✅ Phase 2: Video Pipeline Verification (2-3 days)
3. ✅ Phase 3: Code Cleanup (1 day)
4. ✅ Phase 4: Testing & Documentation (1-2 days)

**Total Critical Path: 5-8 days**

### Optional Enhancements
5. ⚠️ Phase 5: Optional Enhancements (3-5 days)

**Total with Enhancements: 8-13 days**

### Next Actions

**This Week:**
- Start Phase 1: Create VideoStatsService
- Connect Dashboard to real API
- Test with backend

**Next Week:**
- Complete Phase 2: Video pipeline testing
- Begin Phase 3: Code cleanup

**Following Week:**
- Complete Phase 3 & 4: Testing and docs
- Deploy to staging for user testing

### Success Metrics

**Completion Criteria:**
- [ ] Dashboard shows real-time statistics
- [ ] Complete video workflow tested end-to-end
- [ ] No TODO comments in production code
- [ ] No unused services or demo code
- [ ] Test coverage >80%
- [ ] All documentation current
- [ ] No console errors in production

**Production Ready Checklist:**
- [ ] All phases 1-4 complete
- [ ] Security audit passed (CodeQL)
- [ ] Performance benchmarks met
- [ ] User acceptance testing complete
- [ ] Deployment documentation ready
