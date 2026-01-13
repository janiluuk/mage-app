<template>
  <div class="story-creator">
    <div class="page-header">
      <h1>Story Creator</h1>
      <p class="subtitle">Create longer, narrative-driven animations with live preview - inspired by deforum.studio</p>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <!-- Story Builder Tab -->
      <TabPanel header="Story Builder">
        <StoryBuilder 
          :initial-story="currentStory"
          @update:story="handleStoryUpdate"
          @generate:story="handleGenerateStory"
        />
      </TabPanel>

      <!-- Advanced Editor Tab -->
      <TabPanel header="Advanced Settings">
        <Card>
          <template #title>Global Animation Settings</template>
          <template #content>
            <GlobalConfigComponent 
              :config="deforumConfig" 
              @update:configValue="handleDeforumConfigChange" 
            />
          </template>
        </Card>

        <Card class="mt-4">
          <template #title>Frame Configuration</template>
          <template #content>
            <FramesConfigComponent 
              :frameList="deforumConfig.frames" 
              :stepIncrement="userConfig.stepIncrement ?? 1"
              :isExpressionModeEnabled="userConfig.isExpressionModeEnabled ?? false"
              :promptStyle="deforumConfig.promptStyle ?? ''" 
              :substractXFrames="deforumConfig.substractXFrames ?? 0"
              @user-config:step-increment-change="handleStepIncrementChange"
              @user-config:expression-mode-change="handleExpressionModeChange"
              @update:frameList="handleFrameListChange" 
              @update:addFrameBetween="handleAddFrameBetween"
              @update:prompt-style="handlePromptStyleChange"
              @update:substract-x-frames="handleSubstractXFramesChange" 
            />
          </template>
        </Card>
      </TabPanel>

      <!-- Live Preview Tab -->
      <TabPanel header="Live Preview">
        <LivePreview 
          :config="generationConfig"
          :job-id="generationJobId"
          :websocket-url="websocketUrl"
          @frame:generated="handleFrameGenerated"
          @generation:complete="handleGenerationComplete"
          @generation:error="handleGenerationError"
        />

        <Card class="mt-4">
          <template #title>Extend Generation</template>
          <template #content>
            <div class="extend-controls">
              <p class="extend-description">
                Extend the current generation with the same parameters or supply updated settings for the next clip.
              </p>
              <div class="extend-actions">
                <Button 
                  label="Extend with Last Parameters" 
                  icon="pi pi-plus"
                  class="p-button-primary"
                  @click="extendGenerationJob"
                  :disabled="!generationSegments.length || generationJobId || showGenerationDialog"
                />
                <Button 
                  label="Extend with Current Settings" 
                  icon="pi pi-sync"
                  class="p-button-outlined"
                  @click="extendGenerationJob({ useCurrent: true })"
                  :disabled="!generationSegments.length || generationJobId || showGenerationDialog"
                />
              </div>
              <div class="extend-overrides">
                <div class="checkbox-item">
                  <Checkbox v-model="useOverrideConfig" binary input-id="extendOverride" />
                  <label for="extendOverride">Override parameters (JSON)</label>
                </div>
                <Textarea
                  v-model="overrideConfigText"
                  class="override-textarea"
                  placeholder="Paste JSON to override parameters for the next clip"
                  :disabled="!useOverrideConfig"
                  auto-resize
                  rows="6"
                />
              </div>
            </div>
          </template>
        </Card>

        <Card class="mt-4">
          <template #title>Generation Parameters Overview</template>
          <template #content>
            <div v-if="generationSegments.length === 0" class="empty-overview">
              No generation segments yet. Start a job to see parameters per clip.
            </div>
            <div v-else class="segment-overview">
              <div 
                v-for="segment in generationSegments" 
                :key="segment.id"
                class="segment-card"
              >
                <div class="segment-header">
                  <strong>Segment {{ segment.id }}</strong>
                  <span class="segment-meta">Job: {{ segment.batchId }}</span>
                  <span class="segment-meta">Started: {{ segment.startedAt }}</span>
                </div>
                <pre class="segment-config">{{ segment.config }}</pre>
              </div>
            </div>
          </template>
        </Card>
      </TabPanel>

      <!-- Export Tab -->
      <TabPanel header="Export & Share">
        <Card>
          <template #title>Export Options</template>
          <template #content>
            <div class="export-options">
              <div class="export-section">
                <h3>Configuration Export</h3>
                <p>Export your story configuration for use with Deforum or other tools</p>
                <div class="button-group">
                  <Button 
                    label="Export JSON Config" 
                    icon="pi pi-download" 
                    @click="exportJSON"
                    class="p-button-outlined"
                  />
                  <Button 
                    label="Export as Deforum Settings" 
                    icon="pi pi-file-export" 
                    @click="exportDeforumSettings"
                    class="p-button-outlined"
                  />
                  <Button 
                    label="Copy to Clipboard" 
                    icon="pi pi-copy" 
                    @click="copyToClipboard"
                    class="p-button-outlined"
                  />
                </div>
              </div>

              <Divider />

              <div class="export-section">
                <h3>Story Package</h3>
                <p>Create a complete package with all scenes, prompts, and settings</p>
                <div class="button-group">
                  <Button 
                    label="Download Story Package" 
                    icon="pi pi-download" 
                    @click="exportStoryPackage"
                    class="p-button-primary"
                  />
                </div>
              </div>

              <Divider />

              <div class="export-section">
                <h3>Share Story</h3>
                <p>Share your story configuration with others</p>
                <div class="form-group">
                  <InputText 
                    v-model="storyShareUrl" 
                    placeholder="Story share URL will appear here" 
                    readonly 
                    class="share-url-input"
                  />
                  <Button 
                    label="Generate Share Link" 
                    icon="pi pi-share-alt" 
                    @click="generateShareLink"
                    :loading="generatingLink"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </TabPanel>
    </TabView>

    <!-- Save Notification -->
    <SaveNotification 
      :isSaveNotificationVisible="isSaveNotificationVisible"
      @save-notification:close="closeSaveNotification" 
    />

    <!-- Generation Progress Dialog -->
    <Dialog 
      v-model:visible="showGenerationDialog" 
      header="Generating Story" 
      :modal="true" 
      :closable="false"
      :style="{ width: '50vw' }"
    >
      <div class="generation-progress">
        <ProgressBar :value="generationProgress" :show-value="true" />
        <p class="progress-text">{{ generationStatus }}</p>
        <div class="generation-stats">
          <div class="stat">
            <span>Frames Completed:</span>
            <strong>{{ framesCompleted }} / {{ totalFramesToGenerate }}</strong>
          </div>
          <div class="stat">
            <span>Estimated Time Remaining:</span>
            <strong>{{ estimatedTimeRemaining }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="cancelGeneration" class="p-button-danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Textarea from 'primevue/textarea'

import StoryBuilder from '@/components/story/StoryBuilder.vue'
import LivePreview from '@/components/story/LivePreview.vue'
import GlobalConfigComponent from '@/components/Deforum/GlobalConfigComponent.vue'
import FramesConfigComponent from '@/components/Deforum/FramesConfigComponent.vue'
import SaveNotification from '@/components/Deforum/SaveNotification.vue'
import { LocalStorage } from '@/components/Deforum/services/LocalStorage'
import Config from '@/components/Deforum/types/Config'
import UserConfig from '@/components/Deforum/types/UserConfig'
import GenerationService from '@/services/story/GenerationService'
import env from '@/utils/env'

const router = useRouter()
const toast = useToast()

// State
const activeTab = ref(0)
const currentStory = ref(null)
const deforumConfig = ref(new Config())
const userConfig = ref(new UserConfig())
const isSaveNotificationVisible = ref(false)
const showGenerationDialog = ref(false)
const generationProgress = ref(0)
const generationStatus = ref('')
const framesCompleted = ref(0)
const totalFramesToGenerate = ref(0)
const generationJobId = ref(null)
const storyShareUrl = ref('')
const generatingLink = ref(false)
const generationSegments = ref([])
const useOverrideConfig = ref(false)
const overrideConfigText = ref('')
const generationService = new GenerationService()
let statusPoller = null

// Configuration constants
const STATUS_POLLING_INTERVAL_MS = 3000

// WebSocket URL - can be configured via environment variable
const websocketUrl = computed(() => {
  return env.VITE_APP_DEFORUM_WS_URL || null
})

// Generation config combines story and deforum settings
const generationConfig = computed(() => {
  return {
    ...deforumConfig.value,
    story: currentStory.value
  }
})

const estimatedTimeRemaining = computed(() => {
  if (framesCompleted.value === 0) return '--:--'
  // Rough estimation based on average frame time
  const avgTimePerFrame = 3 // seconds, can be dynamic
  const remaining = (totalFramesToGenerate.value - framesCompleted.value) * avgTimePerFrame
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return `${minutes}m ${seconds}s`
})

// Methods
function handleStoryUpdate(story) {
  currentStory.value = story
  
  // Update deforum config with story frames
  if (story.scenes) {
    const allFrames = []
    story.scenes.forEach(scene => {
      scene.frames.forEach(frame => {
        allFrames.push(frame)
      })
    })
    deforumConfig.value.frames = allFrames
    deforumConfig.value.fps = story.fps
  }
  
  showSaveNotification()
}

function handleGenerateStory(storyData) {
  startGenerationJob(storyData)
}

async function startGenerationJob(storyData) {
  showGenerationDialog.value = true
  totalFramesToGenerate.value = storyData.totalFrames
  framesCompleted.value = 0
  generationProgress.value = 0
  generationStatus.value = 'Initializing generation...'

  try {
    const response = await generationService.startGeneration(generationConfig.value)
    generationJobId.value = response.batchId
    generationStatus.value = 'Generation started. Waiting for frames...'

    if (response.totalFrames) {
      totalFramesToGenerate.value = response.totalFrames
    }

    addGenerationSegment({
      batchId: response.batchId,
      config: generationConfig.value
    })

    startStatusPolling()
  } catch (error) {
    generationStatus.value = 'Failed to start generation'
    showGenerationDialog.value = false
    generationJobId.value = null
    toast.add({
      severity: 'error',
      summary: 'Generation Error',
      detail: error.message || 'Unable to start generation job',
      life: 5000
    })
  }
}

async function extendGenerationJob({ useCurrent = false } = {}) {
  const lastSegment = generationSegments.value.at(-1)

  if (useCurrent && !lastSegment) {
    toast.add({
      severity: 'warn',
      summary: 'No Previous Generation',
      detail: 'Start a generation job before extending it.',
      life: 3000
    })
    return
  }

  const baseConfig = useCurrent ? generationConfig.value : lastSegment?.rawConfig
  const baseBatchId = lastSegment?.batchId

  if (!baseConfig) {
    toast.add({
      severity: 'warn',
      summary: 'No Previous Generation',
      detail: 'Start a generation job before extending it.',
      life: 3000
    })
    return
  }

  let nextConfig = baseConfig

  if (useOverrideConfig.value && overrideConfigText.value.trim()) {
    try {
      const overrides = JSON.parse(overrideConfigText.value)
      nextConfig = {
        ...baseConfig,
        ...overrides
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'Override parameters must be valid JSON.',
        life: 3000
      })
      return
    }
  }

  showGenerationDialog.value = true
  generationStatus.value = 'Extending generation with new parameters...'

  try {
    const response = await generationService.extendGeneration(baseBatchId, nextConfig)
    generationJobId.value = response.batchId

    if (response.totalFrames) {
      totalFramesToGenerate.value = response.totalFrames
    }

    addGenerationSegment({
      batchId: response.batchId,
      config: nextConfig
    })

    startStatusPolling()
  } catch (error) {
    generationStatus.value = 'Failed to extend generation'
    showGenerationDialog.value = false
    toast.add({
      severity: 'error',
      summary: 'Extend Failed',
      detail: error.message || 'Unable to extend generation job',
      life: 5000
    })
  }
}

