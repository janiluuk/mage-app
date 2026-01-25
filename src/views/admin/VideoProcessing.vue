<template>
  <div class="grid">
    <div class="col-12">
      <Panel header="Video Processing">
        <template #icons>
          <Tag :value="form.job_type === 'beat-match' ? 'Beat Match' : 'Audio Track Split'" severity="info" />
        </template>
        
        <InlineMessage severity="info" class="mb-3">
          Create a music video with cuts synchronized to bass beats in audio
        </InlineMessage>

        <form @submit.prevent="submitForm" class="p-fluid">
          <Fieldset legend="Job Configuration" class="mb-3">
            <div class="formgrid grid">
              <!-- Job Type Selection -->
              <div class="field col-12 md:col-6">
                <label for="job_type">Job Type *</label>
                <Dropdown
                  id="job_type"
                  v-model="form.job_type"
                  :options="jobTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select job type"
                  :class="{ 'p-invalid': errors.job_type }"
                />
                <small v-if="errors.job_type" class="p-error">{{ errors.job_type }}</small>
              </div>

              <!-- Input Type Selection -->
              <div class="field col-12 md:col-6">
                <label for="input_type">Input Type *</label>
                <Dropdown
                  id="input_type"
                  v-model="form.input_type"
                  :options="inputTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select input type"
                  :class="{ 'p-invalid': errors.input_type }"
                  @change="onInputTypeChange"
                />
                <small v-if="errors.input_type" class="p-error">{{ errors.input_type }}</small>
              </div>
            </div>
          </Fieldset>

          <!-- File Upload Section -->
          <Fieldset v-if="form.input_type === 'files'" legend="File Upload" class="mb-3">
            <div class="formgrid grid">
              <!-- Audio File -->
              <div class="field col-12">
                <label for="audio_file">Audio File (MP3, WAV, AAC, M4A) *</label>
                <FileUpload
                  id="audio_file"
                  mode="basic"
                  accept="audio/*"
                  :maxFileSize="51200000"
                  chooseLabel="Choose Audio File"
                  @select="onAudioFileSelect"
                  :class="{ 'p-invalid': errors.audio_file }"
                />
                <InlineMessage v-if="selectedAudioFile" severity="info" class="mt-2">
                  Selected: {{ selectedAudioFile.name }}
                </InlineMessage>
                <small v-if="errors.audio_file" class="p-error">{{ errors.audio_file }}</small>
              </div>

              <!-- Video Files -->
              <div class="field col-12">
                <label for="video_files">Video Files (MP4, MOV, WebM) * - Select multiple files</label>
                <FileUpload
                  id="video_files"
                  mode="basic"
                  accept="video/*"
                  :maxFileSize="200000000"
                  :multiple="true"
                  chooseLabel="Choose Video Files"
                  @select="onVideoFilesSelect"
                  :class="{ 'p-invalid': errors.video_files }"
                />
                <div v-if="selectedVideoFiles.length > 0" class="mt-2">
                  <Tag :value="`${selectedVideoFiles.length} file(s) selected`" severity="success" class="mb-2" />
                  <div v-for="(file, index) in selectedVideoFiles" :key="index" class="mb-1">
                    <InlineMessage severity="info">{{ file.name }}</InlineMessage>
                  </div>
                </div>
                <small v-if="errors.video_files" class="p-error">{{ errors.video_files }}</small>
              </div>
            </div>
          </Fieldset>

          <!-- Project ID Section -->
          <Fieldset v-if="form.input_type === 'project'" legend="Project Selection" class="mb-3">
            <div class="field col-12">
              <label for="project_id">Project ID *</label>
              <InputNumber
                id="project_id"
                v-model="form.project_id"
                placeholder="Enter project ID"
                :class="{ 'p-invalid': errors.project_id }"
              />
              <small v-if="errors.project_id" class="p-error">{{ errors.project_id }}</small>
            </div>
          </Fieldset>

          <!-- Beat Match Job Parameters -->
          <Fieldset v-if="form.job_type === 'beat-match'" legend="Beat Match Settings" class="mb-3">
            <div class="formgrid grid">
              <!-- Cut Intensity -->
              <div class="field col-12 md:col-6">
                <label for="cut_intensity">Cut Intensity</label>
                <Dropdown
                  id="cut_intensity"
                  v-model="form.cut_intensity"
                  :options="cutIntensityOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select cut intensity"
                />
                <small>How often to cut between video clips based on detected beats</small>
              </div>

              <!-- Direction -->
              <div class="field col-12 md:col-6">
                <label for="direction">Playback Direction</label>
                <Dropdown
                  id="direction"
                  v-model="form.direction"
                  :options="directionOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select direction"
                />
                <small>Direction of video playback for each clip</small>
              </div>

              <!-- Speed Factor -->
              <div class="field col-12 md:col-6">
                <label for="speed_factor">Speed Factor</label>
                <InputNumber
                  id="speed_factor"
                  v-model="form.speed_factor"
                  :min="0.1"
                  :max="2.0"
                  :step="0.1"
                />
                <small>Speed multiplier (0.5 = half speed, 2.0 = double speed)</small>
              </div>

              <!-- Start Time -->
              <div class="field col-12 md:col-6">
                <label for="start_time">Start Time (seconds)</label>
                <InputNumber
                  id="start_time"
                  v-model="form.start_time"
                  :min="0"
                  :step="0.1"
                />
                <small>Start time in seconds for audio processing (optional)</small>
              </div>

              <!-- End Time -->
              <div class="field col-12 md:col-6">
                <label for="end_time">End Time (seconds)</label>
                <InputNumber
                  id="end_time"
                  v-model="form.end_time"
                  :min="0"
                  :step="0.1"
                />
                <small>End time in seconds for audio processing (optional)</small>
              </div>
            </div>
          </Fieldset>

          <!-- Audio Track Split Job Parameters -->
          <Fieldset v-if="form.job_type === 'audio-track-split'" legend="Audio Track Split Settings" class="mb-3">
            <div class="formgrid grid">
              <div class="field col-12 md:col-6">
                <label for="model">UVR5 Model *</label>
                <Dropdown
                  id="model"
                  v-model="form.model"
                  :options="uvr5ModelOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select UVR5 model"
                  :class="{ 'p-invalid': errors.model }"
                />
                <small>UVR5 model for audio separation</small>
                <small v-if="errors.model" class="p-error">{{ errors.model }}</small>
              </div>

              <div class="field col-12 md:col-6">
                <label for="output_format">Output Format</label>
                <Dropdown
                  id="output_format"
                  v-model="form.output_format"
                  :options="outputFormatOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select output format"
                />
                <small>Output audio format</small>
              </div>

              <div class="field col-12">
                <div class="field-checkbox">
                  <Checkbox
                    id="vocal_split_mode"
                    v-model="form.vocal_split_mode"
                    :binary="true"
                  />
                  <label for="vocal_split_mode">Enable vocal split mode</label>
                </div>
                <small>Separate vocals from instrumental track</small>
              </div>
            </div>
          </Fieldset>

          <!-- Submit Button -->
          <div class="field">
            <div class="flex gap-2">
              <Button
                label="Cancel"
                icon="pi pi-times"
                class="p-button-secondary"
                @click="resetForm"
                :disabled="isSubmitting"
              />
              <Button
                :label="form.job_type === 'beat-match' ? 'Create Music Video' : 'Create Audio Track Split'"
                icon="pi pi-play"
                type="submit"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              />
            </div>
          </div>
        </form>

        <!-- Status Messages -->
        <Message
          v-if="statusMessage"
          :severity="statusSeverity"
          :closable="true"
          @close="statusMessage = ''"
          class="mt-3"
        >
          {{ statusMessage }}
        </Message>

        <!-- Progress Bar -->
        <ProgressBar
          v-if="jobId && (jobStatus === 'processing' || jobStatus === 'approved')"
          :value="jobProgress"
          :showValue="true"
          class="mt-3"
        />

        <!-- Job Status -->
        <Panel v-if="jobId" header="Job Status" class="mt-3">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="field grid">
                <label class="col-fixed font-bold" style="width: 120px">Job ID:</label>
                <div class="col">
                  <Tag :value="jobId" severity="info" />
                </div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field grid">
                <label class="col-fixed font-bold" style="width: 120px">Status:</label>
                <div class="col">
                  <Tag :value="jobStatus" :severity="getStatusSeverity(jobStatus)" />
                </div>
              </div>
            </div>
            <div v-if="jobProgress" class="col-12">
              <div class="field grid">
                <label class="col-fixed font-bold" style="width: 120px">Progress:</label>
                <div class="col">
                  <Badge :value="`${jobProgress}%`" severity="success" size="large" />
                </div>
              </div>
            </div>
            <div v-if="jobUrl" class="col-12">
              <div class="field grid">
                <label class="col-fixed font-bold" style="width: 120px">Video URL:</label>
                <div class="col">
                  <a :href="jobUrl" target="_blank" class="p-button p-component p-button-text p-button-plain">
                    {{ jobUrl }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </Panel>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
import customJobService from '@/services/customJobService';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import Fieldset from 'primevue/fieldset';
import FileUpload from 'primevue/fileupload';
import InlineMessage from 'primevue/inlinemessage';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';

export default {
  name: 'VideoProcessing',
  components: {
    Badge,
    Button,
    Checkbox,
    Dropdown,
    Fieldset,
    FileUpload,
    InlineMessage,
    InputNumber,
    Message,
    Panel,
    ProgressBar,
    Tag,
  },
  setup() {
    const form = ref({
      job_type: 'beat-match',
      input_type: 'files',
      project_id: null,
      cut_intensity: 2,
      direction: 'random',
      speed_factor: 1.0,
      start_time: 0,
      end_time: null,
      model: 'MDX-Net-InstVoc_HQ_3', // Default UVR5 model
      output_format: 'wav', // Default output format
      vocal_split_mode: false,
    });

    const selectedAudioFile = ref(null);
    const selectedVideoFiles = ref([]);
    const errors = ref({});
    const isSubmitting = ref(false);
    const statusMessage = ref('');
    const statusSeverity = ref('info');
    const jobId = ref(null);
    const jobStatus = ref(null);
    const jobProgress = ref(0);
    const jobUrl = ref(null);
    const statusCheckInterval = ref(null);

    const jobTypes = [
      { label: 'Beat Match', value: 'beat-match' },
      { label: 'Audio Track Split', value: 'audio-track-split' },
    ];

    const inputTypes = [
      { label: 'Files', value: 'files' },
      { label: 'Project ID', value: 'project' },
    ];

    const cutIntensityOptions = [
      { label: '1 - Every beat', value: 1 },
      { label: '2 - Every 2nd beat', value: 2 },
      { label: '3 - Every 3rd beat', value: 3 },
    ];

    const directionOptions = [
      { label: 'Random - Mix of forward and backward', value: 'random' },
      { label: 'Forward - Normal playback', value: 'forward' },
      { label: 'Backward - Reverse playback', value: 'backward' },
    ];

    const outputFormatOptions = [
      { label: 'MP3', value: 'mp3' },
      { label: 'WAV', value: 'wav' },
      { label: 'AAC', value: 'aac' },
      { label: 'M4A', value: 'm4a' },
      { label: 'FLAC', value: 'flac' },
    ];

    const uvr5ModelOptions = [
      { label: 'MDX-Net InstVoc HQ 3 (Default)', value: 'MDX-Net-InstVoc_HQ_3' },
      { label: 'MDX-Net Karaoke', value: 'MDX-Net-Karaoke' },
      { label: 'MDX-Net Vocal', value: 'MDX-Net-Vocal' },
      { label: 'MDX-Net Instrumental', value: 'MDX-Net-Instrumental' },
      { label: 'VR-DeEcho-Aggressive', value: 'VR-DeEcho-Aggressive' },
      { label: 'VR-DeEcho-DeReverb', value: 'VR-DeEcho-DeReverb' },
      { label: 'VR-DeEcho-Normal', value: 'VR-DeEcho-Normal' },
      { label: 'Demucs', value: 'Demucs' },
      { label: 'Demucs Extra', value: 'Demucs-Extra' },
    ];

    const onInputTypeChange = () => {
      selectedAudioFile.value = null;
      selectedVideoFiles.value = [];
      form.value.project_id = null;
    };

    const onAudioFileSelect = (event) => {
      selectedAudioFile.value = event.files[0];
      errors.value.audio_file = null;
    };

    const onVideoFilesSelect = (event) => {
      selectedVideoFiles.value = Array.from(event.files);
      errors.value.video_files = null;
    };

    const validateForm = () => {
      errors.value = {};

      if (!form.value.job_type) {
        errors.value.job_type = 'Job type is required';
      }

      if (!form.value.input_type) {
        errors.value.input_type = 'Input type is required';
      }

      if (form.value.input_type === 'files') {
        if (form.value.job_type === 'beat-match' && !selectedAudioFile.value) {
          errors.value.audio_file = 'Audio file is required';
        }
        if (form.value.job_type === 'beat-match' && selectedVideoFiles.value.length === 0) {
          errors.value.video_files = 'At least one video file is required';
        }
        if (form.value.job_type === 'audio-track-split' && !selectedAudioFile.value) {
          errors.value.audio_file = 'Audio file is required';
        }
      }

      if (form.value.job_type === 'audio-track-split' && !form.value.model) {
        errors.value.model = 'UVR5 model is required';
      }

      if (form.value.input_type === 'project') {
        if (!form.value.project_id) {
          errors.value.project_id = 'Project ID is required';
        }
      }

      return Object.keys(errors.value).length === 0;
    };

    const submitForm = async () => {
      if (!validateForm()) {
        statusMessage.value = 'Please fix the form errors';
        statusSeverity.value = 'error';
        return;
      }

      isSubmitting.value = true;
      statusMessage.value = '';
      errors.value = {};

      try {
        const formData = new FormData();
        formData.append('job_type', form.value.job_type);
        formData.append('input_type', form.value.input_type);

        if (form.value.input_type === 'files') {
          if (selectedAudioFile.value) {
            formData.append('audio_file', selectedAudioFile.value);
          }
          selectedVideoFiles.value.forEach((file) => {
            formData.append('video_files[]', file);
          });
        } else {
          formData.append('project_id', form.value.project_id);
        }

        // Beat Match options
        if (form.value.job_type === 'beat-match') {
          if (form.value.cut_intensity) {
            formData.append('cut_intensity', form.value.cut_intensity);
          }
          if (form.value.direction) {
            formData.append('direction', form.value.direction);
          }
          if (form.value.speed_factor) {
            formData.append('speed_factor', form.value.speed_factor);
          }
          if (form.value.start_time !== null) {
            formData.append('start_time', form.value.start_time);
          }
          if (form.value.end_time !== null) {
            formData.append('end_time', form.value.end_time);
          }
        }

        // Audio Track Split options
        if (form.value.job_type === 'audio-track-split') {
          const options = {};
          if (form.value.model) {
            options.model = form.value.model;
          }
          if (form.value.output_format) {
            options.output_format = form.value.output_format;
          }
          if (form.value.vocal_split_mode !== null) {
            options.vocal_split_mode = form.value.vocal_split_mode;
          }
          formData.append('options', JSON.stringify(options));
        }

        const response = await customJobService.process(formData);

        if (response.success) {
          statusMessage.value = 'Job queued successfully!';
          statusSeverity.value = 'success';
          jobId.value = response.job_id;
          jobStatus.value = response.status;
          jobProgress.value = 0;
          jobUrl.value = null;

          // Start polling for status
          startStatusCheck(response.job_id);
        } else {
          statusMessage.value = response.message || 'Failed to create job';
          statusSeverity.value = 'error';
        }
      } catch (error) {
        console.error('Error creating custom job:', error);
        statusMessage.value = error.message || 'An error occurred while creating the job';
        statusSeverity.value = 'error';

        if (error.validatorError) {
          errors.value = error.validatorError;
        }
      } finally {
        isSubmitting.value = false;
      }
    };

    const startStatusCheck = (id) => {
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
      }

      statusCheckInterval.value = setInterval(async () => {
        try {
          const status = await customJobService.getStatus(id);
          jobStatus.value = status.status;
          jobProgress.value = status.progress || 0;

          if (status.url) {
            jobUrl.value = status.url;
          }

          if (status.status === 'finished' || status.status === 'error') {
            clearInterval(statusCheckInterval.value);
            statusCheckInterval.value = null;

            if (status.status === 'finished') {
              statusMessage.value = 'Processing complete! Video is ready.';
              statusSeverity.value = 'success';
            } else {
              statusMessage.value = 'Processing failed: ' + (status.error || 'Unknown error');
              statusSeverity.value = 'error';
            }
          }
        } catch (error) {
          console.error('Error checking job status:', error);
        }
      }, 2000);
    };

    const resetForm = () => {
      form.value = {
        job_type: 'beat-match',
        input_type: 'files',
        project_id: null,
        cut_intensity: 2,
        direction: 'random',
        speed_factor: 1.0,
        start_time: 0,
        end_time: null,
        model: 'MDX-Net-InstVoc_HQ_3', // Default UVR5 model
        output_format: 'wav', // Default output format
        vocal_split_mode: false,
      };
      selectedAudioFile.value = null;
      selectedVideoFiles.value = [];
      errors.value = {};
      statusMessage.value = '';
      jobId.value = null;
      jobStatus.value = null;
      jobProgress.value = 0;
      jobUrl.value = null;
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
        statusCheckInterval.value = null;
      }
    };

    const getStatusSeverity = (status) => {
      switch (status) {
        case 'finished':
          return 'success';
        case 'processing':
        case 'approved':
          return 'info';
        case 'error':
          return 'danger';
        default:
          return 'warning';
      }
    };

    onUnmounted(() => {
      if (statusCheckInterval.value) {
        clearInterval(statusCheckInterval.value);
      }
    });

    return {
      form,
      selectedAudioFile,
      selectedVideoFiles,
      errors,
      isSubmitting,
      statusMessage,
      statusSeverity,
      jobId,
      jobStatus,
      jobProgress,
      jobUrl,
      jobTypes,
      inputTypes,
      cutIntensityOptions,
      directionOptions,
      outputFormatOptions,
      uvr5ModelOptions,
      onInputTypeChange,
      onAudioFileSelect,
      onVideoFilesSelect,
      submitForm,
      resetForm,
      getStatusSeverity,
    };
  },
};
</script>
