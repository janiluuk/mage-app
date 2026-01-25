<template>
  <div class="live-preview">
    <Panel>
      <template #header>
        <div class="header-container">
          <span>Live Preview</span>
          <Badge :value="statusText" :severity="statusSeverity" />
        </div>
      </template>
      <div class="preview-container">
        <!-- Preview Canvas -->
        <div class="preview-canvas" ref="canvasContainer">
          <div v-if="!isGenerating && !previewImage" class="preview-placeholder">
            <i class="pi pi-image" style="font-size: 3rem"></i>
            <InlineMessage severity="info">Preview will appear here during generation</InlineMessage>
          </div>
          
          <img v-if="previewImage" :src="previewImage" alt="Live preview" class="preview-image" />
          
          <div v-if="isGenerating" class="preview-overlay">
            <ProgressBar :value="progress" :show-value="true" />
            <div class="generation-info">
              <Tag :value="`Frame ${currentFrame} of ${totalFrames}`" severity="info" class="mb-2" />
              <p class="current-prompt">{{ currentPrompt }}</p>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <Fieldset legend="Preview Controls" :toggleable="true" class="mt-3">
          <div class="control-row">
            <Button 
              :label="isGenerating ? 'Pause' : 'Start'" 
              :icon="isGenerating ? 'pi pi-pause' : 'pi pi-play'"
              @click="toggleGeneration"
              :class="isGenerating ? 'p-button-warning' : 'p-button-success'"
            />
            <Button 
              label="Stop" 
              icon="pi pi-stop"
              @click="stopGeneration"
              class="p-button-danger"
              :disabled="!isGenerating && !isPaused"
            />
            <Button 
              label="Skip Frame" 
              icon="pi pi-step-forward"
              @click="skipFrame"
              :disabled="!isGenerating"
            />
          </div>

          <Divider />

          <div class="control-row">
            <div class="control-item">
              <label>Refresh Rate (fps)</label>
              <Dropdown v-model="refreshRate" :options="refreshRates" option-label="label" option-value="value" />
            </div>
            
            <div class="control-item">
              <label>Quality</label>
              <Dropdown v-model="previewQuality" :options="qualityOptions" option-label="label" option-value="value" />
            </div>
          </div>

          <Divider />

          <div class="control-row">
            <div class="checkbox-item">
              <Checkbox v-model="autoSave" binary input-id="autosave" />
              <label for="autosave">Auto-save frames</label>
            </div>
            
            <div class="checkbox-item">
              <Checkbox v-model="showDebug" binary input-id="debug" />
              <label for="debug">Show debug info</label>
            </div>
          </div>
        </Fieldset>

        <!-- Live Stats -->
        <Panel v-if="isGenerating || isPaused" header="Generation Statistics" class="mt-3">
          <div class="live-stats">
            <div class="stat-item">
              <Tag value="Elapsed Time" severity="info" class="stat-tag" />
              <span class="stat-value">{{ elapsedTime }}</span>
            </div>
            <div class="stat-item">
              <Tag value="Est. Remaining" severity="warning" class="stat-tag" />
              <span class="stat-value">{{ estimatedRemaining }}</span>
            </div>
            <div class="stat-item">
              <Tag value="Avg. Frame Time" severity="success" class="stat-tag" />
              <span class="stat-value">{{ averageFrameTime }}s</span>
            </div>
            <div class="stat-item">
              <Tag value="Frames Generated" severity="secondary" class="stat-tag" />
              <span class="stat-value">{{ framesGenerated }} / {{ totalFrames }}</span>
            </div>
          </div>
        </Panel>

        <!-- Debug Info -->
        <Panel v-if="showDebug && debugInfo" header="Debug Information" :toggleable="true" class="mt-3">
          <pre class="debug-pre">{{ debugInfo }}</pre>
        </Panel>

        <!-- Frame History -->
        <Panel v-if="frameHistory.length > 0" header="Recent Frames" :toggleable="true" class="mt-3">
          <div class="history-grid">
            <div 
              v-for="frame in frameHistory.slice(-8)" 
              :key="frame.id" 
              class="history-item"
              @click="selectHistoryFrame(frame)"
              v-tooltip.top="`Frame ${frame.id}`"
            >
              <img :src="frame.thumbnail" :alt="`Frame ${frame.id}`" />
              <Badge :value="frame.id" severity="info" class="history-frame-badge" />
            </div>
          </div>
        </Panel>
      </div>
    </Panel>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import Fieldset from 'primevue/fieldset'
