<template>

    <div class="progress-overlay" v-if="isVideoProcessing">
  
      <ProgressSpinner style="width: 70px; height: 70px" strokeWidth="3"></ProgressSpinner>
      <div class="progress-container">
        <div class="progress-wrapper w-full">
            <div class="progress-info text-center">
                <div class="text-sm mb-2">
                    <span class="mr-1"><i class="fw-bolder fa fa-spin fa-atom"></i></span>
                    <span v-if="!progressAmount">Calculating... </span>
                    <span v-if="progressAmount">Remaining: </span>
                    <span v-if="progressAmount">
                        {{ amountOfTimeLeft }}
                    </span>
                </div>
            </div>
            <ProgressBar :mode="progressAmount ? 'determinate': 'indeterminate'" :value="progressAmount" class="text-xs overlay-progress-bar"></ProgressBar>
            <p v-if="isJobApproved" class="mt-2 mb-0 text-xs text-primary text-center">
                Waiting
                for
                a worker to pick the job up....  {{  job.queue }}</p>
        

        </div>
        <p v-if="(hasPreviewImage || hasPreviewAnimation) || progressAmount > 0"
            class="mt-1 mb-0 text-xs text-primary text-center"><span class="text-xs">{{
                timeElapsedFormatted }} elapsed</span>
        </p>
      </div>
    </div>
</template>
<script>
import moment from 'moment';

export default {
    name: 'VideoEditProgress',
    data() {
        return {
            progress: 0,
            processTime: 0,
            startTime: 0,
            timeleft: 0,
            interval: false,
            job: {}
        };
    },
    beforeUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = false;
        }
    },
    props: {
        job: { type: Object, default: {} },
    },
    async created() {
        this.updateProgress = this.updateProgress.bind(this);
        this.resumeProgress = this.resumeProgress.bind(this);
    },

    watch: {
        '$props.job.status': {
            handler: function (v, o) {
                if (v == 'processing' || v == 'preprocessing' || v == 'postprocessing' || v == 'approved') {
                    this.startProgress();
                } else {
                    this.pauseProgress();
                }
            },
            immediate: true,
            deep: true
        }
    },
    computed: {
        timeElapsedFormatted() {
            return this.getDuration(this.timeElapsed);
        },
        timeElapsed() {
            if (this.$props.job.job_time >= 0 && this.$props.job.job_time > this.processTime) {
                return this.$props.job.job_time;
            } else {
                 return this.processTime;
            }
        },
        currentTime() {
            return Math.floor(new Date(Date.now()).getTime() / 1000);
        },
        isVideoProcessing() {
            return this.isJobProcessing || this.isJobApproved;
        },
        isJobApproved() {
            return (this.$props.job.status === 'approved');
        },
        isJobProcessing() {
            return this.$props.job.status.includes('processing');
        },
        progressAmount() {
            return this.$props.job.progress > 0 ? this.$props.job.progress : this.progress;
        },
        hasPreviewImage() {
            var url = this.$props.job.preview_img;
            var mediaUrl = this.$props.job.media?.preview?.url;
            if (mediaUrl) {
                 url = mediaUrl;
            }

            return (this.$props.job.status != 'pending' && url && url.length> 0 && (url.includes('.png') || url.includes('.gif')));
        },
        hasPreviewAnimation() {
            var url = this.$props.job.preview_animation;
            var mediaUrl = this.$props.job.media?.animation?.url;
            if (mediaUrl) {
                 url = mediaUrl;
            }

            return (this.$props.job.status != 'pending' && url && url.length> 0 && (url.includes('.png') || url.includes('.gif')));
        },
        currentTime() {
            return Math.floor(new Date(Date.now()).getTime() / 1000);
        },
        amountOfTimeLeft() {
            if (this.timeleft <= 0 || !this.timeleft) return this.getFormattedDuration(this.$props.job.estimated_time_left);
            return this.getFormattedDuration(this.timeleft);
        }
    },
    methods: {
        updateProgress() {
            if (this.$props.job.progress > 0 && this.$props.job.progress != this.progress) {
                this.progress = this.$props.job.progress;
            }
            if (this.$props.job.job_time > 0 && this.$props.job.job_time > this.processTime) {
                this.processTime = this.$props.job.job_time+1;
            } else {
                this.processTime++;
            }
            if (this.$props.job.estimated_time_left >= 0 && (this.last_timeleft !== this.$props.job.estimated_time_left || this.timeleft <= 0)) {
                this.last_timeleft = this.$props.job.estimated_time_left;
                this.timeleft = this.$props.job.estimated_time_left;
            } else {
                if (this.timeleft > 1) this.timeleft--;
            }
        },
        startProgress() {
            this.resetProgress()
            this.startTime = this.currentTime;
            this.resumeProgress();
        },
        pauseProgress() {
            this.isFetching = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = false;
            }
        },
        resumeProgress() {
            this.pauseProgress();
            this.interval = setInterval(this.updateProgress, 2000);
            this.isFetching = true;
        },

        stopProgress() {
            this.pauseProgress();
            this.isFetching = false;
            this.resetProgress();
        },
        resetProgress() {
            this.isFetching = false;
            this.processTime = 0;
            this.timeleft = 0;
            this.startTime = this.currentTime;
            this.progress = 0;
        },
        getDuration(seconds) {
            if (!seconds) {
                seconds = 1;
            }
            return moment.duration({ "seconds": seconds }).humanize();
        },
        getFormattedDuration(seconds) {
            if (!seconds) {
                seconds = 1;
            }
            let momentDuration = moment.duration(seconds, 'seconds');
            return moment.utc(momentDuration.as('milliseconds')).format('HH:mm:ss');
        },


    }
}

</script>
<style type="scss" scoped>
.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-flow: column;
  row-gap: 2rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-width: 0;
  padding: 0 10%;
  min-height: 200px;
}

.progress-container {
  width: 100%;
}

.progress-container p {
  line-height: 1.3;
}

.overlay-progress-bar:deep .p-progressbar-value {
  justify-content: flex-end;
  padding: 0 0.5rem;
}
</style>