function addGenerationSegment({ batchId, config }) {
  const id = generationSegments.value.length + 1
  generationSegments.value.push({
    id,
    batchId,
    startedAt: new Date().toLocaleString(),
    config: JSON.stringify(config, null, 2),
    rawConfig: config
  })
}

function startStatusPolling() {
  stopStatusPolling()

  if (!generationJobId.value) return

  statusPoller = setInterval(async () => {
    try {
      const status = await generationService.getBatchStatus(generationJobId.value)
      updateStatusFromResponse(status)
    } catch (error) {
      stopStatusPolling()
      toast.add({
        severity: 'warn',
        summary: 'Status Update Failed',
        detail: error.message || 'Unable to fetch generation status',
        life: 4000
      })
    }
  }, STATUS_POLLING_INTERVAL_MS)
}

function stopStatusPolling() {
  if (statusPoller) {
    clearInterval(statusPoller)
    statusPoller = null
  }
}

function updateStatusFromResponse(status) {
  if (!status) return

  framesCompleted.value = status.completedFrames ?? framesCompleted.value
  totalFramesToGenerate.value = status.totalFrames ?? totalFramesToGenerate.value
  generationProgress.value = status.progress ?? Math.floor((framesCompleted.value / totalFramesToGenerate.value) * 100)
  generationStatus.value = status.status || generationStatus.value
}

