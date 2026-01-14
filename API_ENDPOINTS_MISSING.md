# Missing and Incomplete API Endpoints - Analysis

**Date:** January 13, 2026  
**Repository:** janiluuk/mage-app  
**Version:** 1.0.0

---

## Executive Summary

This document provides a comprehensive analysis of API endpoints that are referenced in the frontend code but may be missing, incomplete, or need backend verification in the Mage AI Studio application.

### Key Findings

- **12 endpoints** need backend verification or implementation
- **3 endpoints** are partially implemented (frontend only)
- **8 features** have UI but uncertain backend support
- **2 backend helper endpoints** may need enhancement

---

## 1. Video Job Management Endpoints

### 1.1 Add Soundtrack to Video
**Status:** ⚠️ Needs Backend Verification  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❓ Unknown

**Endpoint:**
```
POST /v1/video-jobs/add-soundtrack
```

**Frontend Usage:**
- File: `src/services/videojobs.service.js:183`
- Component: `src/components/video/SoundtrackDialog.vue`
- Store Action: `src/store/videojobs.module.js:112`

**Expected Request:**
```javascript
FormData {
  videoId: string,
  audio: File,
  volume: number (0-100),
  fadeIn: number (0-10),
  fadeOut: number (0-10),
  audioStart: number (optional),
  audioEnd: number (optional),
  type: 'soundtrack'
}
```

**Expected Response:**
```javascript
{
  data: {
    type: 'video-jobs',
    id: string,
    attributes: {
      status: 'pending',
      type: 'soundtrack',
      ...
    }
  }
}
```

**Implementation Status:**
- ✅ Frontend service method implemented
- ✅ UI dialog complete with audio trimming controls
- ✅ Store action wired up
- ❓ Backend endpoint needs verification
- ❓ FFmpeg audio merging implementation unknown

**Required Backend Functionality:**
1. Accept multipart form data with video ID and audio file
2. Validate audio file format (MP3, WAV, OGG, M4A, FLAC)
3. Apply volume adjustment (0-100%)
4. Apply fade in/out effects
5. Handle audio trimming (audioStart, audioEnd)
6. Merge audio with video using FFmpeg
7. Create new video job with merged output
8. Return job status for monitoring

---

### 1.2 Extend Video Duration
**Status:** ⚠️ Needs Backend Verification  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❓ Unknown

**Endpoint:**
```
POST /v1/video-jobs/extend
```

**Frontend Usage:**
- File: `src/services/videojobs.service.js:203`
- Component: `src/components/video/VideoExtensionDialog.vue`
- Store Action: `src/store/videojobs.module.js:119`

**Expected Request:**
```javascript
{
  data: {
    type: 'video-jobs',
    attributes: {
      videoId: string,
      method: 'minterpolate' | 'blend' | 'duplicate',
      targetDuration: number,
      targetFps: number,
      interpolationMode: 'mci' | 'blend' | 'dup',
      type: 'extension'
    }
  }
}
```

**Expected Response:**
```javascript
{
  data: {
    type: 'video-jobs',
    id: string,
    attributes: {
      status: 'pending',
      type: 'extension',
      originalDuration: number,
      targetDuration: number,
      ...
    }
  }
}
```

**Implementation Status:**
- ✅ Frontend service method implemented
- ✅ UI dialog complete with interpolation options
- ✅ Store action wired up
- ❓ Backend endpoint needs verification
- ❓ FFmpeg interpolation implementation unknown

**Required Backend Functionality:**
1. Accept JSON:API formatted request
2. Validate interpolation method
3. Calculate frame interpolation requirements
4. Use FFmpeg with appropriate filters:
   - `minterpolate` for motion compensation
   - `tmix` for blend mode
   - `setpts` for frame duplication
5. Apply target FPS
6. Create new video job with extended output
7. Estimate and track processing time
8. Return job status for monitoring

**Performance Considerations:**
- Motion compensation is CPU-intensive (2s per frame estimate)
- Extension beyond 2x original duration may cause quality degradation
- Processing time scales with frame count and interpolation method

---

### 1.3 Video Trimming/Clipping
**Status:** ⚠️ Partially Implemented  
**Frontend Implementation:** ✅ Complete (UI + Service)  
**Backend Implementation:** ❓ Unknown

**Endpoint:**
```
POST /v1/video-jobs/trim
(Endpoint path not confirmed in code)
```

**Frontend Usage:**
- Service: `src/services/videoTrimService.js`
- Components: 
  - `src/components/video/VideoTrimmer.vue`
  - `src/components/video/VideoClipper.vue`
  - `src/components/video/VideoUpload.vue`

