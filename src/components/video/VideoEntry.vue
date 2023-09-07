<template>
    <div class="row job-item">
        <div class="w-md-50 w-sm-100">
            <div class="d-flex flex-column align-items-center justify-content-center video-container mb-md-0 mb-3">
                <img v-if="getStatus !== 'finished' && job.preview_url && job.preview_url.length > 0 && job.preview_url.includes('.gif')"
                    @error="imageLoadOnError" class="img-fluid" :src="job.preview_url" v-bind:alt="pic">
                <video class="w-100 video-preview"
                    v-if="getStatus != 'finished' && job.preview_url && job.preview_url.length > 0 && job.preview_url.includes('.mp4')"
                    controls :src="job.preview_url" loop></video>
                <video class="w-100 video-preview"
                    v-if="getStatus == 'finished' && job.url && job.url.length > 0 && job.url.includes('.mp4')"
                    :src="job.url" controls></video>
            </div>
        </div>
        <div class="w-md-50 w-sm-100">
            <div>
                <div class="d-flex flex-row align-items-start justify-content-between">
                    <div>
                        <h4 class="fw-bold mb-1 lh-sm">
                            {{ job.prompt.slice(0, 20) }}
                        </h4>
                        <p class="text-xs text-muted">Last edited {{ formatDate(job.updated_at) }}</p>
                    </div>
                    <div class="ms-2">
                        <span v-if="getStatus == 'pending'" class="badge bg-secondary badge-text-shadow">Draft</span>
                        <span v-else-if="getStatus == 'preview'"
                            class="badge bg-secondary badge-text-shadow">Preview</span>
                        <span v-else-if="getStatus == 'approved'"
                            class="badge bg-gradient-vibrant badge-text-shadow">Waiting</span>
                        <span v-else-if="getStatus == 'finished'"
                            class="badge bg-success badge-text-shadow">Completed</span>
                        <span v-else-if="getStatus == 'processing'"
                            class="badge bg-gradient-info badge-text-shadow">Processing</span>
                        <span v-else-if="getStatus === 'error'" class="badge bg-error badge-text-shadow">Error</span>
                    </div>
                </div>
                <div class="d-flex flex-column mb-md-2 mb-3">
                    <label class="form-label text-sm text-uppercase mb-1 ms-0">Prompt</label>
                    <div
                        class="copy-area bg-light-opacity-8 p-2 border-radius-md d-flex flex-row align-items-start justify-content-between">
                        <div class="copy-content mb-2">
                            {{ job.prompt }}
                        </div>
                        <div>
                            <button class="btn-dark btn-icon-only shadow-none btn mb-0" type="submit">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="w-50 w-md-25 d-flex flex-column mb-3">
                        <label class="form-label text-sm text-uppercase ms-0">Model</label>
                        <div>{{ job.model_name }}</div>
                    </div>
                    <div class="w-50 w-md-25 d-flex flex-column mb-3">
                        <label class="form-label text-sm text-uppercase mb-2 ms-0">Denoising strength</label>
                        <div>
                            {{ job.denoising }}
                        </div>
                    </div>
                    <div class="w-50 w-md-25 d-flex flex-column mb-3">
                        <label class="form-label text-sm text-uppercase mb-2 ms-0">Seed</label>
                        <div>
                            {{ job.seed }}
                        </div>
                    </div>
                    <div class="w-50 w-md-25 d-flex flex-column mb-3">
                        <label class="form-label text-sm text-uppercase mb-2 ms-0">File info</label>
                        <div>
                            <span class="text-xs font-weight-bold"> Duration {{ job.length }}</span><br />><span
                                class="text-xs font-weight-bold"> {{ job.width }}x{{ job.height }} @ {{ job.fps }}
                                fps</span>
                        </div>
                    </div>
                </div>
                <div v-if="getStatus === 'processing'" class="align-middle d-flex justify-content-start">
                    <div class="progress-wrapper w-80 w-md-40 mb-3">
                        <div class="progress-info">
                            <div class="progress-percentage">
                                <span class="text-xs font-weight-bold">Processing {{ job.progress }}% completed </span>
                            </div>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-gradient-info progress-bar-striped progress-bar-animated"
                                role="progressbar" v-bind:style="{ width: job.progress + '%' }"
                                v-bind:aria-valuenow="job.progress" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        Time elapsed: {{ job.job_time }}
                    </div>
                </div>
                <div class="d-flex flex-row">

                    <button v-if="getStatus === 'finished' && job.url && job.url.length > 0"
                        @click="downloadWithAxios(job.url, job.prompt.slice(0, 20))"
                        class="btn-success shadow-none btn btn-md border-radius-xxl mb-0 me-2" type="submit">
                        <i class="fa fa-download me-2"></i>
                        Download
                    </button>
                    <button v-if="getStatus === 'preview'"
                        :disabled="getStatus === 'processing' || getStatus === 'approved'"
                        class="bg-gradient-vibrant shadow-none btn btn-md border-radius-xxl mb-0 me-2 text-dark"
                        @click="submitFinalizeForm" type="submit">Finalize video</button>

                    <button v-if="getStatus === 'error' || getStatus === 'cancelled'" @click="submitFinalizeForm"
                        class="bg-gradient-vibrant shadow-none btn btn-md border-radius-xxl mb-0 me-2 text-dark"
                        type="submit">Restart job</button>

                    <button class="btn-light shadow-none btn btn-md border-radius-xxl mb-0 btn-ghost-dark"
                        @click="copySettings">Copy
                        settings</button>

                    <button v-if="getStatus != 'processing' && getStatus != 'approved'"
                        @click="$emit('delete-job', job.id)"
                        class="btn-light shadow-none btn btn-md border-radius-xxl mb-0 btn-ghost-dark">Delete
                        job</button>

                    <div v-if="getStatus === 'approved'">
                        <p class="mt-2 mb-0 text-xs text-warning text-center">Video is being waiting for available worker...
                        </p>
                    </div>
                    <div v-if="getStatus === 'process' && job.progress >= 0">
                        <p class="mt-2 mb-0 text-xs text-warning text-center">Video is being processed. Check back here
                            later...</p>
                    </div>
                    <div v-if="getStatus === 'processing' && (!job.preview_url || job.preview_url == '')">
                        <p class="mt-2 mb-0 text-xs text-warning text-center">Processing file .. {{ job.progress
                        }}% Estimated time left: {{ job.estimated_time_left }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr class="horizontal light my-md-5 my-4" />
</template>

<script>
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
export default {
    name: 'VideoEntry',
    props: ['job'],
    data() {
        return {
            status: false
        };
    },
    methods: {
        formatDate(dateStr) {
            const date = new Date(dateStr);
            return formatDistanceToNow(date, { addSuffix: true });
        },
        forceFileDownload(response, title) {
            const new_url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a')
            link.href = new_url
            link.setAttribute('download', title)
            document.body.appendChild(link)
            link.click()
        },

        downloadWithAxios(url, title) {
            axios({
                method: 'get',
                url,
                responseType: 'arraybuffer',
            })
                .then((response) => {
                    this.forceFileDownload(response, title)
                })
                .catch(() => console.log('error occured'))
        },

        async submitFinalizeForm() {
            this.errorMessage = '';

            this.isFetching = true;
            try {
                const response = await axios.post('https://api.dudeisland.eu/finalize', {
                    modelId: this.job.model_id,
                    cfgScale: this.job.cfg_scale,
                    seed: this.job.seed,
                    denoising: this.job.denoising,
                    prompt: this.job.prompt,
                    videoId: this.job.id
                }).finally(() => {
                    this.isFetching = false;

                    this.status = response.data.status;
                })

            } catch (error) {
                this.isFetching = false;
                this.errorMessage = error.message;
            }
        },

    },
    computed: {
        getStatus: function () {
            if (this.status !== false) return this.status;
            else return this.job.status;
        }

        // Define your computed properties here
    },
    mounted() {
        // Any code that needs to run when the component is first created
    },
};
</script>

<style scoped>/* Any specific styles for this component */</style>
