<template>
  <div class="preview-player" ref="containerEl">
    <!-- Video Canvas -->
    <div class="preview-viewport" :style="viewportStyle">
      <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" class="preview-canvas" />
      <!-- Text overlay rendering -->
      <div
        v-for="overlay in visibleOverlays"
        :key="overlay.id"
        class="text-overlay"
        :style="overlayStyle(overlay)"
      >
        {{ overlay.text }}
      </div>
    </div>

    <!-- Transport controls -->
    <div class="transport-bar">
      <div class="flex align-items-center gap-2">
        <Button icon="pi pi-step-backward" class="p-button-text p-button-sm" @click="goToStart" />
        <Button
          :icon="isPlaying ? 'pi pi-pause' : 'pi pi-play'"
          class="p-button-rounded p-button-sm"
          @click="togglePlay"
        />
        <Button icon="pi pi-step-forward" class="p-button-text p-button-sm" @click="goToEnd" />
      </div>

      <div class="time-display">
        <span class="font-mono text-sm">{{ formatTime(currentTime) }}</span>
        <span class="text-500 mx-1">/</span>
        <span class="font-mono text-sm text-500">{{ formatTime(totalDuration) }}</span>
      </div>

      <div class="flex align-items-center gap-2">
        <Tag :value="fps + ' fps'" severity="info" class="text-xs" />
        <Dropdown
          v-model="previewQuality"
          :options="qualityOptions"
          optionLabel="label"
          optionValue="value"
          class="quality-dropdown"
          placeholder="Quality"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dropdown from 'primevue/dropdown';

