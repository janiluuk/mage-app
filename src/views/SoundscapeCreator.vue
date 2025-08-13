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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AudioVisualizer from '@/components/AudioVisualizer.vue'

const prompt = ref('')
const selectedMood = ref('')
const moods = ['Relaxing', 'Energizing']
const recording = ref(false)
const audioSrc = ref('')
const audioPlayer = ref(null)

function generate() {
  const params = new URLSearchParams({
    text: prompt.value,
    mood: selectedMood.value
  })
  audioSrc.value = `/api/stream?${params.toString()}`
}
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
</style>

