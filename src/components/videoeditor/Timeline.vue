<template>
  <div class="timeline" ref="timeline">
    <div class="timeline-inner">
      <div
        v-for="(fragment, i) in timelineFragments"
        :key="fragment.id"
        :title="fragment.video.fileName"
        class="fragment"
        :class="{
          active: fragment === activeFragment,
          audio: fragment.video.isAudio,
        }"
        :style="{
          width: fragmentWidth(fragment) + 'px',
        }"
        @mousedown="moveStart($event, i)"
      >
        <div class="visual-fragment">
          <div
            v-if="!fragment.video.isAudio"
            class="fragment-background"
          >
            {{ fragment.video.fileName }}
          </div>
          <div v-else class="audio-wave">
            Audio
          </div>
        </div>
        <div
          v-if="fragment === activeFragment"
          class="seek-thumb"
          :style="{
            left: seekPosition(fragment) + 'px',
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'Timeline',
  setup() {
    const store = useStore();
    const timeline = ref(null);
    const bounds = ref(null);
    const fragmentIndex = ref(false);

    const timelineFragments = computed(() => store.state.videoeditor.timeline);
    const activeFragment = computed(() => store.state.videoeditor.activeFragment);
    const widthPerSecond = computed(() => store.state.videoeditor.configTimeline.widthPerSecond);
    const minFragmentWidth = computed(() => store.state.videoeditor.configTimeline.minFragmentWidth);
    const progress = computed(() => store.state.videoeditor.player.progress);

    const fragmentWidth = (fragment) => {
      const pixelWidth = Math.max(
        fragment.adjustedDuration * widthPerSecond.value,
        minFragmentWidth.value
      );
      return pixelWidth;
    };

    const fullDuration = computed(() => {
      return timelineFragments.value.reduce((sum, fragment) => {
        return sum + fragment.adjustedDuration;
      }, 0);
    });

    const seekPosition = (fragment) => {
      if (!fragment || fragment !== activeFragment.value) return 0;
      
      // Calculate the position within the active fragment
      const fragmentStartOverall = timelineFragments.value
        .slice(0, timelineFragments.value.indexOf(fragment))
        .reduce((sum, f) => sum + f.adjustedDuration, 0);
      
      const currentPlayTime = progress.value * fullDuration.value;
      const positionInFragment = currentPlayTime - fragmentStartOverall;
      
      // Only show seek thumb if we're within the fragment's time range
      if (positionInFragment < 0 || positionInFragment > fragment.adjustedDuration) {
        return 0;
      }
      
      const width = fragmentWidth(fragment);
      const positionRatio = positionInFragment / fragment.adjustedDuration;
      return positionRatio * width;
    };

    const moveStart = (e, fragmentIndex) => {
      if (e.button !== 0) return; // Only handle left mouse button
      e.stopPropagation();
      
      const fragment = timelineFragments.value[fragmentIndex];
      if (!fragment) return;
      
      // Set the fragment as active
      store.dispatch('videoeditor/setActiveFragment', fragment);
      
      // Calculate click position within the fragment
      const fragmentElement = e.currentTarget;
      const fragmentRect = fragmentElement.getBoundingClientRect();
      const clickX = e.clientX - fragmentRect.left;
      const width = fragmentWidth(fragment);
      
      // Calculate position ratio (0-1)
      const positionRatio = Math.max(0, Math.min(1, clickX / width));
      
      // Calculate the overall timeline position
      const fragmentStartOverall = timelineFragments.value
        .slice(0, fragmentIndex)
        .reduce((sum, f) => sum + f.adjustedDuration, 0);
      
      const positionInFragment = positionRatio * fragment.adjustedDuration;
      const overallPosition = fragmentStartOverall + positionInFragment;
      
      // Seek to the calculated position
      const progressValue = fullDuration.value > 0 ? overallPosition / fullDuration.value : 0;
      store.dispatch('videoeditor/seek', Math.max(0, Math.min(1, progressValue)));
    };

    const windowResize = () => {
      if (timeline.value) {
        bounds.value = timeline.value.getBoundingClientRect();
      }
    };

    onMounted(() => {
      windowResize();
      window.addEventListener('resize', windowResize, false);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', windowResize);
    });

    watch(widthPerSecond, () => {
      windowResize();
    });

    watch(timelineFragments, () => {
      windowResize();
    });

    return {
      timeline,
      timelineFragments,
      activeFragment,
      fragmentWidth,
      seekPosition,
      moveStart,
    };
  },
};
</script>

<style scoped>
.timeline {
  max-height: 100%;
  padding: 10px;
  overflow-y: auto;
  overflow-x: auto;
}

.timeline-inner {
  display: flex;
  gap: 10px;
  min-height: 125px;
}

.fragment {
  height: 125px;
  display: inline-block;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--surface-border);
  transition: box-shadow 0.3s, background-color 0.2s;
  position: relative;
  background-color: var(--surface-card);
  min-width: 90px;
}

.fragment:hover {
  background-color: var(--surface-hover);
}

.fragment.active {
  box-shadow: inset 0 0 0 2px var(--primary-color);
  background-color: var(--surface-hover);
}

.visual-fragment {
  width: 100%;
  height: 105px;
  display: flex;
  flex-direction: column;
}

.fragment-background {
  width: 100%;
  min-height: 80px;
  background-color: var(--surface-ground);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-color-secondary);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.audio-wave {
  width: 100%;
  min-height: 105px;
  background-color: var(--surface-ground);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-color-secondary);
}

.seek-thumb {
  width: 4px;
  height: 105px;
  position: absolute;
  top: 10px;
  background-color: var(--primary-color);
  box-shadow: 0 0 10px 0 var(--primary-color);
  border-radius: 2px;
  pointer-events: none;
  opacity: 0.8;
}
</style>
