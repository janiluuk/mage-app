<template>
  <div class="seek" @mousedown="moveStart" ref="seek">
    <div class="seek-background">
      <div class="seek-progress" :style="{
        width: percentage + '%',
      }"></div>
      <div class="seek-thumb" :style="{
        left: `calc(${percentage}% - 0.25em)`,
      }"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { clamp } from '@/utils/videoEditorUtils';

export default {
  name: 'SeekBar',
  setup() {
    const store = useStore();
    const seek = ref(null);
    const seekDown = ref(false);

    const progress = computed(() => store.state.videoeditor.player.progress);

    const percentage = computed(() => {
      const p = Math.round(progress.value * 100000) / 1000;
      return clamp(isNaN(p) ? 0 : p, 0, 100);
    });

    const progressFromEvent = (e) => {
      if (!seek.value) return 0;
      const bounds = seek.value.getBoundingClientRect();
      const x = e.pageX - bounds.left;
      return clamp(x / bounds.width, 0, 1);
    };

    const moveStart = (e) => {
      seekDown.value = true;
      store.dispatch('videoeditor/seek', progressFromEvent(e));
    };

    const move = (e) => {
      if (seekDown.value) {
        store.dispatch('videoeditor/seek', progressFromEvent(e));
      }
    };

    const moveEnd = (e) => {
      if (seekDown.value) {
        store.dispatch('videoeditor/seek', progressFromEvent(e));
      }
      seekDown.value = false;
    };

    onMounted(() => {
      document.addEventListener('mousemove', move, false);
      document.addEventListener('mouseup', moveEnd, false);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', moveEnd);
    });

    return {
      seek,
      percentage,
      moveStart,
    };
  },
};
</script>

<style scoped>
.seek {
  width: 100%;
  padding: 5px 0;
  cursor: pointer;
}

.seek > * {
  pointer-events: none;
}

.seek-background {
  width: 100%;
  height: 0.5em;
  border-radius: 0.15em;
  background-color: var(--surface-ground);
  position: relative;
}

.seek-progress {
  width: 0;
  height: 100%;
  border-bottom-left-radius: 0.15em;
  border-top-left-radius: 0.15em;
  background-color: var(--primary-color);
  opacity: 0.6;
}

.seek-thumb {
  left: 0;
  top: -0.75em;
  position: relative;
  width: 0.5em;
  height: 1em;
  border-radius: 0.15em;
  background-color: var(--primary-color);
}
</style>
