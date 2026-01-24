<template>
  <div class="card">
    <h5>FFMpeg Workers</h5>
    
    <div class="grid mb-3">
      <div class="col-12 md:col-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-play-circle text-2xl text-green-500"></i>
          <div>
            <div class="text-sm text-600">Active</div>
            <div class="text-xl font-semibold">{{ ffmpegData.active_count || 0 }}</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-clock text-2xl text-orange-500"></i>
          <div>
            <div class="text-sm text-600">Pending</div>
            <div class="text-xl font-semibold">{{ ffmpegData.pending_count || 0 }}</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-list text-2xl text-blue-500"></i>
          <div>
            <div class="text-sm text-600">Total Queue</div>
            <div class="text-xl font-semibold">{{ totalQueue }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Jobs List -->
    <div v-if="activeJobs.length > 0">
      <h6 class="mb-2">Active Encoding Jobs</h6>
      <div v-for="job in activeJobs" :key="job.id" class="mb-2 p-3 surface-ground border-round">
        <div class="flex justify-content-between align-items-center mb-2">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-video text-primary"></i>
            <span class="font-medium">{{ job.filename || `Job #${job.id}` }}</span>
          </div>
          <Tag :value="`${job.progress || 0}%`" severity="info" />
        </div>
        <ProgressBar 
          :value="job.progress || 0" 
          :showValue="false"
          class="h-0.5rem"
        />
      </div>
    </div>

    <div v-else class="text-center text-600 py-3">
      <i class="pi pi-inbox text-4xl mb-2"></i>
      <p class="m-0">No active encoding jobs</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

export default {
  name: 'FFMpegWorkerStatus',
  components: {
    ProgressBar,
    Tag
  },
  props: {
    ffmpegData: {
      type: Object,
      default: () => ({
        active_count: 0,
        pending_count: 0,
        active_jobs: []
      })
    }
  },
  setup(props) {
    const activeJobs = computed(() => {
      return props.ffmpegData.active_jobs || [];
    });

    const totalQueue = computed(() => {
      return (props.ffmpegData.active_count || 0) + (props.ffmpegData.pending_count || 0);
    });

    return {
      activeJobs,
      totalQueue
    };
  }
};
</script>

<style scoped>
.h-0\.5rem {
  height: 0.5rem;
}
</style>
