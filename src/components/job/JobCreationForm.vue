<template>
  <div class="job-creation-form">
    <div class="form-section">
      <h3 class="section-title">
        <i class="pi pi-file-audio"></i>
        Audio File
      </h3>
      <AudioFileUpload
        @file-selected="onAudioFileSelected"
        @file-removed="onAudioFileRemoved"
      />
    </div>

    <div class="form-section" v-if="audioFile">
      <h3 class="section-title">
        <i class="pi pi-sliders-h"></i>
        Motion Settings
      </h3>
      <MotionStyleSelector
        @style-selected="onStyleSelected"
        @preset-selected="onPresetSelected"
        @bpm-changed="onBpmChanged"
      />
    </div>

    <div class="form-actions" v-if="audioFile && motionStyle">
      <Button
        label="Create Job"
        icon="pi pi-check"
        class="p-button-success"
        :disabled="!canCreateJob"
        @click="createJob"
      />
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-secondary"
        @click="resetForm"
      />
    </div>
  </div>
</template>

<script>
import AudioFileUpload from './AudioFileUpload.vue';
import MotionStyleSelector from './MotionStyleSelector.vue';

export default {
  name: 'JobCreationForm',
  components: {
    AudioFileUpload,
    MotionStyleSelector
  },
  emits: ['job-created', 'form-cancelled'],
  data() {
    return {
      audioFile: null,
      motionStyle: null,
      selectedPreset: null,
      bpmValue: null
    };
  },
  computed: {
    canCreateJob() {
      if (!this.audioFile || !this.motionStyle) {
        return false;
      }
      
      // For classic style, require preset selection
      if (this.motionStyle === 'classic' && !this.selectedPreset) {
        return false;
      }
      
      // For BPM style, require valid BPM value
      if (this.motionStyle === 'bpm' && (!this.bpmValue || this.bpmValue < 60 || this.bpmValue > 200)) {
        return false;
      }
      
      return true;
    }
  },
  methods: {
    onAudioFileSelected(file) {
      this.audioFile = file;
    },
    
    onAudioFileRemoved() {
      this.audioFile = null;
      this.resetMotionSettings();
    },
    
    onStyleSelected(data) {
      this.motionStyle = data.style;
      this.bpmValue = data.bpm;
      
      // Reset preset when style changes
      if (this.motionStyle !== 'classic') {
        this.selectedPreset = null;
      }
    },
    
    onPresetSelected(preset) {
      this.selectedPreset = preset;
    },
    
    onBpmChanged(bpm) {
      this.bpmValue = bpm;
    },
    
    createJob() {
      const jobData = {
        audioFile: this.audioFile,
        motionStyle: this.motionStyle,
        preset: this.selectedPreset,
        bpm: this.bpmValue
      };
      
      this.$emit('job-created', jobData);
    },
    
    resetForm() {
      this.audioFile = null;
      this.resetMotionSettings();
      this.$emit('form-cancelled');
    },
    
    resetMotionSettings() {
      this.motionStyle = null;
      this.selectedPreset = null;
      this.bpmValue = null;
    }
  }
};
</script>

<style scoped>
.job-creation-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--surface-border);
}

.section-title i {
  color: var(--primary-color);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>
