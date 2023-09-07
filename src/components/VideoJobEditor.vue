<template>
  <div>
    <!-- Your template code goes here -->
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import VideoJob from '@/models/VideoJob';
import { mapActions } from 'vuex';

export default {
  name: 'Editor',
  data() {
    return {
      videoFile: null,
      videoPreview: null,
      isLoading: false,
      isFetching: false,
      errorMessage: '',
      interval: false,
      modelFiles: [],
      jobs: [],
    };
  },
  created() {
    this.fetchModelFiles();
  },

  methods: {
    ...mapActions('modelFiles', ['fetchModelFiles']),
    async fetchVideoJobs() {
      try {
        let token = this.getToken();
        const response = await axios.get('https://api.dudeisland.eu/api/v1/video-jobs?sort=-updated_at', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          }
        });

        this.jobs = response.data.data.map(job => new VideoJob(job, this.getDuration, this.getFormattedDuration, this.findModelName));

      } catch (error) {
        this.errorMessage = error.message;
      }
    },
    async fetchModelFiles() {
      if (this.modelFiles.length > 0) {
        return;
      }

      try {
        let token = this.getToken();
        const response = await axios.get('https://api.dudeisland.eu/api/v1/model-files', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.modelFiles = response.data.data.map(file => {
          if (this.modelId < 1) {
            this.modelId = file.id;
          }

          return {
            id: file.id,
            name: file.attributes.name,
            description: file.attributes.description
          };
        });

      } catch (error) {
        console.error('Failed to fetch model files:', error);
        this.errorMessage = error.message;
      }
    },
    getToken() {
      return localStorage.getItem('auth.accessToken');
    },
    findModelName(modelId) {
      const modelFile = this.modelFiles.find(model => model.id == modelId);
      return modelFile ? modelFile.name : 'N/A';
    },
    getFormattedDuration(seconds) {
      if (!seconds) {
        seconds = 1;
      }
      let momentDuration = moment.duration(seconds, 'seconds');
      return moment.utc(momentDuration.as('milliseconds')).format('HH:mm:ss');
    },
    getDuration(seconds) {
      if (!seconds) {
        seconds = 1;
      }
      return moment.duration({ "seconds": seconds }).humanize();
    },
    submitForm() {
      // Logic for submitting the form
    },
    submitFinalizeForm() {
      // Logic for submitting the finalize form
    },
    cancelVideoProcessing() {
      // Logic for canceling video processing
    },
    // Other methods...
  },
};
</script>

<style scoped>
/* Your component's styles */
</style>
