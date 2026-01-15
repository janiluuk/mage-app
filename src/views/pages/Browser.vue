<template>
  <div class="video-browser">
    <div class="app">
      <BrowserHeaderBar
        :is-loading="isLoading"
        :on-refresh="loadJobs"
        :show-filenames="showFilenames"
        :on-toggle-filenames="toggleFilenames"
        :render-limit-step="renderLimitStep"
        :render-limit-label="renderLimitLabel"
        :render-limit-max-step="renderLimitMaxStep"
        :on-render-limit-change="handleRenderLimitChange"
        :zoom-level="zoomLevel"
        :handle-zoom-change-safe="handleZoomChangeSafe"
        :get-minimum-zoom-level="getMinimumZoomLevel"
        :sort-key="sortKey"
        :sort-selection="sortSelection"
        :group-by-folders="groupByFolders"
        :on-sort-change="handleSortChange"
        :on-group-by-folders-toggle="toggleGroupByFolders"
        :on-reshuffle="reshuffle"
        :filters-active-count="filtersActiveCount"
        :filters-are-open="isFiltersOpen"
        :filters-button-ref="filtersButtonRef"
        :on-filters-toggle="toggleFilters"
      />

      <BrowserFiltersPopover
        v-if="isFiltersOpen"
        ref="filtersPopoverRef"
        :filters="filters"
        :available-tags="availableTags"
        :on-change="updateFilters"
        :on-reset="resetFilters"
        :on-close="() => setFiltersOpen(false)"
      />

      <div v-if="filtersActiveCount > 0" class="filters-summary">
        <div v-if="filters.includeTags.length" class="filters-summary__section">
          <span class="filters-summary__label">Include</span>
          <div class="filters-summary__chips">
            <button
              v-for="tag in filters.includeTags"
              :key="`include-${tag}`"
              type="button"
              class="filters-summary__chip filters-summary__chip--include"
              @click="handleRemoveIncludeFilter(tag)"
            >
              {{ tag }}
              <span class="filters-summary__chip-remove">x</span>
            </button>
          </div>
        </div>

        <div v-if="filters.excludeTags.length" class="filters-summary__section">
          <span class="filters-summary__label">Exclude</span>
          <div class="filters-summary__chips">
            <button
              v-for="tag in filters.excludeTags"
              :key="`exclude-${tag}`"
              type="button"
              class="filters-summary__chip filters-summary__chip--exclude"
              @click="handleRemoveExcludeFilter(tag)"
            >
              {{ tag }}
              <span class="filters-summary__chip-remove">x</span>
            </button>
          </div>
        </div>

        <div v-if="ratingSummary" class="filters-summary__section">
          <span class="filters-summary__label">Rating</span>
          <div class="filters-summary__chips">
            <button
              type="button"
              class="filters-summary__chip filters-summary__chip--rating"
              @click="ratingSummary.onClear"
            >
              {{ ratingSummary.label }}
              <span class="filters-summary__chip-remove">x</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="videos.length === 0 && !isLoading"
        class="drop-zone"
      >
        <h2>Library is empty</h2>
        <p>Click the green button to refresh your library from the API.</p>
      </div>

      <div
        v-else
        ref="contentRegionRef"
        :class="contentRegionClassName"
        :style="contentRegionStyle"
      >
        <div
          ref="scrollContainerRef"
          class="content-region__viewport"
          @contextmenu.prevent="handleBackgroundContextMenu"
        >
          <div
            ref="gridRef"
            class="video-grid masonry-vertical"
            :class="[
              showFilenames ? '' : 'hide-filenames',
              zoomClassForLevel(zoomLevel),
            ]"
          >
            <div
              v-if="orderedVideos.length === 0 && videos.length > 0 && !isLoading"
              class="filters-empty-state"
            >
              No videos match your current filters.
            </div>

            <BrowserVideoCard
              v-for="video in videosToRender"
              :key="video.id"
              :video="video"
              :observe-intersection="ioRegistry?.observe"
              :unobserve-intersection="ioRegistry?.unobserve"
              :scroll-root-ref="scrollContainerRef"
              :selected="selection.selected.has(video.id)"
              :on-select="handleVideoSelect"
              :on-context-menu="handleCardContextMenu"
              :show-filenames="showFilenames"
              :can-load-more-videos="canLoadVideo"
              :is-loading="loadingVideos.has(video.id)"
              :is-loaded="loadedVideos.has(video.id)"
              :is-visible="visibleVideos.has(video.id)"
              :is-playing="isVideoPlaying(video.id)"
              :is-near="ioRegistry?.isNear"
              :layout-epoch="layoutEpoch"
              :on-start-loading="handleVideoStartLoading"
              :on-stop-loading="handleVideoStopLoading"
              :on-video-load="handleVideoLoaded"
              :on-video-unload="handleVideoUnloaded"
              :on-visibility-change="handleVideoVisibilityChange"
              :on-video-play="handleVideoPlay"
              :on-video-pause="handleVideoPause"
              :on-play-error="handleVideoPlayError"
              :on-hover="markHover"
            />
          </div>
        </div>

      <BrowserMetadataPanel
        ref="metadataPanelRef"
        :is-open="isMetadataPanelOpen"
        :on-toggle="toggleMetadataPanel"
        :show-collapsed-hint="shouldRenderCollapsedHint"
        :selection-count="selection.size"
        :selected-videos="selectedVideos"
        :available-tags="availableTags"
        :on-add-tag="handleAddTags"
        :on-remove-tag="handleRemoveTag"
        :on-apply-tag-to-selection="handleApplyTagToSelection"
        :on-set-rating="handleSetRating"
        :on-clear-rating="handleClearRating"
        :focus-token="metadataFocusToken"
        :on-focus-selection="focusSelection"
        :dock-height="metadataDockHeight"
        :min-dock-height="MIN_METADATA_DOCK_HEIGHT"
        :max-dock-height="MAX_METADATA_DOCK_HEIGHT"
        :on-dock-height-change="handleMetadataDockHeightChange"
      />
      </div>

      <BrowserFullScreenModal
        v-if="fullScreenVideo"
        :video="fullScreenVideo"
        :on-close="closeFullScreen"
        :on-navigate="navigateFullScreen"
        :show-filenames="showFilenames"
      />

      <BrowserContextMenu
        v-if="contextMenu.visible"
        :visible="contextMenu.visible"
        :position="contextMenu.position"
        :context-id="contextMenu.contextId"
        :get-by-id="getById"
        :selection-count="selection.size"
        :on-close="hideContextMenu"
        :on-action="handleContextAction"
      />

      <SoundtrackDialog
        v-if="selectedVideoForSoundtrack"
        v-model:visible="showSoundtrackDialog"
        :video-id="selectedVideoForSoundtrack.id"
        :video-title="selectedVideoForSoundtrack.filename || selectedVideoForSoundtrack.prompt"
        :video-duration="selectedVideoForSoundtrack.duration"
        @soundtrack-added="onSoundtrackAdded"
      />

      <VideoExtensionDialog
        v-if="selectedVideoForExtension"
        v-model:visible="showExtensionDialog"
        :video-id="selectedVideoForExtension.id"
        :video-title="selectedVideoForExtension.filename || selectedVideoForExtension.prompt"
        :video-duration="selectedVideoForExtension.duration || 60"
        :video-fps="selectedVideoForExtension.fps || 30"
        @video-extended="onVideoExtended"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import BrowserHeaderBar from "@/browser/components/BrowserHeaderBar.vue";
