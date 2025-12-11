<template>
  <div class="motion-style-container">
    <div class="field">
      <label for="motion-style">Motion Style</label>
      <Dropdown
        id="motion-style"
        v-model="selectedStyle"
        :options="motionStyles"
        optionLabel="label"
        optionValue="value"
        placeholder="Select a motion style"
        @change="onStyleChange"
        class="w-full"
      />
      <small class="help-text">{{ getStyleDescription(selectedStyle) }}</small>
    </div>

    <!-- Show preset selector when classic style is selected -->
    <div v-if="selectedStyle === 'classic'" class="preset-selector">
      <label for="motion-preset">Motion Preset</label>
      <div class="preset-grid">
        <Card
          v-for="preset in presets"
          :key="preset.id"
          class="preset-card"
          :class="{ 'selected': selectedPreset?.id === preset.id }"
          @click="selectPreset(preset)"
        >
          <template #content>
            <div class="preset-content">
              <div class="preset-header">
                <i class="pi pi-play-circle"></i>
                <span class="preset-name">{{ preset.name }}</span>
              </div>
              <p class="preset-description">{{ preset.description }}</p>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Show BPM input when bpm style is selected -->
    <div v-if="selectedStyle === 'bpm'" class="bpm-input-section">
      <label for="bpm-value">BPM (Beats Per Minute)</label>
      <div class="p-inputgroup">
        <InputNumber
          id="bpm-value"
          v-model="bpmValue"
          :min="60"
          :max="200"
          :step="1"
          placeholder="Enter BPM"
          @input="onBpmChange"
          class="w-full"
        />
        <span class="p-inputgroup-addon">
          <i class="pi pi-heart"></i>
        </span>
      </div>
      <small class="help-text">Typical range: 60-200 BPM</small>
    </div>

    <!-- Show audio sync info when audio_sync style is selected -->
    <div v-if="selectedStyle === 'audio_sync'" class="audio-sync-info">
      <Message severity="info" :closable="false">
        <i class="pi pi-info-circle"></i>
        Motion will be automatically synchronized with audio amplitude and frequency analysis.
      </Message>
    </div>
  </div>
</template>

<script>
import { getAllPresets, getPresetsByType, initializePresetsDB } from '@/services/deforumPresets.db';

export default {
  name: 'MotionStyleSelector',
  emits: ['style-selected', 'preset-selected', 'bpm-changed'],
  data() {
    return {
      selectedStyle: null,
      selectedPreset: null,
      bpmValue: 120,
      presets: [],
      motionStyles: [
        { label: 'Audio Sync', value: 'audio_sync' },
        { label: 'BPM', value: 'bpm' },
        { label: 'Classic', value: 'classic' }
      ]
    };
  },
  async mounted() {
    await initializePresetsDB();
    await this.loadPresets();
  },
  methods: {
    async loadPresets() {
      try {
        this.presets = await getPresetsByType('classic');
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    },
    
    onStyleChange() {
      this.selectedPreset = null;
      this.$emit('style-selected', {
        style: this.selectedStyle,
        bpm: this.selectedStyle === 'bpm' ? this.bpmValue : null
      });
    },
    
    selectPreset(preset) {
      this.selectedPreset = preset;
      this.$emit('preset-selected', preset);
    },
    
    onBpmChange() {
      this.$emit('bpm-changed', this.bpmValue);
    },
    
    getStyleDescription(style) {
      const descriptions = {
        audio_sync: 'Motion automatically syncs with audio amplitude and frequency',
        bpm: 'Motion synchronized to beats per minute',
        classic: 'Choose from predefined motion presets'
      };
      return descriptions[style] || '';
    }
  }
};
</script>

<style scoped>
.motion-style-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}

.help-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  font-style: italic;
}

.preset-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preset-card.selected {
  border-color: var(--primary-color);
  background: var(--primary-50);
}

.preset-content {
  padding: 0.5rem;
}

.preset-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.preset-header i {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.preset-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
}

.preset-description {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.bpm-input-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.audio-sync-info {
  margin-top: 0.5rem;
}

.audio-sync-info .p-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