export default {
  name: 'PreviewPlayer',
  components: { Button, Tag, Dropdown },
  props: {
    clips: { type: Array, default: () => [] },
    overlays: { type: Array, default: () => [] },
    transitions: { type: Array, default: () => [] },
    fps: { type: Number, default: 30 },
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 },
  },
  emits: ['time-update', 'play', 'pause', 'seek'],
  setup(props, { emit }) {
    const canvas = ref(null);
    const containerEl = ref(null);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const previewQuality = ref('medium');
    let animationFrame = null;
    let lastFrameTime = 0;

    // Video elements pool for each clip
    const videoElements = ref(new Map());

    const qualityOptions = [
      { label: 'Low (256p)', value: 'low' },
      { label: 'Medium (512p)', value: 'medium' },
      { label: 'High (1024p)', value: 'high' },
    ];

    const canvasWidth = computed(() => {
      const scales = { low: 256, medium: 512, high: 1024 };
      return scales[previewQuality.value] || 512;
    });

    const canvasHeight = computed(() => {
      return Math.round(canvasWidth.value * (props.height / props.width));
    });

    const viewportStyle = computed(() => ({
      aspectRatio: `${props.width} / ${props.height}`,
    }));

    const totalDuration = computed(() => {
      if (props.clips.length === 0) return 0;
      let dur = 0;
      for (const clip of props.clips) {
        dur += (clip.endTime || clip.duration || 0) - (clip.startTime || 0);
      }
      // Subtract transition overlaps
      for (const trans of props.transitions) {
        dur -= trans.duration || 0;
      }
      return Math.max(0, dur);
    });

    const visibleOverlays = computed(() => {
      const t = currentTime.value;
      return props.overlays.filter(
        (o) => t >= (o.startTime || 0) && t <= (o.startTime || 0) + (o.duration || 5)
      );
    });

    function overlayStyle(overlay) {
      const t = currentTime.value;
      const start = overlay.startTime || 0;
      const dur = overlay.duration || 5;
      const progress = Math.min(1, Math.max(0, (t - start) / dur));
      const animIn = overlay.animationIn || 'none';
      const animOut = overlay.animationOut || 'none';

      let opacity = 1;
      let transform = '';
      const fadeInDur = 0.2;
      const fadeOutDur = 0.2;

      // Entrance animation (first 20% of duration)
      if (progress < fadeInDur) {
        const p = progress / fadeInDur;
        if (animIn === 'fade') opacity = p;
        else if (animIn === 'slide-up') transform = `translateY(${(1 - p) * 30}px)`;
        else if (animIn === 'slide-down') transform = `translateY(${-(1 - p) * 30}px)`;
        else if (animIn === 'slide-left') transform = `translateX(${(1 - p) * 50}px)`;
        else if (animIn === 'slide-right') transform = `translateX(${-(1 - p) * 50}px)`;
        else if (animIn === 'zoom') transform = `scale(${0.5 + p * 0.5})`;
        if (animIn !== 'none' && animIn !== 'fade') opacity = p;
      }

      // Exit animation (last 20% of duration)
      if (progress > 1 - fadeOutDur) {
        const p = (1 - progress) / fadeOutDur;
        if (animOut === 'fade') opacity = p;
        else if (animOut === 'slide-up') transform = `translateY(${-(1 - p) * 30}px)`;
        else if (animOut === 'slide-down') transform = `translateY(${(1 - p) * 30}px)`;
        else if (animOut !== 'none') opacity = p;
      }

      return {
        position: 'absolute',
        left: (overlay.x || 50) + '%',
        top: (overlay.y || 50) + '%',
        transform: `translate(-50%, -50%) ${transform}`,
        opacity,
        fontSize: (overlay.fontSize || 24) + 'px',
        color: overlay.color || '#ffffff',
        fontWeight: overlay.bold ? 'bold' : 'normal',
        fontStyle: overlay.italic ? 'italic' : 'normal',
        textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        transition: 'opacity 0.05s',
      };
    }

    // Render the current frame to canvas
    function renderFrame() {
      if (!canvas.value) return;
      const ctx = canvas.value.getContext('2d');
      const w = canvasWidth.value;
      const h = canvasHeight.value;

      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);

      // Find which clip should be playing at currentTime
      const { clipIndex, localTime } = getClipAtTime(currentTime.value);

      if (clipIndex >= 0 && clipIndex < props.clips.length) {
        const clip = props.clips[clipIndex];
        const videoEl = videoElements.value.get(clip.id);

        if (videoEl && videoEl.readyState >= 2) {
          ctx.drawImage(videoEl, 0, 0, w, h);
        } else {
          // Placeholder for clip
          ctx.fillStyle = '#2a2a4a';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(clip.name || `Clip ${clipIndex + 1}`, w / 2, h / 2 - 10);
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#aaaaaa';
          ctx.fillText(`${formatTime(localTime)}`, w / 2, h / 2 + 15);
        }

        // Check for transition
        const transIdx = getTransitionAtTime(currentTime.value);
        if (transIdx >= 0 && transIdx < props.transitions.length) {
          const trans = props.transitions[transIdx];
          const nextClipIndex = clipIndex + 1;
          if (nextClipIndex < props.clips.length) {
            const nextClip = props.clips[nextClipIndex];
            const nextVideoEl = videoElements.value.get(nextClip.id);
            const transProgress = getTransitionProgress(currentTime.value, transIdx);

            if (trans.type === 'crossfade') {
              ctx.globalAlpha = transProgress;
              if (nextVideoEl && nextVideoEl.readyState >= 2) {
                ctx.drawImage(nextVideoEl, 0, 0, w, h);
              }
              ctx.globalAlpha = 1;
            } else if (trans.type === 'wipe-left') {
              const wipeX = w * transProgress;
              if (nextVideoEl && nextVideoEl.readyState >= 2) {
                ctx.drawImage(nextVideoEl, 0, 0, wipeX, h, 0, 0, wipeX, h);
              }
            } else if (trans.type === 'fade-black') {
              if (transProgress < 0.5) {
                ctx.fillStyle = `rgba(0,0,0,${transProgress * 2})`;
                ctx.fillRect(0, 0, w, h);
              } else {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, w, h);
                ctx.globalAlpha = (transProgress - 0.5) * 2;
                if (nextVideoEl && nextVideoEl.readyState >= 2) {
                  ctx.drawImage(nextVideoEl, 0, 0, w, h);
                }
                ctx.globalAlpha = 1;
              }
            }
          }
        }
      } else {
        // No clip — show empty state
        ctx.fillStyle = '#ffffff44';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No clips', w / 2, h / 2);
      }
    }

    function getClipAtTime(time) {
      let elapsed = 0;
      for (let i = 0; i < props.clips.length; i++) {
        const clip = props.clips[i];
        const clipDuration = (clip.endTime || clip.duration || 0) - (clip.startTime || 0);
        const transOverlap = i > 0 && props.transitions[i - 1]
          ? (props.transitions[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;

        if (time >= elapsed && time < elapsed + clipDuration) {
          return { clipIndex: i, localTime: time - elapsed + (clip.startTime || 0) };
        }
        elapsed += clipDuration;
      }
      return { clipIndex: -1, localTime: 0 };
    }

    function getTransitionAtTime(time) {
      let elapsed = 0;
      for (let i = 0; i < props.clips.length; i++) {
        const clip = props.clips[i];
        const clipDuration = (clip.endTime || clip.duration || 0) - (clip.startTime || 0);
        const transOverlap = i > 0 && props.transitions[i - 1]
          ? (props.transitions[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;
        elapsed += clipDuration;

        // Check if we're in the transition zone
        if (i < props.transitions.length) {
          const transDur = props.transitions[i]?.duration || 0;
          const transStart = elapsed - transDur;
          if (time >= transStart && time < elapsed) {
            return i;
          }
        }
      }
      return -1;
    }

    function getTransitionProgress(time, transIdx) {
      let elapsed = 0;
      for (let i = 0; i <= transIdx; i++) {
        const clip = props.clips[i];
        const clipDuration = (clip.endTime || clip.duration || 0) - (clip.startTime || 0);
        const transOverlap = i > 0 && props.transitions[i - 1]
          ? (props.transitions[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;
        elapsed += clipDuration;
      }
      const transDur = props.transitions[transIdx]?.duration || 1;
      const transStart = elapsed - transDur;
      return Math.min(1, Math.max(0, (time - transStart) / transDur));
    }

    // Playback loop
    function playbackLoop(timestamp) {
      if (!isPlaying.value) return;

      if (lastFrameTime > 0) {
        const delta = (timestamp - lastFrameTime) / 1000;
        currentTime.value += delta;

        if (currentTime.value >= totalDuration.value) {
          currentTime.value = totalDuration.value;
          isPlaying.value = false;
          emit('pause');
        }
      }

      lastFrameTime = timestamp;
      renderFrame();
      emit('time-update', currentTime.value);

      if (isPlaying.value) {
        animationFrame = requestAnimationFrame(playbackLoop);
      }
    }

    function togglePlay() {
      if (isPlaying.value) {
        pause();
      } else {
        play();
      }
    }

    function play() {
      if (currentTime.value >= totalDuration.value) {
        currentTime.value = 0;
      }
      isPlaying.value = true;
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(playbackLoop);
      emit('play');
    }

    function pause() {
      isPlaying.value = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      emit('pause');
    }

    function goToStart() {
      pause();
      currentTime.value = 0;
      renderFrame();
      emit('seek', 0);
    }

    function goToEnd() {
      pause();
      currentTime.value = totalDuration.value;
      renderFrame();
      emit('seek', totalDuration.value);
    }

    function seekTo(time) {
      const clamped = Math.max(0, Math.min(totalDuration.value, time));
      currentTime.value = clamped;
      renderFrame();
      emit('seek', clamped);
    }

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      const f = Math.floor((seconds % 1) * props.fps);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
    }

    // Create/update video elements for each clip
    watch(() => props.clips, (clips) => {
      const existing = new Set(videoElements.value.keys());
      for (const clip of clips) {
        if (!videoElements.value.has(clip.id) && clip.url) {
          const video = document.createElement('video');
          video.src = clip.url;
          video.muted = true;
          video.preload = 'auto';
          video.playsInline = true;
          videoElements.value.set(clip.id, video);
        }
        existing.delete(clip.id);
      }
      // Remove stale
      for (const id of existing) {
        const el = videoElements.value.get(id);
        if (el) { el.pause(); el.src = ''; }
        videoElements.value.delete(id);
      }
    }, { immediate: true, deep: true });

    onMounted(() => {
      renderFrame();
    });

    onUnmounted(() => {
      pause();
      for (const el of videoElements.value.values()) {
        el.pause();
        el.src = '';
      }
      videoElements.value.clear();
    });

    return {
      canvas,
      containerEl,
      isPlaying,
      currentTime,
      previewQuality,
      qualityOptions,
      canvasWidth,
      canvasHeight,
      viewportStyle,
      totalDuration,
      visibleOverlays,
      overlayStyle,
      togglePlay,
      goToStart,
      goToEnd,
      seekTo,
      formatTime,
      renderFrame,
    };
  },
};
</script>

<style scoped>
.preview-player {
  display: flex;
  flex-direction: column;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.preview-viewport {
  position: relative;
  width: 100%;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-canvas {
  width: 100%;
  height: auto;
  display: block;
}

.text-overlay {
  font-family: 'Inter', 'Segoe UI', sans-serif;
  z-index: 10;
}

.transport-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
}

.time-display {
  font-family: 'Fira Code', 'Consolas', monospace;
}

.quality-dropdown {
  width: 130px;
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>

