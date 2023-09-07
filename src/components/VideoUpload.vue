<template>
  <div class="main-container w-100 position-relative" :class="{ loading: isLoading, banner: !videoFile }">

    <div class="page-container w-100">
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center" v-if="isLoading">
        <h1 class="position-absolute">
          <i class="fw-bolder fa fa-spin fa-atom"></i>
          <i class="text-warning me-3 me-md-5 fa fa-spin fa-atom blur-spinner"></i>
          <i class="text-primary ms-3 ms-md-5 fa fa-spin fa-atom blur-spinner"></i>
        </h1>
      </div>
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
        v-if="errorMessage">
        <span class="text-primary text-lg">{{ errorMessage }}</span>
      </div>
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
        v-if="status == 'error' && errorMessage == ''">
        <span class="text-primary text-lg">Error occcured while processing, please try again</span>
      </div>

      <div v-if="!videoFile">
        <div v-on:drop="dropHandler" v-on:dragover.prevent class="upload-area upload-page card">
          <div class="text-center mb-3">
            <h1 class="text-vibrant">This shit is the shit</h1>
            <h5 class="text-white">Drag and drop or select a video and witness magic happen in real time!
            </h5>
          </div>
          <div>
            <label class="bg-gradient-vibrant p-button p-component bg-gradient-vibrant p-button-lg p-button-rounded p-button-success hero-button">
              <input class="display-none" type="file" accept="video/* image/*" @change="uploadHandler">
              <span class="p-button-icon p-button-icon-left pi pi-upload"></span>
              <span class="p-button-label">Select a video</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'VideoUpload',
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = false;
    }
  },
  data() {
    return {
      videoFile: null,
      videoPreview: null,
      videoId: null,
      errorMessage: '',
      status: null,
    };
  },
  watch: {
    videoId(newValue) {
      if (newValue) {
        this.$router.push(`/edit/${newValue}`);
      }
    },
  },
  constructor() {
    this.uploadHandler = this.uploadHandler.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
    this.dropHandler = this.dropHandler.bind(this)
  },
  methods: {
    getToken() {
      return localStorage.getItem('auth.accessToken');
    },
    
    removeExtension(filename) {
      return filename.substring(0, filename.lastIndexOf('.')) || filename;
    },
    getExtension(filename) {
      return filename.substring(1, filename.lastIndexOf('.')) || filename;
    },
    uploadHandler(event) {
      this.videoFile = event.target.files[0];
      this.videoPreview = URL.createObjectURL(this.videoFile);
      this.uploadVideo();
    },

    async dropHandler(event) {
      event.preventDefault();
      this.videoFile = event.dataTransfer.files[0];
      this.videoPreview = URL.createObjectURL(this.videoFile);
      this.uploadVideo();
    },

    async uploadVideo() {
      this.isLoading = true;
      let formData = new FormData();

      formData.append('video', this.videoFile);

      try {
        const response = await axios.post('https://api.dudeisland.eu/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + this.getToken()
          }
        });
        this.videoUrl = response.data.url;

        this.videoId = response.data.id;
        this.status = response.data.status;

      } catch (error) {
        this.errorMessage = error.message;
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        }
      }
      this.isLoading = false;
    },

  }
};
</script>
<style scoped lang="scss">

@import '@/assets/vimage.scss';

</style>