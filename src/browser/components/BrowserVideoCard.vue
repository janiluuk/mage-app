<template>
  <div
    ref="cardRef"
    class="video-item"
    :class="{ selected: selected, loading: localLoading }"
    :data-filename="video?.name"
    :data-video-id="videoId"
    :data-loaded="String(localLoaded)"
    :data-loading="String(localLoading)"
    :data-aspect-ratio="effectiveAspectRatio"
    :style="cardStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @contextmenu.prevent.stop="handleContextMenu"
  >
    <div v-if="ratingValue !== null" class="video-item-rating" :title="`Rated ${ratingValue} / 5`">
      <span
        v-for="index in 5"
        :key="index"
        :class="{ filled: index <= ratingValue }"
      >
        &#9733;
      </span>
    </div>

    <div
      v-if="hasTags"
      class="video-item-tags"
      :class="{ 'with-filename': showFilenames }"
      :title="video?.tags?.join(', ')"
    >
      <span v-for="tag in tagPreview" :key="tag" class="video-item-tag">
        #{{ tag }}
      </span>
      <span v-if="extraTagCount > 0" class="video-item-tag more">+{{ extraTagCount }}</span>
    </div>

    <div class="video-container" :style="containerStyle">
      <video
        ref="videoRef"
        class="video-element"
        muted
        loop
        playsinline
        :style="{ display: localLoaded ? 'block' : 'none' }"
      ></video>
      <div
        v-if="!localLoaded"
        class="video-placeholder"
        :class="{ 'video-placeholder--static': !isNearViewport }"
        role="status"
        aria-live="polite"
      >
        <div class="video-placeholder__media" aria-hidden="true">
          <div v-if="!isNearViewport" class="video-placeholder__static-block" />
          <template v-else>
            <div class="video-placeholder__sheen" />
            <div :class="spinnerClass" />
          </template>
        </div>
        <div class="video-placeholder__text">
          <span class="video-placeholder__message">{{ placeholderText }}</span>
          <span class="video-placeholder__subtext">{{ placeholderSubtext }}</span>
        </div>
      </div>
    </div>

    <div v-if="showFilenames" class="video-filename">{{ video?.name }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  video: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  onSelect: { type: Function, default: () => {} },
  onContextMenu: { type: Function, default: () => {} },
  onHover: { type: Function, default: () => {} },
  isPlaying: { type: Boolean, default: false },
  isLoaded: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: false },
  showFilenames: { type: Boolean, default: true },
  canLoadMoreVideos: { type: Function, default: () => true },
  onStartLoading: { type: Function, default: () => {} },
  onStopLoading: { type: Function, default: () => {} },
  onVideoLoad: { type: Function, default: () => {} },
  onVideoUnload: { type: Function, default: () => {} },
  onVideoPlay: { type: Function, default: () => {} },
  onVideoPause: { type: Function, default: () => {} },
  onPlayError: { type: Function, default: () => {} },
  onVisibilityChange: { type: Function, default: () => {} },
  observeIntersection: { type: Function, default: null },
  unobserveIntersection: { type: Function, default: null },
  isNear: { type: Function, default: () => true },
  scrollRootRef: { type: Object, default: null },
  layoutEpoch: { type: Number, default: 0 },
  scheduleInit: { type: Function, default: null },
});

const cardRef = ref(null);
const videoRef = ref(null);
const localLoaded = ref(false);
const localLoading = ref(false);
const isNearViewport = ref(true);
const clickTimeout = ref(null);

let onMeta = null;
let onLoadedData = null;
let onError = null;
let onPlaying = null;
let onPause = null;

const videoId = computed(() => props.video?.id ?? props.video?.name ?? "unknown");

const aspectRatioHint = computed(() => {
  const direct = Number(props.video?.aspectRatio);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const dimRatio = Number(props.video?.dimensions?.aspectRatio);
  if (Number.isFinite(dimRatio) && dimRatio > 0) return dimRatio;
  const width = Number(props.video?.dimensions?.width);
  const height = Number(props.video?.dimensions?.height);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return width / height;
  }
  return null;
});

const effectiveAspectRatio = computed(() =>
  aspectRatioHint.value && aspectRatioHint.value > 0 ? aspectRatioHint.value : 16 / 9
);

const cardStyle = computed(() => ({
  userSelect: "none",
  position: "relative",
  width: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  border: props.selected ? "3px solid #007acc" : "1px solid #333",
  background: "#1a1a1a",
  aspectRatio: effectiveAspectRatio.value,
}));

const containerStyle = computed(() => ({
  width: "100%",
  height: props.showFilenames ? "calc(100% - 40px)" : "100%",
}));

const ratingValue = computed(() => {
  const value = props.video?.rating;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(5, Math.round(value)));
});

const hasTags = computed(() => Array.isArray(props.video?.tags) && props.video.tags.length > 0);

const tagPreview = computed(() => (hasTags.value ? props.video.tags.slice(0, 3) : []));

const extraTagCount = computed(() =>
  hasTags.value ? Math.max(0, props.video.tags.length - tagPreview.value.length) : 0
);

const canLoad = computed(() => {
  try {
    return props.canLoadMoreVideos(videoId.value, props.isVisible ? { assumeVisible: true } : undefined);
  } catch {
    return true;
  }
});

const statusText = computed(() => {
  if (localLoading.value) return "Loading video...";
  if (canLoad.value) return "Scroll to load";
  return "Waiting for next chunk";
});

const subtext = computed(() => {
  if (localLoading.value) return "Preparing playback";
  if (canLoad.value) return "Keep scrolling to fetch more clips";
  return "All caught up for now";
});

