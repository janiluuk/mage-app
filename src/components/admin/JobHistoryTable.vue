<template>
  <Dialog 
    v-model:visible="isVisible" 
    :header="`Job History - ${instanceName}`"
    :modal="true"
    :style="{ width: '80vw' }"
    :maximizable="true"
  >
    <div v-if="loading" class="text-center py-5">
      <ProgressSpinner />
      <p class="mt-3">Loading job history...</p>
    </div>

    <div v-else-if="error" class="text-center py-5">
      <Message severity="error" :closable="false">
        {{ error }}
      </Message>
    </div>

    <DataTable 
      v-else
      :value="jobs" 
      :paginator="true" 
      :rows="10"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      responsiveLayout="scroll"
      :loading="loading"
      class="p-datatable-sm"
    >
      <Column field="id" header="Job ID" :sortable="true" />
      <Column field="status" header="Status" :sortable="true">
        <template #body="slotProps">
          <Tag 
            :value="slotProps.data.status" 
            :severity="getStatusSeverity(slotProps.data.status)"
          />
        </template>
      </Column>
      <Column field="processing_time" header="Processing Time" :sortable="true">
        <template #body="slotProps">
          {{ formatProcessingTime(slotProps.data.processing_time) }}
        </template>
      </Column>
      <Column field="created_at" header="Created" :sortable="true">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column field="completed_at" header="Completed" :sortable="true">
        <template #body="slotProps">
          {{ slotProps.data.completed_at ? formatDate(slotProps.data.completed_at) : 'N/A' }}
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>

<script>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import instanceAdminService from '@/services/instanceAdminService';

export default {
  name: 'JobHistoryTable',
  components: {
    Dialog,
    DataTable,
    Column,
    Tag,
    Message,
    ProgressSpinner
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    instanceId: {
      type: Number,
      default: null
    },
    instanceName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const jobs = ref([]);

    const isVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    });

    const loadJobHistory = async () => {
      if (!props.instanceId) return;

      loading.value = true;
      error.value = null;

      try {
        const response = await instanceAdminService.getJobHistory(props.instanceId);
        jobs.value = response.jobs || [];
      } catch (err) {
        console.error('Error loading job history:', err);
        error.value = err.message || 'Failed to load job history';
      } finally {
        loading.value = false;
      }
    };

    const getStatusSeverity = (status) => {
      if (status === 'completed') return 'success';
      if (status === 'failed') return 'danger';
      if (status === 'processing') return 'info';
      return 'warning';
    };

    const formatProcessingTime = (seconds) => {
      if (!seconds) return 'N/A';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    // Watch for visibility changes
    watch(() => props.visible, (newVal) => {
      if (newVal && props.instanceId) {
        loadJobHistory();
      }
    });

    return {
      isVisible,
      loading,
      error,
      jobs,
      getStatusSeverity,
      formatProcessingTime,
      formatDate
    };
  }
};
</script>
