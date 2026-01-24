<template>
  <div class="grid p-4">
    <div class="col-12">
      <h2>Instance Management UI Demo</h2>
      <p>This demo page showcases the admin panel UI components with mock data.</p>
    </div>

    <!-- Mock Instance Card -->
    <div class="col-12 lg:col-6">
      <InstanceCard 
        :instance="mockInstance1"
        @view-history="handleViewHistory"
        @view-jobs="handleViewJobs"
      />
    </div>

    <div class="col-12 lg:col-6">
      <InstanceCard 
        :instance="mockInstance2"
        @view-history="handleViewHistory"
        @view-jobs="handleViewJobs"
      />
    </div>

    <!-- Mock FFMpeg Worker Status -->
    <div class="col-12">
      <FFMpegWorkerStatus :ffmpegData="mockFFMpegData" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import InstanceCard from '@/components/admin/InstanceCard.vue';
import FFMpegWorkerStatus from '@/components/admin/FFMpegWorkerStatus.vue';

export default {
  name: 'AdminUIDemo',
  components: {
    InstanceCard,
    FFMpegWorkerStatus
  },
  setup() {
    const mockInstance1 = ref({
      id: 1,
      name: 'ComfyUI-1',
      type: 'comfyui',
      health_status: 'online',
      queue_count: 2,
      processing_count: 1,
      metrics: {
        gpu_utilization: 75.5,
        cpu_utilization: 45.2,
        memory_utilization: 60.8,
        current_model: 'stable-diffusion-xl'
      }
    });

    const mockInstance2 = ref({
      id: 2,
      name: 'SD-Forge-1',
      type: 'sd-forge',
      health_status: 'degraded',
      queue_count: 5,
      processing_count: 2,
      metrics: {
        gpu_utilization: 92.3,
        cpu_utilization: 68.5,
        memory_utilization: 85.2,
        current_model: 'flux-dev'
      }
    });

    const mockFFMpegData = ref({
      active_count: 2,
      pending_count: 1,
      active_jobs: [
        { id: 101, filename: 'video_123.mp4', progress: 40 },
        { id: 102, filename: 'video_456.mp4', progress: 15 }
      ]
    });

    const handleViewHistory = (instanceId) => {
      console.log('View history for instance:', instanceId);
    };

    const handleViewJobs = (instanceId) => {
      console.log('View jobs for instance:', instanceId);
    };

    return {
      mockInstance1,
      mockInstance2,
      mockFFMpegData,
      handleViewHistory,
      handleViewJobs
    };
  }
};
</script>