const placeholderText = computed(() => {
  if (!isNearViewport.value) return canLoad.value ? "Scroll closer to load" : statusText.value;
  return statusText.value;
});

const placeholderSubtext = computed(() =>
  !isNearViewport.value ? "Thumbnails idle until you're nearby" : subtext.value
);

const spinnerClass = computed(() =>
  `video-placeholder__spinner${localLoading.value ? "" : " video-placeholder__spinner--paused"}`
);

const resolveSrc = () => props.video?.fullPath || props.video?.previewUrl || "";

const ensureLoad = () => {
  if (!props.isVisible && !isNearViewport.value) return;
  if (localLoading.value || localLoaded.value) return;
  if (!props.canLoadMoreVideos(videoId.value)) return;

  localLoading.value = true;
  props.onStartLoading(videoId.value);

  const runInit = () => {
    const el = videoRef.value;
    if (!el) return;
    el.preload = props.isVisible ? "auto" : "metadata";
    el.dataset.videoId = videoId.value;
    const src = resolveSrc();
    if (src) {
      if (el.src !== src) {
        el.src = src;
      }
      el.load();
    } else {
      localLoading.value = false;
      localLoaded.value = false;
      props.onStopLoading(videoId.value);
      props.onPlayError(videoId.value, new Error("No video source"));
    }
  };

  if (typeof props.scheduleInit === "function") {
    props.scheduleInit(runInit);
  } else {
    runInit();
  }
};

const unloadVideo = () => {
  const el = videoRef.value;
  const wasLoading = localLoading.value;
  if (!el) return;
  try {
    el.pause();
    el.removeAttribute("src");
    el.load();
  } catch {}
  localLoaded.value = false;
  localLoading.value = false;
  if (wasLoading) {
    props.onStopLoading(videoId.value);
  }
  props.onVideoUnload(videoId.value);
};

const handleClick = (event) => {
  event.stopPropagation();
  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value);
    clickTimeout.value = null;
    props.onSelect(videoId.value, event.ctrlKey || event.metaKey, event.shiftKey, true);
    return;
  }
  clickTimeout.value = setTimeout(() => {
    props.onSelect(videoId.value, event.ctrlKey || event.metaKey, event.shiftKey, false);
    clickTimeout.value = null;
  }, 300);
};

const handleContextMenu = (event) => {
  props.onContextMenu(event, props.video);
};

const handleMouseEnter = () => {
  props.onHover(videoId.value);
};

watch(
  () => props.isVisible,
  (nextVisible) => {
    if (nextVisible) {
      ensureLoad();
    }
  }
);

watch(
  () => props.isLoaded,
  (nextLoaded) => {
    if (localLoaded.value !== nextLoaded) {
      localLoaded.value = nextLoaded;
    }
    if (!nextLoaded) {
      unloadVideo();
    }
  }
);

watch(
  () => props.isLoading,
  (nextLoading) => {
    if (localLoading.value !== nextLoading) {
      localLoading.value = nextLoading;
    }
  }
);

watch(
  () => [props.isVisible, isNearViewport.value],
  ([nextVisible, near]) => {
    if (!nextVisible && !near) {
      unloadVideo();
    }
  }
);

watch(
  () => props.isPlaying,
  (next) => {
    const el = videoRef.value;
    if (!el) return;
    if (next && props.isVisible) {
      el.play?.().catch(() => {});
    } else {
      el.pause?.();
    }
  }
);

onMounted(() => {
  const el = videoRef.value;
  if (el) {
    onMeta = () => {
      const ar = el.videoWidth && el.videoHeight ? el.videoWidth / el.videoHeight : 16 / 9;
      props.onVideoLoad(videoId.value, ar, true);
    };

    onLoadedData = () => {
      localLoading.value = false;
      localLoaded.value = true;
      props.onStopLoading(videoId.value);
      props.onVideoLoad(
        videoId.value,
        el.videoWidth && el.videoHeight ? el.videoWidth / el.videoHeight : 16 / 9,
        false
      );
      if (props.isPlaying && props.isVisible) {
        el.play().catch(() => {});
      }
    };

    onError = (event) => {
      localLoading.value = false;
      localLoaded.value = false;
      props.onStopLoading(videoId.value);
      props.onPlayError(videoId.value, event?.target?.error || event);
    };

    onPlaying = () => props.onVideoPlay(videoId.value);
    onPause = () => props.onVideoPause(videoId.value);

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("loadeddata", onLoadedData);
    el.addEventListener("error", onError);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
  }

  localLoaded.value = props.isLoaded;
  localLoading.value = props.isLoading;
  isNearViewport.value = props.isNear(videoId.value);

  if (props.observeIntersection && props.unobserveIntersection) {
    const el = cardRef.value;
    if (el) {
      props.observeIntersection(el, videoId.value, (visible) => {
        props.onVisibilityChange(videoId.value, visible);
        isNearViewport.value = props.isNear(videoId.value);
        if (visible) ensureLoad();
      });
    }
  }

  ensureLoad();
});

onBeforeUnmount(() => {
  const el = videoRef.value;
  if (el) {
    if (onMeta) el.removeEventListener("loadedmetadata", onMeta);
    if (onLoadedData) el.removeEventListener("loadeddata", onLoadedData);
    if (onError) el.removeEventListener("error", onError);
    if (onPlaying) el.removeEventListener("playing", onPlaying);
    if (onPause) el.removeEventListener("pause", onPause);
  }
  if (props.unobserveIntersection && cardRef.value) {
    props.unobserveIntersection(cardRef.value);
  }
  if (clickTimeout.value) clearTimeout(clickTimeout.value);
  unloadVideo();
});
</script>
