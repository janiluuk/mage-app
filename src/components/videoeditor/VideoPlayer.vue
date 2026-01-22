<template>
  <div class="player" ref="player">
    <div ref="videosContainer" class="videos" :style="{ height: maxVideoHeight + 'px' }">
      <video
        v-for="videoFile in videoFiles"
        :key="videoFile.videoUrl"
        :id="videoFile.videoUrl"
        v-show="!isAudio"
        :src="videoFile.videoUrl"
        :style="{
          width: videoWidth + 'px',
          height: videoHeight(videoFile) + 'px',
          visibility: videoFile === activeFragment?.video && !isAudio ? 'visible' : 'hidden',
        }"
        @canplay.once="canPlay"
        @ended="playNextFragment"
        crossorigin="anonymous"
      ></video>
      <canvas v-show="isAudio" ref="audioCanvas"></canvas>
    </div>
    <div class="controls" :class="{ fullscreen }">
      <div
        v-if="videoFiles.length > 0"
        class="time-control"
        :style="{ pointerEvents: activeFragment?.video?.canPlay ? 'all' : 'none' }"
      >
        <SeekBar class="seek-bar" />
        <span class="seek-time">{{ toHms(progress * fullDuration) }} / {{ toHms(fullDuration) }}</span>
      </div>
      <div v-if="videoFiles.length > 0" class="playback-controls">
        <div v-if="!fullscreen" class="volume-control">
          <Button
            :icon="true"
            text
            @click="toggleVolumePanel"
          >
            <i :class="'pi ' + volumeIcon" />
          </Button>
          <OverlayPanel ref="volumePanel">
            <div class="volume-panel-content">
              <Slider
                v-model="playerVolumeValue"
                :min="0"
                :max="1"
                :step="0.01"
                class="player-volume"
                @update:modelValue="updateVolume"
              />
            </div>
          </OverlayPanel>
        </div>
        <div class="spacer"></div>
        <div class="center-controls">
          <Button
            :icon="true"
            :disabled="!activeFragment?.video?.canPlay || !canSkipFrameLeft"
            @click="skipFrames(-1)"
          >
            <i class="pi pi-step-backward" />
          </Button>
          <Button
            :icon="true"
            size="large"
            @click="togglePlay"
            :loading="!activeFragment?.video?.canPlay"
          >
            <i v-if="playing" class="pi pi-pause" />
            <i v-else class="pi pi-play" />
          </Button>
          <Button
            :icon="true"
            :disabled="!activeFragment?.video?.canPlay || !canSkipFrameRight"
            @click="skipFrames(1)"
          >
            <i class="pi pi-step-forward" />
          </Button>
        </div>
        <div class="spacer"></div>
        <div class="right-controls">
          <Button :icon="true" @click="toggleFullScreen">
            <i class="pi pi-window-maximize" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import SeekBar from './SeekBar.vue';

