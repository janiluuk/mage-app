<template>
  <Dialog 
    v-model:visible="isVisible" 
    :header="`Metrics History - ${instanceName}`"
    :modal="true"
    :style="{ width: '80vw' }"
    :maximizable="true"
  >
    <div v-if="loading" class="text-center py-5">
      <ProgressSpinner />
      <p class="mt-3">Loading metrics history...</p>
    </div>

    <div v-else-if="error" class="text-center py-5">
      <Message severity="error" :closable="false">
        {{ error }}
      </Message>
    </div>

    <div v-else>
      <!-- Chart Controls -->
      <div class="flex gap-2 mb-3">
        <Button 
          label="GPU" 
          :class="{ 'p-button-outlined': !showGpu }"
          @click="showGpu = !showGpu"
          class="p-button-sm"
        />
        <Button 
          label="CPU" 
          :class="{ 'p-button-outlined': !showCpu }"
          @click="showCpu = !showCpu"
          class="p-button-sm"
        />
        <Button 
          label="Memory" 
          :class="{ 'p-button-outlined': !showMemory }"
          @click="showMemory = !showMemory"
          class="p-button-sm"
        />
      </div>

      <!-- Chart Canvas -->
      <canvas ref="chartCanvas"></canvas>
    </div>
  </Dialog>
</template>

<script>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { Chart } from 'chart.js';
import instanceAdminService from '@/services/instanceAdminService';

export default {
  name: 'MetricsChart',
  components: {
    Dialog,
    Button,
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
    const chartCanvas = ref(null);
    const chartInstance = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const metricsData = ref([]);
    const showGpu = ref(true);
    const showCpu = ref(true);
    const showMemory = ref(true);

    const isVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    });

    const loadMetrics = async () => {
      if (!props.instanceId) return;

      loading.value = true;
      error.value = null;

      try {
        const response = await instanceAdminService.getMetricsHistory(props.instanceId);
        metricsData.value = response.history || [];
        renderChart();
      } catch (err) {
        console.error('Error loading metrics:', err);
        error.value = err.message || 'Failed to load metrics history';
      } finally {
        loading.value = false;
      }
    };

    const renderChart = () => {
      if (!chartCanvas.value || metricsData.value.length === 0) return;

      // Destroy existing chart
      if (chartInstance.value) {
        chartInstance.value.destroy();
      }

      const ctx = chartCanvas.value.getContext('2d');
      
      const labels = metricsData.value.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString();
      });

      const datasets = [];

      if (showGpu.value) {
        datasets.push({
          label: 'GPU Utilization (%)',
          data: metricsData.value.map(item => item.gpu_utilization || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        });
      }

      if (showCpu.value) {
        datasets.push({
          label: 'CPU Utilization (%)',
          data: metricsData.value.map(item => item.cpu_utilization || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4
        });
      }

      if (showMemory.value) {
        datasets.push({
          label: 'Memory Utilization (%)',
          data: metricsData.value.map(item => item.memory_utilization || 0),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4
        });
      }

      chartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Last 24 Hours'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Utilization (%)'
              }
            }
          }
        }
      });
    };

    // Watch for visibility changes
    watch(() => props.visible, (newVal) => {
      if (newVal && props.instanceId) {
        loadMetrics();
      }
    });

    // Watch for metric toggles
    watch([showGpu, showCpu, showMemory], () => {
      if (metricsData.value.length > 0) {
        renderChart();
      }
    });

    onUnmounted(() => {
      if (chartInstance.value) {
        chartInstance.value.destroy();
      }
    });

    return {
      isVisible,
      chartCanvas,
      loading,
      error,
      showGpu,
      showCpu,
      showMemory
    };
  }
};
</script>
