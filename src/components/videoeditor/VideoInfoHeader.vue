<template>
  <div class="video-info-header">
    <div class="info-content">
      <div class="video-info">
        <div class="info-item">
          <i class="pi pi-video mr-2"></i>
          <div class="info-text">
            <span class="info-label">Video:</span>
            <span class="info-value">{{ videoName }}</span>
          </div>
        </div>
        
        <div v-if="storyInfo" class="info-item">
          <i class="pi pi-book mr-2"></i>
          <div class="info-text">
            <span class="info-label">Story:</span>
            <span class="info-value">{{ storyInfo.name || `Story #${storyInfo.id}` }}</span>
          </div>
        </div>
        
        <div v-if="videoMetadata" class="info-item">
          <i class="pi pi-info-circle mr-2"></i>
          <div class="info-text">
            <span class="info-label">Duration:</span>
            <span class="info-value">{{ formatDuration(videoMetadata.duration) }}</span>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <Button
          v-if="storyInfo"
          :label="storyInfo.name || `Story #${storyInfo.id}`"
          icon="pi pi-book"
          size="small"
          text
          @click="goToStory"
          v-tooltip.top="'View story'"
        />
        <Button
          :label="videoType === 'file' ? 'View File' : 'View Job'"
          icon="pi pi-arrow-left"
          size="small"
          text
          @click="goToVideo"
          v-tooltip.top="'Go back to video page'"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';

export default {
  name: 'VideoInfoHeader',
  components: {
    Button,
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    
    const videoData = computed(() => store.state.videoeditor.videoMetadata);
    const storyInfo = computed(() => store.state.videoeditor.storyInfo);
    const videoType = computed(() => store.state.videoeditor.videoType);
    const videoId = computed(() => store.state.videoeditor.videoId);
    
    const videoName = computed(() => {
      if (videoData.value) {
        // Try multiple possible name fields
        const name = videoData.value.fileName || 
                     videoData.value.name || 
                     videoData.value.filename ||
                     videoData.value.attributes?.name ||
                     videoData.value.attributes?.filename ||
                     videoData.value.attributes?.file?.original_name;
        
        if (name) return name;
      }
      
      // Fallback to video ID or default
      if (videoId.value) {
        return `Video ${videoId.value}`;
      }
      return 'Unknown Video';
    });
    
    const videoMetadata = computed(() => {
      if (!videoData.value) return null;
      const activeFragment = store.state.videoeditor.activeFragment;
      if (activeFragment?.video) {
        return {
          duration: activeFragment.video.duration,
          width: activeFragment.video.width,
          height: activeFragment.video.height,
          fps: activeFragment.video.fps,
        };
      }
      return null;
    });
    
    const formatDuration = (seconds) => {
      if (!seconds || isNaN(seconds)) return '00:00';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    const goToVideo = () => {
      if (videoType.value === 'file') {
        router.push(`/browser?file=${videoId.value}`);
      } else if (videoType.value === 'job') {
        router.push(`/browser?job=${videoId.value}`);
      } else {
        router.push('/browser');
      }
    };
    
    const goToStory = () => {
      if (storyInfo.value?.id) {
        router.push(`/stories/${storyInfo.value.id}/edit`);
      }
    };
    
    return {
      videoName,
      storyInfo,
      videoMetadata,
      videoType,
      videoId,
      formatDuration,
      goToVideo,
      goToStory,
    };
  },
};
</script>

<style scoped>
.video-info-header {
  background-color: var(--surface-ground, rgba(128, 128, 128, 0.1));
  border-bottom: 1px solid var(--surface-border, rgba(255, 255, 255, 0.1));
  padding: 0.75rem 1rem;
}

.info-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.video-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  opacity: 0.7;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 500;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .info-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .video-info {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

