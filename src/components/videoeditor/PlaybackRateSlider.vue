<template>
  <div class="playback-rate-slider">
    <label class="slider-label">Speed</label>
    <div class="slider-container">
      <Slider
        v-model="playbackRate"
        :min="0.25"
        :max="4"
        :step="0.05"
        class="slider"
        @update:modelValue="updatePlaybackRate"
      />
      <span class="slider-value">{{ playbackRate.toFixed(2) }}x</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import Slider from 'primevue/slider';

export default {
  name: 'PlaybackRateSlider',
  components: { Slider },
  setup() {
    const store = useStore();
    
    const playbackRate = computed({
      get: () => {
        const activeFragment = store.state.videoeditor.activeFragment;
        return activeFragment?.playbackRate ?? 1;
      },
      set: (value) => {
        store.dispatch('videoeditor/setFragmentPlaybackRate', { playbackRate: value });
      }
    });

    const updatePlaybackRate = (value) => {
      playbackRate.value = value;
    };

    return {
      playbackRate,
      updatePlaybackRate,
    };
  },
};
</script>

<style scoped>
.playback-rate-slider {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 100px;
}

.slider-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider {
  flex: 1;
  min-width: 80px;
}

.slider-value {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  min-width: 40px;
  text-align: right;
}
</style>