function cancelGeneration() {
  showGenerationDialog.value = false
  stopStatusPolling()

  if (generationJobId.value) {
    generationService.cancelBatch(generationJobId.value)
      .catch((error) => {
        console.error('Failed to cancel generation batch', error)
      })
  }
  generationJobId.value = null
  toast.add({
    severity: 'warn',
    summary: 'Generation Cancelled',
    detail: 'Story generation was cancelled',
    life: 3000
  })
}

function handleDeforumConfigChange(newConfig) {
  deforumConfig.value = newConfig
  showSaveNotification()
}

function handleFrameListChange(newFrameList) {
  deforumConfig.value.frames = newFrameList
  showSaveNotification()
}

function handleAddFrameBetween(index) {
  // Implementation from Deforum.vue
  showSaveNotification()
}

function handleStepIncrementChange(newIncrement) {
  userConfig.value.stepIncrement = newIncrement
  LocalStorage.saveUserConfig(userConfig.value)
  showSaveNotification()
}

function handleExpressionModeChange(newIsExpressionModeEnabled) {
  userConfig.value.isExpressionModeEnabled = newIsExpressionModeEnabled
  LocalStorage.saveUserConfig(userConfig.value)
  showSaveNotification()
}

function handlePromptStyleChange(newPromptStyle) {
  deforumConfig.value.promptStyle = newPromptStyle
  showSaveNotification()
}

