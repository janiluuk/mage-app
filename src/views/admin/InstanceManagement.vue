<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <h5 class="m-0">Instance Management</h5>
          <div class="flex align-items-center gap-2">
            <Tag 
              v-if="lastUpdated" 
              :value="`Updated: ${lastUpdated}`" 
              severity="info"
              icon="pi pi-clock"
            />
            <Button 
              icon="pi pi-refresh" 
              @click="refreshData"
              :loading="loading"
              class="p-button-rounded p-button-text"
              v-tooltip.bottom="'Refresh'"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !statusData" class="text-center py-5">
          <ProgressSpinner />
          <p class="mt-3">Loading instance data...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-5">
          <Message severity="error" :closable="false">
            {{ error }}
          </Message>
          <Button 
            label="Retry" 
            icon="pi pi-refresh" 
            @click="refreshData"
            class="mt-3"
          />
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Summary Stats -->
          <div class="grid mb-4">
            <div class="col-12 md:col-3">
              <div class="surface-card shadow-1 p-3 border-round">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-server text-2xl text-blue-500"></i>
                  <div>
                    <div class="text-sm text-600">Total Instances</div>
                    <div class="text-xl font-semibold">{{ summary.total_instances || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-3">
              <div class="surface-card shadow-1 p-3 border-round">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-check-circle text-2xl text-green-500"></i>
                  <div>
                    <div class="text-sm text-600">Online</div>
                    <div class="text-xl font-semibold">{{ summary.online_instances || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-3">
              <div class="surface-card shadow-1 p-3 border-round">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-list text-2xl text-orange-500"></i>
                  <div>
                    <div class="text-sm text-600">Total Queue</div>
                    <div class="text-xl font-semibold">{{ summary.total_queue || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-3">
              <div class="surface-card shadow-1 p-3 border-round">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-cog text-2xl text-purple-500"></i>
                  <div>
                    <div class="text-sm text-600">Processing</div>
                    <div class="text-xl font-semibold">{{ totalProcessing }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Instance Cards -->
          <div class="mb-4">
            <h6 class="mb-3">Instances</h6>
            <div v-if="instances.length === 0" class="text-center text-600 py-5">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p class="m-0">No instances configured</p>
            </div>
            <div v-else class="grid">
              <div 
                v-for="instance in instances" 
                :key="instance.id" 
                class="col-12 lg:col-6"
              >
                <InstanceCard 
                  :instance="instance"
                  @view-history="openMetricsDialog"
                  @view-jobs="openJobHistoryDialog"
                />
              </div>
            </div>
          </div>

          <!-- FFMpeg Worker Status -->
          <FFMpegWorkerStatus :ffmpegData="ffmpegData" />
        </div>
      </div>
    </div>

    <!-- Metrics Chart Dialog -->
    <MetricsChart 
      v-model:visible="showMetricsDialog"
      :instanceId="selectedInstanceId"
      :instanceName="selectedInstanceName"
    />

    <!-- Job History Dialog -->
    <JobHistoryTable 
      v-model:visible="showJobHistoryDialog"
      :instanceId="selectedInstanceId"
      :instanceName="selectedInstanceName"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import InstanceCard from '@/components/admin/InstanceCard.vue';
import FFMpegWorkerStatus from '@/components/admin/FFMpegWorkerStatus.vue';
import MetricsChart from '@/components/admin/MetricsChart.vue';
import JobHistoryTable from '@/components/admin/JobHistoryTable.vue';
import instanceAdminService from '@/services/instanceAdminService';

export default {
  name: 'InstanceManagement',
  components: {
    Button,
    Message,
    ProgressSpinner,
    Tag,
    InstanceCard,
    FFMpegWorkerStatus,
    MetricsChart,
    JobHistoryTable
  },
  setup() {
    const loading = ref(false);
    const error = ref(null);
    const statusData = ref(null);
    const lastUpdated = ref(null);
    const refreshInterval = ref(null);
    const showMetricsDialog = ref(false);
    const showJobHistoryDialog = ref(false);
    const selectedInstanceId = ref(null);
    const selectedInstanceName = ref('');

    const instances = computed(() => {
      return statusData.value?.instances || [];
    });

    const ffmpegData = computed(() => {
      return statusData.value?.ffmpeg || {
        active_count: 0,
        pending_count: 0,
        active_jobs: []
      };
    });

    const summary = computed(() => {
      return statusData.value?.summary || {
        total_instances: 0,
        online_instances: 0,
        total_queue: 0
      };
    });

    const totalProcessing = computed(() => {
      return instances.value.reduce((total, instance) => {
        return total + (instance.processing_count || 0);
      }, 0);
    });

    const fetchData = async () => {
      loading.value = true;
      error.value = null;

      try {
        const data = await instanceAdminService.getStatus();
        statusData.value = data;
        lastUpdated.value = new Date().toLocaleTimeString();
      } catch (err) {
        console.error('Error fetching instance status:', err);
        error.value = err.message || 'Failed to load instance data';
      } finally {
        loading.value = false;
      }
    };

    const refreshData = () => {
      fetchData();
    };

    const openMetricsDialog = (instanceId) => {
      const instance = instances.value.find(i => i.id === instanceId);
      if (instance) {
        selectedInstanceId.value = instanceId;
        selectedInstanceName.value = instance.name;
        showMetricsDialog.value = true;
      }
    };

    const openJobHistoryDialog = (instanceId) => {
      const instance = instances.value.find(i => i.id === instanceId);
      if (instance) {
        selectedInstanceId.value = instanceId;
        selectedInstanceName.value = instance.name;
        showJobHistoryDialog.value = true;
      }
    };

    const startAutoRefresh = () => {
      // Auto-refresh interval (default: 30 seconds, configurable via env)
      const envRefreshInterval = import.meta.env.VITE_ADMIN_REFRESH_INTERVAL;
      const parsedRefreshInterval = envRefreshInterval !== undefined
        ? parseInt(envRefreshInterval, 10)
        : NaN;
      const refreshIntervalMs = Number.isNaN(parsedRefreshInterval) ? 30000 : parsedRefreshInterval;
      refreshInterval.value = setInterval(() => {
        fetchData();
      }, refreshIntervalMs);
    };

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
        refreshInterval.value = null;
      }
    };

    onMounted(() => {
      fetchData();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      loading,
      error,
      statusData,
      lastUpdated,
      instances,
      ffmpegData,
      summary,
      totalProcessing,
      refreshData,
      showMetricsDialog,
      showJobHistoryDialog,
      selectedInstanceId,
      selectedInstanceName,
      openMetricsDialog,
      openJobHistoryDialog
    };
  }
};
</script>
