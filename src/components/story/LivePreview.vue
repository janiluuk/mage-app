<template>
  <div class="live-preview">
    <Card>
      <template #title>
        <div class="header-container">
          <span>Live Preview</span>
          <div class="status-badge" :class="statusClass">
            <i :class="statusIcon"></i>
            {{ statusText }}
          </div>
        </div>
      </template>
      <template #content>
        <div class="preview-container">
          <!-- Preview Canvas -->
          <div class="preview-canvas" ref="canvasContainer">
            <div v-if="!isGenerating && !previewImage" class="preview-placeholder">
              <i class="pi pi-image" style="font-size: 3rem"></i>
              <p>Preview will appear here during generation</p>
            </div>
            
            <img v-if="previewImage" :src="previewImage" alt="Live preview" class="preview-image" />
            
            <div v-if="isGenerating" class="preview-overlay">
              <ProgressBar :value="progress" :show-value="true" />
              <div class="generation-info">
                <p class="current-frame">Frame {{ currentFrame }} of {{ totalFrames }}</p>
                <p class="current-prompt">{{ currentPrompt }}</p>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="preview-controls">
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
          </div>

          <!-- Live Stats -->
          <div v-if="isGenerating || isPaused" class="live-stats">
            <div class="stat-item">
              <span class="stat-label">Elapsed Time</span>
              <span class="stat-value">{{ elapsedTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Est. Remaining</span>
              <span class="stat-value">{{ estimatedRemaining }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Avg. Frame Time</span>
              <span class="stat-value">{{ averageFrameTime }}s</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Frames Generated</span>
              <span class="stat-value">{{ framesGenerated }} / {{ totalFrames }}</span>
            </div>
          </div>

          <!-- Debug Info -->
          <div v-if="showDebug && debugInfo" class="debug-info">
            <h4>Debug Information</h4>
            <pre>{{ debugInfo }}</pre>
          </div>

          <!-- Frame History -->
          <div v-if="frameHistory.length > 0" class="frame-history">
            <h4>Recent Frames</h4>
            <div class="history-grid">
              <div 
                v-for="frame in frameHistory.slice(-8)" 
                :key="frame.id" 
                class="history-item"
                @click="selectHistoryFrame(frame)"
              >
                <img :src="frame.thumbnail" :alt="`Frame ${frame.id}`" />
                <span class="history-frame-id">{{ frame.id }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import ProgressBar from 'primevue/progressbar'

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  websocketUrl: {
    type: String,
    default: null
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

// WebSocket connection
let ws = null
let updateInterval = null

// Computed properties
const statusClass = computed(() => {
  if (isGenerating.value) return 'status-generating'
  if (isPaused.value) return 'status-paused'
  return 'status-idle'
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
  isGenerating.value = true
  isPaused.value = false
  
  if (!startTime.value) {
    startTime.value = Date.now()
  }
  
  // Initialize WebSocket connection if URL provided
  if (props.websocketUrl && !ws) {
    connectWebSocket()
  } else {
    // Fallback to simulated generation for demo
    startSimulatedGeneration()
  }
}

function pauseGeneration() {
  isGenerating.value = false
  isPaused.value = true
  
  if (ws) {
    ws.send(JSON.stringify({ action: 'pause' }))
  }
  
  if (updateInterval) {
    clearInterval(updateInterval)
  }
}

function stopGeneration() {
  isGenerating.value = false
  isPaused.value = false
  currentFrame.value = 0
  framesGenerated.value = 0
  progress.value = 0
  startTime.value = null
  
  if (ws) {
    ws.send(JSON.stringify({ action: 'stop' }))
    ws.close()
    ws = null
  }
  
  if (updateInterval) {
    clearInterval(updateInterval)
  }
}

function skipFrame() {
  if (ws) {
    ws.send(JSON.stringify({ action: 'skip' }))
  } else {
    currentFrame.value++
    updateProgress()
  }
}

function connectWebSocket() {
  ws = new WebSocket(props.websocketUrl)
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      action: 'start',
      config: props.config,
      refreshRate: refreshRate.value,
      quality: previewQuality.value
    }))
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }
  
  ws.onerror = (error) => {
    emit('generation:error', error)
    stopGeneration()
  }
  
  ws.onclose = () => {
    if (isGenerating.value) {
      stopGeneration()
    }
  }
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'frame':
      currentFrame.value = data.frameId
      currentPrompt.value = data.prompt
      previewImage.value = data.image
      framesGenerated.value++
      updateProgress()
      
      if (autoSave.value) {
        frameHistory.value.push({
          id: data.frameId,
          thumbnail: data.image,
          prompt: data.prompt,
          timestamp: Date.now()
        })
      }
      
      emit('frame:generated', data)
      break
      
    case 'complete':
      stopGeneration()
      emit('generation:complete', data)
      break
      
    case 'error':
      emit('generation:error', data.error)
      stopGeneration()
      break
      
    case 'debug':
      if (showDebug.value) {
        debugInfo.value = data.info
      }
      break
  }
}

function startSimulatedGeneration() {
  // Simulated generation for demo purposes
  totalFrames.value = props.config.frames?.length * 30 || 100
  
  updateInterval = setInterval(() => {
    if (!isGenerating.value) return
    
    currentFrame.value++
    framesGenerated.value++
    
    // Simulate frame generation
    const frameIndex = currentFrame.value % (props.config.frames?.length || 10)
    currentPrompt.value = props.config.frames?.[frameIndex]?.prompt || 'Generating frame...'
    
    updateProgress()
    
    // Simulate preview image update
    if (currentFrame.value % refreshRate.value === 0) {
      // In real implementation, this would be actual frame data
      previewImage.value = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect fill="%23${Math.floor(Math.random()*16777215).toString(16)}" width="512" height="512"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24">Frame ${currentFrame.value}</text></svg>`
    }
    
    if (currentFrame.value >= totalFrames.value) {
      stopGeneration()
      emit('generation:complete', { framesGenerated: framesGenerated.value })
    }
  }, 1000 / refreshRate.value)
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

// Cleanup
onBeforeUnmount(() => {
  if (ws) {
    ws.close()
  }
  if (updateInterval) {
    clearInterval(updateInterval)
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

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-idle {
  background: #e5e7eb;
  color: #6b7280;
}

.status-generating {
  background: #dcfce7;
  color: #16a34a;
}

.status-paused {
  background: #fef3c7;
  color: #d97706;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  color: #9ca3af;
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

.current-frame {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.current-prompt {
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
}

.preview-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
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
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.debug-info {
  padding: 1rem;
  background: #1f2937;
  border-radius: 8px;
  color: #f9fafb;
}

.debug-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.debug-info pre {
  margin: 0;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.frame-history h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
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
}

.history-item:hover {
  transform: scale(1.05);
}

.history-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-frame-id {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.75rem;
  text-align: center;
  padding: 0.25rem;
}
</style>
