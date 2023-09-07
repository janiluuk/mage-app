<template>
    <Dialog v-model="$store.state.exportStatus.show" width="700">
        <Card :loading="true">
            <template slot="progress">
                <v-progress-linear
                    v-if="status.error !== ''"
                    color="warning"
                    :value="100"
                ></v-progress-linear>
                <v-progress-linear
                    :indeterminate="exportProgress <= 0"
                    v-else-if="isExporting || (status.done && !status.youtube) || youtube.done"
                    color="success"
                    :value="exportProgress * 100"
                ></v-progress-linear>
                <v-progress-linear
                    :indeterminate="exportProgress <= 0"
                    v-else-if="isUploading"
                    color="red"
                    :value="youtube.progress.percent * 100"
                ></v-progress-linear>
            </template>
            <Card-title v-if="isUploading">
                2/2 - Uploading video
            </CardTitle>
            <Card-title v-else-if="isExporting">
                {{ status.youtube ? '1/2 - ' : '' }}Exporting video
            </CardTitle>
            <Card-title v-else-if="status.error !== ''">
                <i className="pi pi-alert-outline">
                An error occurred during video export!
            </CardTitle>
            <Card-title v-else-if="status.youtube">
                <i className="pi pi-check">
                Video upload complete!
            </CardTitle>
            <Card-title v-else>
                <i className="pi pi-check">
                Video export complete!
            </CardTitle>
            <Card-subtitle v-if="!status.youtube">
                {{ outputPath }}
            </v-card-subtitle>
            <Card-text v-if="isUploading || isExporting">
                {{ speed }}
            </CardText>
            <div v-if="status.error !== ''">
                <Card-text class="error--text">
                    {{ status.error }}
                </CardText>
                <Divider></Divider>
            </div>
            <perfect-scrollbar class="output" v-if="status.output.length > 0">
                <Accordions>
                    <Accordion>
                        <Accordion-header>Show details</AccordionTabHeader>
                        <Accordion-content>
                            <p class="output-line" v-for="line in status.output">{{ line }}</p>
                        </AccordionTab>
                    </Accordion>
                </v-expansion-panels>
            </perfect-scrollbar>
            <Divider></Divider>
            <Card-actions>
                <v-spacer></v-spacer>
                <Button text color="error" @click="abort" v-if="(isUploading || isExporting) && status.error === ''">
                    Abort
                </Button>
                <Button text @click="dismiss" v-else-if="status.error !== ''">
                    Dismiss
                </Button>
                <div v-else-if="!status.youtube">
                    <Tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <Button class="mr-2" icon @click="openFolder(outputPath)"
                                   v-bind="attrs"
                                   v-on="on">
                                <i className="pi pi-folder-outline">
                            </Button>
                        </template>
                        <span>Open containing folder</span>
                    </Tooltip>
                    <Tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <Button class="mr-6" icon @click="openFile(outputPath)"
                                   v-bind="attrs"
                                   v-on="on">
                                <i className="pi pi-play">
                            </Button>
                        </template>
                        <span>Open video</span>
                    </Tooltip>
                    <Button text @click="dismiss">
                        Dismiss
                    </Button>
                </div>
                <div v-else>
                    <Tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                            <Button class="mr-2" icon
                                   @click="openFile(youtube.url)"
                                   v-bind="attrs"
                                   color="red"
                                   v-on="on">
                                <i className="pi pi-youtube">
                            </Button>
                        </template>
                        <span>Open on YouTube</span>
                    </Tooltip>
                    <Button text @click="dismiss">
                        Dismiss
                    </Button>
                </div>
            </CardActions>
        </Card>
    </Dialog>
</template>

<script>
import {mapActions, mapGetters, mapState} from "vuex";
import Utils from "@/js/Utils";

export default {
    name: "ExportStatus",
    data: () => ({}),
    methods: {
        dismiss() {
            this.$store.commit('showExportStatus', false);
        },
        abort() {
            if (this.isExporting) {
                this.status.command.kill();
            } else if (this.isUploading) {
                this.cancelUpload();
            }
        },
        ...mapActions(['openFile', 'cancelUpload', 'openFolder', 'showTextPrompt', 'resetYouTubeStatus', 'resetExportStatus']),
    },
    watch: {
        'status.show'() {
            if (!this.status.show && this.status.error !== '') {
                // when dismissing error, reset status stuff
                this.resetYouTubeStatus();
                this.resetExportStatus();
            }
        },
    },
    computed: {
        speed() {
            if (this.isUploading) {
                let uploaded = Utils.readableBytes(this.youtube.progress.uploaded);
                let total = Utils.readableBytes(this.youtube.progress.total);
                return `Uploaded: ${uploaded} / ${total}`;
            } else if (this.isExporting) {
                let time = this.status.progress.timemark?.substr(3) ?? '00:00.00';
                return `Exported: ${time} / ${this.toHms(this.fullDuration)}`;
            }
            return '';
        },
        ...mapGetters(['exportProgress', 'isExporting', 'isUploading', 'fullDuration', 'toHms']),
        ...mapState({
            status: state => state.exportStatus,
            outputPath: state => state.export.outputPath,
            youtube: state => state.youtube,
        }),
    },
}
</script>

<style scoped>
.output {
    max-height: 500px;
    overflow-y: auto;
}

.output-line {
    margin: 0 10px;
    font-size: 13px;
    opacity: 0.8;
    font-family: monospace;
}
</style>