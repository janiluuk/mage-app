<template>
  <div class="card">
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="flex align-items-center gap-2">
        <h5 class="m-0">{{ instance.name }}</h5>
        <Tag 
          :value="healthStatusLabel" 
          :severity="healthStatusSeverity"
          :icon="healthStatusIcon"
        />
        <Tag
          :value="instance.enabled ? 'Enabled' : 'Disabled'"
          :severity="instance.enabled ? 'success' : 'warning'"
          icon="pi pi-power-off"
        />
      </div>
      <div class="flex align-items-center gap-1">
        <i :class="typeIcon" class="text-sm"></i>
        <span class="text-sm text-color-secondary">{{ typeLabel }}</span>
      </div>
    </div>

    <!-- Metrics Section -->
    <div class="grid">
      <!-- GPU Utilization -->
      <div class="col-12">
        <label class="block text-sm mb-2">GPU Utilization</label>
        <ProgressBar 
          :value="gpuUtilization" 
          :showValue="true"
          :class="getProgressBarClass(gpuUtilization)"
        />
      </div>

      <!-- CPU Utilization -->
      <div class="col-12">
        <label class="block text-sm mb-2">CPU Utilization</label>
        <ProgressBar 
          :value="cpuUtilization" 
          :showValue="true"
          :class="getProgressBarClass(cpuUtilization)"
        />
      </div>

      <!-- Memory Utilization -->
      <div class="col-12">
        <label class="block text-sm mb-2">Memory Utilization</label>
        <ProgressBar 
          :value="memoryUtilization" 
          :showValue="true"
          :class="getProgressBarClass(memoryUtilization)"
        />
      </div>

      <!-- Current Model -->
      <div class="col-12 md:col-6">
        <label class="block text-sm mb-2 text-600">Current Model</label>
        <div class="text-sm">{{ currentModel || 'N/A' }}</div>
      </div>

      <!-- Queue Info -->
      <div class="col-12 md:col-6">
        <label class="block text-sm mb-2 text-600">Queue Status</label>
        <div class="text-sm">
          Queue: {{ instance.queue_count || 0 }} | 
          Processing: {{ instance.processing_count || 0 }}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 mt-3">
      <Button 
        :label="instance.enabled ? 'Disable' : 'Enable'"
        :icon="instance.enabled ? 'pi pi-ban' : 'pi pi-check'"
        :severity="instance.enabled ? 'warning' : 'success'"
        class="p-button-sm"
        data-testid="toggle-instance-button"
        @click="$emit('toggle-enabled', instance.id)"
      />
      <Button 
        label="Edit"
        icon="pi pi-pencil"
        class="p-button-sm p-button-outlined"
        data-testid="edit-instance-button"
        @click="$emit('edit-instance', instance.id)"
      />
      <Button 
        label="Delete"
        icon="pi pi-trash"
        class="p-button-sm p-button-outlined p-button-danger"
        data-testid="delete-instance-button"
        @click="$emit('delete-instance', instance.id)"
      />
      <Button 
        label="View History" 
        icon="pi pi-chart-line" 
        class="p-button-sm p-button-outlined"
        data-testid="view-history-button"
        @click="$emit('view-history', instance.id)"
      />
      <Button 
        label="View Jobs" 
        icon="pi pi-list" 
        class="p-button-sm p-button-outlined"
        data-testid="view-jobs-button"
        @click="$emit('view-jobs', instance.id)"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

export default {
  name: 'InstanceCard',
  components: {
    Button,
    ProgressBar,
    Tag
  },
  props: {
    instance: {
      type: Object,
      required: true
    }
  },
  emits: ['view-history', 'view-jobs', 'toggle-enabled', 'edit-instance', 'delete-instance'],
  setup(props) {
    const gpuUtilization = computed(() => {
      return Math.round(props.instance.metrics?.gpu_utilization || 0);
    });

    const cpuUtilization = computed(() => {
      return Math.round(props.instance.metrics?.cpu_utilization || 0);
    });

    const memoryUtilization = computed(() => {
      return Math.round(props.instance.metrics?.memory_utilization || 0);
    });

    const currentModel = computed(() => {
      return props.instance.metrics?.current_model || 'N/A';
    });

    const healthStatusLabel = computed(() => {
      const status = props.instance.health_status || 'unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
    });

    const healthStatusSeverity = computed(() => {
      const status = props.instance.health_status;
      if (status === 'online') return 'success';
      if (status === 'degraded') return 'warning';
      if (status === 'offline') return 'danger';
      return 'info';
    });

    const healthStatusIcon = computed(() => {
      const status = props.instance.health_status;
      if (status === 'online') return 'pi pi-check-circle';
      if (status === 'degraded') return 'pi pi-exclamation-triangle';
      if (status === 'offline') return 'pi pi-times-circle';
      return 'pi pi-question-circle';
    });

    const typeLabel = computed(() => {
      const typeMap = {
        stable_diffusion_forge: 'SD Forge',
        comfyui: 'ComfyUI',
        ollama: 'Ollama',
      };
      return typeMap[props.instance.type] || props.instance.type;
    });

    const typeIcon = computed(() => {
      const iconMap = {
        stable_diffusion_forge: 'pi pi-image',
        comfyui: 'pi pi-sitemap',
        ollama: 'pi pi-comments',
      };
      return iconMap[props.instance.type] || 'pi pi-server';
    });

    const getProgressBarClass = (value) => {
      if (value >= 90) return 'progress-bar-danger';
      if (value >= 70) return 'progress-bar-warning';
      return '';
    };

    return {
      gpuUtilization,
      cpuUtilization,
      memoryUtilization,
      currentModel,
      healthStatusLabel,
      healthStatusSeverity,
      healthStatusIcon,
      typeLabel,
      typeIcon,
      getProgressBarClass
    };
  }
};
</script>

<style scoped>
.progress-bar-warning :deep(.p-progressbar-value) {
  background-color: #FFA726;
}

.progress-bar-danger :deep(.p-progressbar-value) {
  background-color: #EF5350;
}
</style>
