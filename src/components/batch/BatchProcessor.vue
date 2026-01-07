<template>
  <div class="batch-processor">
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Batch Processing</span>
          <Button
            v-if="batch && batch.status !== 'complete'"
            :label="batch.status === 'processing' ? 'Cancel' : 'Start'"
            :icon="batch.status === 'processing' ? 'pi pi-times' : 'pi pi-play'"
            :class="batch.status === 'processing' ? 'p-button-danger' : 'p-button-success'"
            @click="toggleProcessing"
            :disabled="!canProcess"
          />
        </div>
      </template>
      <template #content>
        <div v-if="!batch">
          <Message severity="info" :closable="false">
            No batch selected. Create a batch to begin processing multiple files.
          </Message>
        </div>

        <div v-else>
          <!-- Batch Status -->
          <div class="field mb-4">
            <div class="flex justify-content-between align-items-center mb-2">
              <span class="font-semibold">Batch Status</span>
              <Tag :value="batch.status.toUpperCase()" :severity="getStatusSeverity(batch.status)" />
            </div>
            
            <ProgressBar
              :value="progress"
              :showValue="true"
              class="mb-2"
            />
            
            <div class="flex justify-content-between text-sm text-muted">
              <span>{{ statistics.complete }} / {{ statistics.total }} completed</span>
              <span v-if="statistics.error > 0" class="text-red-500">
                {{ statistics.error }} error(s)
              </span>
            </div>
          </div>

          <!-- Batch Statistics -->
          <div class="field mb-4">
            <div class="grid">
              <div class="col-6 md:col-3">
                <div class="stat-card p-3 border-round bg-blue-50">
                  <div class="text-sm text-muted mb-1">Total</div>
                  <div class="text-xl font-bold">{{ statistics.total }}</div>
                </div>
              </div>
              <div class="col-6 md:col-3">
                <div class="stat-card p-3 border-round bg-green-50">
                  <div class="text-sm text-muted mb-1">Complete</div>
                  <div class="text-xl font-bold text-green-600">{{ statistics.complete }}</div>
                </div>
              </div>
              <div class="col-6 md:col-3">
                <div class="stat-card p-3 border-round bg-yellow-50">
                  <div class="text-sm text-muted mb-1">Processing</div>
                  <div class="text-xl font-bold text-yellow-600">{{ statistics.processing }}</div>
                </div>
              </div>
              <div class="col-6 md:col-3">
                <div class="stat-card p-3 border-round bg-red-50">
                  <div class="text-sm text-muted mb-1">Errors</div>
                  <div class="text-xl font-bold text-red-600">{{ statistics.error }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Concurrency Setting -->
          <div class="field mb-4">
            <label class="font-semibold mb-2 block">
              Concurrent Jobs: {{ batch.concurrency }}
            </label>
            <Slider
              v-model="batch.concurrency"
              :min="1"
              :max="5"
              :step="1"
              :disabled="batch.status === 'processing'"
              class="w-full"
            />
            <small class="text-muted">
              Number of files to process simultaneously
            </small>
          </div>

          <!-- File List -->
          <div class="field">
            <div class="font-semibold mb-2">Files ({{ batch.files.length }})</div>
            <ScrollPanel style="width: 100%; height: 300px">
              <div class="flex flex-column gap-2">
                <BatchQueueItem
                  v-for="file in batch.files"
                  :key="file.id"
                  :file="file"
                  @remove="removeFile"
                  @retry="retryFile"
                />
              </div>
            </ScrollPanel>
          </div>

          <!-- Batch Info -->
          <div class="field mt-4" v-if="batch.createdAt">
            <Divider />
            <div class="text-sm text-muted">
              <div>Created: {{ formatDate(batch.createdAt) }}</div>
              <div v-if="batch.startedAt">Started: {{ formatDate(batch.startedAt) }}</div>
              <div v-if="batch.completedAt">Completed: {{ formatDate(batch.completedAt) }}</div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script>
import { computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Slider from 'primevue/slider';
import ScrollPanel from 'primevue/scrollpanel';
import Divider from 'primevue/divider';
import BatchQueueItem from './BatchQueueItem.vue';

export default {
  name: 'BatchProcessor',
  components: {
    Card,
    Button,
    ProgressBar,
    Tag,
    Message,
    Slider,
    ScrollPanel,
    Divider,
    BatchQueueItem
  },
  props: {
    batch: {
      type: Object,
      default: null
    }
  },
  emits: ['start', 'cancel', 'remove-file', 'retry-file'],
  setup(props, { emit }) {
    const progress = computed(() => {
      if (!props.batch || !props.batch.files || props.batch.files.length === 0) {
        return 0;
      }
      const completed = props.batch.files.filter(
        f => f.status === 'complete' || f.status === 'error'
      ).length;
      return Math.round((completed / props.batch.files.length) * 100);
    });

    const statistics = computed(() => {
      if (!props.batch || !props.batch.files) {
        return { total: 0, pending: 0, processing: 0, complete: 0, error: 0 };
      }
      
      const stats = {
        total: props.batch.files.length,
        pending: 0,
        uploading: 0,
        queued: 0,
        processing: 0,
        complete: 0,
        error: 0,
        cancelled: 0
      };

      props.batch.files.forEach(file => {
        if (stats[file.status] !== undefined) {
          stats[file.status]++;
        }
      });

      return stats;
    });

    const canProcess = computed(() => {
      return props.batch && props.batch.files.length > 0;
    });

    const getStatusSeverity = (status) => {
      const severityMap = {
        pending: 'info',
        queued: 'info',
        uploading: 'warning',
        processing: 'warning',
        complete: 'success',
        partial: 'warning',
        error: 'danger',
        cancelled: 'secondary'
      };
      return severityMap[status] || 'info';
    };

    const toggleProcessing = () => {
      if (props.batch.status === 'processing') {
        emit('cancel');
      } else {
        emit('start');
      }
    };

    const removeFile = (fileId) => {
      emit('remove-file', fileId);
    };

    const retryFile = (fileId) => {
      emit('retry-file', fileId);
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    return {
      progress,
      statistics,
      canProcess,
      getStatusSeverity,
      toggleProcessing,
      removeFile,
      retryFile,
      formatDate
    };
  }
};
</script>

<style scoped>
.batch-processor {
  width: 100%;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}
</style>
