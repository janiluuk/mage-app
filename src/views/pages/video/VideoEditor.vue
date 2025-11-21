<template>
  <div class="container">
    <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
      v-if="job.status == 'error' || errorMessage != ''">
      <span class="text-primary text-lg">{{ errorMessage }}</span>
    </div>

    <div v-if="job.status != null">

      <!-- Main settings container -->
      <Splitter class="mb-5">
        <SplitterPanel :size="30" :minSize="10" class="mw-0">
          <div class="p-5">
            <!-- Sample video -->
            <div class="bg-gradient-vibrant sample-container mb-3">
              <div class="w-100 sample-area p-3 text-center">
                <label v-if="!isJobReady" class="form-label">Preview Image</label>
                <label v-if="isJobReady" class="form-label">Processed video</label>

                <Image v-if="hasPreviewImage" class="w-100 preview-100" imageClass="mt-1" :src="job.preview_url"
                  @error="imageLoadOnError" v-bind:alt="pic" preview />
                <div class="text-center"
                  v-if="!isJobReady" >
                  <Button label="Generate Preview Video" @click="submitForm(10)"
                    class="p-button p-component p-button-rounded p-button-outlined p-button-success mb-0 mt-3" />
                </div>

                <video class="w-100 video-preview mt-1" v-if="isJobReady" controls :src="job.url"></video>
                <div class="w-100 mt-1" v-if="(isVideoProcessing) && !hasPreviewImage">
                  <div
                    class="video-loader bg-gradient-dark w-100 d-flex flex-column align-items-center justify-content-center text-lg">
                    <h1 class="position-absolute">
                      <i class="fw-bolder fa fa-spin fa-atom"></i>
                      <i class="text-warning me-3 md:me-5 fa fa-spin fa-atom blur-spinner"></i>
                      <i class="text-primary ms-3 md:ms-5 fa fa-spin fa-atom blur-spinner"></i>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <!-- Original video -->
            <div v-if="job.status == 'pending'" class="video-preview-container mb-3">
              <label class="form-label">Original video</label>
              <video ref="videoPlayer" class="video-js mt-1" controls preload="auto">
                <source v-if="getPreviewUrl()" :src="getPreviewUrl()" type="video/mp4">
              </video>
            </div>
            <!-- Original video -->

            <!-- Remove button
              <div class="text-center">
                <Button icon="pi pi-trash" label="Remove video"
                  class="p-button p-component p-button-rounded p-button-danger" @click="cancelUpload" />
              </div>
               Remove button -->

          </div>
        </SplitterPanel>
        <SplitterPanel :size="70" :minSize="40" class="mw-0">
          <form v-on:submit.prevent="">

            <div class="p-5">
              <div class="p-fluid formgrid grid">
                <div class="field col-12 md:col-6 md:mb-2 mb-3">
                </div>
                <div class="field col-12 md:mb-2 mb-3">
                  <div class="message p-error p-danger">{{ validation.firstError('job.prompt') }}</div>
                  <label class="mb-1 ms-0">Prompt</label>
                  <textarea rows="4" class="p-inputtextarea p-inputtext p-component" placeholder="Type your prompt here"
                    v-model="job.prompt" :disabled="isVideoProcessing"></textarea>
                </div>
                <div class="field col-12 md:mb-2 mb-3">
                  <label class="mb-1 ms-0 mt-2">Negative Prompt</label>
                  <textarea rows="2" class="p-inputtextarea p-inputtext p-component"
                    placeholder="Type your negative prompt here" v-model="job.negative_prompt"
                    :disabled="isVideoProcessing"></textarea>
                </div>

                <div class="field col-12 md:col-6 md:mb-2 mb-3">
                  <label class="mb-1 ms-0 mt-2" :style="{ color: denoisingColor }">Select Denoising Strength</label>
                  <InputNumber min="0.2" :max="0.8" :step="0.025" v-model.number="job.denoising" showButtons
                    :disabled="isVideoProcessing" />
                  <Slider v-model="job.denoising" :min="0.2" :max="0.8" :step="0.025" :disabled="isVideoProcessing" />
                </div>
                <div class="field col-12 md:col-6 md:mb-2 mb-3">
                  <label class="mb-1 ms-0 mt-2">Seed</label>
                  <div class="flex  align-items-center justify-content-center">
                    <div class="field-radiobutton mb-0 mr-3">
                      <InputSwitch v-model="switchValue" :disabled="isVideoProcessing" />
                      <label>Randomize</label>
                    </div>
                    <InputText type="number" v-model.number="job.seed"
                      :disabled="isVideoProcessing || switchValue == true">
                    </InputText>
                  </div>
                </div>
                <div class="col-12 md:mb-2 mb-3 mt-2">
                  <label class="form-label mb-1 ms-0 mt-2">Selected Model: <strong>{{ job.model_name }}</strong></label>
                  <div class="model-selector-container mt-1">
                    <ModelfileSelector :modelId="job.model_id" :modelName="job.model_name" @update:modelId="updateModelId"
                      @update:modelName="updateModelName" />
                  </div>
                </div>

                <div class="col-12 flex flex-column">
                  <div class="d-flex flex-row" v-if="!isJobReady">
                    <Button @click="submitForm(1)" label="Generate Preview Image"
                      :disabled="isVideoProcessing || formChanged == false"
                      class="p-button p-component p-button-lg p-button-rounded p-button-outlined p-button-success mb-0 mt-3 mr-3" />
                    <Button v-if="job.status == 'preview' || job.status == 'error' || job.status == 'cancelled'" class="p-button p-component p-button-lg bg-gradient-vibrant p-button-rounded p-button-success mb-0 mt-3" @click="submitFinalizeForm" label="Finalize Video" :disabled="isVideoProcessing" />
                    <Button v-if="isVideoProcessing" class="p-button p-component p-button-lg p-button-rounded p-button-outlined p-button-warning mb-0 mt-3"
                    :label="cancelButtonValue" @click="cancelVideoProcessing" />
                  </div>


                  <div class="card mt-3" v-if="isVideoProcessing && job.progress >= 0">

                    <p class="p-2 text-xs text-primary text-center"
                      v-if="job.status == 'processing' && operation == 'preview' && job.progress == 0">
                      Cooking preview, <span class="text-xs"> {{ getFormattedDuration(processTime) }} elapsed...
                      </span>
                    </p>

                    <div class="progress-wrapper mb-3" v-if="isVideoProcessing && job.progress > 0">
                      <ProgressBar :value="job.progress"></ProgressBar>

                      <div class="progress-info mt-1">
                        <div class="progress-percentage">
                      <span class="text-xs" v-if="job.estimated_time_left == 0"> Preparing..
                      </span>
                        </div>
                      </div>

                    </div>
                    <p v-if="job.status == 'processing' && (hasPreviewImage) && job.progress > 0"
                      class="mt-2 mb-0 text-sm text-primary text-center">Video is being processed. <span
                        class="text-sm">{{ getFormattedDuration(job.job_time) }} elapsed.</span><span class="text-sm"
                        v-if="job.estimated_time_left > 0"> ~ {{ getFormattedDuration(job.estimated_time_left) }}
                        remaining</span>..
                    </p>
                    <p v-if="job.status == 'approved'" class="mt-2 mb-0 text-xs text-primary text-center">Waiting for
                      a worker to pick the job up....</p>
                  </div>
                </div>
              </div>

            </div>
          </form>

        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import VideoPlayer from '@/components/video/VideoPlayer.vue';
