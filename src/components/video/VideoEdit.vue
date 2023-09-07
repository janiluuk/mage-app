<template>
  <div class="container">
    <Sidebar v-model:visible="overlayActive" class="startup-overlay" :baseZIndex="1000" position="full">
      <VideoEditOverlay :job="job" @overlay:active="toggleFullscreenOverlay" />
    </Sidebar>
    <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
      v-if="job.status == 'error' || errorMessage != ''">
      <span class="text-primary text-lg">{{ errorMessage }}</span>
    </div>
    <VideoEditToolbar :job="job" :formChanged="formChanged" @submit:cancel="handleCancelJob" @submit:overlay="toggleFullscreenOverlay" @submit:preview="handlePreviewSubmit" @submit:finalize="handleFinalizeJob"/>
    <div class="editor" v-if="job.status != null">
      <!-- Main settings container -->
      <Splitter class="mb-5 editor-container">
        <SplitterPanel :size="30" :minSize="10" class="mw-0">
          <VideoEditPreview :job="job" />
        </SplitterPanel>
        <SplitterPanel :size="70" :minSize="40" class="mw-0">
          <form v-on:submit.prevent="">
            <div class="md:mb-3 mb-4 pl-3">
              <label class="form-label mb-1 ms-0 mt-2">Selected Model: <strong>{{ job.model_name }}</strong></label>
              <div class="model-selector-container mt-1">
                <ModelfileSelector :modelId="job.model_id" :modelName="job.model_name" @update:modelId="updateModelId"
                  @update:modelName="updateModelName" />
              </div>
            </div>
            <div class="pl-3">

              <div class="p-fluid formgrid grid">
                <div class="field col-12 md:mb-2 mb-3">
                  <div class="message p-error p-danger">{{ validation.firstError('job.prompt') }}</div>
                  <label class="mb-1 ms-0">Prompt</label>
                  <Textarea rows="4" autoResize placeholder="Type your prompt here" v-model="job.prompt"
                    :disabled="isVideoProcessing"></Textarea>
                </div>
                <div class="field col-12 md:mb-2 mb-3">
                  <label class="mb-1 ms-0 mt-2">Negative Prompt</label>
                  <Textarea rows="2" autoResize placeholder="Type your negative prompt here" v-model="job.negative_prompt"
                    :disabled="isVideoProcessing || isJobReady"></Textarea>
                </div>

                <div class="field col-12 md:col-6 md:mb-3 mb-4">
                  <label class="mb-1 ms-0" :style="{ color: denoisingColor }">Strength: {{ denoisingText
                  }} <div class="help-btn" @click="toggleOverlay"><i class="fa fa-question"></i></div></label>
                  <OverlayPanel ref="op" :showCloseIcon="true">
                    <p>Help text goes here</p>
                  </OverlayPanel>
                  <InputNumber min="0.2" :max="0.8" :step="0.025" v-model.number="job.denoising" showButtons
                    :disabled="isVideoProcessing" />
                  <Slider v-model="job.denoising" :class="{ denoisingColor }" :min="0.2" :max="0.8" :step="0.025"
                    :disabled="isVideoProcessing" /><br/>
                  <!--  <label class="mb-1 ms-0 mt-2">Debugging controlnet 1 weight:{{ controlnet[0].weight }}</label>
                  <Slider v-model="controlnet[0].weight" :min="0.2" :max="0.8" :step="0.025"/>
                  <label class="mb-1 ms-0 mt-2">Debugging controlnet 2 weight:{{ controlnet[1].weight }}</label>
                  <Slider v-model="controlnet[1].weight" :min="0.2" :max="1.5" :step="0.025"/>
                -->
                </div>
                <div class="field col-12 md:col-6 md:mb-3 mb-4">
                  <label class="mb-1 ms-0">Seed</label>
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

              </div>
            </div>
          </form>
        </SplitterPanel>
      </Splitter>
      <OverlayPanel ref="op">
      </OverlayPanel>
    </div>
  </div>
</template>

<script>
import ModelfileSelector from '@/components/Modelfile/ModelfileSelector.vue';
import VideoEditOverlay from '@/components/video/VideoEditOverlay.vue';
import VideoEditPreview from '@/components/video/VideoEditPreview.vue';
import VideoEditToolbar from '@/components/video/VideoEditToolbar.vue';
import VideoEntry from '@/components/video/VideoEntry.vue';
import VideoPlayer from '@/components/video/VideoPlayer.vue';
import showSwal from "@/mixins/showSwal.js";
import _ from 'lodash';
import SimpleVueValidator from 'simple-vue3-validator';
import { ref } from 'vue';
import { mapActions, mapGetters } from 'vuex';

