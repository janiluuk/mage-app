<template>
  <div class="soundscape-creator">
    <h1>Create a Soundscape</h1>
    <textarea v-model="prompt" placeholder="Describe your soundscape or mood..." />

    <div class="mood-tags">
      <button
        v-for="mood in moods"
        :key="mood"
        :class="{ active: selectedMood === mood }"
        @click="selectedMood = mood"
      >
        {{ mood }}
      </button>
    </div>

    <div class="actions">
      <button @click="recording = !recording">
        {{ recording ? 'Stop Recording' : 'Speak' }}
      </button>
      <button @click="generate">Generate</button>
    </div>

    <AudioVisualizer v-if="audioSrc" :audio="audioPlayer" />
    <audio
      v-if="audioSrc"
      :src="audioSrc"
      controls
      loop
      ref="audioPlayer"
    />

    <div class="queue-status" v-if="status">
      <h2>Processing status</h2>
      <p v-if="status.processing">Currently processing: {{ status.processing.metadata.text || 'Pending text' }}</p>
      <p v-else>Nothing processing right now.</p>
      <p>Items in queue: {{ status.queued }}</p>

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
    </div>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'
import MageApiService from '@/services/mage/MageApiService'
import env from '@/utils/env'

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

function generate() {
  const API_URL = env.VITE_API_URL || ''
  const params = new URLSearchParams({
    text: prompt.value,
    mood: selectedMood.value
  })
  audioSrc.value = `${API_URL}/api/stream?${params.toString()}`
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
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
}
textarea {
  width: 100%;
  min-height: 80px;
  margin-bottom: 1rem;
}
.mood-tags {
  margin-bottom: 1rem;
}
.mood-tags button {
  margin: 0 0.5rem;
}
.mood-tags button.active {
  background: #42b983;
  color: #fff;
}
.actions button {
  margin: 0 0.5rem;
}
audio {
  width: 100%;
  margin-top: 1rem;
}
.queue-status {
  margin-top: 2rem;
  text-align: left;
}

.queue-status ul {
  padding-left: 1.2rem;
}

.error {
  color: #e44;
  margin-top: 1rem;
}
</style>
