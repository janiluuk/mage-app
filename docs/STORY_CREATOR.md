# Story Creator - Long-Form Narrative Animation Tool

## Overview

The Story Creator is a comprehensive tool for creating longer, narrative-driven animations inspired by deforum.studio. It enables creators to build multi-scene stories with live preview capabilities, making it easier to produce extended content with cohesive narratives.

## Features

### 1. Multi-Scene Story Builder

Organize your animations into scenes and chapters for better narrative structure:

- **Scene Management**: Add, edit, duplicate, and delete scenes
- **Duration Control**: Set individual scene durations with automatic frame calculation
- **Keyframe Management**: Add multiple keyframes per scene with smooth transitions
- **Camera Movements**: Choose from predefined camera movements (pan, zoom, orbit, etc.)
- **Transition Types**: Control how scenes blend together (smooth, sharp, fade, morph)

### 2. Story Templates

Pre-built narrative structures to jumpstart your creativity:

- **Hero's Journey**: Classic 5-act narrative structure
- **Three Act Structure**: Traditional storytelling format
- **Music Video**: Verse-chorus-bridge structure
- **Documentary Style**: Sequential narrative format

Each template provides:
- Pre-configured scene structure
- Recommended durations
- Suggested keyframe distribution

### 3. Live Preview

Real-time generation monitoring with:

- **Visual Preview**: See frames as they're generated
- **Progress Tracking**: Monitor generation progress with detailed statistics
- **Frame History**: Review recently generated frames
- **Quality Controls**: Adjust preview quality and refresh rate
- **Debug Information**: Optional debug mode for troubleshooting

### 4. Advanced Settings Integration

Full integration with Deforum configuration:

- **Global Config**: Control animation mode, resolution, seed behavior, etc.
- **Frame Configuration**: Fine-tune individual frame parameters
- **Expression Mode**: Use mathematical expressions for dynamic parameters
- **Batch Configuration**: Export settings in Deforum-compatible format

### 5. Export & Sharing

Multiple export options:

- **JSON Config**: Export complete story configuration
- **Deforum Settings**: Export in Deforum-compatible format
- **Story Package**: Download comprehensive package with all settings
- **Share Links**: Generate shareable links for collaboration (coming soon)

### 6. Batch Generation Service

Efficient processing of long sequences:

- **Chunked Processing**: Break long sequences into manageable chunks
- **Progress Saving**: Resume interrupted generations
- **Retry Mechanism**: Automatically retry failed frames
- **Error Handling**: Graceful handling of generation errors

## Usage Guide

### Getting Started

1. Navigate to "Story Creator" from the AI Tools menu
2. Start with a template or create a new story from scratch
3. Configure your scenes with names, durations, and keyframes
4. Add prompts to each keyframe describing what should appear
5. Adjust advanced settings if needed
6. Use Live Preview to monitor generation
7. Export your configuration when ready

### Creating a Story

#### Step 1: Story Setup

```
Story Name: My Epic Adventure
Total Duration: 120 seconds
FPS: 30 (900 total frames)
```

#### Step 2: Add Scenes

For each scene:
- Give it a descriptive name
- Set the duration
- Add keyframes with prompts
- Choose camera movement
- Select transition type

Example Scene:
```
Scene: "Hero's Introduction"
Duration: 20 seconds (600 frames)
Keyframes:
  - Frame 0: "A hero stands on a mountain peak at sunrise"
  - Frame 300: "Camera slowly zooms in on the hero's face"
  - Frame 600: "Hero turns to face an epic landscape"
Camera Movement: Zoom In
Transition: Smooth
```

#### Step 3: Configure Keyframes

Each keyframe supports:
- **Prompt**: Text description of the scene
- **Camera Parameters**: Angle, zoom, translation, rotation
- **Technical Settings**: Noise schedule, strength, contrast

#### Step 4: Generate

Use the Live Preview tab to:
- Monitor real-time generation
- Adjust quality settings
- Pause/resume as needed
- Review generated frames

### Best Practices

#### For Longer Stories (>60 seconds)

1. **Use Scene Structure**: Break your story into logical scenes
2. **Keyframe Distribution**: Space keyframes 5-10 seconds apart for smooth transitions
3. **Consistent Prompts**: Maintain consistent character descriptions across keyframes
4. **Camera Movement**: Use subtle movements to avoid jarring transitions
5. **Test Preview**: Generate a low-quality preview first to verify timing

#### For Shorter Stories (<30 seconds)

1. **Dense Keyframes**: Use more keyframes for detailed control
2. **Dynamic Camera**: More aggressive camera movements work better
3. **Rapid Transitions**: Shorter scenes with quick transitions
4. **High Quality**: Generate at full quality from the start

