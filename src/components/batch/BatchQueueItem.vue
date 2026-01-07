<template>
  <div class="batch-queue-item p-3 border-round border-1 surface-border">
    <div class="flex justify-content-between align-items-center">
      <div class="flex align-items-center gap-3 flex-grow-1">
        <!-- Status Icon -->
        <div class="status-icon">
          <i 
            :class="getStatusIcon(file.status)" 
            :style="{ color: getStatusColor(file.status) }"
            class="text-2xl"
          ></i>
        </div>

        <!-- File Info -->
        <div class="flex-grow-1">
          <div class="font-semibold mb-1">{{ file.fileName }}</div>
          <div class="text-sm text-muted">
            {{ formatFileSize(file.fileSize) }}
          </div>
          <div v-if="file.error" class="text-sm text-red-500 mt-1">
            {{ file.error }}
          </div>
        </div>

        <!-- Status & Progress -->
        <div class="flex-shrink-0" style="min-width: 150px">
          <Tag 
            :value="file.status.toUpperCase()" 
            :severity="getStatusSeverity(file.status)"
            class="mb-2"
          />
          <ProgressBar 
            v-if="file.status === 'processing' || file.status === 'uploading'"
            :value="file.progress || 0"
            :showValue="false"
            style="height: 4px"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 ml-3">
        <Button
          v-if="file.status === 'error'"
          icon="pi pi-refresh"
          class="p-button-sm p-button-rounded p-button-text"
          @click="$emit('retry', file.id)"
          v-tooltip.top="'Retry'"
        />
        <Button
          v-if="canRemove"
          icon="pi pi-trash"
          class="p-button-sm p-button-rounded p-button-text p-button-danger"
          @click="confirmRemove"
          v-tooltip.top="'Remove'"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tooltip from 'primevue/tooltip';

export default {
  name: 'BatchQueueItem',
  components: {
    Tag,
    Button,
    ProgressBar
  },
  directives: {
    tooltip: Tooltip
  },
  props: {
    file: {
      type: Object,
      required: true
    }
  },
  emits: ['remove', 'retry'],
  setup(props, { emit }) {
    const confirm = useConfirm();

    const canRemove = computed(() => {
      return props.file.status !== 'processing' && props.file.status !== 'uploading';
    });

    const getStatusIcon = (status) => {
      const iconMap = {
        pending: 'pi pi-clock',
        uploading: 'pi pi-cloud-upload',
        queued: 'pi pi-list',
        processing: 'pi pi-spin pi-spinner',
        complete: 'pi pi-check-circle',
        error: 'pi pi-times-circle',
        cancelled: 'pi pi-ban'
      };
      return iconMap[status] || 'pi pi-circle';
    };

    const getStatusColor = (status) => {
      const colorMap = {
        pending: '#6c757d',
        uploading: '#ffc107',
        queued: '#17a2b8',
        processing: '#fd7e14',
        complete: '#28a745',
        error: '#dc3545',
        cancelled: '#6c757d'
      };
      return colorMap[status] || '#6c757d';
    };

    const getStatusSeverity = (status) => {
      const severityMap = {
        pending: 'info',
        uploading: 'warning',
        queued: 'info',
        processing: 'warning',
        complete: 'success',
        error: 'danger',
        cancelled: 'secondary'
      };
      return severityMap[status] || 'info';
    };

    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const confirmRemove = () => {
      confirm.require({
        message: `Remove ${props.file.fileName} from batch?`,
        header: 'Confirm Removal',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          emit('remove', props.file.id);
        }
      });
    };

    return {
      canRemove,
      getStatusIcon,
      getStatusColor,
      getStatusSeverity,
      formatFileSize,
      confirmRemove
    };
  }
};
</script>

<style scoped>
.batch-queue-item {
  transition: all 0.2s;
}

.batch-queue-item:hover {
  background-color: var(--surface-hover);
}

.status-icon {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
