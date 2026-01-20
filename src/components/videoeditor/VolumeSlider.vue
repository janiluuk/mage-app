<template>
  <div class="volume-slider">
    <label class="slider-label">Volume</label>
    <div class="slider-container">
      <Slider
        v-model="volume"
        :min="0"
        :max="1"
        :step="0.01"
        class="slider"
        @update:modelValue="updateVolume"
      />
      <span class="slider-value">{{ Math.round(volume * 100) }}%</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import Slider from 'primevue/slider';

export default {
  name: 'VolumeSlider',
  components: { Slider },
  setup() {
    const store = useStore();
    
    const volume = computed({
      get: () => {
        const activeFragment = store.state.videoeditor.activeFragment;
        return activeFragment?.volume ?? 1;
      },
      set: (value) => {
        store.dispatch('videoeditor/setFragmentVolume', { volume: value });
      }
    });

    const updateVolume = (value) => {
      volume.value = value;
    };

    return {
      volume,
      updateVolume,
    };
  },
};
</script>

<style scoped>
.volume-slider {
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
  min-width: 35px;
  text-align: right;
}
</style>