**Frontend Capabilities:**
- Frame-accurate trim calculations
- Time format conversion (HH:MM:SS.mmm)
- Trim validation with error messages
- Snap-to-frame functionality
- Thumbnail timestamp generation
- Min/max duration constraints

**Expected Request:**
```javascript
{
  videoId: string,
  startTime: string, // "HH:MM:SS.mmm" or seconds
  endTime: string,   // "HH:MM:SS.mmm" or seconds
  type: 'trim'
}
```

**Missing Implementation:**
- ❌ No clear API endpoint in videojobs.service.js
- ❌ No store action for trimming
- ❌ Backend endpoint path unknown
- ⚠️ VideoUpload.vue contains old FFmpeg client-side trimming logic

**Required Backend Functionality:**
1. Accept trim parameters
2. Use FFmpeg to trim video accurately
3. Preserve video quality
4. Handle frame-accurate cuts
5. Return new video job or trimmed video URL

---

### 1.4 Batch Processing API
**Status:** ⚠️ Frontend Service Only  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❌ Not Found

**Potential Endpoint:**
```
POST /v1/video-jobs/batch
GET /v1/video-jobs/batch/:batchId
DELETE /v1/video-jobs/batch/:batchId
PATCH /v1/video-jobs/batch/:batchId/files/:fileId
```

**Frontend Usage:**
- Service: `src/services/batchProcessingService.js`
- Components:
  - `src/components/batch/BatchProcessor.vue`
  - `src/components/batch/BatchQueueItem.vue`

**Frontend Capabilities:**
- Batch creation and queue management
- File-level status tracking
- Configurable concurrency (default: 3 parallel jobs)
- Progress calculation and statistics
- Batch cancellation and file removal
- localStorage persistence

**Current Implementation:**
- ✅ Complete client-side batch management
- ❌ No backend API integration found
- ⚠️ Currently works with localStorage only

**Required Backend Functionality:**
1. Create batch jobs with multiple files
2. Track batch status across all files
3. Support concurrent processing
4. Provide batch-level progress updates
5. Allow cancellation of entire batch
6. Support removing individual files from batch
7. Persist batch state on server
8. Return batch statistics and status

**Recommendation:**
- Implement batch API endpoints to support server-side batch processing
- Allow batches to survive page reloads
- Enable batch sharing across devices
- Improve reliability with server-side tracking

---

## 2. Preset Management Endpoints

### 2.1 Preset Library API
**Status:** ⚠️ Frontend Service Only  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❌ Not Found

**Potential Endpoints:**
```
GET /v1/presets
GET /v1/presets/:id
POST /v1/presets
PUT /v1/presets/:id
DELETE /v1/presets/:id
GET /v1/presets/search?q=:query
```

**Frontend Usage:**
- Service: `src/services/presetService.js`
- Components:
  - `src/components/preset/PresetLibrary.vue`
  - `src/components/preset/PresetCard.vue`
  - `src/components/preset/PresetDialog.vue`

**Frontend Capabilities:**
- CRUD operations (create, read, update, delete)
- localStorage persistence with versioning
- Search across name, description, and tags
- Category and tag-based filtering
- Recent and popular preset tracking
- Usage statistics (last used, use count)
- System vs user preset distinction

**Current Implementation:**
- ✅ Complete client-side preset management
- ❌ No backend API integration found
- ⚠️ Currently works with localStorage only
- ⚠️ Presets not synced across devices/browsers

**Required Backend Functionality:**
1. Store user presets in database
2. Support system/default presets
3. Enable preset sharing (public/private)
4. Track usage statistics server-side
5. Support full-text search
6. Allow categorization and tagging
7. Support preset versioning
8. Enable import/export functionality

---

### 2.2 Preset Import/Export API
**Status:** ⚠️ Frontend Service Only  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❌ Not Found

**Potential Endpoints:**
```
POST /v1/presets/import
GET /v1/presets/:id/export
POST /v1/presets/batch-import
```

**Frontend Usage:**
- Services:
  - `src/services/exportService.js`
  - `src/services/importService.js`
- Components:
  - `src/components/export/ExportDialog.vue`
  - `src/components/import/ImportDialog.vue`

**Frontend Capabilities:**
- JSON export format with versioning (v1.0)
- Metadata tracking (export date, app version)
- Import validation and conflict detection
- Resolution strategies: skip, replace, keep_both
- Preset sanitization for security
- Multi-preset batch operations

