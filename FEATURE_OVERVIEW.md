# Mage AI Studio - Feature Overview

## 🎯 Core Features

This document provides a simplified high-level overview of the Mage AI Studio's capabilities.

### 1. 📤 Media Upload
Upload images and videos to create AI-powered animations.

**What you can do:**
- Drag & drop files directly into the upload area
- Upload images (JPG, PNG, GIF, WebP)
- Upload videos (MP4, MOV, AVI, WebM)
- Automatic thumbnail generation
- File validation and preview before processing

**How to use:**
Navigate to `/upload` → Select upload type → Drag & drop or browse for files

---

### 2. 🎬 Deforum Animation
Create AI-powered animation sequences from images or videos.

**What you can do:**
- Transform static images into animated sequences
- Apply AI-driven motion effects
- Configure animation parameters:
  - Zoom, rotation, translation
  - 3D camera movements
  - Perspective effects
  - Noise schedules for organic motion
- Choose from preset motion styles or create custom animations

**Motion Styles Available:**
- **Audio Sync**: Animation responds dynamically to audio characteristics
- **BPM**: Synchronize motion to specific tempo (60-200 BPM)
- **Classic Presets**: 
  - Slow Zoom In
  - Fast Zoom Out
  - Rotation (Left/Right)
  - Pan (Left/Right)
  - Dolly In
  - Spiral Motion

**How to use:**
1. Upload an image or video
2. Go to Library → Select item → Edit with Deforum
3. Configure motion parameters or select preset
4. Submit job and track progress

---

### 3. 🎥 Vid2Vid Transformation
Convert videos using AI to transform style, appearance, or content.

**What you can do:**
- Apply AI models to existing videos
- Transform video style and aesthetics
- Create video-to-video transformations
- Adjust processing parameters in real-time

**How to use:**
1. Upload a video
2. Go to Library → Select video → Edit with Vid2Vid
3. Choose transformation model
4. Configure parameters
5. Submit job

---

### 4. 🎵 Audio Animation
Create animations synchronized with audio files.

**What you can do:**
- Upload audio files (MP3, WAV, OGG, M4A, FLAC)
- Sync animation motion to audio amplitude/frequency
- Match animation to music tempo (BPM)
- Apply classic motion presets with audio

**Audio File Support:**
- Maximum size: 50MB
- Automatic duration detection
- Format validation

**How to use:**
1. Navigate to `/upload`
2. Select "Audio Animation" option
3. Upload audio file
4. Choose motion style (Audio Sync, BPM, or Classic)
5. Configure settings
6. Create job

---

### 5. 🎼 Soundscape Creator
Generate AI-powered audio from text descriptions.

**What you can do:**
- Create audio from text prompts
- Choose mood tags (Relaxing, Energizing)
- Real-time audio streaming
- Audio visualization playback
- Queue management for audio generation

**How to use:**
1. Navigate to `/soundscape`
2. Enter text description of desired soundscape
3. Select mood (optional)
4. Click "Generate"
5. Listen to generated audio with visualization

---

### 6. 🎞️ Add Soundtrack to Videos
*(Feature available in video editor - Integration enhancement needed)*

**What you can do:**
- Add audio tracks to processed videos
- Merge audio with video output
- Audio file upload component exists
- Timeline-based audio editing

**Current Status:** Components implemented, full UI integration needed

**Planned Enhancement:**
- Add "Add Soundtrack" button in Library for finished videos
- Integrate AudioFileUpload component
- Create audio-video merge job type
- Display combined video result

---

### 7. 📈 Extend Existing Videos
*(Feature partially implemented - UI exposure needed)*

**What you can do:**
- Interpolate frames to extend video duration
- Smooth motion using frame interpolation
- Increase video length while maintaining quality

**Current Status:** Interpolation technology exists in codebase but not exposed in UI

**Planned Enhancement:**
- Add "Extend Video" option in video editor
- Configure interpolation parameters:
  - Target duration/frame count
  - Interpolation method
  - Quality settings
- Submit as video processing job

---

