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
        <p v-if="videoDuration" class="info-text">
          <i class="pi pi-clock"></i>
          Video Duration: <strong>{{ formatDuration(videoDuration) }}</strong>
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
          v-if="audioDuration && videoDuration && audioDuration < videoDuration"
          severity="info"
          :closable="false"
        >
          Audio is shorter than video. Audio will loop or video will have silence at the end.
        </Message>

        <Message 
          v-if="audioDuration && videoDuration && audioDuration > videoDuration"
          severity="warn"
          :closable="false"
        >
          Audio is longer than video. Audio will be trimmed to match video duration.
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
        :disabled="!audioFile || processing"
        :loading="processing"
      />
    </template>
  </Dialog>
</template>

<script>
import AudioFileUpload from '@/components/job/AudioFileUpload.vue';

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
      type: Number,
      default: null
    }
  },
  emits: ['update:visible', 'soundtrack-added'],
  data() {
    return {
      audioFile: null,
      audioDuration: null,
      volume: 100,
      fadeIn: 0,
      fadeOut: 0,
      error: null,
      processing: false
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
      this.error = null;
    },

    getAudioDuration(file) {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        this.audioDuration = audio.duration;
        URL.revokeObjectURL(url);
      });
      
      audio.addEventListener('error', () => {
        console.error('Failed to load audio metadata');
        URL.revokeObjectURL(url);
      });
      
      audio.src = url;
    },

    formatDuration(seconds) {
      if (!seconds) return 'Unknown';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    async addSoundtrack() {
      if (!this.audioFile) {
        this.error = 'Please select an audio file';
        return;
      }

      this.processing = true;
      this.error = null;

      try {
        const options = {
          volume: this.volume,
          fadeIn: this.fadeIn,
          fadeOut: this.fadeOut
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
