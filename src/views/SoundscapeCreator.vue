<template>
  <div class="soundscape-creator">
    <div class="page-header">
      <h1>Soundscape Creator</h1>
      <p class="text-color-secondary">Generate AI-powered soundscapes from text, voice, or video</p>
    </div>

    <Card class="soundscape-card">
      <template #content>
        <SoundscapeGenerator @generated="onGenerated" />
      </template>
    </Card>

    <Card v-if="hasQueueData" class="queue-status">
      <template #title>Processing Status</template>
      <template #content>
        <p v-if="status.processing">
          Currently processing: {{ status.processing.metadata?.text || 'Pending' }}
        </p>
        <p v-else>Nothing processing right now.</p>
        <p>Items in queue: {{ status.queued || 0 }}</p>

        <Divider />

        <h4 class="mt-0">Recent History</h4>
        <ul v-if="status.recent && status.recent.length > 0">
          <li v-for="item in status.recent" :key="item.id">
            <strong>{{ item.status }}</strong> — {{ item.metadata?.text || 'No text provided' }}
          </li>
        </ul>
        <p v-else class="text-color-secondary">No recent items.</p>

        <div v-if="queueItems.length > 0" class="queue-list">
          <h4 class="mt-0">Queued Items</h4>
          <ul>
            <li v-for="item in queueItems" :key="item.id">
              {{ item.metadata?.text || 'Queued request' }}
            </li>
          </ul>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import SoundscapeGenerator from '@/components/soundscape/SoundscapeGenerator.vue'
import MageApiService from '@/services/mage/MageApiService'
import Card from 'primevue/card'
import Divider from 'primevue/divider'

const status = ref(null)
const queueItems = ref([])
let intervalId

const hasQueueData = computed(() => status.value !== null)

function onGenerated(event) {
  // Refresh queue after a generation is triggered
  refreshQueue()
}

async function refreshQueue() {
  try {
    const [latestStatus, queue] = await Promise.all([
      MageApiService.getStatus(),
      MageApiService.getQueue()
    ])
    status.value = latestStatus
    queueItems.value = queue.queued || []
  } catch {
    // API not available — silently ignore
    // Don't clear existing data and don't show error
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
  max-width: 760px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin-bottom: 0.25rem;
}

.soundscape-card,
.queue-status {
  margin-bottom: 1.5rem;
}

.queue-status ul {
  padding-left: 1.2rem;
}
</style>