import BrowserFiltersPopover from "@/browser/components/BrowserFiltersPopover.vue";
import BrowserVideoCard from "@/browser/components/BrowserVideoCard.vue";
import BrowserContextMenu from "@/browser/components/BrowserContextMenu.vue";
import BrowserFullScreenModal from "@/browser/components/BrowserFullScreenModal.vue";
import BrowserMetadataPanel from "@/browser/components/BrowserMetadataPanel.vue";
import SoundtrackDialog from "@/components/video/SoundtrackDialog.vue";
import VideoExtensionDialog from "@/components/video/VideoExtensionDialog.vue";
import useSelectionState from "@/browser/composables/useSelectionState";
import useCardSelection from "@/browser/composables/useCardSelection";
import { useFilterState } from "@/browser/composables/useFilterState";
import { useMasonryLayout } from "@/browser/composables/useMasonryLayout";
import { useContextMenu } from "@/browser/composables/useContextMenu";
import { useVideoCollection } from "@/browser/composables/useVideoCollection";
import { useFullScreenModal } from "@/browser/composables/useFullScreenModal";
import { useZoomControls } from "@/browser/composables/useZoomControls";
import { useHotkeys } from "@/browser/composables/useHotkeys";
import { SortKey } from "@/browser/utils/sorting";
import { parseSortValue, formatSortValue } from "@/browser/utils/sortOption";
import {
  formatRenderLimitLabel,
  resolveRenderLimit,
  RENDER_LIMIT_STEPS,
} from "@/browser/utils/renderLimit";
import { updateSetMembership } from "@/browser/utils/updateSetMembership";
import {
  normalizeVideoJob,
  normalizeTags,
  normalizeRating,
} from "@/browser/utils/normalizeVideoJob";
import { zoomClassForLevel } from "@/browser/zoom/utils";
import { ZOOM_MAX_INDEX } from "@/browser/zoom/config";
import "@/assets/video-browser.css";