function handleSubstractXFramesChange(newSubstractXFrames) {
  deforumConfig.value.substractXFrames = newSubstractXFrames
  showSaveNotification()
}

function handleFrameGenerated(frameData) {
  framesCompleted.value++
  if (totalFramesToGenerate.value > 0) {
    generationProgress.value = Math.floor((framesCompleted.value / totalFramesToGenerate.value) * 100)
  }
  if (frameData?.frameId !== undefined) {
    generationStatus.value = `Generating frame ${frameData.frameId} of ${totalFramesToGenerate.value}...`
  }
  toast.add({
    severity: 'info',
    summary: 'Frame Generated',
    detail: `Frame ${frameData.frameId} completed`,
    life: 2000
  })
}

function handleGenerationComplete(data) {
  stopStatusPolling()
  showGenerationDialog.value = false
  generationStatus.value = 'Generation complete'
  generationJobId.value = null
  toast.add({
    severity: 'success',
    summary: 'Generation Complete',
    detail: `Successfully generated ${data.framesGenerated} frames`,
    life: 5000
  })
}

function handleGenerationError(error) {
  stopStatusPolling()
  generationJobId.value = null
  toast.add({
    severity: 'error',
    summary: 'Generation Error',
    detail: error.message || 'An error occurred during generation',
    life: 5000
  })
}

function showSaveNotification() {
  isSaveNotificationVisible.value = true
  setTimeout(() => {
    isSaveNotificationVisible.value = false
  }, 3000)
}

function closeSaveNotification() {
  isSaveNotificationVisible.value = false
}

function exportJSON() {
  const exportData = {
    story: currentStory.value,
    config: deforumConfig.value,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentStory.value?.name || 'story'}_config.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Exported',
    detail: 'Story configuration exported successfully',
    life: 3000
  })
}

