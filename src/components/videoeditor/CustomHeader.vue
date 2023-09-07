<template>
   <template>
    <div class="header">
        <div class="left-content">
            <Avatar class="no-drag logo mr-5" size="35" rounded v-ripple @click="goHome">
                <img :src="`img/favicon.png`"></img>
            </Avatar>
            <Button class="no-drag" icon v-if="hasProject">
                <i class="pi pi-file-outline"></i>
                <span>New project</span>
            </Button>
            <Button class="no-drag" icon v-if="!hasProject">
                <i class="pi pi-file-outline"></i>
                <span>Create new project</span>
            </Button>
            <Button class="no-drag" icon v-if="hasProject && !importProjectLoading">
                <i class="pi pi-movie-open-outline"></i>
                <span>Open project</span>
            </Button>
            <Button class="no-drag" icon v-if="hasProject && importProjectLoading">
                <i class="pi pi-spinner pi-spin"></i>
                <span>Importing project...</span>
            </Button>
            <Button class="no-drag" icon v-if="hasProject && !importVideoLoading">
                <i class="pi pi-import"></i>
                <span>Import video</span>
            </Button>
            <Button class="no-drag" icon v-if="hasProject && importVideoLoading">
                <i class="pi pi-spinner pi-spin"></i>
                <span>Importing video...</span>
            </Button>
        </div>
        <div class="center-content">
            <span class="caption" v-if="projectFileName !== ''">
                <span>{{ projectFileName.split('.')[0] }}</span>
                <span class="grey-file">.{{ projectFileName.split('.')[1] }}</span>
                <span class="unsaved" v-if="hasUnsavedAction">*</span>
            </span>
        </div>
        <div class="right-content">
            <Button class="no-drag" icon v-if="status.done && !(isExporting || isUploading) && status.error === ''">
                <i class="pi pi-check"></i>
            </Button>
            <Button class="no-drag" icon v-if="isExporting || isUploading">
                <ProgressBar
                    value="(isUploading ? youtube.progress.percent : exportProgress) * 100"
                    color="red"
                    v-if="isUploading"
                >
                    {{ Math.round((isUploading ? youtube.progress.percent : exportProgress) * 100) }}
                </ProgressBar>
                <ProgressBar
                    value="(isUploading ? youtube.progress.percent : exportProgress) * 100"
                    color="default"
                    v-else
                >
                    {{ Math.round((isUploading ? youtube.progress.percent : exportProgress) * 100) }}
                </ProgressBar>
            </Button>
            <Menu class="no-drag" open-on-hover close-delay="100" offset-y v-if="hasProject">
                <template v-slot:activator="{ on, attrs }">
                    <Button class="no-drag" icon v-bind="attrs" v-on="on">
                        <i class="pi pi-export"></i>
                    </Button>
                </template>
                <MenuItem v-if="!isExporting && !isUploading">
                    <i class="pi pi-movie-outline"></i>
                    <span>Quick export</span>
                </MenuItem>
                <MenuItem v-if="!isExporting && !isUploading">
                    <i class="pi pi-movie-open-outline"></i>
                    <span>Export</span>
                </MenuItem>
                <MenuItem v-if="!isExporting && !isUploading">
                    <i class="pi pi-youtube"></i>
                    <span>Export to YouTube</span>
                </MenuItem>
            </Menu>
    </div>
</template>

<script>
import {mapActions, mapGetters, mapState} from "vuex";
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";

export default {
    name: "CustomHeader",
    components: {PlaybackRateSlider, VolumeSlider},
    data: () => ({}),
    mounted() {

    },
    methods: {
        showExportDialog(youtube = false) {
            if (youtube && !this.isLoggedIn) {
                this.addSnack({text: "You must log in to YouTube before uploading"});
                this.$router.push("/settings");
                return;
            }
            this.$store.commit('ytShow', youtube);
            this.$store.commit('showExportDialog', true);
        },
        goHome() {
            if (this.$route.path !== '/')
                this.$router.push("/");
        },
        ...mapActions([
            'promptVideoInput', 'exportToYouTube', 'exportVideoAs', 'secureClose',
            'promptProjectInput', 'saveProjectAs', 'newProject', 'saveProject', 'addSnack',
        ]),
    },
    watch: {
        '$vuetify.theme.dark'() {
            localStorage.darkTheme = this.$vuetify.theme.dark;
        },
    },
    computed: {
        ...mapGetters(['hasProject', 'projectFileName', 'isExporting', 'exportProgress', 'isUploading', 'isLoggedIn']),
        ...mapState({
            youtube: state => state.youtube,
            activeFragment: state => state.activeFragment,
            importVideoLoading: state => state.loading.videoImport,
            importProjectLoading: state => state.loading.projectImport,
            hasUnsavedAction: state => state.command.hasUnsavedAction,
            status: state => state.exportStatus,
        }),
    },
}
</script>

<style scoped>
.header {
    -webkit-app-region: drag;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0 1em;
}

.no-drag {
    -webkit-app-region: no-drag;
}

.left-content {
    display: flex;
    align-items: center;
}

.logo {
    cursor: pointer;
}

.center-content {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    max-width: calc(100% - 320px - 206px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.grey-file {
    opacity: 0.7;
}

.unsaved {
    color: var(--primary);
}

.fragment-controls {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
}

.close-button:active {
    color: maroon !important;
}
</style>