<template>
  <Dialog 
    v-model:visible="dialogVisible" 
    header="Extend Video" 
    :modal="true"
    :style="{ width: '650px' }"
    @hide="resetForm"
  >
    <div class="extension-dialog-content">
      <div class="video-info">
        <p class="info-text">
          <i class="pi pi-video"></i>
          Extending: <strong>{{ videoTitle }}</strong>
        </p>
        <p v-if="videoDuration" class="info-text">
          <i class="pi pi-clock"></i>
          Current Duration: <strong>{{ formatDuration(videoDuration) }}</strong>
        </p>
      </div>

      <Divider />

      <div class="extension-options">
        <div class="field">
          <label for="method">
            <i class="pi pi-cog"></i>
            Interpolation Method:
          </label>
          <Dropdown 
            id="method"
            v-model="selectedMethod" 
            :options="methods" 
            optionLabel="label"
            optionValue="value"
            placeholder="Select interpolation method"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="method-option">
                <div class="method-name">{{ slotProps.option.label }}</div>
                <small class="method-desc">{{ slotProps.option.description }}</small>
              </div>
            </template>
          </Dropdown>
          <small class="field-help">{{ currentMethodDescription }}</small>
        </div>

        <div class="field">
          <label for="targetDuration">
            Target Duration: {{ formatDuration(targetDuration) }}
          </label>
          <div class="duration-slider-container">
            <Slider 
              id="targetDuration"
              v-model="targetDuration" 
              :min="minDuration"
              :max="maxDuration"
              :step="1"
              class="w-full"
            />
            <div class="slider-labels">
              <span>{{ formatDuration(minDuration) }}</span>
              <span>{{ formatDuration(maxDuration) }}</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="targetFps">
            Target FPS: {{ targetFps }}
          </label>
          <div class="fps-slider-container">
            <Slider 
              id="targetFps"
              v-model="targetFps" 
              :min="24"
              :max="60"
              :step="1"
              class="w-full"
            />
            <div class="slider-labels">
              <span>24 fps</span>
              <span>30 fps</span>
              <span>60 fps</span>
            </div>
          </div>
          <small class="field-help">Higher FPS = smoother motion but larger file size</small>
        </div>
      </div>

      <Divider />

      <div class="preview-info">
        <h4><i class="pi pi-info-circle"></i> Extension Preview</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Original Duration:</span>
            <span class="info-value">{{ formatDuration(videoDuration) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">New Duration:</span>
            <span class="info-value">{{ formatDuration(targetDuration) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Extension:</span>
            <span class="info-value">{{ formatDuration(targetDuration - videoDuration) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Original Frames:</span>
            <span class="info-value">{{ originalFrames }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">New Frames:</span>
            <span class="info-value">{{ targetFrames }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Frames to Generate:</span>
            <span class="info-value highlighted">{{ framesToGenerate }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Estimated Processing Time:</span>
            <span class="info-value">{{ estimatedProcessingTime }}</span>
          </div>
        </div>
      </div>

      <Message v-if="extensionRatio > 2" severity="warn" :closable="false">
        <p>You're extending the video by more than 2x its original length. This may result in visible artifacts or quality loss.</p>
      </Message>

      <div v-if="error" class="error-section">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <div v-if="processing" class="processing-section">
        <ProgressBar mode="indeterminate" />
        <p class="processing-text">Creating video extension job...</p>
      </div>
    </div>

    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times"
        @click="dialogVisible = false"
        :disabled="processing"
        class="p-button-text"
      />
      <Button 
        label="Extend Video" 
        icon="pi pi-check"
        @click="extendVideo" 
        :disabled="processing || !isValid"
        :loading="processing"
      />
    </template>
  </Dialog>
</template>

<script>
import { formatDuration } from '@/utils/format';

export default {
  name: 'VideoExtensionDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    videoId: {
      type: [String, Number],
      required: true
    },
    videoTitle: {
      type: String,
      default: 'Unknown Video'
    },
    videoDuration: {
      type: Number,
      required: true
    },
    videoFps: {
      type: Number,
      default: 30
    }
  },
  emits: ['update:visible', 'video-extended'],
  data() {
    return {
      selectedMethod: 'mci',
      targetDuration: 0,
      targetFps: 30,
      error: null,
      processing: false,
      methods: [
        {
          label: 'Motion Compensation (Best Quality)',
          value: 'mci',
          description: 'Analyzes motion between frames for smooth interpolation. Best quality but slower.'
        },
        {
          label: 'Blend (Faster)',
          value: 'blend',
          description: 'Simple frame blending. Faster processing but less accurate motion.'
        },
        {
          label: 'Duplicate Frames',
          value: 'dup',
          description: 'Duplicates frames to extend duration. Fastest but no smooth motion.'
        }
      ]
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
      }
    },
    minDuration() {
      return this.videoDuration;
    },
    maxDuration() {
      return this.videoDuration * 3;
    },
    originalFrames() {
      return Math.round(this.videoDuration * this.videoFps);
    },
    targetFrames() {
      return Math.round(this.targetDuration * this.targetFps);
    },
    framesToGenerate() {
      return Math.max(0, this.targetFrames - this.originalFrames);
    },
    extensionRatio() {
      return this.targetDuration / this.videoDuration;
    },
    currentMethodDescription() {
      const method = this.methods.find(m => m.value === this.selectedMethod);
      return method ? method.description : '';
    },
    isValid() {
      return this.targetDuration > this.videoDuration && 
             this.targetFps >= 24 && 
             this.targetFps <= 60;
    },
    estimatedProcessingTime() {
      // Rough estimate: based on frames to generate
      // Adjusted by method complexity
      const baseTime = this.framesToGenerate;
      let multiplier = 1;
      
      switch (this.selectedMethod) {
        case 'mci':
          multiplier = 2; // Most complex
          break;
        case 'blend':
          multiplier = 1; // Medium complexity
          break;
        case 'dup':
          multiplier = 0.1; // Very fast
          break;
      }
      
      const estimatedSeconds = baseTime * multiplier;
      
      if (estimatedSeconds < 60) {
        return `~${Math.ceil(estimatedSeconds)} seconds`;
      } else if (estimatedSeconds < 3600) {
        const mins = Math.ceil(estimatedSeconds / 60);
        return `~${mins} minute${mins > 1 ? 's' : ''}`;
      } else {
        const hours = Math.ceil(estimatedSeconds / 3600);
        return `~${hours} hour${hours > 1 ? 's' : ''}`;
      }
    }
  },
  watch: {
    videoDuration: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.targetDuration = newVal * 1.5;
        }
      }
    },
    videoFps: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.targetFps = newVal;
        }
      }
    }
  },
  methods: {
    formatDuration,

    async extendVideo() {
      if (!this.isValid) {
        this.error = 'Please ensure target duration is greater than original and FPS is between 24-60';
        return;
      }

      this.processing = true;
      this.error = null;

      try {
        const options = {
          method: this.selectedMethod,
          targetDuration: this.targetDuration,
          targetFps: this.targetFps,
          interpolationMode: this.selectedMethod
        };

        await this.$store.dispatch('videojobs/extendVideo', {
          videoId: this.videoId,
          options: options
        });

        this.$emit('video-extended', {
          videoId: this.videoId,
          originalDuration: this.videoDuration,
          newDuration: this.targetDuration
        });

        this.dialogVisible = false;
        this.resetForm();
      } catch (err) {
        console.error('Error extending video:', err);
        this.error = err.response?.data?.message || err.message || 'Failed to extend video. Please try again.';
      } finally {
        this.processing = false;
      }
    },

    resetForm() {
      this.selectedMethod = 'mci';
      this.targetDuration = this.videoDuration * 1.5;
      this.targetFps = this.videoFps || 30;
      this.error = null;
      this.processing = false;
    }
  }
};
</script>

<style scoped>
.extension-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.video-info {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary-color);
}

.info-text {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
}

.info-text i {
  color: var(--primary-color);
}

.extension-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field label i {
  color: var(--primary-color);
}

.field-help {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

.method-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.method-name {
  font-weight: 600;
}

.method-desc {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.duration-slider-container,
.fps-slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.preview-info {
  padding: 1rem;
  background: var(--surface-100);
  border-radius: var(--border-radius);
}

.preview-info h4 {
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
}

.preview-info h4 i {
  color: var(--primary-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-0);
  border-radius: var(--border-radius);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-color);
}

.info-value.highlighted {
  color: var(--primary-color);
  font-size: 1.125rem;
}

.error-section,
.processing-section {
  margin-top: 1rem;
}

.processing-text {
  text-align: center;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

@media (max-width: 768px) {
  .extension-dialog-content {
    gap: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
