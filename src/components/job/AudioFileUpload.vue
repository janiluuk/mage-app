<template>
  <div class="audio-upload-container">
    <div 
      class="audio-dropzone"
      :class="{ 'drag-active': isDragActive, 'has-file': audioFile }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragActive = true"
      @dragleave.prevent="isDragActive = false"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div v-if="!audioFile" class="upload-placeholder">
        <i class="pi pi-cloud-upload" style="font-size: 3rem"></i>
        <div class="upload-text">
          <span class="primary-text">{{ isDragActive ? 'Drop audio file here' : 'Drag & drop audio file' }}</span>
          <span class="secondary-text">or click to browse</span>
          <span class="format-text">Supported formats: MP3, WAV, OGG, M4A, FLAC</span>
        </div>
      </div>
      
      <div v-else class="file-preview">
        <div class="file-info">
          <i class="pi pi-file-audio" style="font-size: 2rem; color: var(--primary-color)"></i>
          <div class="file-details">
            <div class="file-name">{{ audioFile.name }}</div>
            <div class="file-size">{{ formatFileSize(audioFile.size) }}</div>
            <div v-if="audioDuration" class="file-duration">Duration: {{ formatDuration(audioDuration) }}</div>
          </div>
        </div>
        <Button 
          icon="pi pi-times" 
          class="p-button-rounded p-button-text p-button-danger"
          @click.stop="removeFile"
          v-tooltip.top="'Remove file'"
        />
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <i class="pi pi-exclamation-circle"></i>
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioFileUpload',
  emits: ['file-selected', 'file-removed'],
  data() {
    return {
      audioFile: null,
      isDragActive: false,
      error: null,
      audioDuration: null,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    };
  },
  methods: {
    triggerFileInput() {
      if (!this.audioFile) {
        this.$refs.fileInput.click();
      }
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },
    
    handleDrop(event) {
      this.isDragActive = false;
      const file = event.dataTransfer.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },
    
    validateAndSetFile(file) {
      this.error = null;
      
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        this.error = 'Please select a valid audio file';
        return;
      }
      
      // Check file size
      if (file.size > this.maxFileSize) {
        this.error = `File size exceeds ${this.formatFileSize(this.maxFileSize)} limit`;
        return;
      }
      
      this.audioFile = file;
      this.getAudioDuration(file);
      this.$emit('file-selected', file);
    },
    
    removeFile() {
      this.audioFile = null;
      this.audioDuration = null;
      this.error = null;
      this.$refs.fileInput.value = '';
      this.$emit('file-removed');
    },
    
    getAudioDuration(file) {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        this.audioDuration = audio.duration;
        URL.revokeObjectURL(objectUrl);
      });
      
      audio.src = objectUrl;
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    
    formatDuration(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.audio-upload-container {
  width: 100%;
}

.audio-dropzone {
  border: 2px dashed var(--surface-border);
  border-radius: var(--border-radius);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--surface-ground);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-dropzone:hover {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}

.audio-dropzone.drag-active {
  border-color: var(--primary-color);
  background: var(--primary-50);
  transform: scale(1.02);
}

.audio-dropzone.has-file {
  cursor: default;
  border-style: solid;
}

.audio-dropzone.has-file:hover {
  background: var(--surface-ground);
  transform: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-color-secondary);
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.primary-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.secondary-text {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.format-text {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

.file-size,
.file-duration {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--red-50);
  color: var(--red-700);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}
</style>
