<template>
  <div class="soundscape-generator">
    <TabView v-model:activeIndex="activeTab">
      <!-- ═══ Create Tab ═══ -->
      <TabPanel header="Create">
        <div class="tab-content">
          <div class="field">
            <label class="font-semibold block mb-2">Describe your soundscape</label>
            <Textarea
              v-model="prompt"
              autoResize
              placeholder="e.g. Ocean waves crashing with distant seagulls and a gentle breeze..."
              rows="3"
              class="w-full"
            />
          </div>

          <div class="field">
            <label class="font-semibold block mb-2">Mood</label>
            <div class="mood-tags">
              <Button
                v-for="mood in moods"
                :key="mood"
                :label="mood"
                size="small"
                :outlined="selectedMood !== mood"
                :severity="selectedMood === mood ? 'info' : 'secondary'"
                @click="selectedMood = selectedMood === mood ? '' : mood"
              />
            </div>
          </div>

          <div class="field">
            <label class="font-semibold block mb-2">
              Duration: {{ duration }}s
            </label>
            <Slider
              v-model="duration"
              :min="1"
              :max="30"
              :step="1"
              class="w-full"
            />
            <div class="flex justify-content-between mt-1">
              <small class="text-color-secondary">1s</small>
              <small class="text-color-secondary">30s</small>
            </div>
          </div>

          <div class="actions">
            <Button
              label="Generate Soundscape"
              icon="pi pi-play"
              :loading="generating"
              :disabled="!canGenerate"
              @click="generateSoundscape"
            />
          </div>

          <div v-if="audioSrc" class="preview">
            <AudioVisualizer :audio="audioPlayer" />
            <audio
              :src="audioSrc"
              controls
              loop
              ref="audioPlayer"
            />
          </div>
        </div>
      </TabPanel>

      <!-- ═══ Speak Tab ═══ -->
      <TabPanel header="Speak">
        <div class="tab-content">
          <div class="field">
            <label class="font-semibold block mb-2">Voice Mode</label>
            <Dropdown
              v-model="voiceMode"
              :options="voiceModeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select voice processing mode"
              class="w-full"
            />
            <small class="text-color-secondary mt-1 block">
              <span v-if="voiceMode === 'as_is'">Record your voice and use it as-is for the soundscape.</span>
              <span v-else>Clone and transform your voice using AI.</span>
            </small>
          </div>

          <div class="mic-section">
            <div
              class="mic-button"
              :class="{ 'mic-button--recording': recording }"
              @click="toggleRecording"
            >
              <i :class="recording ? 'pi pi-stop-circle' : 'pi pi-microphone'" />
            </div>
            <p class="mic-label">
              <template v-if="recording">
                <span class="recording-indicator" />
                Recording... {{ recordingTime }}s
              </template>
              <template v-else-if="recordedBlob">
                Recording captured ({{ recordingDuration }}s)
              </template>
              <template v-else>
                Tap to start recording
              </template>
            </p>
          </div>

          <div v-if="recordedBlob" class="recorded-preview">
            <audio :src="recordedAudioUrl" controls class="w-full" />
            <div class="flex gap-2 mt-2 justify-content-center">
              <Button
                label="Discard"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                @click="discardRecording"
              />
              <Button
                label="Process Voice"
                icon="pi pi-bolt"
                :loading="processingVoice"
                size="small"
                @click="processVoice"
              />
            </div>
          </div>

          <div v-if="voiceAudioSrc" class="preview">
            <AudioVisualizer :audio="voiceAudioPlayer" />
            <audio
              :src="voiceAudioSrc"
              controls
              loop
              ref="voiceAudioPlayer"
            />
          </div>
        </div>
      </TabPanel>

      <!-- ═══ Video Tab ═══ -->
      <TabPanel header="Video">
        <div class="tab-content">
          <div class="field">
            <label class="font-semibold block mb-2">Upload Video</label>
            <div
              class="video-upload-zone"
              :class="{ 'video-upload-zone--has-file': videoFile }"
              @dragover.prevent
              @drop.prevent="onVideoDrop"
              @click="$refs.videoInput.click()"
            >
              <input
                ref="videoInput"
                type="file"
                accept="video/*"
                style="display: none"
                @change="onVideoSelected"
              />
              <template v-if="videoFile">
                <i class="pi pi-video text-3xl text-primary" />
                <p class="font-semibold mt-2 mb-0">{{ videoFile.name }}</p>
                <small class="text-color-secondary">{{ formatFileSize(videoFile.size) }}</small>
                <Button
                  label="Remove"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  size="small"
                  class="mt-2"
                  @click.stop="removeVideo"
                />
              </template>
              <template v-else>
                <i class="pi pi-cloud-upload text-4xl text-color-secondary" />
                <p class="mt-2 mb-0 text-color-secondary">
                  Drag & drop a video or click to browse
                </p>
                <small class="text-color-secondary">Supports MP4, WebM, MOV</small>
              </template>
            </div>
          </div>

          <div class="field">
            <label class="font-semibold block mb-2">Soundscape Description (optional)</label>
            <Textarea
              v-model="videoPrompt"
              autoResize
              placeholder="Describe the soundscape you want for this video..."
              rows="2"
              class="w-full"
            />
          </div>

          <div class="actions">
            <Button
              label="Generate Soundscape for Video"
              icon="pi pi-bolt"
              :loading="generatingVideo"
              :disabled="!videoFile"
              @click="generateVideoSoundscape"
            />
          </div>

          <Message v-if="videoResult" severity="success" :closable="true" class="mt-3">
            Soundscape generation queued. The ComfyUI workflow will process your video and generate a dynamic AI soundscape.
          </Message>
        </div>
      </TabPanel>
    </TabView>

    <Message v-if="errorMessage" severity="error" :closable="true" class="mt-3" @close="errorMessage = ''">
      {{ errorMessage }}
    </Message>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'