function exportDeforumSettings() {
  // Export in Deforum-compatible format
  const deforumSettings = {
    ...deforumConfig.value,
    animation_prompts: {},
    angle: {},
    zoom: {},
    translation_x: {},
    translation_y: {},
    translation_z: {},
    rotation_3d_x: {},
    rotation_3d_y: {},
    rotation_3d_z: {}
  }
  
  // Convert frames to Deforum format
  deforumConfig.value.frames.forEach(frame => {
    deforumSettings.animation_prompts[frame.id] = frame.prompt
    if (frame.angle) deforumSettings.angle[frame.id] = frame.angle
    if (frame.zoom) deforumSettings.zoom[frame.id] = frame.zoom
    if (frame.translation_x) deforumSettings.translation_x[frame.id] = frame.translation_x
    if (frame.translation_y) deforumSettings.translation_y[frame.id] = frame.translation_y
    if (frame.translation_z) deforumSettings.translation_z[frame.id] = frame.translation_z
    if (frame.rotation_3d_x) deforumSettings.rotation_3d_x[frame.id] = frame.rotation_3d_x
    if (frame.rotation_3d_y) deforumSettings.rotation_3d_y[frame.id] = frame.rotation_3d_y
    if (frame.rotation_3d_z) deforumSettings.rotation_3d_z[frame.id] = frame.rotation_3d_z
  })
  
  const blob = new Blob([JSON.stringify(deforumSettings, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentStory.value?.name || 'story'}_deforum_settings.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Exported',
    detail: 'Deforum settings exported successfully',
    life: 3000
  })
}

function copyToClipboard() {
  const exportData = {
    story: currentStory.value,
    config: deforumConfig.value
  }
  
  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    .then(() => {
      toast.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Configuration copied to clipboard',
        life: 3000
      })
    })
    .catch(() => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard',
        life: 3000
      })
    })
}

function exportStoryPackage() {
  // Create a comprehensive package with all story data
  const packageData = {
    meta: {
      name: currentStory.value?.name || 'Untitled Story',
      version: '1.0',
      createdAt: new Date().toISOString(),
      totalScenes: currentStory.value?.scenes?.length || 0,
      totalFrames: totalFramesToGenerate.value
    },
    story: currentStory.value,
    deforumConfig: deforumConfig.value,
    userConfig: userConfig.value
  }
  
  const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${packageData.meta.name.replace(/\s+/g, '_')}_package.json`
  a.click()
  URL.revokeObjectURL(url)
  
  toast.add({
    severity: 'success',
    summary: 'Exported',
    detail: 'Story package exported successfully',
    life: 3000
  })
}

function generateShareLink() {
  generatingLink.value = true

  generationService.createShareLink({
    story: currentStory.value,
    config: deforumConfig.value,
    batchId: generationJobId.value
  })
    .then((response) => {
      // Normalize backend response: expected field is `shareUrl`; other fields are kept for backward compatibility.
      const shareUrl = response.shareUrl ?? response.share_link ?? response.url

      if (!shareUrl) {
        throw new Error('Backend response did not include a shareUrl')
      }

      storyShareUrl.value = shareUrl
      generatingLink.value = false

      toast.add({
        severity: 'success',
        summary: 'Link Generated',
        detail: 'Share link generated successfully',
        life: 3000
      })
    })
    .catch((error) => {
      generatingLink.value = false
      toast.add({
        severity: 'error',
        summary: 'Share Failed',
        detail: error.message || 'Unable to generate share link',
        life: 3000
      })
    })
}

// Initialize
onMounted(() => {
  userConfig.value = LocalStorage.getUserConfig() ?? new UserConfig()
})

onBeforeUnmount(() => {
  stopStatusPolling()
})
</script>

<style scoped>
.story-creator {
  padding: 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.export-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.export-section p {
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.share-url-input {
  flex: 1;
}

.generation-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-text {
  text-align: center;
  font-weight: 600;
  margin: 0;
}

.generation-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.generation-stats .stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.generation-stats .stat span {
  font-size: 0.875rem;
  color: #6b7280;
}

.generation-stats .stat strong {
  font-size: 1.25rem;
  color: #1f2937;
}

.extend-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.extend-description {
  margin: 0;
  color: #4b5563;
}

.extend-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.extend-overrides {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.override-textarea {
  width: 100%;
}

.empty-overview {
  color: #6b7280;
  font-size: 0.95rem;
}

.segment-overview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.segment-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.segment-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.segment-meta {
  color: #6b7280;
  font-size: 0.875rem;
}

.segment-config {
  margin: 0;
  font-size: 0.75rem;
  background: #111827;
  color: #f9fafb;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