export default {
  name: 'VideoPlayer',
  components: { SeekBar },
  setup() {
    const store = useStore();
    const player = ref(null);
    const videosContainer = ref(null);
    const audioCanvas = ref(null);
    const volumePanel = ref(null);
    const bounds = ref(null);
    const timeInterval = ref(null);
    const animationFrame = ref(null);
    const prevVolume = ref(1);
    const canvas = ref(null);
    const context = ref(null);
    const cachedPrimaryColor = ref('#007bff'); // Default fallback

    const videoFiles = computed(() => store.state.videoeditor.videoFiles);
    const activeFragment = computed(() => store.state.videoeditor.activeFragment);
    const progress = computed(() => store.state.videoeditor.player.progress);
    const playing = computed(() => store.state.videoeditor.player.playing);
    const playerVolume = computed(() => store.state.videoeditor.player.volume);
    const fullscreen = computed(() => store.state.videoeditor.player.fullscreen);
    const fullDuration = computed(() => store.getters['videoeditor/fullDuration']);
    const toHms = computed(() => store.getters['videoeditor/toHms']);
    const canSkipFrameLeft = computed(() => store.getters['videoeditor/canSkipFrameLeft']);
    const canSkipFrameRight = computed(() => store.getters['videoeditor/canSkipFrameRight']);
    const isAudio = computed(() => store.getters['videoeditor/isAudio']);
    const progressAtFragmentProgress = computed(() => store.getters['videoeditor/progressAtFragmentProgress']);

    const videoWidth = computed(() => {
      if (!bounds.value) return 0;
      return bounds.value.width;
    });

    const maxVideoHeight = computed(() => {
      if (!videoFiles.value.length) return 0;
      const maxRatio = videoFiles.value
        .filter(v => !v.isAudio)
        .reduce((a, b) => Math.min(a, b.aspectRatio), 2);
      return videoWidth.value / maxRatio;
    });

    const playerVolumeValue = computed({
      get: () => playerVolume.value,
      set: (value) => store.commit('videoeditor/SET_PLAYER_VOLUME', value)
    });

    const volumeIcon = computed(() => {
      if (playerVolume.value === 0) return 'pi-volume-off';
      if (playerVolume.value < 0.5) return 'pi-volume-down';
      return 'pi-volume-up';
    });

    const videoHeight = (video) => {
      return videoWidth.value / video.aspectRatio;
    };

    const resizeCanvas = () => {
      if (canvas.value) {
        canvas.value.width = videoWidth.value;
        canvas.value.height = maxVideoHeight.value;
      }
    };

    const visualizeAudio = () => {
      animationFrame.value = requestAnimationFrame(visualizeAudio);
      if (!isAudio.value || !canvas.value || !context.value || !activeFragment.value) return;

      context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

      const video = activeFragment.value.video;
      if (!video.analyser || !video.dataArray) return;

      video.analyser.getByteTimeDomainData(video.dataArray);
      const bufferLength = video.analyser.frequencyBinCount;

      context.value.lineWidth = 2;
      // Use cached CSS variable for primary color
      context.value.strokeStyle = cachedPrimaryColor.value;
      context.value.beginPath();

      const sliceWidth = canvas.value.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = video.dataArray[i] / 128.0;
        const y = v * canvas.value.height / 2;

        if (i === 0) {
          context.value.moveTo(x, y);
        } else {
          context.value.lineTo(x, y);
        }

        x += sliceWidth;
      }

      context.value.lineTo(canvas.value.width, canvas.value.height / 2);
      context.value.stroke();
    };

    const toggleMute = () => {
      if (playerVolume.value > 0) {
        prevVolume.value = playerVolume.value;
        store.commit('videoeditor/SET_PLAYER_VOLUME', 0);
      } else {
        store.commit('videoeditor/SET_PLAYER_VOLUME', prevVolume.value);
      }
    };

    const toggleVolumePanel = (event) => {
      if (volumePanel.value) {
        volumePanel.value.toggle(event, event.currentTarget);
      }
    };

    const updateVolume = (value) => {
      store.commit('videoeditor/SET_PLAYER_VOLUME', value);
    };

    const toggleFullScreen = async () => {
      if (fullscreen.value) {
        try {
          await document.exitFullscreen();
          store.commit('videoeditor/SET_PLAYER_FULLSCREEN', false);
        } catch (e) {
          console.warn('Exiting fullscreen failed:', e);
        }
      } else {
        try {
          await player.value.requestFullscreen();
          store.commit('videoeditor/SET_PLAYER_FULLSCREEN', true);
        } catch (e) {
          console.warn('Fullscreen failed:', e);
        }
      }
      windowResize();
    };

    const canPlay = (e) => {
      const video = videoFiles.value.find(v => v.videoUrl === e.target.getAttribute('id'));
      if (video) {
        video.emit('canplay');
      }
      if (activeFragment.value) {
        activeFragment.value.reset();
      }
    };

    const togglePlay = () => {
      if (playing.value) {
        store.dispatch('videoeditor/pause');
      } else {
        store.dispatch('videoeditor/play');
      }
    };

    const skipFrames = (frames) => {
      store.dispatch('videoeditor/skipFrames', frames);
    };

    const playNextFragment = () => {
      store.dispatch('videoeditor/playNextFragment', true);
    };

    const windowResize = () => {
      if (player.value) {
        bounds.value = player.value.getBoundingClientRect();
        resizeCanvas();
      }
    };

    onMounted(() => {
      // Cache the primary color from CSS variable
      cachedPrimaryColor.value = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color')
        .trim() || '#007bff';

      if (audioCanvas.value) {
        canvas.value = audioCanvas.value;
        context.value = canvas.value.getContext('2d');
        animationFrame.value = requestAnimationFrame(visualizeAudio);
      }

      store.commit('videoeditor/SET_VIDEOS_CONTAINER', videosContainer.value);
      windowResize();
      window.addEventListener('resize', windowResize, false);

      // Update progress and playing state using requestAnimationFrame for better performance
      const updateProgress = () => {
        if (activeFragment.value?.video?.element) {
          const activeVideo = activeFragment.value.video.element;
          store.commit('videoeditor/SET_PLAYER_PLAYING', !activeVideo.paused);

          const fragmentProgress = activeFragment.value.progress;
          const overallProgress = progressAtFragmentProgress.value({
            fragment: activeFragment.value,
            progress: fragmentProgress,
          });

          if (!isNaN(overallProgress)) {
            store.commit('videoeditor/SET_PLAYER_PROGRESS', overallProgress);
          }

          if (fragmentProgress >= 1) {
            playNextFragment();
          }

          // Update playback rate
          if (activeVideo.playbackRate !== activeFragment.value.playbackRate) {
            activeVideo.playbackRate = activeFragment.value.playbackRate;
          }

          // Update volume
          const gainNode = activeFragment.value.video.gainNode;
          if (gainNode) {
            const updatedGain = activeFragment.value.volume * playerVolume.value;
            if (gainNode.gain.value !== updatedGain) {
              gainNode.gain.value = updatedGain;
            }
          }
        }
        
        // Continue the animation loop
        timeInterval.value = requestAnimationFrame(updateProgress);
      };
      
      // Start the animation loop
      timeInterval.value = requestAnimationFrame(updateProgress);
    });

    onBeforeUnmount(() => {
      if (timeInterval.value) {
        cancelAnimationFrame(timeInterval.value);
      }
      window.removeEventListener('resize', windowResize);
      store.commit('videoeditor/SET_VIDEOS_CONTAINER', null);
      if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value);
      }
    });

    watch(fullscreen, async (isFullscreen) => {
      if (isFullscreen) {
        try {
          await player.value?.requestFullscreen();
        } catch (e) {
          console.warn('Fullscreen failed:', e);
        }
      } else {
        try {
          await document.exitFullscreen();
        } catch (e) {
          console.warn('Exiting fullscreen failed:', e);
        }
      }
      windowResize();
    });

    watch(activeFragment, (fragment, previousFragment) => {
      if (!previousFragment || !fragment) return;
      if (fragment.video !== previousFragment.video) {
        const wasPaused = previousFragment.video.element?.paused;
        previousFragment.reset();
        if (!wasPaused && fragment.video.element) {
          fragment.video.element.play().catch(console.error);
        }
      }
    });

    return {
      player,
      videosContainer,
      audioCanvas,
      volumePanel,
      videoFiles,
      activeFragment,
      progress,
      playing,
      playerVolume,
      playerVolumeValue,
      fullscreen,
      fullDuration,
      toHms,
      canSkipFrameLeft,
      canSkipFrameRight,
      isAudio,
      videoWidth,
      maxVideoHeight,
      volumeIcon,
      videoHeight,
      toggleMute,
      toggleVolumePanel,
      updateVolume,
      toggleFullScreen,
      canPlay,
      togglePlay,
      skipFrames,
      playNextFragment,
    };
  },
};
</script>

<style scoped>
.player {
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.player video {
  width: 100%;
  position: absolute;
}

.videos {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
}

.controls {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.controls.fullscreen {
  position: fixed;
  width: 100%;
  z-index: 4;
  bottom: 0;
  background-image: linear-gradient(0deg, var(--surface-ground) 0%, transparent 150%);
}

.time-control {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.seek-bar {
  flex: 1;
}

.seek-time {
  white-space: nowrap;
  font-size: 12px;
  padding-left: 10px;
  color: var(--text-color-secondary);
  opacity: 0.8;
}

.playback-controls {
  display: flex;
  place-content: center;
  align-items: center;
  gap: 10px;
}

.spacer {
  flex: 1;
}

.center-controls {
  display: flex;
  gap: 5px;
  align-items: center;
}

.right-controls {
  display: flex;
  align-items: center;
}

.volume-panel-content {
  padding: 20px;
  min-width: 200px;
}

.player-volume {
  width: 150px;
}
</style>
