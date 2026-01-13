<template>
  <Dialog 
    v-model:visible="dialogVisible" 
    header="Add Soundtrack" 
    :modal="true"
    :style="{ width: '600px' }"
    @hide="resetForm"
  >
    <div class="soundtrack-dialog-content">
      <div class="video-info">
        <p class="info-text">
          <i class="pi pi-video"></i>
          Adding soundtrack to: <strong>{{ videoTitle }}</strong>
        </p>
        <p v-if="resolvedVideoDuration" class="info-text">
          <i class="pi pi-clock"></i>
          Video Duration: <strong>{{ formatDuration(resolvedVideoDuration) }}</strong>
        </p>
      </div>

      <div class="audio-upload-section">
        <AudioFileUpload 
          @file-selected="onAudioSelected"
          @file-removed="onAudioRemoved"
        />
      </div>

      <div v-if="audioFile" class="audio-options">
        <Divider />
        
        <div class="field" v-if="audioDuration && resolvedVideoDuration">
          <label for="audio-range">
            Audio Clip ({{ formatDuration(audioStart) }} - {{ formatDuration(audioEnd) }})
          </label>
          <div class="audio-range">
            <Slider
              id="audio-range"
              v-model="audioRange"
              :min="0"
              :max="audioDuration"
              :step="0.1"
              range
              class="w-full"
              :disabled="!isAudioDurationValid"
            />
            <div class="range-inputs">
              <div class="range-input">
                <label for="audio-start">Start (seconds)</label>
                <InputNumber
                  id="audio-start"
                  :modelValue="audioStart"
                  :min="0"
                  :max="maxAudioStart"
                  :step="0.1"
                  showButtons
                  class="w-full"
                  :disabled="!isAudioDurationValid"
                  @update:modelValue="updateAudioStart"
                />
              </div>
              <div class="range-input">
                <label for="audio-end">End (seconds)</label>
                <InputNumber
                  id="audio-end"
                  :modelValue="audioEnd"
                  :min="minAudioEnd"
                  :max="audioDuration"
                  :step="0.1"
                  showButtons
                  class="w-full"
                  :disabled="!isAudioDurationValid"
                  @update:modelValue="updateAudioEnd"
                />
              </div>
            </div>
            <small class="field-help">
              Clip length always matches the video length ({{ formatDuration(resolvedVideoDuration) }}).
            </small>
          </div>
        </div>

        <div class="field">
          <label for="volume">Volume: {{ volume }}%</label>
          <Slider 
            id="volume"
            v-model="volume" 
            :min="0" 
            :max="100"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="fadeIn">Fade In (seconds):</label>
          <InputNumber 
            id="fadeIn"
            v-model="fadeIn" 
            :min="0" 
            :max="10"
            :step="0.5"
            showButtons
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="fadeOut">Fade Out (seconds):</label>
          <InputNumber 
            id="fadeOut"
            v-model="fadeOut" 
            :min="0" 
            :max="10"
            :step="0.5"
            showButtons
            class="w-full"
          />
        </div>

        <Message 
          v-if="audioDuration && resolvedVideoDuration && audioDuration < resolvedVideoDuration"
          severity="error"
          :closable="false"
        >
          Audio must be at least as long as the video to create a soundtrack.
        </Message>
      </div>

      <div v-if="error" class="error-section">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <div v-if="processing" class="processing-section">
        <ProgressBar mode="indeterminate" />
        <p class="processing-text">Creating soundtrack job...</p>
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
        label="Add Soundtrack" 
        icon="pi pi-check"
        @click="addSoundtrack" 
        :disabled="!audioFile || processing || !isAudioDurationValid"
        :loading="processing"
      />
    </template>
  </Dialog>
</template>

<script>
import AudioFileUpload from '@/components/job/AudioFileUpload.vue';
import { parseDuration } from '@/utils/format';