import InlineMessage from 'primevue/inlinemessage'
import Panel from 'primevue/panel'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import GenerationService from '@/services/story/GenerationService'

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  jobId: {
    type: String,
    default: null
  },
  websocketUrl: {
    type: String,
    default: null
  },
  generationService: {
    type: Object,
    default: () => new GenerationService()
  }
})

const emit = defineEmits(['frame:generated', 'generation:complete', 'generation:error'])

// State
const isGenerating = ref(false)
const isPaused = ref(false)
const currentFrame = ref(0)
const totalFrames = ref(100)
const framesGenerated = ref(0)
const currentPrompt = ref('')
const previewImage = ref(null)
const progress = ref(0)
const startTime = ref(null)
const frameHistory = ref([])
const debugInfo = ref(null)
const lastError = ref(null)

// Settings
const refreshRate = ref(2)
const previewQuality = ref('medium')
const autoSave = ref(true)
const showDebug = ref(false)

// Options
const refreshRates = [
  { label: '1 FPS (Slow)', value: 1 },
  { label: '2 FPS (Medium)', value: 2 },
  { label: '5 FPS (Fast)', value: 5 },
  { label: '10 FPS (Very Fast)', value: 10 }
]

const qualityOptions = [
  { label: 'Low (Fast)', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High (Slow)', value: 'high' }
]

const service = props.generationService
let ws = null

// Computed properties
const statusSeverity = computed(() => {
  if (isGenerating.value) return 'success'
  if (isPaused.value) return 'warning'
  return 'secondary'
})

const statusIcon = computed(() => {
  if (isGenerating.value) return 'pi pi-spin pi-spinner'
  if (isPaused.value) return 'pi pi-pause'
  return 'pi pi-circle'
})

const statusText = computed(() => {
  if (isGenerating.value) return 'Generating'
  if (isPaused.value) return 'Paused'
  return 'Idle'
})

const elapsedTime = computed(() => {
  if (!startTime.value) return '00:00'
  const elapsed = Date.now() - startTime.value
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const averageFrameTime = computed(() => {
  if (framesGenerated.value === 0) return '0.0'
  const elapsed = (Date.now() - startTime.value) / 1000
  return (elapsed / framesGenerated.value).toFixed(1)
})

const estimatedRemaining = computed(() => {
  if (framesGenerated.value === 0) return '--:--'
  const avgTime = parseFloat(averageFrameTime.value)
  const remainingFrames = totalFrames.value - framesGenerated.value
  const remainingSeconds = avgTime * remainingFrames
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = Math.floor(remainingSeconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Methods
function toggleGeneration() {
  if (isGenerating.value) {
    pauseGeneration()
  } else {
    startGeneration()
  }
}

function startGeneration() {
  if (!props.jobId) {
    emit('generation:error', new Error('No active generation job. Start a story job first.'))
    return
  }

  isGenerating.value = true
  isPaused.value = false

  if (!startTime.value) {
    startTime.value = Date.now()
  }

  if (props.websocketUrl && !ws) {
    connectWebSocket()
  }
}

async function pauseGeneration() {
  isGenerating.value = false
  isPaused.value = true

  if (props.jobId) {
    try {
      await service.pauseBatch(props.jobId)
    } catch (error) {
      emit('generation:error', error)
    }
  }
}

async function stopGeneration() {
  isGenerating.value = false
  isPaused.value = false
  currentFrame.value = 0
  framesGenerated.value = 0
  progress.value = 0
  startTime.value = null
  lastError.value = null

  if (props.jobId) {
    try {
      await service.cancelBatch(props.jobId)
    } catch (error) {
      emit('generation:error', error)
    }
  }

  if (ws) {
    ws.close()
    ws = null
  }
}

function skipFrame() {
  if (ws) {
    ws.send(JSON.stringify({ action: 'skip' }))
  }
}

function connectWebSocket() {
  ws = service.connectWebSocket({
    websocketUrl: props.websocketUrl,
    config: props.config,
    refreshRate: refreshRate.value,
    quality: previewQuality.value,
    batchId: props.jobId,
    onMessage: (data) => {
      handleWebSocketMessage(data).catch((error) => {
        console.error('Error handling websocket message:', error)
        emit('generation:error', error)
      })
    },
    onError: (error) => {
      lastError.value = error
      emit('generation:error', error)
      stopGeneration().catch((err) => {
        console.error('Error stopping generation after websocket error:', err)
      })
    },
    onClose: () => {
      if (isGenerating.value) {
        stopGeneration().catch((err) => {
          console.error('Error stopping generation after websocket close:', err)
        })
      }
    }
  })
}

async function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'frame':
      currentFrame.value = data.frameId
      currentPrompt.value = data.prompt
      previewImage.value = data.imageUrl || data.image
      framesGenerated.value = data.framesGenerated ?? framesGenerated.value + 1
      updateProgress()

      if (autoSave.value && props.jobId) {
        try {
          // Persist frame to backend. Both `image` (base64) and `imageUrl` (URL) are sent
          // to support different backend storage strategies. The backend determines which to use.
          const persisted = await service.persistFrame(props.jobId, {
            frameId: data.frameId,
            prompt: data.prompt,
            image: data.image,
            imageUrl: data.imageUrl
          })

          frameHistory.value.push({
            id: persisted.frameId ?? data.frameId,
            thumbnail: persisted.thumbnailUrl ?? persisted.imageUrl ?? data.imageUrl ?? data.image,
            prompt: data.prompt,
            timestamp: Date.now()
          })
        } catch (error) {
          frameHistory.value.push({
            id: data.frameId,
            thumbnail: data.imageUrl || data.image,
            prompt: data.prompt,
            timestamp: Date.now()
          })
          emit('generation:error', error)
        }
      }

      emit('frame:generated', data)
      break

    case 'progress':
      currentFrame.value = data.currentFrame ?? currentFrame.value
      totalFrames.value = data.totalFrames ?? totalFrames.value
      framesGenerated.value = data.completedFrames ?? framesGenerated.value
      currentPrompt.value = data.currentPrompt ?? currentPrompt.value
      updateProgress()
      break

    case 'complete':
      await stopGeneration()
      emit('generation:complete', data)
      break

    case 'error':
      lastError.value = data.error
      emit('generation:error', data.error)
      await stopGeneration()
      break

    case 'debug':
      if (showDebug.value) {
        debugInfo.value = data.info
      }
      break
  }
}

function updateProgress() {
  progress.value = Math.floor((currentFrame.value / totalFrames.value) * 100)
}

function selectHistoryFrame(frame) {
  previewImage.value = frame.thumbnail
  currentPrompt.value = frame.prompt
  currentFrame.value = frame.id
}

// Watch for config changes
watch(() => props.config, (newConfig) => {
  if (newConfig?.frames) {
    totalFrames.value = newConfig.frames.length * (newConfig.fps || 30)
  }
}, { deep: true, immediate: true })

watch(() => props.jobId, async (jobId, oldJobId) => {
  if (!jobId || !props.websocketUrl || jobId === oldJobId) {
    return
  }

  if (isGenerating.value) {
    await stopGeneration()
  }

  startGeneration()
})

watch([refreshRate, previewQuality], () => {
  if (isGenerating.value && props.websocketUrl) {
    if (ws) {
      ws.close()
      ws = null
    }
    connectWebSocket()
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<style scoped>
.live-preview {
  width: 100%;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preview-container {
  display: flex;
  flex-direction: column;
}

.preview-canvas {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 1rem;
  color: white;
}

.generation-info {
  margin-top: 0.5rem;
}

.current-prompt {
  font-size: 0.875rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  color: white;
}

.control-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.control-item label {
  font-size: 0.875rem;
  font-weight: 600;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item label {
  font-size: 0.875rem;
  cursor: pointer;
}

.live-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
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
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-color);
}

.debug-pre {
  margin: 0;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 6px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.history-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  border: 2px solid var(--surface-border);
}

.history-item:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
}

.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-frame-badge {
  position: absolute;
  bottom: 0.25rem;
  left: 50%;
  transform: translateX(-50%);
}

.mt-3 {
  margin-top: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
