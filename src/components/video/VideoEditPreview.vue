<template>
    <div class="pr-3" v-if="job.status != ''">
        <!-- Sample video -->
        <div class="sample-container mb-1">

            <div class="w-100 sample-area p-3 text-center">

                <!-- progress box start -->
                <label v-if="!isJobReady && !isJobSketch" class="form-label mb-1">Preview</label>
                    <label v-if="isJobReady" class="form-label mb-1 text-primary"><i class="pi pi-check"></i>Completed
                        video. Job duration {{ getFormattedDuration(job.job_time) }}</label>
                <div class="img-with-overlay mt-1"
                    v-if="!isJobReady && (isJobApproved || isVideoProcessing || hasPreviewAnimation || hasPreviewImage)">
                    
                    <Image crossorigin="anonymous"
                        :style="{ filter: isVideoProcessing ? 'blur(' + (50 - ((1 + job.progress))) + 'px)' : '' }"
                        v-if="hasPreviewAnimation && (job.operation == 'animation' || (job.operation == 'preview' && !hasPreviewImage))"
                        class="w-100 preview-100 text-center img-with-blur"
                        :src="job.preview_animation.replace('https://api.dudeisland.eu', '')" @error="imageLoadOnError"
                        v-bind:alt="animation" preview />
                    <Image
                        :style="{ filter: isVideoProcessing ? 'blur(' + (50 - ((1 + job.progress))) + 'px)' : '' }"
                        v-if="hasPreviewImage && (job.operation != 'animation' || (job.operation == 'animation' && !hasPreviewAnimation))"
                        class="w-100 preview-100 img-with-blur"
                        :src="job.preview_img ? job.preview_img.replace('https://api.dudeisland.eu', '') : ''" @error="imageLoadOnError"

                    <div class="img-with-overlay mt-1"
                    v-if="!isJobReady || (isJobApproved || isVideoProcessing || hasPreviewAnimation || hasPreviewImage || job.generator == 'deforum')">

                    <Image crossorigin="anonymous"
                        :style="{ filter: isVideoProcessing ? 'blur(' + (50 - ((1 + job.progress))) + 'px)' : '' }"
                        v-if="hasPreviewAnimation || (job.operation == 'animation' && hasPreviewAnimation)"
                        class="w-100 preview-100 text-center img-with-blur" :src="getPreviewAnimation"
                        @error="imageLoadOnError" v-bind:alt="animation" preview />
                    <Image crossorigin="anonymous"
                        :style="{ filter: isVideoProcessing ? 'blur(' + (50 - ((1 + job.progress))) + 'px)' : '' }"
                        v-if="hasPreviewImage || ((job.operation != 'animation' && hasPreviewImage))"
                        class="w-100 preview-100 img-with-blur" :src="getPreviewImage" @error="imageLoadOnError"
                        v-bind:alt="pic" preview />
                        <div v-if="(!isJobReady && job.generator == 'deforum'  || showOriginal == true )" class="preview-100 mt-1">
                    <label class="form-label">Original image</label>
                    <div class="preview-100 mt-1">
                        <Image crossorigin="anonymous" :src="job.original_url" @error="imageLoadOnError"
                            v-bind:alt="pic" class="preview-100" preview />
                    </div>
                    </div>
                    <VideoEditProgress :job="job"></VideoEditProgress>
                </div>
                <!-- preview box end-->


                <div class="text-center position-relative w-100 mt-1" v-if="isJobReady">
                    <vue-plyr :options="options">
<<<<<<< HEAD
                        <video controls crossorigin="anonymous" playsinline
                            :data-poster="job.preview_img.replace('https://api.dudeisland.eu', '')">
=======
                        <video controls crossorigin="anonymous" playsinline :data-poster="job.preview_img ? job.preview_img.replace('https://api.dudeisland.eu', '') : ''">
>>>>>>> c7e57d1 (Fixes)
                            <source size="720" crossorigin="anonymous" :src="job.url" type="video/mp4" />
                        </video>
                    </vue-plyr>

                    <!-- Original video -->
                </div>
<<<<<<< HEAD

                <div v-if="job.status == 'pending' || showOriginal == true"
=======
                
                <div v-if="job.status == 'pending' || (!hasPreviewAnimation && !hasPreviewImage) || showOriginal"
