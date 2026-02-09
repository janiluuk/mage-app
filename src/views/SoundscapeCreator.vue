<template>
  <div class="soundscape-creator">
    <div class="page-header">
      <h1>Create a Soundscape</h1>
    </div>

    <Card class="soundscape-card">
      <template #content>
        <div class="form-grid">
          <InputTextarea
            v-model="prompt"
            autoResize
            placeholder="Describe your soundscape or mood..."
            rows="4"
          />

          <div class="mood-tags">
            <Button
              v-for="mood in moods"
              :key="mood"
              :label="mood"
              size="small"
              :outlined="selectedMood !== mood"
              :severity="selectedMood === mood ? 'info' : 'secondary'"
              @click="selectedMood = mood"
            />
          </div>

          <div class="actions">
            <Button
              :label="recording ? 'Stop Recording' : 'Speak'"
              :icon="recording ? 'pi pi-stop' : 'pi pi-microphone'"
              :severity="recording ? 'danger' : 'secondary'"
              outlined
              @click="recording = !recording"
            />
            <Button
              label="Generate"
              icon="pi pi-play"
              @click="generate"
            />
          </div>
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
      </template>
    </Card>

    <Card v-if="status" class="queue-status">
      <template #title>Processing status</template>
      <template #content>
        <p v-if="status.processing">Currently processing: {{ status.processing.metadata.text || 'Pending text' }}</p>
        <p v-else>Nothing processing right now.</p>
        <p>Items in queue: {{ status.queued }}</p>

        <Divider />

        <h3>Recent history</h3>
        <ul>
          <li v-for="item in status.recent" :key="item.id">
            <strong>{{ item.status }}</strong> — {{ item.metadata.text || 'No text provided' }}
          </li>
        </ul>

        <div class="queue-list">
          <h3>Queued items</h3>
          <ul>
            <li v-for="item in queueItems" :key="item.id">{{ item.metadata.text || 'Queued request' }}</li>
          </ul>
        </div>
      </template>
    </Card>

    <Message v-if="errorMessage" severity="error" :closable="false" class="error">
      {{ errorMessage }}
    </Message>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'
import MageApiService from '@/services/mage/MageApiService'
import env from '@/utils/env'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import InputTextarea from 'primevue/textarea'
import Message from 'primevue/message'

const prompt = ref('')
const selectedMood = ref('')
const moods = ['Relaxing', 'Energizing']
const recording = ref(false)
const audioSrc = ref('')
const audioPlayer = ref(null)
const status = ref(null)
const queueItems = ref([])
const errorMessage = ref('')
let intervalId

async function generate() {
  try {
    errorMessage.value = ''
    
    // Validate that either prompt or mood is provided
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
      mood: selectedMood.value
    })
    
    const streamUrl = `${API_URL}/api/stream?${params.toString()}`
    
    // Validate URL before setting
    try {
      new URL(streamUrl)
      audioSrc.value = streamUrl
    } catch (urlError) {
      errorMessage.value = 'Invalid API URL configuration'
      console.error('Invalid URL:', urlError)
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to generate soundscape'
    console.error('Generate error:', error)
  }
}

async function refreshQueue() {
  try {
    const [latestStatus, queue] = await Promise.all([
      MageApiService.getStatus(),
      MageApiService.getQueue()
    ])
    status.value = latestStatus
    queueItems.value = queue.queued
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message
  }
}

onMounted(() => {
  refreshQueue()
  intervalId = window.setInterval(refreshQueue, 5000)
})

onBeforeUnmount(() => {
  window.clearInterval(intervalId)
})
</script>

<style scoped>
.soundscape-creator {
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.soundscape-card,
.queue-status {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mood-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

audio {
  width: 100%;
}

.queue-status ul {
  padding-left: 1.2rem;
}
</style>
