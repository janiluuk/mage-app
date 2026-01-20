<template>
  <div class="video-info-footer">
    <div class="info-text">
      <span 
        v-if="videoFileName" 
        class="info-item clickable"
        @click="openVideoFile"
        v-tooltip.top="'Open video file'"
      >
        {{ videoFileName }}
      </span>
      <span v-if="activeFragment" class="info-item">
        Fragment: {{ formatTime(activeFragment.adjustedDuration) }}
      </span>
      <span v-if="videoMetadata" class="info-item">
        Resolution: {{ videoMetadata.width }}×{{ videoMetadata.height }}
      </span>
      <span v-if="videoMetadata" class="info-item">
        FPS: {{ videoMetadata.fps }}
      </span>
      <span v-if="videoMetadata?.bitrate" class="info-item">
        Bitrate: {{ readableBitrate(videoMetadata.bitrate) }}
      </span>
    </div>
    <div class="zoom-control">
      <Button
        icon="pi pi-search-plus"
        size="small"
        text
        @click="resetZoom"
        v-tooltip.top="'Reset zoom'"
      />
      <Slider
        v-model="zoomValue"
        :min="0.1"
        :max="7"
        :step="0.01"
        class="zoom-slider"
        @update:modelValue="updateZoom"
        @wheel="handleWheel"
      />
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import Button from 'primevue/button';
import Slider from 'primevue/slider';
import Tooltip from 'primevue/tooltip';
import { readableBytes } from '@/utils/videoEditorUtils';

export default {
  name: 'VideoInfoFooter',
  components: {
    Button,
    Slider,
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const store = useStore();
    const zoomValue = ref(3.5);
    
    const activeFragment = computed(() => store.state.videoeditor.activeFragment);
    const widthPerSecond = computed(() => store.state.videoeditor.configTimeline.widthPerSecond);
    
    const videoMetadata = computed(() => {
      if (!activeFragment.value?.video) return null;
      return {
        width: activeFragment.value.video.width,
        height: activeFragment.value.video.height,
        fps: activeFragment.value.video.fps,
        bitrate: activeFragment.value.video.bitrate,
      };
    });
    
    const videoFileName = computed(() => {
      if (activeFragment.value?.video) {
        return activeFragment.value.video.fileName;
      }
      return null;
    });
    
    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '00:00';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    const readableBitrate = (bitrate) => {
      if (!bitrate) return 'N/A';
      return readableBytes(bitrate) + '/s';
    };
    
    const updateZoom = (value) => {
      // Convert slider value to widthPerSecond
      // Slider uses non-linear scale: center value is 3, values > 3 are scaled up
      const centerValue = 3;
      let wps = value;
      if (wps > centerValue) {
        wps = centerValue + (wps - centerValue) * 5;
      }
      store.commit('videoeditor/SET_TIMELINE_WIDTH_PER_SECOND', wps);
    };
    
    const resetZoom = () => {
      zoomValue.value = 3.5;
      store.commit('videoeditor/SET_TIMELINE_WIDTH_PER_SECOND', 3.5);
    };
    
    const handleWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.0001;
      zoomValue.value = Math.max(0.1, Math.min(7, zoomValue.value - delta));
    };
    
    const openVideoFile = () => {
      if (activeFragment.value?.video?.videoUrl) {
        window.open(activeFragment.value.video.videoUrl, '_blank');
      }
    };
    
    // Sync zoom value with store
    watch(widthPerSecond, (newValue) => {
      const centerValue = 3;
      let sliderValue = newValue;
      if (sliderValue > centerValue) {
        sliderValue = centerValue + (sliderValue - centerValue) / 5;
      }
      zoomValue.value = sliderValue;
    }, { immediate: true });
    
    return {
      zoomValue,
      activeFragment,
      videoMetadata,
      videoFileName,
      formatTime,
      readableBitrate,
      updateZoom,
      resetZoom,
      handleWheel,
      openVideoFile,
    };
  },
};
</script>

<style scoped>
.video-info-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: var(--surface-ground, rgba(128, 128, 128, 0.05));
  border-top: 1px solid var(--surface-border, rgba(255, 255, 255, 0.1));
  min-height: 40px;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
}

.info-item {
  font-size: 0.75rem;
  opacity: 0.7;
  text-transform: uppercase;
  white-space: nowrap;
}

.info-item:not(.clickable) {
  text-transform: uppercase;
}

.clickable {
  cursor: pointer;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  transition: background-color 0.2s;
}

.clickable:hover {
  background-color: var(--surface-hover, rgba(255, 255, 255, 0.1));
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.zoom-slider {
  flex: 1;
  min-width: 150px;
}
</style>
