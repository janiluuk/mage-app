<template>
  <div class="fullscreen-modal" @click="handleBackdropClick">
    <div class="fullscreen-video-container" @click.stop>
      <button class="fullscreen-close" type="button" @click="onClose">x</button>
      <button class="fullscreen-nav fullscreen-nav--prev" type="button" @click="() => onNavigate('prev')">&#8249;</button>
      <button class="fullscreen-nav fullscreen-nav--next" type="button" @click="() => onNavigate('next')">&#8250;</button>
      <video
        ref="videoRef"
        class="fullscreen-video"
        :src="resolvedSrc"
        controls
        playsinline
      ></video>
      <div v-if="showFilenames" class="fullscreen-filename">{{ video?.name }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  video: { type: Object, required: true },
  onClose: { type: Function, default: () => {} },
  onNavigate: { type: Function, default: () => {} },
  showFilenames: { type: Boolean, default: true },
});

const videoRef = ref(null);

const resolvedSrc = computed(() => {
  return props.video?.fullPath || props.video?.previewUrl || "";
});

const playIfReady = () => {
  const el = videoRef.value;
  if (!el) return;
  el.play?.().catch(() => {});
};

watch(resolvedSrc, () => {
  const el = videoRef.value;
  if (!el) return;
  el.load?.();
  playIfReady();
});

const handleKeyDown = (event) => {
  if (event.key === " ") {
    event.preventDefault();
    const el = videoRef.value;
    if (!el) return;
    if (el.paused) {
      el.play?.().catch(() => {});
    } else {
      el.pause?.();
    }
  }
};

onMounted(() => {
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKeyDown);
  playIfReady();
});

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKeyDown);
});

const handleBackdropClick = (event) => {
  if (event.target.classList.contains("fullscreen-modal")) {
    props.onClose();
  }
};

</script>
