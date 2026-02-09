<template>
    <div class="editor">
        <VideoInfoHeader class="info-panel" />
        <EditButtons class="top-panel" />
        <div class="bottom-panel" ref="panel">
            <div class="left-panel" :style="{
                width: Math.round(playerWidth * 10000) / 100 + '%',
            }">
                <VideoPlayer />
            </div>
            <div class="divider" @mousedown="startMove">
                <div ref="divider" class="divider-inner"></div>
            </div>
            <div class="right-panel" :style="{
                width: Math.round((1-playerWidth) * 10000) / 100 + '%',
            }">
                <Timeline class="timeline" />
            </div>
        </div>
        <VideoTrimPanel class="trim-panel" @trim-applied="onTrimApplied" @trim-preview="onTrimPreview" />
        <VideoInfoFooter class="footer-panel" />
        <ExportDialog />
        <ExportStatus />
        <SaveProjectDialog 
          v-model:visible="showSaveProjectDialog" 
          @saved="onProjectSaved"
        />
        <LoadProjectDialog 
          v-model:visible="showLoadProjectDialog"
          @loaded="onProjectLoaded"
        />
    </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import VideoPlayer from "@/components/videoeditor/VideoPlayer.vue";
import Timeline from "@/components/videoeditor/Timeline.vue";
import EditButtons from "@/components/videoeditor/EditButtons.vue";
import VideoInfoHeader from "@/components/videoeditor/VideoInfoHeader.vue";
import VideoInfoFooter from "@/components/videoeditor/VideoInfoFooter.vue";
import ExportDialog from "@/components/videoeditor/ExportDialog.vue";
import ExportStatus from "@/components/videoeditor/ExportStatus.vue";
import SaveProjectDialog from "@/components/videoeditor/SaveProjectDialog.vue";
import LoadProjectDialog from "@/components/videoeditor/LoadProjectDialog.vue";
import VideoTrimPanel from "@/components/videoeditor/VideoTrimPanel.vue";

export default {
    name: "Editor",
    components: { 
        EditButtons, 
        Timeline, 
        VideoPlayer, 
        VideoInfoHeader, 
        VideoInfoFooter, 
        ExportDialog, 
        ExportStatus,
        SaveProjectDialog,
        LoadProjectDialog,
        VideoTrimPanel,
    },
    setup() {
        const store = useStore();
        const mouseDown = ref(false);
        const panel = ref(null);
        const divider = ref(null);
        const showSaveProjectDialog = ref(false);
        const showLoadProjectDialog = ref(false);

        // Use user-configured width when it is a positive value; otherwise default to 75% (bigger video display)
        const playerWidth = computed(() => {
          const stored = store.state.videoeditor.player.widthPercent;
          // Only use the stored value if it is a positive number; treat 0 or negative values as invalid and fall back to 0.75
          return stored != null && stored > 0 ? stored : 0.75;
        });

        const startMove = (e) => {
            mouseDown.value = true;
            resize(e);
        };

        const move = (e) => {
            if (mouseDown.value) {
                resize(e);
            }
        };

        const endMove = (e) => {
            if (mouseDown.value) {
                resize(e);
            }
            mouseDown.value = false;
        };

        const resize = (e) => {
            if (!panel.value) return;
            const bounds = panel.value.getBoundingClientRect();
            const x = e.pageX - bounds.left;
            const newWidth = x / bounds.width;
            store.commit('videoeditor/SET_PLAYER_WIDTH', newWidth);
        };

        const handleShowSaveProject = () => {
            showSaveProjectDialog.value = true;
        };

        const handleShowLoadProject = () => {
            showLoadProjectDialog.value = true;
        };

        const onProjectSaved = () => {
            // Project saved successfully
            console.log('Project saved');
        };

        const onProjectLoaded = () => {
            // Project loaded successfully
            console.log('Project loaded');
        };

        const onTrimApplied = (trimData) => {
            console.log('Trim applied:', trimData);
        };

        const onTrimPreview = (trimData) => {
            console.log('Trim preview:', trimData);
        };

        onMounted(() => {
            document.addEventListener('mousemove', move, false);
            document.addEventListener('mouseup', endMove, false);
            window.addEventListener('show-save-project-dialog', handleShowSaveProject);
            window.addEventListener('show-load-project-dialog', handleShowLoadProject);
        });

        onBeforeUnmount(() => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', endMove);
            window.removeEventListener('show-save-project-dialog', handleShowSaveProject);
            window.removeEventListener('show-load-project-dialog', handleShowLoadProject);
        });

        return {
            mouseDown,
            panel,
            divider,
            playerWidth,
            startMove,
            showSaveProjectDialog,
            showLoadProjectDialog,
            onProjectSaved,
            onProjectLoaded,
            onTrimApplied,
            onTrimPreview,
        };
    }
}
</script>

<style scoped>
.editor {
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
}

.info-panel {
    height: auto;
    width: 100%;
    flex-shrink: 0;
}

.top-panel {
    height: 60px;
    width: 100%;
    flex-shrink: 0;
}

.bottom-panel {
    flex-grow: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
}

.trim-panel {
    width: 100%;
    flex-shrink: 0;
}

.footer-panel {
    height: auto;
    width: 100%;
    flex-shrink: 0;
}

.left-panel {
    /*border-right: 1px solid rgba(128, 128, 128, 0.5);*/
    width: 50%;
    min-width:250px;
    z-index: 1;
}

.divider {
    height: 100%;
    padding-left: 7px !important;
    padding-right: 7px !important;
    display: flex;
    margin-left: -7px;
    margin-right: -7px;
    cursor: e-resize;
    z-index: 3;
}

.divider-inner {
    pointer-events: none;
    background-color: var(--surface-border);
    opacity: 0.5;
    height: 100%;
    width: 1px;
}

.right-panel {
    min-width:150px;
    width: 50%;
    max-height: 100%;
    z-index: 1;
}

.timeline {
    width: 100%;
    height: 100%;
}
</style>