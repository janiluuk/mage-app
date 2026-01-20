<template>
    <div class="editor">
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
    </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import VideoPlayer from "@/components/videoeditor/VideoPlayer";
import Timeline from "@/components/videoeditor/Timeline";
import EditButtons from "@/components/videoeditor/EditButtons";

export default {
    name: "Editor",
    components: { EditButtons, Timeline, VideoPlayer },
    setup() {
        const store = useStore();
        const mouseDown = ref(false);
        const panel = ref(null);
        const divider = ref(null);

        const playerWidth = computed(() => store.state.videoeditor.player.widthPercent);

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

        onMounted(() => {
            document.addEventListener('mousemove', move, false);
            document.addEventListener('mouseup', endMove, false);
        });

        onBeforeUnmount(() => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', endMove);
        });

        return {
            mouseDown,
            panel,
            divider,
            playerWidth,
            startMove,
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

.top-panel {
    height: 110px;
    width: 100%;
}

.bottom-panel {
    flex-grow: 1;
    display: flex;
    max-height: calc(100% - 110px);
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
    background-color: var(--soft-foreground);
    opacity: 0.2;
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