const router = useRouter();
const store = useStore();

const filtersButtonRef = ref(null);
const filtersPopoverRef = ref(null);
const contentRegionRef = ref(null);
const scrollContainerRef = ref(null);
const gridRef = ref(null);
const metadataPanelRef = ref(null);

const isLoading = ref(false);
const refreshInterval = ref(null);

const rawJobs = computed(() => store.getters["videojobs/list"] || []);
const metadataOverrides = ref(new Map());

const applyMetadataOverrides = (video) => {
  const patch = metadataOverrides.value.get(video.id);
  if (!patch) return video;
  const next = { ...video, ...patch };
  if ("tags" in patch) {
    next.tags = normalizeTags(patch.tags);
  }
  if ("rating" in patch) {
    next.rating = normalizeRating(patch.rating);
  }
  return next;
};

const videos = computed(() =>
  rawJobs.value.map(normalizeVideoJob).map(applyMetadataOverrides)
);

const selection = useSelectionState();

const showFilenames = ref(true);
const renderLimitStep = ref(RENDER_LIMIT_STEPS);
const renderLimitMaxStep = RENDER_LIMIT_STEPS;
const zoomLevel = ref(1);
const sortKey = ref(SortKey.NAME);
const sortDir = ref("asc");
const groupByFolders = ref(false);
const randomSeed = ref(null);

