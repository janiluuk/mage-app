<template>
  <div class="home-banner">
    <div class="text-center">
      <div class="hero-banner">What do you like to create today?</div>
    </div>

    <div class="banner-item-row">
      <div class="banner-item" v-on:drop="uploadHandler($event, 'deforum')" v-on:dragover.prevent>
        <input class="file-input" type="file" accept="image/*" multiple @change="uploadHandler($event, 'deforum')">
        <div class="banner-media-container">
          <img src="/img/mona.gif" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="/img/mona2.gif" />
          </div>
          <div class="banner-overlay">
            <div class="banner-overlay-icon">
              <i class="pi pi-upload"></i>
            </div>
            <div class="banner-overlay-body">
              <div class="banner-overlay-title">Upload images</div>
              <div class="banner-overlay-desc">Formats .jpg, .jpeg, .png, .gif — up to 2MB each. Select multiple files.</div>
            </div>
          </div>
        </div>

        <ProgressBar :value="getProgress" v-if="getProgress > 0"></ProgressBar>
        <div class="banner-content-container">
          <div class="banner-header">Animation</div>
          <div class="banner-description">Turn images into gorgeous animated clips</div>
        </div>
      </div>
      <div class="banner-item" v-on:drop="uploadHandler($event, 'vid2vid')" v-on:dragover.prevent>
        <input class="file-input" type="file" accept="video/*" multiple @change="uploadHandler($event, 'vid2vid')">
        <div class="banner-media-container">
          <img src="/img/mona.jpg" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="/img/mona.jpg" />
          </div>
          <div class="banner-overlay">
            <div class="banner-overlay-icon">
              <i class="pi pi-upload"></i>
            </div>
            <div class="banner-overlay-body">
              <div class="banner-overlay-title">Upload videos</div>
              <div class="banner-overlay-desc">Format .mp4 — up to 50MB each. Select multiple files.</div>
            </div>
          </div>
        </div>
        <div class="banner-content-container">
          <div class="banner-header">Video Effect</div>
          <div class="banner-description">Enhance videos with stunning visual effects</div>
        </div>
      </div>
      <div class="banner-item" @click="showAudioJobDialog = true">
        <div class="banner-media-container">
          <img src="/img/mona.gif" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="/img/mona2.gif" />
          </div>
          <div class="banner-overlay">
            <div class="banner-overlay-icon">
              <i class="pi pi-cloud-upload"></i>
            </div>
            <div class="banner-overlay-body">
              <div class="banner-overlay-title">Upload audio file</div>
              <div class="banner-overlay-desc">Create animation synced with audio</div>
            </div>
          </div>
        </div>
        <div class="banner-content-container">
          <div class="banner-header">Audio Animation</div>
          <div class="banner-description">Create animations synchronized with audio</div>
        </div>
      </div>
      <div class="banner-item coming-soon hidden">
        <div class="banner-icon"><i class="pi pi-camera"></i></div>
        <div class="banner-content-container">
          <div class="banner-header with-tag">Record a video <Tag value="Coming Soon"></Tag></div>
          <div class="banner-description">Directly record a video with your device's camera</div>
        </div>
      </div>
    </div>

    <!-- Batch Upload Progress -->
    <div v-if="batchQueue.length > 0" class="batch-progress-section">
      <div class="batch-progress-header">
        <h4 class="m-0">
          Uploading {{ batchQueue.length }} file{{ batchQueue.length > 1 ? 's' : '' }}
        </h4>
        <ProgressBar :value="batchOverallProgress" class="mt-2 mb-3" />
      </div>
      <div class="batch-queue-list">
        <div
          v-for="item in batchQueue"
          :key="item.id"
          class="batch-queue-entry"
          :class="'status-' + item.status"
        >
          <div class="flex align-items-center gap-2 flex-grow-1">
            <i :class="getBatchItemIcon(item.status)" class="text-lg"></i>
            <span class="text-sm font-semibold">{{ item.file.name }}</span>
            <span class="text-xs text-color-secondary ml-auto">{{ formatFileSize(item.file.size) }}</span>
          </div>
          <div class="flex align-items-center gap-2" style="min-width: 140px">
            <Tag
              v-if="item.status !== 'uploading'"
              :value="item.status"
              :severity="getBatchItemSeverity(item.status)"
              class="text-xs"
            />
            <ProgressBar
              v-if="item.status === 'uploading'"
              :value="item.progress"
              :showValue="false"
              style="height: 6px; flex: 1"
            />
          </div>
          <div v-if="item.error" class="text-xs text-red-500 mt-1 w-full">{{ item.error }}</div>
        </div>
      </div>
    </div>

    <!-- Audio Job Creation Dialog -->
    <Dialog
      v-model:visible="showAudioJobDialog"
      :modal="true"
      header="Create Audio Animation Job"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    >
      <JobCreationForm
        @job-created="handleJobCreated"
        @form-cancelled="showAudioJobDialog = false"
      />
    </Dialog>
  </div>