### 8. 📚 Video Library & Job Management
Comprehensive management of all your video projects.

**What you can do:**
- View all uploaded videos and created jobs
- Filter by:
  - Status (In the Works, Finished, Error)
  - Generator type (Deforum, Vid2Vid)
  - Search by filename or prompt
- Sort by date (newest/oldest)
- Real-time status updates (polls every 10 seconds)
- Delete unwanted jobs
- Grid or list view options

**Job Statuses:**
- **Pending**: Job created, waiting to start
- **Processing**: AI model actively generating
- **Preview**: Initial preview available
- **Finished**: Complete and ready to download
- **Error**: Processing failed
- **Cancelled**: User cancelled job

**How to use:**
Navigate to `/library` → Use filters and search → Click on items to view/edit/download

---

### 9. ⬇️ Download Videos
Download your completed video creations.

**What you can do:**
- Download finished videos directly to your device
- Original filename preserved
- One-click download from Library
- Download available only for completed jobs

**How to use:**
Library → Find finished job → Click download icon → File saves to Downloads folder

---

### 10. 🎨 Video Editors
Advanced editing interfaces for both Deforum and Vid2Vid.

**Features:**
- Real-time parameter adjustment
- Visual preview before submission
- Parameter history and undo
- Preset management
- Advanced export options
- Custom prompts and settings

**Deforum Editor** (`/edit/deforum/:id`):
- 2D/3D animation modes
- Camera controls (zoom, rotation, translation)
- Perspective and flip parameters
- Noise schedules
- Border handling

**Vid2Vid Editor** (`/edit/vid2vid/:id`):
- Model selection
- Style transformation parameters
- Frame-by-frame control
- Quality settings

---

### 11. 🔐 Authentication & User Management
Secure access to your projects.

**Features:**
- JWT-based authentication
- Email/password login
- Account creation
- Password reset via email
- Email verification
- Protected routes (auto-redirect if not logged in)
- User profile management

**Available at:**
- `/login` - Sign in
- `/signup` - Create account
- `/forgot-password` - Reset password
- `/profile` - Manage account

---

### 12. 📊 Dashboard & Status Monitoring
Monitor your projects and system status.

**Dashboard Features:**
- Quick access to recent jobs
- Project statistics
- System status overview
- Quick links to key features

**Mage Helper** (`/mage`):
- Backend processing queue status
- Active job monitoring
- Queue length tracking
- Recent job history
- Health check summaries

---

### 13. 🛠️ Developer Tools
Advanced tools for development and testing.

**Available Tools:**
- **Webcam Capture** - Browser-based recording
- **FFmpeg Web Transcoder** - Client-side video processing
- **Deforum UI Tester** - Parameter configuration preview
- **Deforumation QT** - Real-time parameter control panel
- **Video Modal Tests** - UI component testing

**Access:** `/dev/*` routes

---

## 🎯 Common Workflows

### Workflow 1: Create Animation from Image
1. Upload image → `/upload`
2. View in Library → `/library`
3. Select image → Click "Edit with Deforum"
4. Configure motion parameters or select preset
5. Submit job
6. Monitor progress in Library
7. Download when finished

### Workflow 2: Transform Video Style
1. Upload video → `/upload`
2. View in Library → `/library`
3. Select video → Click "Edit with Vid2Vid"
4. Choose AI model and parameters
5. Submit job
6. Download result

### Workflow 3: Create Audio-Driven Animation
1. Navigate to Upload → Select "Audio Animation"
2. Upload audio file (drag & drop)
3. Choose motion style:
   - Audio Sync (reactive to audio)
   - BPM (match tempo)
   - Classic (preset + audio)
4. Configure parameters
5. Create job
6. View in Library when complete

### Workflow 4: Generate Soundscape
1. Navigate to `/soundscape`
2. Describe desired audio in text prompt
3. Select mood tag (optional)
4. Click "Generate"
5. Listen to streaming audio with visualization

---

## ⚙️ Technical Details

### API Endpoints

