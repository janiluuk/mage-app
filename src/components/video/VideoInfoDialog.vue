<template>
        <Dialog header="Video Information" v-bind:visible="infodialog" :breakpoints="{ '960px': '75vw' }"
            :style="{ width: '30vw' }" :modal="true">
            <p class="line-height-3 m-0">
            <table>

                <tr>
                    <td>Filename</td>
                    <td> {{ job.original_filename }}</td>
                </tr>
                <tr>
                    <td>Type</td>
                    <td> {{ job.mimetype ?? 'video/mp4' }}</td>
                </tr>
                <tr>
                    <td>Dimensions</td>
                    <td> {{ job.width }}x{{ job.height }}</td>
                </tr>
                <tr>
                    <td>Bitrate</td>
                    <td> {{ job.bitrate / 1024 | round }} kbps</td>
                </tr>
                <tr>
                    <td>Length</td>
                    <td> {{ getFormattedDuration(job.length) }} </td>
                </tr>
                <tr>
                    <td>Size</td>
                    <td> {{ (job.size/1024/1024).toFixed(2) }} MB</td>
                </tr>

                <tr>
                    <td> Codec</td>
                    <td> {{ job.codec }}</td>
                </tr>
                <tr>
                    <td>FPS</td>
                    <td> {{ job.fps }}</td>
                </tr>
                <tr>
                    <td>Frames</td>
                    <td> {{ job.frame_count }} </td>
                </tr>


                <tr>
                    <td>Audio</td>
                    <td> {{ job.audio_codec }}</td>
                </tr>
                <tr>
                    <td>Created</td>
                    <td> {{ 
                        formatDate(job.created_at) }}</td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td>{{ job.status == 'finished' ? "Finished Job duration: "+ getFormattedDuration(job.job_time) : job.status }}</td>
                </tr>
            </table>
            </p>
            <template #footer>
                <Button label="Ok" @click="$emit('dialog:close', true)" icon="pi pi-check" class="p-button-outlined" />
            </template>
        </Dialog>
</template>

<script>
import moment from 'moment';

export default {
    name: 'VideoInfoDialog',

    data() {
        return {
            previewFrames: 15,
            infodialog: false
        };
    },

    emits: ['dialog:close'],

    props: {
        job: { type: Object, default: { status: '' } },
        infodialog: { type: Boolean, default: false },
    },
    computed: {

    },
    methods: {
        formatDate(date) {
            return moment(date).format('DD.MM.YYYY hh:mm');
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
        }
    }
}


</script>