**Current Implementation:**
- ✅ Complete client-side import/export
- ❌ No backend API for preset storage
- ⚠️ File-based import/export only
- ⚠️ No cloud backup/sync

**Required Backend Functionality:**
1. Accept imported preset files
2. Validate preset format and security
3. Store imported presets in database
4. Generate export packages
5. Support batch import operations
6. Track import history
7. Enable cloud backup of presets
8. Support preset sharing via URLs

---

## 3. Real-time Preview Endpoints

### 3.1 Real-time Preview Generation
**Status:** ⚠️ Frontend Service Only  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❌ Not Found

**Potential Endpoints:**
```
POST /v1/preview/generate
GET /v1/preview/:previewId
DELETE /v1/preview/:previewId
WebSocket: ws://api/preview/stream
```

**Frontend Usage:**
- Service: `src/services/realtimePreviewService.js`

**Frontend Capabilities:**
- Preview request management
- Status tracking (pending, generating, ready, error, cancelled)
- WebSocket integration ready
- Preview caching with expiration
- Multiple concurrent preview support
- Event-based notifications
- Resource cleanup

**Current Implementation:**
- ✅ Complete client-side preview service
- ❌ No backend preview API found
- ❌ No WebSocket preview streaming
- ⚠️ Preview generation not implemented

**Required Backend Functionality:**
1. Generate low-resolution previews quickly
2. Support WebSocket streaming for real-time updates
3. Cache generated previews
4. Support cancellation of preview generation
5. Return preview URLs or blob data
6. Track preview generation status
7. Clean up expired previews
8. Throttle preview requests

**WebSocket Events:**
```javascript
// Client -> Server
{ type: 'preview_request', previewId, settings }
{ type: 'preview_cancel', previewId }

// Server -> Client
{ type: 'preview_progress', previewId, progress }
{ type: 'preview_ready', previewId, url }
{ type: 'preview_error', previewId, error }
```

---

## 4. Story Creator Endpoints

### 4.1 Batch Generation API
**Status:** ⚠️ Partial Backend Support  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ⚠️ Uncertain

**Endpoints Referenced:**
```
POST /api/story/generate
GET /api/story/batch/:batchId
POST /api/story/extend/:batchId
POST /api/story/cancel/:batchId
```

**Frontend Usage:**
- Services:
  - `src/services/story/GenerationService.js`
  - `src/services/story/BatchGenerationService.js`
- Component: `src/views/StoryCreator.vue`

**Frontend Capabilities:**
- Multi-scene narrative builder
- Live preview with real-time monitoring
- Batch generation management
- Scene-based configuration
- Generation extension support
- Status polling and updates

**Status:**
- ✅ Frontend implementation complete
- ❓ Backend endpoints referenced but not found in videojobs service
- ⚠️ May be handled by separate Deforum backend
- ⚠️ WebSocket integration for live updates unclear

**Required Verification:**
1. Confirm story generation endpoints exist
2. Verify batch ID handling
3. Check WebSocket support for live preview
4. Validate scene-based generation
5. Confirm extension functionality

---

## 5. Deforum & Vid2Vid Endpoints

### 5.1 Live Deforum Control
**Status:** ⚠️ Needs Verification  
**Frontend Implementation:** ✅ Complete  
**Backend Implementation:** ❓ Unknown

**Endpoints:**
```
POST /deforum/live
GET /deforum/live/status
```

**Frontend Usage:**
- Service: `src/services/deforum/DeforumControlService.js`

**Purpose:**
- Real-time Deforum parameter control
- Live generation status monitoring
- Remote control of Deforum process

**Required Verification:**
1. Confirm endpoints exist and are functional
2. Verify real-time control capabilities
3. Check WebSocket vs polling approach
4. Validate status updates

---

### 5.2 Preview Generation Endpoints
**Status:** ✅ Implemented  
**Endpoints Found:**
```
POST /generate (with type: 'vid2vid' or 'deforum')
POST /finalize
POST /preview
```

**Frontend Usage:**
- `src/services/videojobs.service.js:155-161`

**Status:** ✅ Working

---

## 6. Dashboard & Statistics Endpoints

### 6.1 Dashboard Statistics
**Status:** ⚠️ Not Found  
**Frontend Implementation:** ❌ Limited  
**Backend Implementation:** ❌ Not Found

**Potential Endpoints:**
```
GET /v1/stats/dashboard
GET /v1/stats/user
GET /v1/stats/jobs
```

