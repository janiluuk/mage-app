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
          :websocket-url="websocketUrl"
          @frame:generated="handleFrameGenerated"
          @generation:complete="handleGenerationComplete"
          @generation:error="handleGenerationError"
        />
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

import StoryBuilder from '@/components/story/StoryBuilder.vue'
import LivePreview from '@/components/story/LivePreview.vue'
import GlobalConfigComponent from '@/components/Deforum/GlobalConfigComponent.vue'
import FramesConfigComponent from '@/components/Deforum/FramesConfigComponent.vue'
import SaveNotification from '@/components/Deforum/SaveNotification.vue'
import { LocalStorage } from '@/components/Deforum/services/LocalStorage'
import Config from '@/components/Deforum/types/Config'
import UserConfig from '@/components/Deforum/types/UserConfig'
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
const storyShareUrl = ref('')
const generatingLink = ref(false)

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
  showGenerationDialog.value = true
  totalFramesToGenerate.value = storyData.totalFrames
  framesCompleted.value = 0
  generationProgress.value = 0
  generationStatus.value = 'Initializing generation...'
  
  // In a real implementation, this would start the actual generation process
  // For now, we'll just simulate it
  simulateGeneration()
}

function simulateGeneration() {
  // Simulated generation for demo purposes
  totalFramesToGenerate.value = currentStory.value?.scenes?.reduce((sum, scene) => 
    sum + (scene.frames?.length || 0) * 30, 0) || 100
  
  let generationInterval = setInterval(() => {
    framesCompleted.value++
    generationProgress.value = Math.floor((framesCompleted.value / totalFramesToGenerate.value) * 100)
    generationStatus.value = `Generating frame ${framesCompleted.value} of ${totalFramesToGenerate.value}...`
    
    if (framesCompleted.value >= totalFramesToGenerate.value) {
      clearInterval(generationInterval)
      generationStatus.value = 'Generation complete!'
      setTimeout(() => {
        showGenerationDialog.value = false
        toast.add({
          severity: 'success',
          summary: 'Story Generated',
          detail: 'Your story has been generated successfully!',
          life: 5000
        })
      }, 2000)
    }
  }, 100) // Fast simulation, real generation would be much slower
}

function cancelGeneration() {
  showGenerationDialog.value = false
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
  toast.add({
    severity: 'info',
    summary: 'Frame Generated',
    detail: `Frame ${frameData.frameId} completed`,
    life: 2000
  })
}

function handleGenerationComplete(data) {
  toast.add({
    severity: 'success',
    summary: 'Generation Complete',
    detail: `Successfully generated ${data.framesGenerated} frames`,
    life: 5000
  })
}

function handleGenerationError(error) {
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
  
  // In a real implementation, this would upload the config to a server
  // and return a shareable URL
  setTimeout(() => {
    const shareId = Math.random().toString(36).substring(2, 11)
    storyShareUrl.value = `${window.location.origin}/story/share/${shareId}`
    generatingLink.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Link Generated',
      detail: 'Share link generated successfully',
      life: 3000
    })
  }, 1000)
}

// Initialize
onMounted(() => {
  userConfig.value = LocalStorage.getUserConfig() ?? new UserConfig()
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

.mt-4 {
  margin-top: 1rem;
}
</style>