const availableTags = computed(() => {
  const counts = new Map();
  videos.value.forEach((video) => {
    const tags = Array.isArray(video.tags) ? video.tags : [];
    tags.forEach((tag) => {
      if (!tag) return;
      const key = tag.toString();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return Array.from(counts.entries()).map(([name, usageCount]) => ({ name, usageCount }));
});

const {
  filters,
  isFiltersOpen,
  setFiltersOpen,
  updateFilters,
  resetFilters,
  filteredVideos,
  filtersActiveCount,
  ratingSummary,
  handleRemoveIncludeFilter,
  handleRemoveExcludeFilter,
} = useFilterState({
  videos,
  filtersButtonRef,
  filtersPopoverRef,
});

const {
  orderedVideos,
  orderForRange,
  ioRegistry,
  layoutEpoch,
  scheduleLayout,
  updateAspectRatio,
  onItemsChanged,
  setZoomClass,
  progressiveMaxVisibleNumber,
  activationTarget,
  viewportMetrics,
} = useMasonryLayout({
  videos,
  filteredVideos,
  sortKey,
  sortDir,
  groupByFolders,
  randomSeed,
  zoomLevel,
  scrollContainerRef,
  gridRef,
});

const renderLimitValue = computed(() =>
  resolveRenderLimit(renderLimitStep.value, orderedVideos.value.length)
);

const renderLimitLabel = computed(() =>
  formatRenderLimitLabel(renderLimitStep.value, orderedVideos.value.length)
);

const sortSelection = computed(() =>
  formatSortValue(sortKey.value, sortDir.value)
);

const handleSortChange = (value) => {
  const parsed = parseSortValue(value);
  sortKey.value = parsed.sortKey;
  sortDir.value = parsed.sortDir;
  if (parsed.sortKey === SortKey.RANDOM) {
    randomSeed.value = Date.now();
  }
};

const toggleGroupByFolders = () => {
  groupByFolders.value = !groupByFolders.value;
};

const reshuffle = () => {
  randomSeed.value = Date.now();
};

const handleRenderLimitChange = (value) => {
  renderLimitStep.value = value;
};

const toggleFilenames = () => {
  showFilenames.value = !showFilenames.value;
};

const toggleFilters = () => {
  setFiltersOpen(!isFiltersOpen.value);
};

const visibleVideos = ref(new Set());
const loadedVideos = ref(new Set());
const loadingVideos = ref(new Set());
const actualPlaying = ref(new Set());

const updateSet = (target, id, shouldHave) => {
  target.value = updateSetMembership(target.value, id, shouldHave);
};

const handleVideoVisibilityChange = (id, visible) => {
  updateSet(visibleVideos, id, visible);
};

const handleVideoStartLoading = (id) => {
  updateSet(loadingVideos, id, true);
};

const handleVideoStopLoading = (id) => {
  updateSet(loadingVideos, id, false);
};

const handleVideoLoaded = (id, aspectRatio, isMetadataOnly = false) => {
  if (!isMetadataOnly) {
    updateSet(loadedVideos, id, true);
  }
  if (aspectRatio) {
    updateAspectRatio(id, aspectRatio);
  }
};

const handleVideoUnloaded = (id) => {
  updateSet(loadedVideos, id, false);
};

const {
  videosToRender,
  canLoadVideo,
  isVideoPlaying,
  markHover,
  reportPlayError,
  reportStarted,
  playingVideos,
  stats,
  maxLoaded,
} = useVideoCollection({
  videos: orderedVideos,
  visibleVideos,
  loadedVideos,
  loadingVideos,
  actualPlaying,
  scrollRef: scrollContainerRef,
  progressive: {
    initial: 120,
    batchSize: 64,
    intervalMs: 100,
    pauseOnScroll: true,
    longTaskAdaptation: true,
    maxVisible: progressiveMaxVisibleNumber,
  },
  activationTarget,
  renderLimit: renderLimitValue,
});

const handleVideoPlay = (id) => {
  reportStarted(id);
  updateSet(actualPlaying, id, true);
};

const handleVideoPause = (id) => {
  updateSet(actualPlaying, id, false);
};

const handleVideoPlayError = (id) => {
  reportPlayError(id);
  updateSet(actualPlaying, id, false);
};

const getById = (id) =>
  orderedVideos.value.find((video) => video.id === id) || null;

const selectedIds = computed(() => Array.from(selection.selected.value));

const selectedVideos = computed(() =>
  Array.from(selection.selected.value).map(getById).filter(Boolean)
);

const metadataFocusToken = ref(0);

const applyMetadataPatch = (updates) => {
  if (!updates || typeof updates !== "object") return;
  const next = new Map(metadataOverrides.value);
  Object.entries(updates).forEach(([id, patch]) => {
    if (!id || !patch) return;
    const prev = next.get(id) || {};
    next.set(id, { ...prev, ...patch });
  });
  metadataOverrides.value = next;
};

const handleAddTags = (tagNames) => {
  const additions = normalizeTags(tagNames);
  if (!additions.length) return;
  const updates = {};
  selectedIds.value.forEach((id) => {
    const video = getById(id);
    if (!video) return;
    const existing = Array.isArray(video.tags) ? video.tags : [];
    updates[id] = { tags: normalizeTags([...existing, ...additions]) };
  });
  applyMetadataPatch(updates);
};

const handleRemoveTag = (tagName) => {
  const clean = normalizeTags([tagName]);
  if (!clean.length) return;
  const [tag] = clean;
  const updates = {};
  selectedIds.value.forEach((id) => {
    const video = getById(id);
    if (!video) return;
    const existing = Array.isArray(video.tags) ? video.tags : [];
    updates[id] = { tags: existing.filter((entry) => entry !== tag) };
  });
  applyMetadataPatch(updates);
};

const handleApplyTagToSelection = (tagName) => {
  handleAddTags([tagName]);
};

const handleSetRating = (value, targetIds = selectedIds.value) => {
  const rating = value == null ? null : normalizeRating(value);
  const updates = {};
  (targetIds || []).forEach((id) => {
    if (!id) return;
    updates[id] = { rating };
  });
  applyMetadataPatch(updates);
};

const handleClearRating = () => {
  handleSetRating(null, selectedIds.value);
};

const {
  fullScreenVideo,
  openFullScreen,
  closeFullScreen,
  navigateFullScreen,
} = useFullScreenModal(orderedVideos);

const { contextMenu, showOnItem, showOnEmpty, hide } = useContextMenu();

const {
  handleVideoSelect,
  handleCardContextMenu,
  handleBackgroundContextMenu,
} = useCardSelection({
  gridRef,
  selection,
  getById,
  openFullScreen,
  playingVideos,
  showOnItem,
  showOnEmpty,
});

const isMetadataPanelOpen = ref(false);
const metadataPanelDismissed = ref(false);
const metadataDockHeight = ref(280);
const MIN_METADATA_DOCK_HEIGHT = 200;
const MAX_METADATA_DOCK_HEIGHT = 520;

const openMetadataPanel = () => {
  isMetadataPanelOpen.value = true;
  metadataPanelDismissed.value = false;
  metadataFocusToken.value += 1;
};

const toggleMetadataPanel = () => {
  const next = !isMetadataPanelOpen.value;
  isMetadataPanelOpen.value = next;
  if (!next) {
    metadataPanelDismissed.value = true;
  } else {
    metadataPanelDismissed.value = false;
    metadataFocusToken.value += 1;
  }
};

const handleMetadataDockHeightChange = (height) => {
  metadataDockHeight.value = height;
};

const shouldRenderCollapsedHint = computed(
  () => metadataPanelDismissed.value || selection.size.value > 0
);

watch(
  () => selection.size.value,
  (size) => {
    if (size > 0 && !isMetadataPanelOpen.value && !metadataPanelDismissed.value) {
      isMetadataPanelOpen.value = true;
    }
    if (size === 0) {
      metadataPanelDismissed.value = false;
    }
  }
);

const contentRegionClassName = computed(() => [
  "content-region",
  isMetadataPanelOpen.value ? "content-region--dock-open" : "",
  shouldRenderCollapsedHint.value ? "content-region--dock-hint" : "",
]);

const contentRegionStyle = computed(() => ({
  "--metadata-dock-height": `${Math.round(metadataDockHeight.value)}px`,
}));

const focusSelection = () => {
  const id = selection.anchorId.value || selection.selected.value.values().next().value;
  if (!id) return;
  const gridEl = gridRef.value;
  if (!gridEl) return;
  const escaped = window.CSS?.escape ? window.CSS.escape(String(id)) : id;
  const el = gridEl.querySelector(`[data-video-id="${escaped}"]`);
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ block: "center" });
  }
};

const { handleZoomChangeSafe, getMinimumZoomLevel } = useZoomControls({
  zoomLevel,
  setZoomLevel: (value) => {
    zoomLevel.value = value;
  },
  orderedVideoCount: computed(() => orderedVideos.value.length),
  renderLimitStep,
  showFilenames,
  setZoomClass,
  scheduleLayout,
});

const loadJobs = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    await store.dispatch("videojobs/list", { include: "modelfile,user" });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadJobs();
  refreshInterval.value = setInterval(loadJobs, 10000);
});

onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

watch(
  () => videosToRender.value.length,
  () => {
    onItemsChanged();
  }
);

watch(
  () => loadedVideos.value.size,
  () => {
    if (loadedVideos.value.size <= maxLoaded.value) return;
    const next = new Set(loadedVideos.value);
    for (const id of loadedVideos.value) {
      if (!visibleVideos.value.has(id) && next.size > maxLoaded.value) {
        next.delete(id);
      }
    }
    loadedVideos.value = next;
  }
);

const handleContextAction = (actionId) => {
  runContextAction(actionId);
};

const copyToClipboard = async (text) => {
  if (!text) return;
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
};

const runContextAction = (actionId, selectionSet = selection.selected.value, contextId) => {
  if (!actionId) return;

  if (actionId === "metadata:open") {
    openMetadataPanel();
    return;
  }
  if (actionId.startsWith("metadata:rate:")) {
    if (actionId === "metadata:rate:clear") {
      handleSetRating(null, selectedIds.value);
      return;
    }
    const raw = Number(actionId.replace("metadata:rate:", ""));
    if (!Number.isNaN(raw)) {
      handleSetRating(raw, selectedIds.value);
    }
    return;
  }
  if (actionId.startsWith("metadata:tag:")) {
    const tagName = actionId.replace("metadata:tag:", "");
    if (tagName) {
      handleApplyTagToSelection(tagName);
    }
    return;
  }

  const selected = Array.from(selectionSet || []);
  const primaryId = contextId || contextMenu.value.contextId || selected[0];
  const primaryVideo = primaryId ? getById(primaryId) : null;
  const primaryJob = primaryVideo?.job;
  const selectionVideos = selected.map(getById).filter(Boolean);
  const targets = selectionVideos.length ? selectionVideos : primaryVideo ? [primaryVideo] : [];

  switch (actionId) {
    case "edit":
      if (primaryVideo) {
        router.push(`/edit/${primaryVideo.generator || "vid2vid"}/${primaryVideo.id}`);
      }
      break;
    case "download":
      if (primaryJob) {
        store.dispatch("videojobs/download", primaryJob);
      }
      break;
    case "soundtrack":
      if (primaryJob) {
        openSoundtrackDialog(primaryJob);
      }
      break;
    case "extend":
      if (primaryJob) {
        openExtensionDialog(primaryJob);
      }
      break;
    case "delete":
    case "move-to-trash": {
      if (!targets.length) return;
      const label =
        targets.length === 1
          ? `Delete "${targets[0].name || "this video"}"?`
          : `Delete ${targets.length} videos?`;
      if (!window.confirm(label)) return;
      targets.forEach((video) => {
        if (video?.job?.id) {
          store.dispatch("videojobs/destroy", video.job.id);
        }
      });
      break;
    }
    case "copy-filename": {
      const names = targets.map((video) => video?.name).filter(Boolean);
      copyToClipboard(names.join("\n"));
      break;
    }
    case "copy-path": {
      const paths = targets
        .map((video) => video?.fullPath || video?.previewUrl || video?.name)
        .filter(Boolean);
      copyToClipboard(paths.join("\n"));
      break;
    }
    case "copy-relative-path": {
      const paths = targets
        .map((video) => video?.basename || video?.name)
        .filter(Boolean);
      copyToClipboard(paths.join("\n"));
      break;
    }
    case "open-external": {
      const urls = targets.map((video) => video?.fullPath).filter(Boolean);
      urls.forEach((url) => window.open(url, "_blank"));
      break;
    }
    case "file-properties":
      openMetadataPanel();
      break;
    default:
      break;
  }
};

const hideContextMenu = () => hide();

useHotkeys({
  runAction: runContextAction,
  getSelection: () => selection.selected.value,
  getZoomIndex: () => zoomLevel.value,
  setZoomIndexSafe: (value) => handleZoomChangeSafe(value),
  minZoomIndex: 0,
  maxZoomIndex: ZOOM_MAX_INDEX,
});

const showSoundtrackDialog = ref(false);
const selectedVideoForSoundtrack = ref(null);
const showExtensionDialog = ref(false);
const selectedVideoForExtension = ref(null);

const openSoundtrackDialog = (videoJob) => {
  selectedVideoForSoundtrack.value = videoJob;
  showSoundtrackDialog.value = true;
};

const openExtensionDialog = (videoJob) => {
  selectedVideoForExtension.value = videoJob;
  showExtensionDialog.value = true;
};

const onSoundtrackAdded = () => {
  loadJobs();
};

const onVideoExtended = () => {
  loadJobs();
};
</script>