**Current State:**
- Dashboard exists: `src/views/pages/Dashboard.vue`
- No API calls for statistics found
- Dashboard may be displaying static/mock data

**Required Backend Functionality:**
1. User activity statistics
2. Job completion rates
3. Processing time averages
4. Storage usage
5. Recent activity feed
6. Quick stats (total jobs, completed, failed)

---

### 6.2 Status Service
**Status:** ⚠️ Generic Implementation  
**Frontend Implementation:** ✅ Present  
**Backend Implementation:** ❓ Unknown

**Endpoint:**
```
GET /status/:serviceName
```

**Frontend Usage:**
- Service: `src/services/status-service/StatusService.js`

**Purpose:**
- Generic service health checking
- May be used for microservices monitoring

**Required Verification:**
1. What services are supported?
2. What does the status response include?
3. Is this used in production?

---

## 7. Backend Helper API (Node.js Express)

### Current Endpoints (Verified)

**File:** `backend/app.js`

```javascript
GET /api/stream?text=:text&mood=:mood
GET /api/status
GET /api/queue  
GET /api/config
```

**Status:** ✅ Implemented

### 7.1 Audio Streaming Enhancements Needed

**Current Limitations:**
1. No authentication/authorization
2. No rate limiting
3. Limited error handling
4. No streaming status callbacks
5. No audio file upload support

**Suggested Enhancements:**
```javascript
// New endpoints
POST /api/audio/upload         // Upload audio for processing
GET /api/audio/:id              // Get processed audio
DELETE /api/audio/:id           // Delete audio file
POST /api/audio/synthesize      // Text-to-speech
```

### 7.2 Queue Management Enhancements

**Current Implementation:**
- In-memory queue only
- No persistence
- Limited monitoring

**Suggested Enhancements:**
1. Redis/database persistence
2. Priority queue support
3. Queue analytics
4. Job retry mechanism
5. Dead letter queue
6. Queue size limits

---

## 8. Authentication & User Management

### Current Endpoints (Verified)

**Auth Endpoints:**
```javascript
POST /api/v2/login
POST /api/v2/logout
POST /api/v2/register
POST /api/v2/password-forgot
POST /api/v2/password-reset
```

**Status:** ✅ Implemented

**User Profile:**
```javascript
GET /auth/me
PATCH /me
POST /uploads/users/:id/profile-image
```

**Status:** ✅ Implemented

### Missing User Management Features

**Potential Gaps:**
1. Email verification endpoint status unclear
2. Two-factor authentication endpoints missing
3. Session management endpoints unclear
4. Account deletion endpoint not found
5. User preferences API not found

**Suggested Endpoints:**
```javascript
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/enable-2fa
POST /auth/verify-2fa
GET /auth/sessions
DELETE /auth/sessions/:id
DELETE /users/:id/account
GET /users/:id/preferences
PUT /users/:id/preferences
```

---

## 9. File & Media Management

### Current Endpoints (Verified)

```javascript
POST /upload
POST /uploads/items/:id/image
POST /uploads/users/:id/profile-image
POST /uploads/video-jobs/:id/image
```

**Status:** ✅ Implemented

### Missing Media Features

**Potential Gaps:**
1. Bulk file upload endpoint
2. File deletion endpoint unclear
3. Media library organization endpoints
4. Thumbnail regeneration endpoint
5. Media metadata update endpoints

**Suggested Endpoints:**
```javascript
POST /v1/media/bulk-upload
DELETE /v1/media/:id
PUT /v1/media/:id/metadata
POST /v1/media/:id/thumbnail/regenerate
GET /v1/media/library
POST /v1/media/organize
```

---

## 10. Additional Service Endpoints Found

### Support Service
**Endpoints:**
```javascript
POST /support-request
GET /support-requests/user/:userId
POST /support-requests/:id/respond
GET /support-requests/:id/messages
PATCH /support-requests/:id/status
POST /support-requests/:id/close
POST /support-requests/
```
**Status:** ✅ Implemented
**File:** `src/services/support-service/SupportService.js`

### Finance Operations
**Endpoints:**
```javascript
POST /finance-operations/
PUT /finance-operations/:id
PATCH /finance-operations/:id/status
GET /finance-operations/:id
GET /finance-operations/between-dates
```
**Status:** ✅ Implemented
**File:** `src/services/finance-operation-service/FinanceOperationService.js`

### Product & Order Management
**Endpoints:**
```javascript
GET /products/:id
GET /products/
GET /products/business/:businessId
POST /products
PUT /products/:id
DELETE /products/:id

GET /administration/orders
GET /orders/purchases
GET /orders/sales
PATCH /orders/:id/status
POST /orders
GET /orders/:id
PATCH /orders/confirm-order
```
**Status:** ✅ Implemented