const Validator = SimpleVueValidator.Validator;

export default {
  name: 'VideoEdit',
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = false;
    }
  },
  setup() {
    const op = ref(null);
    return { op };

  },
  data() {
    return {
      videoId: null,
      overlayActive: false,
      isLoading: false,
      isFetching: false,
      errorMessage: '',
      switchValue: false,
      formChanged: false,
      interval: false,

      job: {
        status: null,
        model_id: 0,
        operation: 'preview',
        cfg_scale: 7,
        progress: 1,
        estimated_time_left: 0,
        job_time: 0,
        denoising: 0.4,
        seed: -1,

      },
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
      ],
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
  async created() {
    this.videoId = this.$route.params.id;
    this.fetchVideoJob = this.fetchVideoJob.bind(this);
    this.startPollingVideoJob = this.startPollingVideoJob.bind(this);
    await this.fetchVideoJob(true);
    this.startPollingVideoJob();
    this.formChanged = false;
  },
  components: {
    VideoEntry,
    ModelfileSelector,
    VideoPlayer,
    VideoEditOverlay,
    VideoEditPreview,
    VideoEditToolbar
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
    ...mapGetters('videojobs', {
      getJob: 'job',
     fetchStatus: 'progress'
    }),
    op() {
      return this.$refs.op;
    },
    isVideoProcessing() {
      return (this.job.status && (this.job.status.includes('processing') || this.job.status == 'approved'));
    },
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
    denoisingText() {
      const value = (this.job.denoising * 100).toFixed(0);
      if (value >= 1 && value <= 25) {
        return 'Low';
      } else if (value > 25 && value <= 50) {
        return 'Medium';
      } else if (value > 50 && value <= 75) {
        return 'High';
      } else if (value > 75 && value <= 100) {
        return 'Ludicrous';
      } else {
        return 'Normal';
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
        controlnet: this.controlnet
      };
    }
  },

  methods: {
    ...mapActions({
      fetchJob: 'videojobs/get',
      finalize: 'videojobs/finalize',
      preview: 'videojobs/preview',
      cancel: 'videojobs/cancel',
    }),
    async handlePreviewSubmit(frameCount) {

      let validationStatus = await this.$validate()
          .then(function (success) { return success; });
        if (validationStatus) {
          this.job.operation = (frameCount > 1) ? 'animation' : 'preview';
          this.job.status='processing';
          var options = _.clone(this.formAttributes);
          options.frameCount = frameCount;
          await this.preview(options);
          this.switchValue = 0;

        }
    },
    async handleFinalizeJob()
    {
      try {
        await this.finalize(this.formAttributes);
        this.job.status = 'approved';
        this.job.operation = 'finalize';
      } catch (error) {
          if (error.message)
            this.errorMessage = error.message;
      }
    },
    handleCancelJob() {
      this.errorMessage = '';
        this.cancel(this.videoId).then((response) => {
            this.job.status = 'cancelled';
        });
      return;
    },
    pasteModelData() {
      navigator.clipboard.readText().then(text => {
        showSwal.methods.showSwal({
          type: "success",
          message: "Model cloned successfully!",
          width: 500
        });
      });
    },
    toggleOverlay(event) {
      this.op.toggle(event);
    },
    toggleFullscreenOverlay() {
      this.overlayActive = !this.overlayActive
    },
    updateModelId(newModelId) {
      this.job.model_id = newModelId;
    },
    updateModelName(newModelName) {
      this.job.model_name = newModelName;
    },
    async startPollingVideoJob() {
      if (this.interval) clearInterval(this.interval);
      this.interval = setInterval(this.fetchVideoJob, 2500); // Poll every 3 seconds
    },
    async fetchVideoJob(force) {
      if (!this.videoId) return;
      if (force == true || this.isVideoProcessing) {
        try {
          await this.fetchJob(this.videoId);
          // Compare and update only changed properties
          for (let key in this.getJob) {
            let val = this.getJob[key];
            if (this.job[key] !== val && val !== null) {
              if (this.job.model_id > 0 && key == 'model_id' && val !== this.job.model_id) {
              } else {
                this.job[key] = val;
              }
            }
          }
        } catch (error) {
          if (error?.message)
            this.errorMessage = error.message;
        }
      }
    },
  }
};
</script>

<style scoped lang="scss">
@import '@/assets/vimage.scss';
</style>
