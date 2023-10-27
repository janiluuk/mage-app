<template>
    <Toolbar class="video-edit-toolbar p-toolbar p-0 ml-3 mb-3">
        <template v-slot:start>
            <!-- <Menu :popup="true" :model="getMenu()" ref="menu" />
            <Button class="p-button-plain p-button-text mr-2" icon="pi pi-bars" label="Options"
                @click.prevent="toggleMenu(job.id, $event)"></Button>
            <ConfirmPopup></ConfirmPopup>-->
            <!--<Button type="button" :class=" showOriginal ? 'p-button-warning' : 'p-button-outlined' " icon="pi pi-image" label="Show Original"
            @click="$emit('submit:showoriginal', 1)" /> -->
<!--
            <Button type="button" class="ml-5 p-button-success hidden" icon="pi pi-image" label="Wizard"
            @click="$emit('submit:overlay', 1)" />
-->
            <Toast />
            <VideoInfoDialog :job="job" :infodialog="infodialog" @dialog:close="closeInfoDialog"></VideoInfoDialog>
        </template>

        <template v-slot:end>
            <div class="flex flex-column">
                <div class="d-flex flex-row">
                    <!--<Button @click="$emit('submit:preview', 1)" icon="pi pi-image" label="Generate Preview Image"
                        :disabled="isVideoProcessing || (formChanged == false && job.status !== 'error')" v-if="!isVideoProcessing"
                        :loading="isPreviewProcessing" class="p-button-outlined p-button-success mb-0 mr-2" />
                    <Button icon="pi pi-video" v-if="!isVideoProcessing && !isJobSketch" label="Generate Preview Animation"
                        @click="$emit('submit:preview', previewFrames)" :loading="isAnimationProcessing"
                        class="p-button-outlined p-button-success mb-0 mr-2"
                        :disabled="isVideoProcessing ||  (formChanged == false && job.status !== 'error')" /> -->
                    <Button icon="pi pi-download" v-if="!isVideoProcessing && isJobReady" class="vimage-yellow p-button-lg p-button-warning mb-0"
                        @click="downloadItem()" label="Download video"
                         :disabled="isVideoProcessing || !isJobReady" />
                        <Button v-if="!isVideoProcessing && !isJobReady" class="vimage-yellow p-button-lg p-button-warning mb-0"
                        @click="$emit('submit:finalize')" label="Generate Video"
                        :loading="isVideoProcessing && job.operation == 'finalize'" :disabled="isVideoProcessing || isJobReady" />
                    <Button icon="pi pi-times-circle" v-if="isVideoProcessing"
                        class="p-button-outlined p-button-warning mb-0" :label="cancelButtonValue"
                        @click="$emit('submit:cancel', true)" />
                </div>
            </div>
        </template>
    </Toolbar>
</template>

<script>
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { mapActions } from 'vuex';
import VideoInfoDialog from './VideoInfoDialog.vue';

export default {
    name: 'VideoEditToolbar',
    watch: {
        'job.status': {
            handler: function (v, o) {
                let s = '';
                let detail = '';

                if (v == 'error') {
                    s = 'error';
                    detail = 'Oopsy, there was a doopsy! ' + this.errorMessage;
                }

                if (s != '') {
                    this.$toast.add({ severity: s, summary: v, detail: detail, life: 5000 });
                }
            },
            immediate: true,
        }
    },
    data() {
        return {
            previewFrames: 15,
        };
    },
    setup() {
        const menu = ref(null);
        const toast = useToast();
        const confirmPopup = useConfirm();
        const infodialog = ref(null);
        return { menu, toast, confirmPopup, infodialog }
    },
    emits: ['submit:preview', 'submit:cancel', 'submit:finalize'],

    props: {
        job: { type: Object, default: { status: '' } },
        formChanged: { type: Boolean, default: false },
        showOriginal: { type: Boolean, default: false }
    },
    computed: {
        isJobSketch() {
            return (this.$props.job.status === 'pending');
        },
        isAnimationProcessing() {
            return this.isVideoProcessing && this.$props.job.operation == 'animation';
        },
        isPreviewProcessing() {
            return this.isVideoProcessing && this.$props.job.operation == 'preview';
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
            return this.$props.job.status !== null && this.$props.job.status.includes('processing');
        },

        isJobApproved() {
            return (this.$props.job.status === 'approved');
        },
        isJobReady() {
            return (this.isJobFinished && this.$props.job.url && this.$props.job.url.length > 0);
        },
        originalUrl() {
            const url = process.env.VUE_APP_VIDEO_PREVIEW_URL;
            return url + this.$props.job.filename;
        },
        hasPreviewImage() {
            return (!this.isJobSketch && this.$props.job.preview_img && this.$props.job.preview_img.length > 0 && (this.$props.job.preview_img.includes('.png') || this.$props.job.preview_img.includes('.gif')));
        },
        hasPreviewAnimation() {
            return (!this.isJobSketch && this.$props.job.preview_animation && this.$props.job.preview_animation.length > 0);
        },
        cancelButtonValue() {
            if (this.$props.job.operation == "preview") {
                return "Cancel preview generation";
            }
            if (this.$props.job.operation == "animation") {
                return "Cancel animation generation";
            }
            if (this.$props.job.operation == "finalize") {
                return "Cancel job";
            }
            return "Cancel job";
        }

    },
    components: {
        VideoInfoDialog
    },
    methods: {
        ...mapActions({
            download: 'videojobs/download',
            finalize: 'videojobs/finalize',
            destroy: 'videojobs/destroy',
        }),
        downloadItem() {
            this.toast.add({ severity: 'info', summary: 'Downloading', detail: 'Download started for '+this.$props.job.original_filename, life: 3000 });
            this.download(this.$props.job);
        },
        openInfoDialog() {
            this.infodialog = true;
        },
        closeInfoDialog() {
            this.infodialog = false;
        },
        toggleMenu(id, event) {

            this.$refs.menu.toggle(event);
            event.stopPropagation();
            return false;
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

        getMenu() {

            const id = this.$props.job.id;
            return [

                {
                    label: 'Delete',
                    icon: 'pi pi-times',

                    command: (target) => {
                        this.confirmPopup.require({
                            message: 'Are you sure you want to delete this?',
                            icon: 'pi pi-exclamation-triangle',
                            target: target.originalEvent.target,
                            accept: () => {
                                this.destroy(id);
                                this.toast.add({ severity: 'info', summary: 'Success!', detail: 'Job deleted!', life: 3000 });
                                this.$router.push('/library');
                            },
                            reject: () => {
                                this.toast.add({ severity: 'info', summary: 'Rejected', detail: 'You no good for this action', life: 3000 });
                            }
                        });
                    }
                },

                {
                    label: 'Download',
                    icon: 'pi pi-download',
                    disabled: this.$props.job.status !== 'finished',
                    command: (target) => {
                        this.downloadItem();
                    }
                }
            ];
        }


    }
}


</script>
<style scoped type="scss">
.video-edit-toolbar {
    background-color: rgb(18 18 18 / 20%);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 5rem;
    z-index: 2;

    button {
        font-weight: bold;
    }
}

.vimage-yellow {
    background-color: #fdc500;
}
</style>