import env from '@/utils/env'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import Slider from 'primevue/slider'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Textarea from 'primevue/textarea'

const emit = defineEmits(['generated'])

const activeTab = ref(0)
const errorMessage = ref('')

// ═══ Create tab state ═══════════════════════════════════════════════
const prompt = ref('')
const selectedMood = ref('')
const moods = ['Relaxing', 'Energizing', 'Cinematic', 'Mysterious', 'Upbeat', 'Ambient']
const duration = ref(10)
const generating = ref(false)
const audioSrc = ref('')
const audioPlayer = ref(null)

const canGenerate = computed(() => prompt.value.trim() || selectedMood.value)

async function generateSoundscape() {
  try {
    errorMessage.value = ''
    generating.value = true

    if (!prompt.value.trim() && !selectedMood.value) {
      errorMessage.value = 'Please enter a prompt or select a mood'
      return
    }

    const API_URL = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '')
    if (!API_URL) {
      errorMessage.value = 'API URL is not configured'
      return
    }

    const params = new URLSearchParams({
      text: prompt.value,
      mood: selectedMood.value,
      duration: duration.value.toString()
    })

    const streamUrl = `${API_URL}/api/stream?${params.toString()}`

    try {
      new URL(streamUrl)
      audioSrc.value = streamUrl
      emit('generated', { type: 'create', url: streamUrl })
    } catch {
      errorMessage.value = 'Invalid API URL configuration'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to generate soundscape'
    console.error('Generate error:', error)
  } finally {
    generating.value = false
  }
}

// ═══ Speak tab state ════════════════════════════════════════════════
const voiceMode = ref('as_is')
const voiceModeOptions = [
  { label: 'As Is', value: 'as_is' },
  { label: 'Voice Cloning', value: 'voice_cloning' }
]
const recording = ref(false)
const recordingTime = ref(0)
const recordingDuration = ref(0)
const recordedBlob = ref(null)
const recordedAudioUrl = ref('')
const processingVoice = ref(false)
const voiceAudioSrc = ref('')
const voiceAudioPlayer = ref(null)

let mediaRecorder = null
let recordingChunks = []
let recordingTimer = null

async function toggleRecording() {
  if (recording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    recordingChunks = []
    recordingTime.value = 0

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordingChunks.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordingChunks, { type: 'audio/webm' })
      recordedBlob.value = blob
      recordedAudioUrl.value = URL.createObjectURL(blob)
      recordingDuration.value = recordingTime.value
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    recording.value = true

    recordingTimer = setInterval(() => {
      recordingTime.value++
    }, 1000)
  } catch (error) {
    errorMessage.value = 'Could not access microphone. Please check your permissions.'
    console.error('Microphone error:', error)
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  recording.value = false
  clearInterval(recordingTimer)
  recordingTimer = null
}

