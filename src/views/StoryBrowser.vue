<template>
  <div class="story-browser">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1>My Stories</h1>
      <Button 
        label="New Story" 
        icon="pi pi-plus" 
        @click="goToNewStory"
        :disabled="loading"
      />
    </div>

    <div v-if="loading" class="flex justify-content-center align-items-center" style="min-height: 300px;">
      <ProgressSpinner />
    </div>

    <Message v-else-if="error" severity="error" :closable="false">
      {{ error }}
      <template v-if="isAuthError">
        <div class="mt-2">
          <Button label="Login" @click="goToLogin" size="small" />
        </div>
      </template>
    </Message>

    <div v-else-if="!stories || stories.length === 0" class="card">
      <div class="flex flex-column align-items-center justify-content-center" style="min-height: 300px;">
        <i class="pi pi-book text-6xl text-300 mb-3"></i>
        <h3 class="text-500">No stories yet</h3>
        <p class="text-500 mb-4">Create your first story to get started</p>
        <Button label="Create Story" icon="pi pi-plus" @click="goToNewStory" />
      </div>
    </div>

    <div v-else class="grid">
      <div v-for="story in stories" :key="story.id" class="col-12 md:col-6 lg:col-4">
        <Card class="story-card">
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>{{ story.name || 'Untitled Story' }}</span>
              <Badge 
                :value="story.status" 
                :severity="getStatusSeverity(story.status)"
              />
            </div>
          </template>
          <template #content>
            <p class="text-500 mb-3">{{ story.description || 'No description' }}</p>
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-calendar text-500"></i>
              <span class="text-500 text-sm">{{ formatDate(story.created_at) }}</span>
            </div>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-images text-500"></i>
              <span class="text-500 text-sm">{{ story.total_jobs || 0 }} jobs</span>
              <Divider layout="vertical" />
              <span class="text-500 text-sm">{{ Math.round(story.progress || 0) }}% complete</span>
            </div>
          </template>
          <template #footer>
            <div class="flex gap-2">
              <Button 
                label="Edit" 
                icon="pi pi-pencil" 
                @click="editStory(story.id)"
                severity="secondary"
                outlined
              />
              <Button 
                label="View" 
                icon="pi pi-eye" 
                @click="viewStory(story.id)"
                severity="info"
                outlined
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <div v-if="pagination && pagination.last_page > 1" class="mt-4 flex justify-content-center">
      <Paginator
        :rows="pagination.per_page"
        :totalRecords="pagination.total"
        :first="(pagination.current_page - 1) * pagination.per_page"
        @page="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StoryService from '@/services/story/StoryService'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import Paginator from 'primevue/paginator'

const router = useRouter()
const storyService = new StoryService()

const loading = ref(true)
const error = ref(null)
const stories = ref([])
const pagination = ref(null)
const isAuthError = ref(false)

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const getStatusSeverity = (status) => {
  const statusMap = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'secondary'
  }
  return statusMap[status?.toLowerCase()] || 'secondary'
}

const loadStories = async (page = 1) => {
  try {
    loading.value = true
    error.value = null
    isAuthError.value = false

    const response = await storyService.listStories({ per_page: 12, page })
    
    if (response.data) {
      stories.value = response.data
      pagination.value = {
        current_page: response.current_page || page,
        last_page: response.last_page || 1,
        per_page: response.per_page || 12,
        total: response.total || 0
      }
    } else {
      // Handle paginated response format
      stories.value = response
      pagination.value = null
    }
  } catch (err) {
    console.error('Error loading stories:', err)
    error.value = err.message || 'Failed to load stories'
    
    // Check if it's an auth error
    if (err.response?.status === 401 || err.message?.includes('Unauthenticated')) {
      isAuthError.value = true
      error.value = 'Please log in to view your stories'
    }
  } finally {
    loading.value = false
  }
}

const onPageChange = (event) => {
  const page = (event.first / event.rows) + 1
  loadStories(page)
}

const editStory = (id) => {
  router.push(`/stories/${id}/edit`)
}

const viewStory = (id) => {
  router.push(`/stories/${id}/edit`)
}

const goToNewStory = () => {
  router.push('/story')
}

const goToLogin = () => {
  router.push('/auth/login')
}

onMounted(() => {
  loadStories()
})
</script>

<style scoped>
.story-browser {
  padding: 1rem;
}

.story-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s;
}

.story-card:hover {
  transform: translateY(-2px);
}
</style>