**Video Jobs:**
- `GET /v1/video-jobs` - List all jobs
- `GET /v1/video-jobs/:id` - Get specific job
- `POST /v1/video-jobs` - Create new job
- `DELETE /v1/video-jobs/:id` - Delete job
- `POST /cancelJob/:id` - Cancel processing job
- `POST /upload` - Upload media files
- `POST /finalize` - Finalize Vid2Vid job
- `POST /preview` - Preview Vid2Vid job

**Audio (Backend Helper):**
- `GET /api/stream?text=&mood=` - Stream generated audio
- `GET /api/status` - Get processing status
- `GET /api/queue` - Get queue details
- `GET /api/config` - Get configuration

**Authentication:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### File Format Support

**Images:**
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP

**Videos:**
- MP4
- MOV
- AVI
- WebM
- MKV

**Audio:**
- MP3
- WAV
- OGG
- M4A
- FLAC

### Browser Requirements
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- WebAssembly support (for FFmpeg features)
- Minimum 4GB RAM recommended

---

## 📋 Implementation Status

### ✅ Fully Implemented
- [x] Upload images and videos
- [x] Create Deforum animations
- [x] Create Vid2Vid transformations
- [x] View and manage jobs in Library
- [x] Download completed videos
- [x] Audio animation creation
- [x] Soundscape generation
- [x] User authentication
- [x] Job status tracking

### 🚧 Partially Implemented
- [ ] Add soundtrack to videos (components ready, UI integration needed)
- [ ] Extend videos via interpolation (code exists, UI needed)
- [ ] Dashboard with real statistics (UI ready, needs API connection)

### 🔮 Planned Enhancements
- [ ] Video trimming/clipping in editor
- [ ] Batch processing multiple files
- [ ] Preset library management
- [ ] Export presets/settings
- [ ] Advanced audio visualization
- [ ] Real-time preview during editing
- [ ] Collaborative project sharing
- [ ] Cloud storage integration

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URLs
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open http://localhost:8080

5. **Create an account:**
   Navigate to `/signup` and register

6. **Start creating:**
   Upload your first image or video!

---

## 📖 Additional Resources

- **Full Documentation:** [README.md](./README.md)
- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Current Status:** [CURRENT_STATE_SUMMARY.md](./CURRENT_STATE_SUMMARY.md)
- **Audio Feature Docs:** [docs/AUDIO_ANIMATION_FEATURE.md](./docs/AUDIO_ANIMATION_FEATURE.md)
- **Phased Roadmap:** [PHASED_IMPLEMENTATION_ROADMAP.md](./PHASED_IMPLEMENTATION_ROADMAP.md)

---

## 🐛 Troubleshooting

**Can't see my uploaded files?**
- Check if you're logged in
- Verify the upload completed successfully
- Refresh the Library page

**Job stuck in "processing"?**
- Check Mage Helper status at `/mage`
- Verify backend is running
- Check browser console for errors

**Download not working?**
- Ensure job status is "finished"
- Check browser download permissions
- Verify file URL is accessible

**Audio generation not working?**
- Verify backend helper is running (`npm run api`)
- Check if ComfyUI workflow is configured
- Check `/api/status` endpoint

---

## 💡 Tips for Best Results

**For Deforum Animations:**
- Start with preset motion styles
- Use lower frame counts for testing (faster)
- Higher frame counts = smoother motion but longer processing
- Audio Sync works best with dynamic audio files

**For Vid2Vid:**
- Use high-quality source videos
- Test with short clips first
- Choose appropriate AI models for desired style

**For Audio Animations:**
- Match BPM to your audio for best sync
- Audio Sync mode analyzes both amplitude and frequency
- Classic presets work well with any audio

**General:**
- Monitor job status regularly
- Download important results promptly
- Delete old/unwanted jobs to keep Library organized
- Use search and filters to find specific projects

---

## 🤝 Support

For issues, questions, or feature requests:
- Check existing documentation
- Review the troubleshooting section
- Open an issue on GitHub
- Check the developer tools at `/dev`

---

**Last Updated:** January 2026
**Version:** 1.0.0