function discardRecording() {
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
  }
  recordedBlob.value = null
  recordedAudioUrl.value = ''
  recordingDuration.value = 0
  voiceAudioSrc.value = ''
}

async function processVoice() {
  if (!recordedBlob.value) return

  processingVoice.value = true
  errorMessage.value = ''

  try {
    const API_URL = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '')
    if (!API_URL) {
      errorMessage.value = 'API URL is not configured'
      return
    }

    const formData = new FormData()
    formData.append('audio', recordedBlob.value, 'recording.webm')
    formData.append('mode', voiceMode.value)

    const response = await fetch(`${API_URL}/api/voice-process`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Voice processing failed: ${response.statusText}`)
    }

    const blob = await response.blob()
    voiceAudioSrc.value = URL.createObjectURL(blob)
    emit('generated', { type: 'voice', mode: voiceMode.value })
  } catch (error) {
    errorMessage.value = error.message || 'Failed to process voice'
    console.error('Voice processing error:', error)
  } finally {
    processingVoice.value = false
  }
}

// ═══ Video tab state ════════════════════════════════════════════════
const videoFile = ref(null)
const videoPrompt = ref('')
const generatingVideo = ref(false)
const videoResult = ref(false)

function onVideoSelected(event) {
  const file = event.target.files?.[0]
  if (file) {
    videoFile.value = file
  }
}

function onVideoDrop(event) {
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('video/')) {
    videoFile.value = file
  }
}

function removeVideo() {
  videoFile.value = null
  videoResult.value = false
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

async function generateVideoSoundscape() {
  if (!videoFile.value) return

  generatingVideo.value = true
  errorMessage.value = ''
  videoResult.value = false

  try {
    const API_URL = (env.VITE_HELPER_API_URL || env.VITE_APP_URL || '').replace(/\/$/, '')
    if (!API_URL) {
      errorMessage.value = 'API URL is not configured'
      return
    }

    const formData = new FormData()
    formData.append('video', videoFile.value)
    if (videoPrompt.value.trim()) {
      formData.append('prompt', videoPrompt.value)
    }

    const response = await fetch(`${API_URL}/api/video-soundscape`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Request failed: ${response.statusText}`)
    }

    videoResult.value = true
    emit('generated', { type: 'video' })
  } catch (error) {
    errorMessage.value = error.message || 'Failed to generate soundscape for video'
    console.error('Video soundscape error:', error)
  } finally {
    generatingVideo.value = false
  }
}

// ═══ Cleanup ════════════════════════════════════════════════════════
onBeforeUnmount(() => {
  if (recording.value) {
    stopRecording()
  }
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
  }
  if (voiceAudioSrc.value) {
    URL.revokeObjectURL(voiceAudioSrc.value)
  }
})
</script>

<style scoped>
.soundscape-generator {
  width: 100%;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.mood-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.preview audio {
  width: 100%;
}

/* ── Mic Section ─────────────────────────────────────────────────── */
.mic-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.mic-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--surface-100);
  border: 3px solid var(--surface-300);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.mic-button i {
  font-size: 2rem;
  color: var(--text-color-secondary);
  transition: color 0.2s;
}

.mic-button:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.mic-button:hover i {
  color: var(--primary-color);
}

.mic-button--recording {
  border-color: var(--red-500);
  background: var(--red-50);
  animation: pulse-recording 1.5s ease-in-out infinite;
}

.mic-button--recording i {
  color: var(--red-500);
}

@keyframes pulse-recording {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
}

.mic-label {
  margin-top: 1rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.recording-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--red-500);
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.recorded-preview {
  background: var(--surface-50);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.recorded-preview audio {
  width: 100%;
}

/* ── Video Upload ────────────────────────────────────────────────── */
.video-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  border: 2px dashed var(--surface-300);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.video-upload-zone:hover {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.video-upload-zone--has-file {
  border-style: solid;
  border-color: var(--primary-300);
  background: var(--surface-50);
}
</style>
