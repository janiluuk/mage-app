<template>
  <div>
    <div v-if="!uploadedVideo">
      <input type="file" @change="handleFileUpload" accept="video/*" />
      <div v-if="dragOver" class="drop-area">Drop the video file here</div>
    </div>
    <div v-else-if="uploadedVideo.url && !uploadedVideo.approved">
      <video :src="uploadedVideo.url" controls></video>
      <button @click="confirmUpload">Confirm</button>
    </div>
    <div v-else-if="showForm">
      <form @submit.prevent="submitForm">
        <div>
          <label for="prompt">Prompt:</label>
          <input type="text" id="prompt" v-model="form.prompt" required />
        </div>
        <div>
          <label for="cfgScale">CFG Scale:</label>
          <input
            type="range"
            id="cfgScale"
            v-model.number="form.cfgScale"
            min="1"
            max="20"
            required
          />
          <span>{{ form.cfgScale }}</span>
        </div>
        <div>
          <label for="modelName">Model Name:</label>
          <select id="modelName" v-model="form.modelName" required>
            <option value="ChilloutMix">ChilloutMix</option>
            <option value="InkPunk Fusion">InkPunk Fusion</option>
            <option value="Stable Diffusion">Stable Diffusion</option>
          </select>
        </div>
        <button type="submit">Next</button>
      </form>
    </div>
    <div v-else>
      <p>Video is being processed. Please wait...</p>
    </div>
  </div>
</template>

<script>
import '@/assets/scss/material-dashboard.scss';
import { APP_BASE_URL, API_BASE_URL } from '@/utils/domains';
export default {
  data() {
    return {
      uploadedVideo: null,
      dragOver: false,
      showForm: false,
      form: {
        prompt: '',
        cfgScale: 7,
        modelName: 'ChilloutMix'
      }
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      this.uploadedVideo = { file };

      const formData = new FormData();
      formData.append('video', file);

      // Send video file to Laravel API
      // Adjust the API endpoint URL as per your configuration
      fetch(`${APP_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 0) {
            this.uploadedVideo.id = data.id;
            this.uploadedVideo.url = data.url;
            this.uploadedVideo.approved = data.approved;
            
            if (this.uploadedVideo.approved) {
              this.showForm = true;
            }
          } else {
            // Handle upload error
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    confirmUpload() {
      this.showForm = this.uploadedVideo.approved;
    },
    submitForm() {
      // Create the payload to send to the Laravel API
      const payload = {
        videoId: this.uploadedVideo.id,
        prompt: this.form.prompt,
        cfgScale: this.form.cfgScale,
        modelName: this.form.modelName
      };

      // Send the form data to the Laravel API
      // Adjust the API endpoint URL as per your configuration
      fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.log(error);
          });
    }
  }
};
</script>

<style>
.drop-area {
  border: 2px dashed gray;
  padding: 20px;
  text-align: center;
  margin-top: 20px;
}
</style>
