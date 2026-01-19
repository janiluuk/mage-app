<template>
  <div class="story-editor">
    <ConfirmDialog />
    
    <div v-if="loading && !story" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <ProgressSpinner />
    </div>

    <Message v-else-if="error" severity="error" :closable="true" @close="error = null">
      {{ error }}
      <template v-if="isAuthError">
        <div class="mt-2">
          <Button label="Login" @click="goToLogin" size="small" />
        </div>
      </template>
    </Message>

    <template v-else-if="story">
      <div class="flex justify-content-between align-items-center mb-4">
        <h1>Edit Story</h1>
        <div class="flex gap-2">
          <Button 
            label="Go Back" 
            icon="pi pi-arrow-left" 
            @click="goBack"
            severity="secondary"
            outlined
          />
          <Button 
            label="Save Changes" 
            icon="pi pi-save" 
            @click="saveStory"
            :loading="saving"
            :disabled="saving"
          />
        </div>
      </div>

      <div class="grid">
        <div class="col-12">
          <Card>
            <template #title>Story Information</template>
            <template #content>
              <div class="flex flex-column gap-3">
                <div>
                  <label for="story-name" class="block text-500 font-medium mb-2">Story Name</label>
                  <InputText 
                    id="story-name"
                    v-model="storyForm.name" 
                    placeholder="Enter story name"
                    class="w-full"
                  />
                </div>
                <div>
                  <label for="story-description" class="block text-500 font-medium mb-2">Description</label>
                  <Textarea 
                    id="story-description"
                    v-model="storyForm.description" 
                    placeholder="Enter story description"
                    rows="3"
                    class="w-full"
                  />
                </div>
                <div class="flex gap-3">
                  <div>
                    <span class="text-500">Status: </span>
                    <Badge :value="story.status" :severity="getStatusSeverity(story.status)" />
                  </div>
                  <div>
                    <span class="text-500">Progress: </span>
                    <span>{{ Math.round(story.progress || 0) }}%</span>
                  </div>
                  <div>
                    <span class="text-500">Jobs: </span>
                    <span>{{ story.total_jobs || 0 }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <div class="col-12">
          <Card>
            <template #title>
              <div class="flex align-items-center justify-content-between">
                <span>Story Jobs ({{ orderedJobs.length }})</span>
                <Button 
                  label="Add Jobs" 
                  icon="pi pi-plus" 
                  @click="showAddJobsDialog = true"
                  size="small"
                  outlined
                />
              </div>
            </template>
            <template #content>
              <Message v-if="saveError" severity="error" :closable="true" @close="saveError = null">
                {{ saveError }}
              </Message>

              <Message v-if="saveSuccess" severity="success" :closable="true" @close="saveSuccess = null">
                Changes saved successfully
              </Message>

              <div v-if="orderedJobs.length === 0" class="text-center py-4 text-500">
                No jobs in this story. Click "Add Jobs" to add video jobs.
              </div>

              <div v-else class="job-list">
                <div 
                  v-for="(job, index) in orderedJobs" 
                  :key="job.id"
                  class="job-item p-3 border-round mb-2 surface-100"
                >
                  <div class="flex align-items-start gap-3">
                    <div class="drag-handle flex align-items-center justify-content-center" style="cursor: move;">
                      <i class="pi pi-bars text-500"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="flex align-items-center gap-2 mb-2">
                        <h4 class="m-0">{{ job.original_filename || job.filename || `Job #${job.id}` }}</h4>
                        <Badge :value="job.status" :severity="getJobStatusSeverity(job.status)" />
                      </div>
                      <div class="mb-2">
                        <label class="block text-500 font-medium mb-1 text-sm">Job Description</label>
                        <InputText 
                          v-model="job.description" 
                          placeholder="Enter description for this job in the story"
                          class="w-full"
                          @blur="markDirty()"
                        />
                      </div>
                      <div class="text-500 text-sm">
                        Order: {{ job.order }}, Progress: {{ Math.round(job.progress || 0) }}%
                      </div>
                    </div>
                    <Button 
                      icon="pi pi-times" 
                      severity="danger"
                      text
                      rounded
                      @click="removeJob(job.id)"
                      :disabled="saving"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </template>

    <Dialog 
      v-model:visible="showAddJobsDialog" 
      modal 
      header="Add Jobs to Story"
      :style="{ width: '50rem' }"
    >
      <p>Job selection dialog will be implemented here.</p>
      <template #footer>
        <Button label="Cancel" @click="showAddJobsDialog = false" severity="secondary" outlined />
        <Button label="Add" @click="showAddJobsDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import StoryService from '@/services/story/StoryService'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ConfirmDialog from 'primevue/confirmdialog'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const storyService = new StoryService()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveError = ref(null)
const saveSuccess = ref(null)
const isAuthError = ref(false)
const story = ref(null)
const storyForm = ref({
  name: '',
  description: ''
})
const showAddJobsDialog = ref(false)

const orderedJobs = computed(() => {
  if (!story.value?.jobs) return []
  return [...story.value.jobs].sort((a, b) => (a.order || 0) - (b.order || 0))
})

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

const getJobStatusSeverity = (status) => {
  const statusMap = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'secondary'
  }
  return statusMap[status?.toLowerCase()] || 'secondary'
}