export default {
  name: 'SoundtrackDialog',
  components: {
    AudioFileUpload
  },
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
      type: [Number, String],
      default: null
    }
  },
  emits: ['update:visible', 'soundtrack-added'],
  data() {
    return {
      audioFile: null,
      audioDuration: null,
      audioStart: 0,
      audioEnd: 0,
      audioRange: [0, 0],
      isAdjustingRange: false,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      error: null,
      processing: false
    };
  },
  computed: {
    resolvedVideoDuration() {
      if (!this.videoDuration) return null;
      if (typeof this.videoDuration === 'number') return this.videoDuration;
      if (typeof this.videoDuration === 'string') {
        const parsed = parseDuration(this.videoDuration);
        return parsed || null;
      }
      return null;
    },
    isAudioDurationValid() {
      return Boolean(
        this.audioDuration &&
        this.resolvedVideoDuration &&
        this.audioDuration >= this.resolvedVideoDuration
      );
    },
    maxAudioStart() {
      if (!this.isAudioDurationValid) return 0;
      return Math.max(0, this.audioDuration - this.resolvedVideoDuration);
    },
    minAudioEnd() {
      if (!this.isAudioDurationValid) return 0;
      return this.resolvedVideoDuration;
    },
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
      }
    }
  },
  watch: {
    audioDuration() {
      this.initializeAudioRange();
    },
    resolvedVideoDuration() {
      this.initializeAudioRange();
    },
    audioRange(newRange, oldRange) {
      if (this.isAdjustingRange || !this.isAudioDurationValid) return;
      this.syncAudioRange(newRange, oldRange);
    }
  },
  methods: {
    onAudioSelected(file) {
      this.audioFile = file;
      this.error = null;
      this.getAudioDuration(file);
    },
    
    onAudioRemoved() {
      this.audioFile = null;
      this.audioDuration = null;
      this.audioStart = 0;
      this.audioEnd = 0;
      this.audioRange = [0, 0];
      this.error = null;
    },

    getAudioDuration(file) {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        this.audioDuration = audio.duration;
        this.initializeAudioRange();
        URL.revokeObjectURL(url);
      });
      
      audio.addEventListener('error', () => {
        console.error('Failed to load audio metadata');
        URL.revokeObjectURL(url);
      });
      
      audio.src = url;
    },

    async initializeAudioRange() {
      if (!this.audioDuration || !this.resolvedVideoDuration) return;
      const clipDuration = this.resolvedVideoDuration;
      if (this.audioDuration < clipDuration) {
        this.isAdjustingRange = true;
        this.audioStart = 0;
        this.audioEnd = this.audioDuration;
        this.audioRange = [0, this.audioDuration];
        await this.$nextTick();
        this.isAdjustingRange = false;
        return;
      }
      const start = Math.min(this.audioStart || 0, this.audioDuration - clipDuration);
      const end = start + clipDuration;
      this.isAdjustingRange = true;
      this.audioStart = start;
      this.audioEnd = end;
      this.audioRange = [start, end];
      await this.$nextTick();
      this.isAdjustingRange = false;
    },

    async syncAudioRange(newRange, oldRange) {
      const clipDuration = this.resolvedVideoDuration;
      if (!clipDuration) return;
      const [newStart, newEnd] = newRange;
      const [oldStart, oldEnd] = oldRange || [];
      let nextStart = newStart;
      let nextEnd = newEnd;
      const startChanged = newStart !== oldStart;
      const endChanged = newEnd !== oldEnd;
      const rangeLength = newEnd - newStart;
      if (Math.abs(rangeLength - clipDuration) > 0.05) {
        if (startChanged && !endChanged) {
          nextEnd = newStart + clipDuration;
        } else if (endChanged && !startChanged) {
          nextStart = newEnd - clipDuration;
        } else {
          nextEnd = newStart + clipDuration;
        }
      }

      if (nextStart < 0) {
        nextStart = 0;
        nextEnd = clipDuration;
      }
      if (nextEnd > this.audioDuration) {
        nextEnd = this.audioDuration;
        nextStart = this.audioDuration - clipDuration;
      }

      this.isAdjustingRange = true;
      this.audioStart = nextStart;
      this.audioEnd = nextEnd;
      this.audioRange = [nextStart, nextEnd];
      await this.$nextTick();
      this.isAdjustingRange = false;
    },

    async updateAudioStart(value) {
      if (!this.isAudioDurationValid) return;
      const clipDuration = this.resolvedVideoDuration;
      const start = Math.min(Math.max(0, value || 0), this.audioDuration - clipDuration);
      const end = start + clipDuration;
      this.isAdjustingRange = true;
      this.audioStart = start;
      this.audioEnd = end;
      this.audioRange = [start, end];
      await this.$nextTick();
      this.isAdjustingRange = false;
    },

    async updateAudioEnd(value) {
      if (!this.isAudioDurationValid) return;
      const clipDuration = this.resolvedVideoDuration;
      const end = Math.min(Math.max(clipDuration, value || clipDuration), this.audioDuration);
      const start = end - clipDuration;
      this.isAdjustingRange = true;
      this.audioStart = start;
      this.audioEnd = end;
      this.audioRange = [start, end];
      await this.$nextTick();
      this.isAdjustingRange = false;
    },

    formatDuration(seconds) {
      if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return 'Unknown';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    async addSoundtrack() {
      if (!this.audioFile) {
        this.error = 'Please select an audio file';
        return;
      }
      if (!this.isAudioDurationValid) {
        this.error = 'Audio must be at least as long as the video to create a soundtrack.';
        return;
      }

      this.processing = true;
      this.error = null;

      try {
        const options = {
          volume: this.volume,
          fadeIn: this.fadeIn,
          fadeOut: this.fadeOut,
          audioStart: this.audioStart,
          audioEnd: this.audioEnd
        };

        await this.$store.dispatch('videojobs/addSoundtrack', {
          videoId: this.videoId,
          audioFile: this.audioFile,
          options: options
        });

        this.$emit('soundtrack-added', {
          videoId: this.videoId,
          audioFile: this.audioFile.name
        });

        this.dialogVisible = false;
        this.resetForm();
      } catch (err) {
        console.error('Error adding soundtrack:', err);
        this.error = err.response?.data?.message || err.message || 'Failed to add soundtrack. Please try again.';
      } finally {
        this.processing = false;
      }
    },

    resetForm() {
      this.audioFile = null;
      this.audioDuration = null;
      this.audioStart = 0;
      this.audioEnd = 0;
      this.audioRange = [0, 0];
      this.volume = 100;
      this.fadeIn = 0;
      this.fadeOut = 0;
      this.error = null;
      this.processing = false;
    }
  }
};
</script>

<style scoped>
.soundtrack-dialog-content {
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

.audio-upload-section {
  margin: 0;
}

.audio-options {
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
}

.audio-range {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.range-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.range-input label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.field-help {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
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
  .soundtrack-dialog-content {
    gap: 1rem;
  }
  
  .field {
    gap: 0.25rem;
  }
}
</style>
