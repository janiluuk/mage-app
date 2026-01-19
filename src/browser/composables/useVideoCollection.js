import { computed } from "vue";
import { useProgressiveList } from "./useProgressiveList";
import usePlayOrchestrator from "./usePlayOrchestrator";

export function useVideoCollection({
  videos,
  visibleVideos,
  loadedVideos,
  loadingVideos,
  actualPlaying,
  scrollRef,
  progressive,
  activationTarget,
  renderLimit,
}) {
  const {
    initial = 100,
    batchSize = 50,
    intervalMs = 100,
    pauseOnScroll = true,
    longTaskAdaptation = true,
    forceInterval,
    maxVisible,
  } = progressive || {};

  const progressiveState = useProgressiveList(
    videos,
    initial,
    batchSize,
    intervalMs,
    {
      scrollRef,
      pauseOnScroll,
      longTaskAdaptation,
      forceInterval: !!forceInterval,
      maxVisible,
      materializeAll: true,
    }
  );

  const progressiveVideos = computed(() => progressiveState.value.items || videos.value);
  const progressiveVisibleCount = computed(() =>
    typeof progressiveState.value.visibleCount === "number"
      ? progressiveState.value.visibleCount
      : videos.value.length
  );
  const progressiveTargetCount = computed(() =>
    typeof progressiveState.value.targetCount === "number"
      ? progressiveState.value.targetCount
      : videos.value.length
  );

  const userLimit = computed(() => {
    const limit = renderLimit?.value ?? renderLimit;
    if (limit != null && Number.isFinite(limit)) {
      return Math.max(0, Math.floor(limit));
    }
    return null;
  });

  const videosToRender = computed(() =>
    userLimit.value == null
      ? progressiveVideos.value
      : progressiveVideos.value.slice(0, userLimit.value)
  );

  const limitedVisibleCount = computed(() =>
    userLimit.value == null
      ? progressiveVisibleCount.value
      : Math.min(progressiveVisibleCount.value, userLimit.value)
  );

  const limitedTargetCount = computed(() =>
    userLimit.value == null
      ? progressiveTargetCount.value
      : Math.min(progressiveTargetCount.value, Math.max(userLimit.value, 0))
  );

  const desiredActiveCount = computed(() =>
    Number.isFinite(activationTarget.value) && activationTarget.value > 0
      ? Math.max(1, Math.floor(activationTarget.value))
      : progressiveVisibleCount.value
  );

  const cappedDesiredActiveCount = computed(() =>
    userLimit.value == null
      ? desiredActiveCount.value
      : Math.min(Math.max(0, desiredActiveCount.value), Math.max(userLimit.value, 0))
  );

  const maxLoaded = computed(() => {
    if (userLimit.value != null) return Math.max(0, userLimit.value);
    const base = cappedDesiredActiveCount.value || limitedVisibleCount.value || 0;
    const buffer = Math.max(16, Math.round(base * 0.5));
    const total = videos.value.length;
    return total ? Math.min(total, base + buffer) : base + buffer;
  });

  const maxConcurrentLoading = computed(() => {
    const base = Math.max(2, Math.ceil(maxLoaded.value / 12));
    return Math.min(12, base);
  });

  const canLoadVideo = (_id, _options) => {
    const loadingCount = loadingVideos.value.size;
    const loadedCount = loadedVideos.value.size;
    if (loadingCount >= maxConcurrentLoading.value) return false;
    if (loadingCount + loadedCount >= maxLoaded.value) return false;
    return true;
  };

  const maxPlaying = computed(() => {
    const cap = cappedDesiredActiveCount.value || limitedVisibleCount.value;
    return Number.isFinite(cap) && cap > 0 ? cap : limitedVisibleCount.value;
  });

  const orchestrator = usePlayOrchestrator({
    visibleIds: visibleVideos,
    loadedIds: loadedVideos,
    maxPlaying,
  });

  const stats = computed(() => ({
    total: videos.value.length,
    rendered: videosToRender.value.length,
    playing: orchestrator.playingSet.value.size,
    loaded: loadedVideos.value.size,
    progressiveVisible: limitedVisibleCount.value,
    activationTarget: cappedDesiredActiveCount.value,
  }));

  return {
    videosToRender,
    canLoadVideo,
    isVideoPlaying: (videoId) => orchestrator.playingSet.value.has(videoId),
    markHover: orchestrator.markHover,
    reportPlayError: orchestrator.reportPlayError,
    reportStarted: orchestrator.reportStarted,
    playingVideos: orchestrator.playingSet,
    stats,
    maxLoaded,
    maxConcurrentLoading,
  };
}
