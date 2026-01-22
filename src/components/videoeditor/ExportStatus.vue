<template>
  <Dialog 
    v-model:visible="showStatus" 
    modal 
    :style="{ width: '700px' }"
    :closable="!isExporting && !isUploading"
    :header="statusTitle"
  >
    <div class="export-status-content">
      <!-- Progress Bar -->
      <div class="mb-4">
        <ProgressBar 
          v-if="hasError"
          :value="100"
          severity="warn"
        />
        <ProgressBar 
          v-else-if="isExporting || isUploading"
          :value="exportProgressPercent"
          :indeterminate="exportProgressPercent <= 0"
          :severity="isUploading ? 'danger' : 'success'"
        />
      </div>
      
      <!-- Status Message -->
      <div class="status-message mb-3">
        <p v-if="isUploading" class="text-lg font-semibold">
          2/2 - Uploading video
        </p>
        <p v-else-if="isExporting" class="text-lg font-semibold">
          {{ statusTitle }}
        </p>
        <p v-else-if="hasError" class="text-lg font-semibold text-red-500">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          An error occurred during video export!
        </p>
        <p v-else-if="isComplete" class="text-lg font-semibold text-green-500">
          <i class="pi pi-check mr-2"></i>
          Video export complete!
        </p>
      </div>
      
      <!-- Output Path -->
      <div v-if="outputPath && !hasError" class="mb-3">
        <p class="text-sm text-gray-600">{{ outputPath }}</p>
      </div>
      
      <!-- Speed/Progress Info -->
      <div v-if="(isUploading || isExporting) && speedText" class="mb-3">
        <p class="text-sm">{{ speedText }}</p>
      </div>
      
      <!-- Error Message -->
      <div v-if="hasError" class="mb-4">
        <Message severity="error" :closable="false">
          {{ exportStatus.error }}
        </Message>
      </div>
      
      <!-- Processing Method Info -->
      <div v-if="isExporting && exportStatus.output && exportStatus.output.length > 0" class="mb-3">
        <div class="processing-info">
          <i class="pi pi-info-circle mr-2"></i>
          <span class="text-sm">
            {{ processingMethod }}
          </span>
        </div>
      </div>

      <!-- Output Details (if available) -->
      <div v-if="exportStatus.output && exportStatus.output.length > 0" class="mb-4">
        <Accordion>
          <AccordionTab>
            <template #header>
              <span>Show details ({{ exportStatus.output.length }} lines)</span>
            </template>
            <div class="output-details">
              <p 
                v-for="(line, index) in exportStatus.output" 
                :key="index"
                class="output-line"
              >
                {{ line }}
              </p>
            </div>
          </AccordionTab>
        </Accordion>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button 
          v-if="(isUploading || isExporting) && !hasError"
          label="Abort" 
          severity="danger"
          @click="abort"
        />
        <Button 
          v-else-if="hasError"
          label="Dismiss" 
          @click="dismiss"
        />
        <div v-else class="flex gap-2">
          <Button 
            v-if="outputPath"
            icon="pi pi-folder"
            severity="secondary"
            v-tooltip.top="'Open containing folder'"
            @click="openFolder"
          />
          <Button 
            v-if="outputPath"
            icon="pi pi-play"
            severity="secondary"
            v-tooltip.top="'Open video'"
            @click="openFile"
          />
          <Button 
            label="Dismiss" 
            @click="dismiss"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script>
import { computed, watch } from 'vue';
import { useStore } from 'vuex';
import Dialog from 'primevue/dialog';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Button from 'primevue/button';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Tooltip from 'primevue/tooltip';
import { readableBytes } from '@/utils/videoEditorUtils';