</template>

<script>
import * as notificationActions from '@/store/modules/notification/types/actions';
import { mapActions, mapGetters } from 'vuex';
import JobCreationForm from '@/components/job/JobCreationForm.vue';
import Dialog from 'primevue/dialog';


export default {
  name: 'Upload',
  components: {
    JobCreationForm,
    Dialog
  },
  data() {
    return {
      generatorType: 'vid2vid',
      videoId: false,
      isLoading: false,
      status: '',
      errorMessage: false,
      showAudioJobDialog: false,
      batchQueue: [],
      fileSizeLimit: {'video/mp4': 50, 'image/jpeg': 2, 'image/png': 2, 'image/gif': 2 },
      supportedFormats: {
        deforum: ['image/jpeg', 'image/png', 'image/gif'],
        vid2vid: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
      }
    };
  },
  watch: {
    videoId(newValue) {
      if (newValue && this.batchQueue.length <= 1) {
        // Only auto-navigate for single file uploads
           this.$router.push(`/edit/${this.generatorType}/${newValue}`);
      }
    },
  },
  computed: {
    ...mapGetters('videojobs', {
      getProgress: 'progress'
    }),
    batchOverallProgress() {
      if (!this.batchQueue.length) return 0;
      const done = this.batchQueue.filter(i => i.status === 'done' || i.status === 'error').length;
      return Math.round((done / this.batchQueue.length) * 100);
    },
  },
  methods: {
    ...mapActions({
        upload: 'videojobs/upload',
        setErrorNotification: 'notification/'+notificationActions.SET_ERROR_NOTIFICATION,
        setSuccessNotification: 'notification/'+notificationActions.SET_SUCCESS_NOTIFICATION
    }),
    cancel() {
      this.isLoading = false;
      this.status = '';
      this.errorMessage = false;
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    getBatchItemIcon(status) {
      const map = {
        pending: 'pi pi-clock text-color-secondary',
        uploading: 'pi pi-spin pi-spinner text-primary',
        done: 'pi pi-check-circle text-green-500',
        error: 'pi pi-times-circle text-red-500',
      };
      return map[status] || 'pi pi-circle';
    },
    getBatchItemSeverity(status) {
      const map = { pending: 'info', done: 'success', error: 'danger' };
      return map[status] || 'info';
    },
    uploadHandler(event, type) {
      const files = event.target?.files || event.dataTransfer?.files;
      if (!files || files.length === 0) {
        this.setErrorNotification('No file selected');
        return;
      }

      this.generatorType = type;

      // Single file — keep original behavior
      if (files.length === 1) {
        const file = files[0];
        const validation = this.validateFile(file, type);
        if (!validation.valid) {
          this.setErrorNotification(validation.error);
          return;
        }
        this.setSuccessNotification('Uploading file...');
        this.uploadFile(file, type);
        if (event.target) event.target.value = '';
        return;
      }

      // Multiple files — batch upload
      const validated = [];
      const rejected = [];
      for (const file of files) {
        const validation = this.validateFile(file, type);
        if (validation.valid) {
          validated.push(file);
        } else {
          rejected.push(`${file.name}: ${validation.error}`);
        }
      }

      if (rejected.length) {
        const preview = rejected.slice(0, 2).join(' | ');
        const suffix = rejected.length > 2 ? ` (+${rejected.length - 2} more)` : '';
        this.setErrorNotification(`Some files were rejected: ${preview}${suffix}`);
      }

      if (validated.length === 0) return;

      this.setSuccessNotification(`Uploading ${validated.length} files...`);
      this.startBatchUpload(validated, type);
      if (event.target) event.target.value = '';
    },
    validateFile(file, type) {
      const fileType = file.type;
      const fileSize = file.size;

      if (!this.supportedFormats[type].includes(fileType)) {
        const formatList = this.supportedFormats[type].map(f => f.split('/')[1]).join(', ');
        return { valid: false, error: `Unsupported format. Expected: ${formatList}` };
      }

      const maxSizeMB = this.fileSizeLimit[fileType] || (type === 'deforum' ? 2 : 50);
      if (fileSize > 1024 * 1024 * maxSizeMB) {
        return { valid: false, error: `File too large. Max: ${maxSizeMB}MB` };
      }

      return { valid: true };
    },
    async startBatchUpload(files, type) {
      // Build queue
      this.batchQueue = files.map((file, idx) => ({
        id: `batch_${Date.now()}_${idx}`,
        file,
        status: 'pending',
        progress: 0,
        error: null,
        videoId: null,
      }));

      // Process sequentially to avoid overwhelming the server
      for (const item of this.batchQueue) {
        item.status = 'uploading';
        item.progress = 10;
        try {
          const response = await this.upload({ attachment: item.file, type });
          item.status = 'done';
          item.progress = 100;
          item.videoId = response.id;
        } catch (error) {
          item.status = 'error';
          item.error = error.response?.data?.message || error.message || 'Upload failed';
        }
      }

      // Batch complete — show summary
      const succeeded = this.batchQueue.filter(i => i.status === 'done').length;
      const failed = this.batchQueue.filter(i => i.status === 'error').length;
      if (failed === 0) {
        this.setSuccessNotification(`All ${succeeded} files uploaded successfully`);
      } else {
        this.setErrorNotification(`${succeeded} uploaded, ${failed} failed`);
      }

      // If all succeeded and there's just one, navigate to editor
      if (succeeded === 1 && failed === 0) {
        const done = this.batchQueue.find(i => i.status === 'done');
        if (done?.videoId) {
          this.$router.push(`/edit/${type}/${done.videoId}`);
        }
      } else if (succeeded > 0) {
        // Multiple successes — go to library to see them
        setTimeout(() => {
          this.$router.push('/library');
        }, 2000);
      }
    },
    async uploadFile(file, type) {
      try {
        const response = await this.upload({attachment: file, type: type });
        this.status = response.status;
        this.videoId = response.id;
        return response;
      } catch (error) {
        console.error('Upload error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
        this.setErrorNotification(errorMsg);
        this.isLoading = false;
      }
    }
  }};

</script>




<style scoped lang="scss">

.home-banner {
  display: flex;
  flex-flow: column;
  padding-top: 1rem;
}
.hero-banner {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.banner-item-row {
  width: 100%;
  max-width: 576px;
  margin: 3rem auto 5rem auto;
  display: grid;
  grid-template: 1fr / fit-content(100%);
  align-items: self-start;
  justify-content: center;
  flex-flow: column;
  column-gap: 2rem;
  row-gap: 3rem;
}

.banner-item {
  position: relative;

  &.coming-soon {
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
    column-gap: 2rem;
    padding: 2rem;
    background: #eeeeee0a;
    border-radius: 6px;
  }
}

.file-input {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  z-index: 3;
  cursor: pointer;
}

.banner-icon i {
  font-size: 5rem;
}

.banner-description {
  font-size: 1rem;
  opacity: 0.5;
}

.banner-header {
  font-size: 1.2rem;
  font-weight: bold;

  &.with-tag {
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
  }
}

.banner-media-container {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  margin-bottom: 0.5rem;
}
.banner-media-main {
  width: 100%;
  display: block;
}
.banner-media-secondary {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
  border-right: 2px solid rgba(18, 18, 18, 0.4);
  animation: slide 20s infinite ease-in-out;
}
.banner-media-secondary img {
  display: block;
  filter: grayscale(1);
  height: 100%;
}

.banner-overlay {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-flow: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  background: rgba(28, 28, 28, 0.2);
  backdrop-filter: blur(30px);
  row-gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.5rem;
  opacity: 0;

  .banner-item:hover & {
    animation: appear 0.3s ease-in-out;
    opacity: 1;
  }
}

.banner-overlay-icon i {
  font-size: 3em;
}

.banner-overlay-title {
  font-size: 1.5em;
}

.banner-overlay-desc {
  opacity: 0.5;
}

@keyframes slide {
  0%, 10% {
    right: 0;
  }
  50%, 60% {
    right: 100%;
  }
  90%, 100% {
    right: 0;
  }
}

@keyframes appear {
  0% {
    opacity: 0;
    bottom: -2rem;
  }
  100% {
    opacity: 1;
    top: 0;
  }
}

@media (min-width: 768px) {
  .hero-banner {
    font-size: 2.5rem;
  }
  .home-banner {
    padding-top: 1.5rem;
  }
  .banner-item-row {
    grid-template: auto auto / 1fr 1fr;
    max-width: 960px;
    row-gap: 5rem;
  }
}

.batch-progress-section {
  max-width: 576px;
  margin: 0 auto 3rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.batch-progress-header h4 {
  font-size: 1.1rem;
}

.batch-queue-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.batch-queue-entry {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius);
  background: var(--surface-ground);
  transition: background 0.2s;
}

.batch-queue-entry.status-uploading {
  background: var(--blue-50, rgba(59, 130, 246, 0.05));
}

.batch-queue-entry.status-done {
  background: var(--green-50, rgba(16, 185, 129, 0.05));
}

.batch-queue-entry.status-error {
  background: var(--red-50, rgba(239, 68, 68, 0.05));
}

@media (min-width: 768px) {
  .batch-progress-section {
    max-width: 960px;
  }
}

@media (min-width: 992px) {
  .home-banner {
    padding-top: 3rem;
  }
  .hero-banner {
    font-size: 3.5rem;
  }
  .banner-description {
    font-size: 1.4rem;
  }
  .banner-header {
    font-size: 2rem;
  }
  .banner-overlay {
    font-size: 1rem;
  }
}

</style>
