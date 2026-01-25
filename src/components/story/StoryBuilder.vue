<template>
  <div class="story-builder">
    <Panel header="Story Builder" class="story-header-panel">
      <template #icons>
        <Tag :value="`${scenes.length} scenes`" severity="info" class="mr-2" />
      </template>
      <InlineMessage severity="info" class="mb-3">
        Create longer narratives by organizing your animation into scenes and chapters
      </InlineMessage>

      <Fieldset legend="Story Configuration" :toggleable="true">
        <div class="story-controls">
          <div class="control-group">
            <label>Story Name</label>
            <InputText v-model="storyName" placeholder="My Epic Story" />
          </div>
          
          <div class="control-group">
            <label>Total Duration (seconds)</label>
            <InputNumber v-model="totalDuration" :min="10" :max="600" :step="10" showButtons />
          </div>

          <div class="control-group">
            <label>FPS</label>
            <InputNumber v-model="fps" :min="12" :max="60" :step="6" showButtons />
          </div>

          <div class="control-group">
            <Button label="Add Scene" icon="pi pi-plus" @click="addScene" class="p-button-success" />
            <Button label="Load Template" icon="pi pi-file" @click="showTemplateDialog = true" class="p-button-secondary" />
          </div>
        </div>
      </Fieldset>
    </Panel>

    <div class="scenes-container">
      <Panel v-for="(scene, index) in scenes" :key="scene.id" class="scene-panel mb-3">
        <template #header>
          <div class="scene-header-content">
            <Badge :value="index + 1" severity="success" class="mr-2" />
            <span class="scene-title">{{ scene.name }}</span>
            <Tag :value="`${scene.frames.length} keyframes`" severity="info" class="ml-2" />
          </div>
        </template>
        <template #icons>
          <Button icon="pi pi-pencil" @click="editScene(index)" class="p-button-text p-button-sm" v-tooltip.top="'Edit scene'" />
          <Button icon="pi pi-copy" @click="duplicateScene(index)" class="p-button-text p-button-sm" v-tooltip.top="'Duplicate scene'" />
          <Button icon="pi pi-trash" @click="deleteScene(index)" class="p-button-text p-button-sm p-button-danger" 
                  :disabled="scenes.length <= 1" v-tooltip.top="'Delete scene'" />
        </template>

        <Fieldset legend="Scene Settings" class="mb-3">
          <div class="scene-info">
            <div class="info-item">
              <label>Scene Name</label>
              <InputText v-model="scene.name" placeholder="Enter scene name" />
            </div>
            <div class="info-item">
              <label>Duration (seconds)</label>
              <InputNumber v-model="scene.duration" :min="1" :max="120" :step="1" showButtons />
            </div>
            <div class="info-item">
              <label>Start Frame</label>
              <InputNumber v-model="scene.startFrame" :min="0" :step="1" showButtons disabled />
            </div>
            <div class="info-item">
              <label>End Frame</label>
              <InputNumber :model-value="getSceneEndFrame(index)" disabled />
            </div>
          </div>
        </Fieldset>

        <Fieldset legend="Keyframes" class="mb-3">
          <ScrollPanel style="height: 200px">
            <div v-for="(frame, frameIndex) in scene.frames" :key="frame.id" class="frame-item">
              <div class="frame-info">
                <Tag :value="`Frame ${frame.id}`" severity="secondary" class="mr-2" />
                <InputText v-model="frame.prompt" placeholder="Enter prompt for this frame" class="frame-prompt" />
              </div>
              <div class="frame-actions">
                <Button icon="pi pi-trash" @click="deleteFrame(index, frameIndex)" 
                        class="p-button-text p-button-sm p-button-danger"
                        :disabled="scene.frames.length <= 1" 
                        v-tooltip.top="'Delete keyframe'" />
              </div>
            </div>
            <Button label="Add Keyframe" icon="pi pi-plus" @click="addKeyframe(index)" 
                    class="p-button-sm p-button-outlined mt-2" />
          </ScrollPanel>
        </Fieldset>

        <Fieldset legend="Transition Settings">
          <div class="transition-controls">
            <div class="control-item">
              <label>Camera Movement</label>
              <Dropdown v-model="scene.cameraMovement" :options="cameraMovements" 
                        option-label="label" option-value="value" placeholder="Select movement" />
            </div>
            <div class="control-item">
              <label>Transition Type</label>
              <Dropdown v-model="scene.transitionType" :options="transitionTypes" 
                        option-label="label" option-value="value" placeholder="Select transition" />
            </div>
          </div>
        </Fieldset>
      </Panel>
    </div>

    <Panel header="Story Summary" class="story-summary-panel">
      <template #icons>
        <Badge :value="`${totalKeyframes} keyframes`" severity="success" />
      </template>
      <div class="summary-stats">
        <div class="stat">
          <Tag value="Total Scenes" severity="info" class="stat-tag" />
          <span class="stat-value">{{ scenes.length }}</span>
        </div>
        <div class="stat">
          <Tag value="Total Frames" severity="info" class="stat-tag" />
          <span class="stat-value">{{ totalFrames }}</span>
        </div>
        <div class="stat">
          <Tag value="Estimated Duration" severity="info" class="stat-tag" />
          <span class="stat-value">{{ estimatedDuration }}s</span>
        </div>
        <div class="stat">
          <Tag value="Total Keyframes" severity="info" class="stat-tag" />
          <span class="stat-value">{{ totalKeyframes }}</span>
        </div>
      </div>
      <Divider />
      <div class="export-actions">
        <Button label="Export Story Config" icon="pi pi-download" @click="exportStory" class="p-button-primary" />
        <Button label="Generate All Frames" icon="pi pi-play" @click="generateStory" class="p-button-success" />
      </div>
    </Panel>

    <!-- Template Dialog -->
    <Dialog v-model:visible="showTemplateDialog" header="Story Templates" :modal="true" :style="{ width: '50vw' }">
      <div class="templates-grid">
        <Panel v-for="template in storyTemplates" :key="template.id" class="template-panel" @click="loadTemplate(template)">
          <template #header>
            <div class="template-header">
              <span class="template-title">{{ template.name }}</span>
              <Tag :value="`${template.scenes.length} scenes`" severity="info" />
            </div>
          </template>
          <p class="template-description">{{ template.description }}</p>
        </Panel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import Fieldset from 'primevue/fieldset'
