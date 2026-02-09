<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-4">
          <h5 class="m-0">Instance Management</h5>
          <div class="flex align-items-center gap-2">
            <Button 
              label="Add Instance"
              icon="pi pi-plus"
              class="p-button-sm"
              @click="openCreateDialog"
            />
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
                    <div class="text-xl font-semibold">{{ summary.total_queue_size || 0 }}</div>
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
                  @toggle-enabled="toggleInstance"
                  @edit-instance="openEditDialog"
                  @delete-instance="deleteInstance"
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

    <Dialog
      v-model:visible="showInstanceDialog"
      :header="dialogTitle"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="block text-sm mb-2">Name</label>
          <InputText v-model="formState.name" class="w-full" />
        </div>
        <div class="field">
          <label class="block text-sm mb-2">URL</label>
          <InputText v-model="formState.url" class="w-full" />
        </div>
        <div class="field">
          <label class="block text-sm mb-2">Type</label>
          <Dropdown
            v-model="formState.type"
            :options="instanceTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            class="w-full"
          />
        </div>
        <div class="field flex align-items-center gap-2">
          <InputSwitch v-model="formState.enabled" />
          <span class="text-sm">{{ formState.enabled ? 'Enabled' : 'Disabled' }}</span>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" class="p-button-text" @click="closeDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveInstance" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
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
    Dialog,
    Dropdown,
    InputSwitch,
    InputText,
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
    const showInstanceDialog = ref(false);
    const dialogTitle = ref('Add Instance');
    const editingInstanceId = ref(null);
    const formState = ref({
      name: '',
      url: '',
      type: null,
      enabled: true,
    });
    const instanceTypeOptions = [
      { label: 'Stable Diffusion Forge', value: 'stable_diffusion_forge' },
      { label: 'ComfyUI', value: 'comfyui' },
      { label: 'Ollama', value: 'ollama' },
    ];

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
        total_queue_size: 0
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

    const openCreateDialog = () => {
      dialogTitle.value = 'Add Instance';
      editingInstanceId.value = null;
      formState.value = {
        name: '',
        url: '',
        type: null,
        enabled: true,
      };
      showInstanceDialog.value = true;
    };

    const openEditDialog = (instanceId) => {
      const instance = instances.value.find(i => i.id === instanceId);
      if (!instance) return;
      dialogTitle.value = 'Edit Instance';
      editingInstanceId.value = instanceId;
      formState.value = {
        name: instance.name || '',
        url: instance.url || '',
        type: instance.type || null,
        enabled: Boolean(instance.enabled),
      };
      showInstanceDialog.value = true;
    };

    const closeDialog = () => {
      showInstanceDialog.value = false;
    };

    const saveInstance = async () => {
      const payload = {
        name: formState.value.name?.trim(),
        url: formState.value.url?.trim(),
        type: formState.value.type,
        enabled: Boolean(formState.value.enabled),
      };

      if (!payload.name || !payload.url || !payload.type) {
        error.value = 'Name, URL, and type are required.';
        return;
      }

      try {
        if (editingInstanceId.value) {
          await instanceAdminService.updateInstance(editingInstanceId.value, payload);
        } else {
          await instanceAdminService.createInstance(payload);
        }
        showInstanceDialog.value = false;
        await fetchData();
      } catch (err) {
        console.error('Failed to save instance:', err);
        error.value = err.message || 'Failed to save instance';
      }
    };

    const toggleInstance = async (instanceId) => {
      try {
        await instanceAdminService.toggleInstance(instanceId);
        await fetchData();
      } catch (err) {
        console.error('Failed to toggle instance:', err);
        error.value = err.message || 'Failed to toggle instance';
      }
    };

    const deleteInstance = async (instanceId) => {
      const instance = instances.value.find(i => i.id === instanceId);
      const confirmed = window.confirm(`Delete instance "${instance?.name || instanceId}"?`);
      if (!confirmed) return;
      try {
        await instanceAdminService.deleteInstance(instanceId);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete instance:', err);
        error.value = err.message || 'Failed to delete instance';
      }
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
      openCreateDialog,
      openEditDialog,
      closeDialog,
      saveInstance,
      toggleInstance,
      deleteInstance,
      showMetricsDialog,
      showJobHistoryDialog,
      showInstanceDialog,
      dialogTitle,
      formState,
      instanceTypeOptions,
      selectedInstanceId,
      selectedInstanceName,
      openMetricsDialog,
      openJobHistoryDialog
    };
  }
};
</script>