const loadStory = async () => {
  const storyId = parseInt(route.params.id)
  if (!storyId) {
    error.value = 'Invalid story ID'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    isAuthError.value = false

    const data = await storyService.getStory(storyId)
    story.value = data
    storyForm.value = {
      name: data.name || '',
      description: data.description || ''
    }
  } catch (err) {
    console.error('Error loading story:', err)
    error.value = err.message || 'Failed to load story'
    
    if (err.response?.status === 404) {
      error.value = 'Story not found'
    } else if (err.response?.status === 401 || err.message?.includes('Unauthenticated')) {
      isAuthError.value = true
      error.value = 'Please log in to view this story'
    }
  } finally {
    loading.value = false
  }
}

const markDirty = () => {
  // Mark that changes need to be saved
}

const saveStory = async () => {
  if (!story.value) return

  try {
    saving.value = true
    saveError.value = null
    saveSuccess.value = null

    // Save story metadata
    await storyService.updateStory(story.value.id, {
      name: storyForm.value.name,
      description: storyForm.value.description
    })

    // Save job order and descriptions
    const jobOrders = orderedJobs.value.map((job, index) => ({
      job_id: job.id,
      order: index + 1,
      description: job.description || ''
    }))

    await storyService.updateJobOrder(story.value.id, jobOrders)

    saveSuccess.value = true
    
    // Reload story to get updated data
    await loadStory()
  } catch (err) {
    console.error('Error saving story:', err)
    saveError.value = err.message || 'Failed to save story'
  } finally {
    saving.value = false
  }
}

const confirm = useConfirm()

const removeJob = async (jobId) => {
  if (!story.value) return
  
  confirm.require({
    message: 'Are you sure you want to remove this job from the story?',
    header: 'Remove Job',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await storyService.removeJobs(story.value.id, [jobId])
        await loadStory()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error removing job:', err)
        }
        saveError.value = err.message || 'Failed to remove job'
      }
    },
    reject: () => {
      // User cancelled, do nothing
    }
  })
}
}

const goBack = () => {
  router.push('/stories')
}

const goToLogin = () => {
  router.push('/auth/login')
}

onMounted(() => {
  loadStory()
})
</script>

<style scoped>
.story-editor {
  padding: 1rem;
}

.job-list {
  max-height: 600px;
  overflow-y: auto;
}

.job-item {
  transition: background-color 0.2s;
}

.job-item:hover {
  background-color: var(--surface-200) !important;
}

.drag-handle {
  width: 24px;
  height: 24px;
}

.drag-handle:hover {
  background-color: var(--surface-300);
  border-radius: 4px;
}
</style>