>>>>>>> c7e57d1 (Fixes)
                    class="video-preview-container mb-3">
                    <div v-if="job.generator == 'vid2vid'">
                        <label class="form-label">Original video</label>
                        <div class="preview-100 mt-1">
                            <video crossorigin="anonymous" ref="videoPlayer" class="video-js" controls preload="auto">
                                <source v-if="originalUrl" :src="originalUrl" type="video/mp4">
                            </video>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    </div>
</template>
<script>
import VideoEditProgress from '@/components/video/VideoEditProgress.vue';
import moment from 'moment';
export default {
    name: 'VideoEditPreview',
    components: {
        VideoEditProgress
    },
    data() {
        return {
            job: {},
            options: { quality: { default: '720p' } },
            preview: '/layout/images/default-video-thumb.svg',
        };
    },
    props: {
        job: { type: Object, default: {} },
        showOriginal: { type: Boolean, default: false }
    },
    computed: {
        imageLoadOnError(e) {
            if (!e || !e.originalEvent) return;
            e.originalEvent.target.src = "https://yt3.googleusercontent.com/ytc/AGIKgqM4CXwFgjDl9yy2zsJaWMBIL4zPAR810_zU5W9g=s900-c-k-c0x00ffffff-no-rj";
        },
        isJobSketch() {
            return (this.$props.job.status === 'pending');
        },
        isAnimationProcessing() {
            return this.isVideoProcessing && this.$props.job.operation == 'animation';
        },
        isFinalizationProcessing() {
            return this.isVideoProcessing && this.$props.job.operation == 'finalize';
        },
        isVideoProcessing() {
            return this.isJobProcessing || this.isJobApproved;
        },
        isJobFinished() {
            return this.$props.job.status === 'finished';
        },
        isJobProcessing() {
            return this.$props.job.status.includes('processing');
        },

        isJobApproved() {
            return (this.$props.job.status === 'approved');
        },
        isJobReady() {
            return (this.$props.job.status == 'finished' && this.$props.job.url && this.$props.job.url.length > 0);
        },
        originalUrl() {
            const url = this.$props.job.original_url.replace('https://api.dudeisland.eu', '');
            if (url && url.length > 0)
                return url;
            return false;
        },
        hasPreviewImage() {
            var url = this.$props.job.preview_img;
            var mediaUrl = this.$props.job.media?.preview?.url;
            if (mediaUrl) {
                url = mediaUrl;
            }

            return (this.$props.job.status != 'pending' && url && url.length > 0 && (url.includes('.png') || url.includes('.gif')));
        },
        hasPreviewAnimation() {
            var url = this.$props.job.preview_animation;
            var mediaUrl = this.$props.job.media?.animation?.url;
            if (mediaUrl) {
                url = mediaUrl;
            }

            return (this.$props.job.status != 'pending' && url && url.length > 0 && (url.includes('.png') || url.includes('.gif')));
        },
        getPreviewUrl() {
            return this.$props.job.original_url.replace("https://api.dudeisland.eu", "");
        },
        getPreviewImage() {
            if (this.hasPreviewImage) {
                var url = this.$props.job.media?.preview?.url;
                if (url) {
                    return url;
                }
                return this.$props.job.preview_img;
            }
            return false;
        },
        getPreviewAnimation() {
            if (this.hasPreviewAnimation) {

                var url = this.$props.job.media?.animation?.url;
                if (url) {
                    return url;
                }
                return this.$props.job.preview_animation;
            }
            return false;
        },

    },
    methods: {
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
<style type="scss">
.form-label,
.field>label {
    font-weight: bold;
    letter-spacing: 0.2px;
    color: rgba(238, 238, 238, 0.5);
    font-size: 11px;
    text-transform: uppercase;
    transition: color 0.3s ease-in-out;
}

.w-100 {
    width: 100%;
}

.preview-100>img,
.preview-100>video,
img.preview-100 {
    width: auto;
    max-width: 400px;
    max-height: 400px;
    margin: auto;
}

.p-image .p-image-preview-indicator {
    border: none;
}

.img-with-blur {
    transition: filter 0.15s ease-in-out;
}

.img-with-overlay {
    position: relative;
    overflow: hidden;
    min-height: 100px;
}
</style>