export default {
  name: 'ExportStatus',
  components: {
    Dialog,
    ProgressBar,
    Message,
    Button,
    Accordion,
    AccordionTab,
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const store = useStore();
    
    const exportStatus = computed(() => store.state.videoeditor.exportStatus);
    const exportState = computed(() => store.state.videoeditor.export);
    const fullDuration = computed(() => store.getters['videoeditor/fullDuration']);
    const toHms = computed(() => store.getters['videoeditor/toHms']);
    const exportProgress = computed(() => store.getters['videoeditor/exportProgress']);
    const isExporting = computed(() => store.getters['videoeditor/isExporting']);
    const isUploading = computed(() => store.getters['videoeditor/isUploading']);
    
    const showStatus = computed({
      get: () => exportStatus.value.show,
      set: (value) => store.commit('videoeditor/SET_EXPORT_STATUS_SHOW', value),
    });
    
    const outputPath = computed(() => exportState.value.outputPath);
    
    const hasError = computed(() => !!exportStatus.value.error);
    const isComplete = computed(() => exportStatus.value.done && !hasError.value);
    
    const exportProgressPercent = computed(() => {
      const progress = exportProgress.value;
      if (typeof progress === 'number') {
        return Math.round(progress * 100);
      }
      return 0;
    });
    
    const statusTitle = computed(() => {
      if (isUploading.value) {
        return '2/2 - Uploading video';
      } else if (isExporting.value) {
        return 'Exporting video';
      } else if (hasError.value) {
        return 'Export Error';
      } else if (isComplete.value) {
        return 'Export Complete';
      }
      return 'Export Status';
    });
    
    const speedText = computed(() => {
      if (isUploading.value) {
        // YouTube upload not implemented yet
        return '';
      } else if (isExporting.value) {
        const progress = exportStatus.value.progress;
        let time = '00:00.00';
        if (progress && typeof progress === 'object' && progress.timemark) {
          time = progress.timemark.substring(3) || '00:00.00';
        }
        const totalTime = toHms.value(fullDuration.value);
        return `Exported: ${time} / ${totalTime}`;
      }
      return '';
    });

    const processingMethod = computed(() => {
      if (!exportStatus.value.output || exportStatus.value.output.length === 0) {
        return '';
      }
      const firstLine = exportStatus.value.output[0] || '';
      if (firstLine.includes('Client-side')) {
        return 'Processing locally in your browser';
      } else if (firstLine.includes('Server-side')) {
        return 'Processing on server';
      }
      return '';
    });
    
    watch(() => showStatus.value, (newVal) => {
      if (!newVal && hasError.value) {
        // When dismissing error, reset status
        store.dispatch('videoeditor/resetExportStatus');
      }
    });
    
    const dismiss = () => {
      store.dispatch('videoeditor/resetExportStatus');
    };
    
    const abort = async () => {
      if (isExporting.value) {
        // Cancel export job via backend API
        try {
          await store.dispatch('videoeditor/cancelExport');
        } catch (error) {
          console.error('Failed to cancel export:', error);
          // Still reset status even if cancellation fails
          store.dispatch('videoeditor/resetExportStatus');
        }
      } else if (isUploading.value) {
        // TODO: Implement upload cancellation
        console.log('Cancel upload');
        store.dispatch('videoeditor/resetExportStatus');
      } else {
        store.dispatch('videoeditor/resetExportStatus');
      }
    };
    
    const openFile = () => {
      if (outputPath.value) {
        // In a web environment, we can't directly open files
        // Instead, we might want to download or open in a new tab
        window.open(outputPath.value, '_blank');
      }
    };
    
    const openFolder = () => {
      // In a web environment, we can't open folders
      // This would be an Electron-specific feature
      console.log('Open folder:', outputPath.value);
    };
    
    return {
      showStatus,
      exportStatus,
      outputPath,
      hasError,
      isComplete,
      isExporting,
      isUploading,
      exportProgressPercent,
      statusTitle,
      speedText,
      processingMethod,
      dismiss,
      abort,
      openFile,
      openFolder,
    };
  },
};
</script>

<style scoped>
.export-status-content {
  padding: 1rem 0;
}

.status-message {
  min-height: 2rem;
}

.output-details {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: var(--surface-ground);
  border-radius: 4px;
}

.output-line {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.processing-info {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background-color: var(--surface-ground);
  border-radius: 4px;
  color: var(--text-color-secondary);
}
</style>