import InlineMessage from 'primevue/inlinemessage'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel'
import ScrollPanel from 'primevue/scrollpanel'
import Tag from 'primevue/tag'

const props = defineProps({
  initialStory: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:story', 'generate:story'])

// Story state
const storyName = ref('Untitled Story')
const totalDuration = ref(60)
const fps = ref(30)
const scenes = ref([createDefaultScene(0)])
const showTemplateDialog = ref(false)

// Camera movement options
const cameraMovements = [
  { label: 'Static', value: 'static' },
  { label: 'Pan Left', value: 'pan_left' },
  { label: 'Pan Right', value: 'pan_right' },
  { label: 'Zoom In', value: 'zoom_in' },
  { label: 'Zoom Out', value: 'zoom_out' },
  { label: 'Orbit', value: 'orbit' },
  { label: 'Fly Through', value: 'fly_through' }
]

// Transition types
const transitionTypes = [
  { label: 'Smooth', value: 'smooth' },
  { label: 'Sharp', value: 'sharp' },
  { label: 'Fade', value: 'fade' },
  { label: 'Morph', value: 'morph' }
]

// Story templates
const storyTemplates = [
  {
    id: 'hero-journey',
    name: 'Hero\'s Journey',
    description: 'Classic narrative structure with 5 key scenes',
    scenes: [
      { name: 'Ordinary World', duration: 10, frames: 3 },
      { name: 'Call to Adventure', duration: 15, frames: 4 },
      { name: 'Trials and Challenges', duration: 20, frames: 6 },
      { name: 'Climax', duration: 10, frames: 4 },
      { name: 'Return/Resolution', duration: 15, frames: 3 }
    ]
  },
  {
    id: 'three-act',
    name: 'Three Act Structure',
    description: 'Traditional three-act narrative',
    scenes: [
      { name: 'Act 1: Setup', duration: 20, frames: 5 },
      { name: 'Act 2: Confrontation', duration: 30, frames: 8 },
      { name: 'Act 3: Resolution', duration: 20, frames: 5 }
    ]
  },
  {
    id: 'music-video',
    name: 'Music Video',
    description: 'Verse-chorus structure for music videos',
    scenes: [
      { name: 'Intro', duration: 10, frames: 3 },
      { name: 'Verse 1', duration: 15, frames: 4 },
      { name: 'Chorus 1', duration: 12, frames: 4 },
      { name: 'Verse 2', duration: 15, frames: 4 },
      { name: 'Chorus 2', duration: 12, frames: 4 },
      { name: 'Bridge', duration: 10, frames: 3 },
      { name: 'Final Chorus', duration: 15, frames: 5 },
      { name: 'Outro', duration: 11, frames: 3 }
    ]
  },
  {
    id: 'documentary',
    name: 'Documentary Style',
    description: 'Sequential narrative for documentaries',
    scenes: [
      { name: 'Introduction', duration: 12, frames: 3 },
      { name: 'Background', duration: 18, frames: 5 },
      { name: 'Main Content', duration: 40, frames: 10 },
      { name: 'Conclusion', duration: 10, frames: 3 }
    ]
  }
]

// Computed properties
const totalFrames = computed(() => {
  return Math.floor(totalDuration.value * fps.value)
})

const totalKeyframes = computed(() => {
  return scenes.value.reduce((sum, scene) => sum + scene.frames.length, 0)
})

const estimatedDuration = computed(() => {
  return scenes.value.reduce((sum, scene) => sum + scene.duration, 0)
})

// Watch for scene changes to update start frames
watch(scenes, () => {
  updateSceneStartFrames()
  emitStoryUpdate()
}, { deep: true })

// Helper functions
function createDefaultScene(startFrame) {
  return {
    id: Date.now() + Math.random(),
    name: 'New Scene',
    duration: 10,
    startFrame: startFrame,
    frames: [createKeyframe(startFrame)],
    cameraMovement: 'static',
    transitionType: 'smooth'
  }
}

function createKeyframe(frameId) {
  return {
    id: frameId,
    prompt: '',
    angle: '0',
    zoom: '1',
    translation_x: '0',
    translation_y: '0',
    translation_z: '0',
    rotation_3d_x: '0',
    rotation_3d_y: '0',
    rotation_3d_z: '0',
    noise_schedule: '0.02',
    strength_schedule: '0.65',
    contrast_schedule: '1'
  }
}

function addScene() {
  const newStartFrame = getSceneEndFrame(scenes.value.length - 1)
  scenes.value.push(createDefaultScene(newStartFrame))
}

function deleteScene(index) {
  if (scenes.value.length > 1) {
    scenes.value.splice(index, 1)
    updateSceneStartFrames()
  }
}

function duplicateScene(index) {
  const sceneToCopy = scenes.value[index]
  const newScene = JSON.parse(JSON.stringify(sceneToCopy))
  newScene.id = Date.now() + Math.random()
  newScene.name = sceneToCopy.name + ' (Copy)'
  scenes.value.splice(index + 1, 0, newScene)
  updateSceneStartFrames()
}

function editScene(index) {
  // Scene editing handled inline in the card
}

function addKeyframe(sceneIndex) {
  const scene = scenes.value[sceneIndex]
  const lastFrame = scene.frames[scene.frames.length - 1]
  const newFrameId = lastFrame.id + Math.floor((scene.duration * fps.value) / (scene.frames.length + 1))
  scene.frames.push(createKeyframe(newFrameId))
}

function deleteFrame(sceneIndex, frameIndex) {
  const scene = scenes.value[sceneIndex]
  if (scene.frames.length > 1) {
    scene.frames.splice(frameIndex, 1)
  }
}

function getSceneEndFrame(index) {
  const scene = scenes.value[index]
  return scene.startFrame + Math.floor(scene.duration * fps.value)
}

function updateSceneStartFrames() {
  let currentFrame = 0
  scenes.value.forEach((scene) => {
    scene.startFrame = currentFrame
    // Update frame IDs within the scene
    const sceneFrameCount = Math.floor(scene.duration * fps.value)
    scene.frames.forEach((frame, frameIndex) => {
      if (frameIndex === 0) {
        frame.id = currentFrame
      } else {
        const framesPerKeyframe = Math.floor(sceneFrameCount / scene.frames.length)
        frame.id = currentFrame + (frameIndex * framesPerKeyframe)
      }
    })
    currentFrame += sceneFrameCount
  })
}

function loadTemplate(template) {
  scenes.value = []
  let currentFrame = 0
  
  template.scenes.forEach(sceneTemplate => {
    const scene = createDefaultScene(currentFrame)
    scene.name = sceneTemplate.name
    scene.duration = sceneTemplate.duration
    
    // Create evenly distributed keyframes
    const framesCount = Math.floor(sceneTemplate.duration * fps.value)
    scene.frames = []
    for (let i = 0; i < sceneTemplate.frames; i++) {
      const frameId = currentFrame + Math.floor((i * framesCount) / sceneTemplate.frames)
      scene.frames.push(createKeyframe(frameId))
    }
    
    scenes.value.push(scene)
    currentFrame += framesCount
  })
  
  storyName.value = template.name
  totalDuration.value = scenes.value.reduce((sum, scene) => sum + scene.duration, 0)
  showTemplateDialog.value = false
}

function exportStory() {
  const storyConfig = {
    name: storyName.value,
    totalDuration: totalDuration.value,
    fps: fps.value,
    scenes: scenes.value,
    totalFrames: totalFrames.value,
    totalKeyframes: totalKeyframes.value,
    generatedAt: new Date().toISOString()
  }
  
  // Convert all scene frames to a flat frame list for Deforum
  const allFrames = []
  scenes.value.forEach(scene => {
    scene.frames.forEach(frame => {
      allFrames.push(frame)
    })
  })
  storyConfig.flatFrames = allFrames
  
  const blob = new Blob([JSON.stringify(storyConfig, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${storyName.value.replace(/\s+/g, '_')}_story.json`
  a.click()
  URL.revokeObjectURL(url)
}

function generateStory() {
  // Emit event to parent component to trigger story generation
  const storyData = {
    name: storyName.value,
    fps: fps.value,
    scenes: scenes.value,
    totalFrames: totalFrames.value
  }
  emit('generate:story', storyData)
}

function emitStoryUpdate() {
  emit('update:story', {
    name: storyName.value,
    scenes: scenes.value,
    totalDuration: totalDuration.value,
    fps: fps.value
  })
}

// Initialize with props if provided
if (props.initialStory) {
  storyName.value = props.initialStory.name || storyName.value
  scenes.value = props.initialStory.scenes || scenes.value
  totalDuration.value = props.initialStory.totalDuration || totalDuration.value
  fps.value = props.initialStory.fps || fps.value
}
</script>

<style scoped>
.story-builder {
  padding: 1rem;
}

.story-header-panel {
  margin-bottom: 2rem;
}

.story-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  font-size: 0.875rem;
}

.scenes-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.scene-panel {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scene-header-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.scene-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.scene-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 600;
  font-size: 0.875rem;
}

.frame-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.frame-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.frame-prompt {
  flex: 1;
}

.transition-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-item label {
  font-weight: 600;
  font-size: 0.875rem;
}

.story-summary-panel {
  position: sticky;
  bottom: 1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
  align-items: center;
  text-align: center;
}

.stat-tag {
  width: 100%;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
}

.export-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.template-panel {
  cursor: pointer;
  transition: all 0.2s;
}

.template-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.template-title {
  font-weight: 600;
  font-size: 1rem;
}

.template-description {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