import { API_BASE_URL, API_V1_URL, VIDEO_PREVIEW_URL } from '@/utils/domains';

import ModelfileSelector from '@/components/Modelfile/ModelfileSelector.vue';
import showSwal from "@/mixins/showSwal.js";
import VideoEntry from '@/components/video/VideoEntry.vue';

import SimpleVueValidator from 'simple-vue3-validator';

const Validator = SimpleVueValidator.Validator;

export default {
  name: 'VideoEdit',
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = false;
    }
  },
  data() {
    return {
      videoId: null,
      isLoading: false,
      isFetching: false,
      switchValue: false,
      formChanged: false,
      operation: 'preview',
      interval: false,
      processTime: 0,
      job: {
        status: null,
        model_id: 0,
        cfg_scale: 7,
        progress: 0,
        estimated_time_left: 0,
        job_time: 0,
        denoising: 0.4,
        seed: -1,
      }
    };
  },

  watch: {
    formAttributes: {
      handler: function (v, o) {
        this.formChanged = true;
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.videoId = this.$route.params.id;
    this.fetchVideoJob = this.fetchVideoJob.bind(this);
    this.startPollingVideoJob = this.startPollingVideoJob.bind(this);
    this.fetchVideoJob(true);
    this.startPollingVideoJob();
  },
  components: {
    VideoEntry,
    VideoModal,
    ModelfileSelector
  },
  validators: {
    'job.prompt': function (value) {
      return Validator.value(value).required('Prompt is needed!');
    },
    'job.model_id': function (value) {
      return Validator.value(value).required("Model is required");
    }
  },
  computed: {
    cancelButtonValue() {
      if (this.operation == "preview") {
        return "Cancel preview generation";
      }
      return "Cancel job";
    },
    isJobReady() {
      return (this.job.status === 'finished' && this.job.url.length > 0);
    },
    isVideoProcessing() {
      return (this.job.status === 'processing' || this.job.status === 'approved' || this.isFetching == true);
    },
    hasPreviewImage() {
      return (this.job.status != 'pending' && this.job.preview_url && this.job.preview_url.length > 0);
    },
    hasPreviewAnimation() {
      return (this.job.status != 'pending' && this.job.preview_img && this.job.preview_img.length > 0)
    },
    // Compute denoising warning color
    denoisingColor() {
      const value = (this.job.denoising * 100).toFixed(0);
      if (value >= 1 && value <= 25) {
        return '';
      } else if (value > 25 && value <= 50) {
        return '';
      } else if (value > 50 && value <= 75) {
        return '#e4d067';
      } else if (value > 75 && value <= 100) {
        return '#fc4d4d';
      } else {
        return '#5ee9d3';
      }
    },

    formAttributes() {

      return {
        modelId: this.job.model_id,
        denoising: this.job.denoising,
        cfgScale: this.job.cfg_scale,
        seed: this.switchValue ? -1 : this.job.seed,
        prompt: this.job.prompt,
        negative_prompt: this.job.negative_prompt,
        videoId: this.videoId,
        controlnet: [
          {
            module: "hed",
            model: "control_v11p_sd15_softedge [a8575a2a]",
            weight: 0.8,
            control_mode: "Balanced",
            pixel_perfect: true,
            loopback: true
          },
          {
            module: "none",
            model: "diff_control_sd15_temporalnet_fp16 [adc6bd97]",
            weight: 1.5,
            control_mode: "My prompt is more important",
            pixel_perfect: true,
            loopback: true
          }
        ]
      };
    }
  },

  methods: {
    pasteModelData() {
      navigator.clipboard.readText().then(text => {
        showSwal.methods.showSwal({
          type: "success",
          message: "Model cloned successfully!",
          width: 500
        });
      });
    },
    updateModelId(newModelId) {
      this.job.model_id = newModelId;
    },
    updateModelName(newModelName) {
      this.job.model_name = newModelName;
    },
    imageLoadOnError(e) {
      alert("There was error loading image");
      e.originalEvent.target.src = "https://yt3.googleusercontent.com/ytc/AGIKgqM4CXwFgjDl9yy2zsJaWMBIL4zPAR810_zU5W9g=s900-c-k-c0x00ffffff-no-rj";
    },
    async startPollingVideoJob() {
      if (this.interval) clearInterval(this.interval);

      this.interval = setInterval(this.fetchVideoJob, 2500); // Poll every 3 seconds
    },
    removeExtension(filename) {
      return filename.substring(0, filename.lastIndexOf('.')) || filename;
    },
    getExtension(filename) {
      return filename.substring(1, filename.lastIndexOf('.')) || filename;
    },
    getPreviewUrl() {
      return `${VIDEO_PREVIEW_URL}${this.job.filename}`;
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

    async fetchVideoJob(force) {

      if (!this.videoId) return;
      if (force == true || this.isVideoProcessing) {
        this.processTime+=2.5;

        try {
          let token = this.getToken();
          const response = await axios.get(`${API_V1_URL}/video-jobs/${this.videoId}?include=modelfile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json'
            }
          });
          const fetchedJob = response.data.data;

          // Compare and update only changed properties
          for (let key in fetchedJob.attributes) {
            let val = fetchedJob.attributes[key];

            if (this.job[key] !== val && val !== null) {
              if (this.job.model_id > 0 && key == 'model_id' && val !== this.job.model_id) {

              } else {
                
                this.job[key] = val;
              }

            } else if (key == 'job_time' && val > this.processTime) {
              this.processTime = val;
            }
          }
          } catch (error) {
            this.errorMessage = error.message;
          }
        }
      },

      getToken() {
        return localStorage.getItem('auth.accessToken');
      },
      cancelUpload() {
        this.errorMessage = '';
        if (this.interval)
          clearInterval(this.interval);

        this.videoFile = null;
        this.videoPreview = null;
        this.job = { status: null };

        this.$router.push('/upload');
      },

    async submitFinalizeForm() {
        this.errorMessage = '';
        this.isFetching = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/finalize`, this.formAttributes).finally(() => { this.isFetching = false; });
          this.resetProgress();
          this.operation = 'finalize';

          this.job.status = response.data.status;
        } catch (error) {
          this.isFetching = false;
          this.errorMessage = error.message;
        }
      },

    async cancelVideoProcessing() {
        this.operation = 'preview';
        this.errorMessage = '';
        this.job.status = 'cancelled';
        this.isFetching = true;
        try {
          const response = await axios.post(`${API_BASE_URL}/cancelJob/${this.videoId}`, {

            videoId: this.videoId
          },
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': 'Bearer ' + this.getToken()
              }
            }).finally(() => { this.isFetching = false; });
          this.resetProgress();
          this.job.status = response.data.status;
          this.formChanged = true;

        } catch (error) {
          this.isFetching = false;
          this.errorMessage = error.message;
        }
        return false;
      },
      resetProgress() {
        this.processTime = 0;
        this.job.progress = 0;
        this.job.job_time = 0;
        this.job.estimated_time_left = 0;
      },
    async deleteJob(id) {

        this.isFetching = true;

        try {
          let token = this.getToken();
          await axios.delete(`${API_V1_URL}/video-jobs/${id}?sort=-updated_at`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json'
            }
          }).finally(function () { this.isFetching = false; });

        } catch (error) {
          this.errorMessage = error.message;
        }
        _.remove(this.jobs, item => item.id === id);
      },

    async submitForm(frameCount = 1) {
        try {
          this.isFetching = true;
          this.errorMessage = '';

          this.formChanged = false;
          this.job.status = 'processing';
          this.resetProgress();

          let validationStatus = await this.$validate()
            .then(function (success) { return success; });

          if (validationStatus) {
            this.operation = 'preview';


            var options = _.clone(this.formAttributes);
            options.frameCount = frameCount;
            let response = await axios.post(`${API_BASE_URL}/generate`, options)
              .finally(() => {
                this.isFetching = false;
              });

            this.job.status = response.data.status;
            this.job.seed = response.data.seed;
            this.job.width = response.data.width;
            this.job.height = response.data.height;
            this.job.length = this.getFormattedDuration(response.data.length);
            this.job.fps = response.data.fps;
          }
        } catch (error) {
          this.isFetching = false;
          this.errorMessage = error.message;

          if (error.response?.data.message) {
            this.errorMessage = error.response.data.message;
          }
        }
      }

    }
  };
</script>

<style scoped lang="scss">
@import '@/assets/vimage.scss';
</style>