### Wallet & User Management
**Endpoints:**
```javascript
GET /user-wallets/wallets
GET /user-wallets/
POST /user-wallets/
PUT /user-wallets/
DELETE /user-wallets/:id

GET /wallet-types

GET /administration/users
GET /users/:id
PATCH /users/:id/update-wallet
POST /users/bind-email
PATCH /users/:id/password
PATCH /users/:id/enable-notifications
```
**Status:** ✅ Implemented

### Chat Service
**Endpoints:**
```javascript
GET /chats/by-user?userId=:userId
POST /chats
GET /chats/:id
GET /chats/:chatId/messages
```
**Status:** ✅ Implemented

---

## Summary of Missing/Incomplete Endpoints

### Critical (High Priority)

1. **POST /v1/video-jobs/add-soundtrack** - Needs backend verification
2. **POST /v1/video-jobs/extend** - Needs backend verification
3. **POST /v1/video-jobs/trim** - Endpoint not found, needs implementation
4. **Batch Processing API** - Complete API missing
5. **Preset Management API** - Complete API missing

### Important (Medium Priority)

6. **Real-time Preview API** - Complete API missing
7. **Story Creator Endpoints** - Need verification
8. **WebSocket support** - For live preview and status updates
9. **Dashboard Statistics API** - Endpoints not found
10. **Preset Import/Export API** - Server-side missing

### Nice to Have (Low Priority)

11. **Enhanced Backend Helper API** - Rate limiting, auth
12. **Enhanced Queue Management** - Persistence, analytics
13. **User Preferences API** - Missing
14. **Media Library Organization** - Limited functionality
15. **Two-Factor Authentication** - Not implemented

---

## Recommendations

### Immediate Actions

1. **Verify Backend Implementation**
   - Test `/v1/video-jobs/add-soundtrack` endpoint
   - Test `/v1/video-jobs/extend` endpoint
   - Document actual backend implementation status

2. **Implement Critical Missing Endpoints**
   - Video trimming API
   - Batch processing API
   - Preset management API

3. **Add Integration Tests**
   - End-to-end tests for video operations
   - API contract tests
   - WebSocket integration tests

### Short-term Improvements

1. **Add Authentication to Backend Helper**
   - JWT validation
   - Rate limiting
   - User quota management

2. **Implement WebSocket Support**
   - Real-time preview updates
   - Live status notifications
   - Job progress streaming

3. **Add Persistence Layer**
   - Queue state persistence
   - Preset cloud sync
   - Batch job recovery

### Long-term Enhancements

1. **Microservices Architecture**
   - Separate video processing service
   - Dedicated preview generation service
   - Scalable queue management

2. **API Documentation**
   - OpenAPI/Swagger specification
   - API versioning strategy
   - Deprecation policy

3. **Monitoring & Analytics**
   - API usage metrics
   - Performance monitoring
   - Error tracking
   - User behavior analytics

---

## Testing Recommendations

### API Contract Testing
```javascript
// Example test structure
describe('Video Job Endpoints', () => {
  it('POST /v1/video-jobs/add-soundtrack', async () => {
    // Test soundtrack addition
  });
  
  it('POST /v1/video-jobs/extend', async () => {
    // Test video extension
  });
  
  it('POST /v1/video-jobs/trim', async () => {
    // Test video trimming
  });
});
```

### Integration Testing
- Test complete workflows (upload → process → download)
- Verify status updates and notifications
- Test error handling and recovery
- Validate file handling and cleanup

### Performance Testing
- Load test batch processing
- Test concurrent job processing
- Validate queue performance
- Test WebSocket connection limits

---

## Conclusion

The Mage AI Studio application has a comprehensive frontend implementation with many advanced features. However, several API endpoints need backend verification or implementation:

**Critical Gaps:**
- Video soundtrack and extension endpoints need verification
- Video trimming endpoint appears missing
- Batch processing lacks backend API
- Preset management lacks cloud sync
- Real-time preview lacks backend support

**Next Steps:**
1. Verify existing backend implementation
2. Prioritize critical missing endpoints
3. Add comprehensive API documentation
4. Implement integration tests
5. Plan microservices migration

This analysis should guide the backend development efforts to fully support all frontend features.

---

**Document Version:** 1.0  
**Last Updated:** January 13, 2026  
**Status:** Initial Analysis Complete
