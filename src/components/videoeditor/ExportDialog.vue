<template>
    <Dialog v-model="$store.state.export.showDialog" width="700">
        <Card>
            <Accordions accordion multiple v-model="panel">
                <Accordion :disabled="!youtube.show">
                    <Accordion-header>
                        <div>
                            <i className="pi pi-youtube">
                            YouTube
                        </div>
                    </AccordionTabHeader>
                    <Accordion-content>
                        <InputText
                            label="Title"
                            outlined
                            hide-details="auto"
                            class="mb-4"
                            dense
                            v-model="$store.state.youtube.title">
                        </InputText>
                        <v-textarea
                            rows="3"
                            label="Description"
                            hide-details="auto"
                            outlined
                            dense
                            v-model="$store.state.youtube.description">
                        </v-textarea>
                        <Chip-group color="primary"
                                      mandatory
                                      class="mt-2"
                                      v-model="$store.state.youtube.privacy">
                            <Chip>Public</Chip>
                            <Chip>Unlisted</Chip>
                            <Chip>Private</Chip>
                        </v-chip-group>
                    </AccordionTab>
                </Accordion>
                <Accordion>
                    <Accordion-header>
                        <div>
                            <i className="pi pi-cog">
                            Export settings
                        </div>
                    </AccordionTabHeader>
                    <Accordion-content>
                        <InputText label="Output FPS (optional)"
                                      outlined
                                      dense
                                      hide-details="auto"
                                      class="mb-4"
                                      v-model="$store.state.export.fps"
                                      type="number"></InputText>
                        <Switch v-if="$store.state.export.fps !== ''"
                                  label="Interpolate frames"
                                  inset
                                  dense
                                  class="interpolate-switch"
                                  v-model="$store.state.export.interpolate"></Switch>
                        <InputText label="Video bitrate (MB/s, optional)"
                                      outlined
                                      dense
                                      v-model="$store.state.export.bitrate"
                                      hide-details="auto"
                                      type="number"></InputText>
                        <Switch v-model="$store.state.export.customResolution"
                                  inset
                                  dense
                                  label="Change output resolution"></Switch>
                        <div class="resolution mb-2">
                            <InputText label="Width"
                                          outlined
                                          :disabled="!$store.state.export.customResolution"
                                          dense
                                          class="mr-2"
                                          hide-details="auto"
                                          v-model="exportWidth"
                                          type="number"></InputText>
                            <InputText label="Height"
                                          :disabled="!$store.state.export.customResolution"
                                          outlined
                                          class="ml-2"
                                          dense
                                          hide-details="auto"
                                          v-model="exportHeight"
                                          type="number"></InputText>
                        </div>
                    </AccordionTab>
                </Accordion>
                <Accordion>
                    <Accordion-header>
                        <div>
                            <i className="pi pi-movie-filter-outline">
                            Advanced options
                        </div>
                    </AccordionTabHeader>
                    <Accordion-content>
                        <Chip-group class="chip-group" show-arrows>
                            <Chip @click="editFilter(filter)"
                                    color="secondary"
                                    :close="true"
                                    class="mb-2"
                                    @click:close="removeFilter(filter)"
                                    v-for="filter in selectedFilters">
                                {{ filter.name }}{{ filter.options === '' ? '' : '=' }}{{ filter.options }}
                            </Chip>
                        </v-chip-group>
                        <advanced-export-options></advanced-export-options>
                    </AccordionTab>
                </Accordion>
            </v-expansion-panels>

            <Divider></Divider>
            <Card-actions>
                <v-spacer></v-spacer>
                <Button text @click="cancel">
                    Cancel
                </Button>
                <Button color="primary" text @click="confirm">
                    {{ youtube.show ? 'Upload' : 'Export' }}
                </Button>
            </CardActions>
        </Card>
    </Dialog>
</template>

<script>
import {mapActions, mapState} from "vuex";
import path from 'path'
import AdvancedExportOptions from "@/components/AdvancedExportOptions";

export default {
    name: "ExportDialog",
    components: {AdvancedExportOptions},
    data: () => ({
        pathRules: [
            v => path.isAbsolute(v) || 'Must be a valid path',
        ],
        panel: [0, 1],
    }),
    mounted() {

    },
    methods: {
        async editFilter(filter) {
            let {confirmed, value} = await this.showTextPrompt({
                title: `Edit options for filter: ${filter.name}`,
                value: filter.options,
            });

            if (confirmed) {
                filter.options = value;
            }
        },
        removeFilter(filter) {
            this.$store.commit('removeExportFilter', filter);
        },
        cancel() {
            this.$store.commit('showExportDialog', false);
        },
        async confirm() {
            if (this.youtube.show) {
                this.exportToYouTube();
                this.$store.commit('showExportDialog', false);
            } else {
                let canceled = await this.exportVideoAs();
                if (!canceled)
                    this.$store.commit('showExportDialog', false);
            }
        },
        ...mapActions(['promptVideoExport', 'showTextPrompt', 'exportVideoAs', 'exportToYouTube']),
    },
    watch: {
        'export.showDialog'() {
            if (this.export.showDialog) {
                if (this.youtube.show)
                    this.panel = [0];
                else
                    this.panel = [1];
            }
        },
    },
    computed: {
        exportHeight: {
            get: function () {
                let state = this.$store.state;
                return state.export.customResolution ?
                    state.export.height :
                    state.activeFragment?.video?.height;
            },
            set: function (height) {
                if (this.$store.state.export.customResolution) {
                    this.$store.commit('customHeight', height);
                }
            },
        },
        exportWidth: {
            get: function () {
                let state = this.$store.state;
                return state.export.customResolution ?
                    state.export.width :
                    state.activeFragment?.video?.width;
            },
            set: function (width) {
                if (this.$store.state.export.customResolution) {
                    this.$store.commit('customWidth', width);
                }
            },
        },
        ...mapState({
            outputPath: state => state.export.outputPath,
            selectedFilters: state => state.export.filters,
            youtube: state => state.youtube,
            export: state => state.export,
        }),
    },
}
</script>

<style scoped>
.card-content {
    padding: 24px;
}

.output-path {
    display: flex;
    align-items: center;
}

.output-path > p {
    width: 100%;
    margin-bottom: 0;
    font-size: 15px;
    box-shadow: inset 0 0 0 2px var(--softer-background);
    padding: 8px 15px;
    border-radius: 3px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.interpolate-switch {
    margin-top: -10px;
}

.resolution {
    display: flex;
    align-items: center;
}

.resolution > p {
    vertical-align: middle;
    margin: 0 15px;
    margin-bottom: 25px;
}

.actions {
    display: flex;
    align-items: center;
}

.chip-group {
    max-width: 100%;
}
</style>