#### Prompt Writing Tips

- **Be Specific**: "A red-haired warrior in silver armor" vs "A person"
- **Maintain Consistency**: Repeat key character traits across frames
- **Set the Scene**: Include lighting, time of day, atmosphere
- **Action Direction**: Describe movement or changes between keyframes
- **Style Keywords**: Include artistic style, mood, color palette

Example Good Prompt:
```
"A red-haired elven archer in emerald green cloak, 
standing in a misty ancient forest, golden morning 
light filtering through trees, cinematic lighting, 
detailed fantasy art style, soft focus background"
```

### Advanced Features

#### Expression Mode

Use mathematical expressions for dynamic parameter control:

```javascript
// Example expressions
zoom: "1 + 0.5*sin(t/30)"  // Oscillating zoom
rotation_3d_y: "t * 0.5"    // Continuous rotation
translation_z: "10*cos(t/20)" // Back-and-forth movement
```

The `t` variable represents the current frame number.

#### Batch Generation Options

Configure batch processing:

```javascript
{
  chunkSize: 30,        // Frames per chunk
  maxRetries: 3,        // Retry failed frames
  retryDelay: 5000,     // Wait before retry (ms)
  saveInterval: 10,     // Save progress frequency
  quality: 'medium',    // Preview quality
  priority: 'normal'    // Processing priority
}
```

## API Integration

### WebSocket Live Preview

Connect to live generation:

```javascript
const ws = new WebSocket('ws://your-api/generation')

ws.send(JSON.stringify({
  action: 'start',
  config: storyConfig,
  refreshRate: 2,
  quality: 'medium'
}))

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // Handle frame updates, progress, errors
}
```

### REST API Endpoints

Expected endpoints:

```
POST /api/story/generate
  - Start story generation
  - Body: story configuration
  - Returns: { batchId, estimatedDuration }

GET /api/story/batch/:id
  - Get batch generation status
  - Returns: { status, progress, completedFrames }

POST /api/story/batch/:id/pause
  - Pause generation

POST /api/story/batch/:id/resume
  - Resume generation

DELETE /api/story/batch/:id
  - Cancel generation
```

## Technical Details

### File Structure

```
src/
├── components/story/
│   ├── StoryBuilder.vue       # Main story building interface
│   └── LivePreview.vue         # Live generation preview
├── views/
│   └── StoryCreator.vue        # Story creator page
└── services/story/
    └── BatchGenerationService.js  # Batch processing service
```

### Data Format

Story configuration format:

```json
{
  "name": "My Story",
  "totalDuration": 60,
  "fps": 30,
  "scenes": [
    {
      "id": "scene_1",
      "name": "Opening",
      "duration": 20,
      "startFrame": 0,
      "frames": [
        {
          "id": 0,
          "prompt": "Scene description",
          "angle": "0",
          "zoom": "1",
          "translation_x": "0",
          "translation_y": "0",
          "translation_z": "0",
          "rotation_3d_x": "0",
          "rotation_3d_y": "0",
          "rotation_3d_z": "0",
          "noise_schedule": "0.02",
          "strength_schedule": "0.65",
          "contrast_schedule": "1"
        }
      ],
      "cameraMovement": "static",
      "transitionType": "smooth"
    }
  ]
}
```

## Troubleshooting

### Common Issues

**Generation Fails to Start**
- Check WebSocket connection
- Verify API endpoints are accessible
- Ensure story configuration is valid

**Slow Generation**
- Reduce preview quality
- Lower refresh rate
- Use smaller chunk sizes
- Check system resources

**Inconsistent Results**
- Use consistent seed values
- Maintain prompt similarity across keyframes
- Check for conflicting parameter expressions

**Memory Issues with Long Stories**
- Enable batch processing
- Reduce chunk size
- Lower resolution temporarily
- Clear frame history periodically

## Future Enhancements

Planned features:

- [ ] AI-assisted prompt generation
- [ ] Automatic scene detection
- [ ] Style transfer between scenes
- [ ] Collaborative story editing
- [ ] Cloud-based generation queue
- [ ] Mobile app for on-the-go editing
- [ ] Audio synchronization
- [ ] Character consistency tools

## Support

For issues or questions:
- Check the main README.md
- Review IMPLEMENTATION_PLAN.md
- Submit issues on GitHub
- Join community discussions

## Credits

Inspired by:
- deforum.studio - for the concept of long-form AI animation
- Deforum - for the animation framework
- The AI art community for continued innovation

## License

Same as the main project license.
