<template>
  <div class="mage-app">
    <header class="mage-header">
      <div>
        <h1>Mage Helper</h1>
        <p>Monitor the backend queue and live processing state.</p>
      </div>
      <div class="actions">
        <Button label="Refresh" icon="pi pi-refresh" @click="refresh" />
        <Button label="Auto-refresh" icon="pi pi-clock" class="p-button-text" :class="{ 'is-active': autoRefresh }" @click="toggleAuto" />
      </div>
    </header>

    <div class="status-grid">
      <div class="card">
        <h3>Currently processing</h3>
        <p v-if="status.processing">{{ status.processing.metadata.text || 'Processing request' }}</p>
        <p v-else class="muted">Idle</p>
      </div>
      <div class="card">
        <h3>Queued items</h3>
        <p class="stat">{{ status.queued }}</p>
        <p class="muted">waiting for a worker</p>
      </div>
      <div class="card" :class="{ danger: queueWarning }">
        <h3>Health</h3>
        <p>{{ queueWarning ? 'Backlog detected' : 'Operating normally' }}</p>
        <small v-if="queueWarning">Consider scaling ffmpeg workers or pausing new jobs.</small>
      </div>
    </div>

    <section class="queue-section">
      <h2>Queued items</h2>
      <p v-if="queue.queued.length === 0" class="muted">No queued requests</p>
      <ul v-else>
        <li v-for="item in queue.queued" :key="item.id">
          <strong>{{ item.metadata.text || 'Queued request' }}</strong>
          <span class="tag">{{ item.status }}</span>
          <small>enqueued {{ formatTime(item.createdAt) }}</small>
        </li>
      </ul>
    </section>

    <section class="queue-section">
      <h2>Recent history</h2>
      <p v-if="queue.history.length === 0" class="muted">No recent runs yet</p>
      <ul v-else>
        <li v-for="item in queue.history" :key="item.id">
          <strong>{{ item.metadata.text || 'Request' }}</strong>
          <span class="tag" :class="item.status">{{ item.status }}</span>
          <small>{{ formatTime(item.completedAt || item.createdAt) }}</small>
        </li>
      </ul>
    </section>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'
import MageApiService from '@/services/mage/MageApiService'

const status = ref({ processing: null, queued: 0, recent: [] })
const queue = ref({ queued: [], processing: [], history: [] })
const error = ref('')
const autoRefresh = ref(true)
let intervalId

// Backlog = too many queued items; processing is normal operation
const queueWarning = computed(() => status.value.queued > 3)

const formatTime = (time) => {
  if (!time) return 'unknown time'
  return new Date(time).toLocaleString()
}

async function refresh() {
  try {
    const [latestStatus, queuePayload] = await Promise.all([
      MageApiService.getStatus(),
      MageApiService.getQueue(),
    ])
    status.value = latestStatus
    queue.value = queuePayload
    error.value = ''
  } catch (err) {
    error.value = err.message
  }
}

function toggleAuto() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    schedule()
  } else {
    window.clearInterval(intervalId)
  }
}

function schedule() {
  window.clearInterval(intervalId)
  intervalId = window.setInterval(refresh, 5000)
}

onMounted(() => {
  if (MageApiService.isConfigured()) {
    refresh()
    schedule()
  }
})

onBeforeUnmount(() => {
  window.clearInterval(intervalId)
})
</script>

<style scoped>
.mage-app {
  padding: 1rem;
}
.mage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.card {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--surface-card);
}
.card.danger {
  border-color: #e44;
}
.stat {
  font-size: 2rem;
  margin: 0.25rem 0;
}
.muted {
  color: var(--text-color-secondary);
}
.queue-section {
  margin-top: 1rem;
}
.queue-section ul {
  list-style: none;
  padding: 0;
}
.queue-section li {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.tag {
  background: var(--surface-200);
  border-radius: 4px;
  padding: 0.15rem 0.35rem;
  font-size: 0.8rem;
  width: fit-content;
  text-transform: capitalize;
}
.tag.completed {
  background: #d1f0d1;
}
.tag.failed {
  background: #f8d7da;
}
.is-active {
  color: var(--primary-color);
}
</style>
