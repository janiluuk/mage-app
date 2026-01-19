import { ref, computed, onMounted, onBeforeUnmount, watch, watchEffect } from "vue";
import useChunkedMasonry from "./useChunkedMasonry";
import useIntersectionObserverRegistry from "./useIntersectionObserverRegistry";
import {
  SortKey,
  buildComparator,
  groupAndSort,
  buildRandomOrderMap,
} from "../utils/sorting.js";
import { clampZoomIndex, zoomClassForLevel } from "../zoom/utils.js";
import { ZOOM_TILE_WIDTHS } from "../zoom/config";

export function useMasonryLayout({
  videos,
  filteredVideos,
  sortKey,
  sortDir,
  groupByStories,
  randomSeed,
  zoomLevel,
  scrollContainerRef,
  gridRef,
}) {
  const viewportSize = ref({ width: 0, height: 0 });
  const masonryMetrics = ref({
    columnWidth: 0,
    columnCount: 0,
    columnGap: 0,
    gridWidth: 0,
  });
  const scrollTop = ref(0);
  const visualOrderedIds = ref([]);
  const metadataAspectCache = new Map();
  const masonryRefreshRaf = ref(0);
  const ioConfig = ref({
    rootMargin: "100% 0px 100% 0px",
    nearPx: 900,
  });
  const layoutEpoch = ref(0);
  const layoutHoldCount = ref(0);

  const beginLayoutHold = () => {
    let released = false;
    layoutHoldCount.value += 1;
    return () => {
      if (released) return;
      released = true;
      layoutHoldCount.value = Math.max(0, layoutHoldCount.value - 1);
    };
  };

  const withLayoutHold = (fn) => {
    const release = beginLayoutHold();
    let result;
    try {
      result = typeof fn === "function" ? fn() : undefined;
    } catch (error) {
      release();
      throw error;
    }
    if (result && typeof result.then === "function") {
      result.then(release, release);
    } else {
      release();
    }
    return result;
  };

  const isLayoutTransitioning = computed(() => layoutHoldCount.value > 0);

  const computeViewport = () => {
    const currentScroll = scrollContainerRef.value;
    const currentGrid = gridRef.value;
    const height =
      currentScroll?.clientHeight ||
      (typeof window !== "undefined" ? window.innerHeight : 0);
    const width =
      currentGrid?.clientWidth ||
      currentScroll?.clientWidth ||
      (typeof window !== "undefined" ? window.innerWidth : 0);

    const prev = viewportSize.value;
    if (prev.width !== width || prev.height !== height) {
      viewportSize.value = { width, height };
    }

    if (currentScroll) {
      const top = currentScroll.scrollTop || 0;
      if (Math.abs(scrollTop.value - top) > 0.5) {
        scrollTop.value = top;
      }
    }
  };

  let resizeObserver = null;

  onMounted(() => {
    computeViewport();
    const scrollEl = scrollContainerRef.value;
    const gridEl = gridRef.value;

    resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => computeViewport())
        : null;
    if (resizeObserver) {
      if (scrollEl) resizeObserver.observe(scrollEl);
      if (gridEl && gridEl !== scrollEl) resizeObserver.observe(gridEl);
    }

    window.addEventListener("resize", computeViewport);
  });

  onBeforeUnmount(() => {
    const scrollEl = scrollContainerRef.value;
    const gridEl = gridRef.value;
    window.removeEventListener("resize", computeViewport);
    if (resizeObserver) {
      if (scrollEl) resizeObserver.unobserve(scrollEl);
      if (gridEl && gridEl !== scrollEl) resizeObserver.unobserve(gridEl);
      resizeObserver.disconnect();
    }
  });

  const ioRegistry = useIntersectionObserverRegistry(scrollContainerRef, {
    rootMargin: ioConfig.value.rootMargin,
    threshold: [0, 0.15],
    nearPx: ioConfig.value.nearPx,
  });

  const handleMasonryMetrics = (metrics) => {
    const prev = masonryMetrics.value;
    if (
      prev.columnWidth === metrics.columnWidth &&
      prev.columnCount === metrics.columnCount &&
      prev.columnGap === metrics.columnGap &&
      prev.gridWidth === metrics.gridWidth
    ) {
      return;
    }
    masonryMetrics.value = metrics;
  };

  const bumpLayoutEpoch = () => {
    layoutEpoch.value =
      layoutEpoch.value >= Number.MAX_SAFE_INTEGER ? 1 : layoutEpoch.value + 1;
  };

  const handleMasonryLayoutComplete = () => {
    if (masonryRefreshRaf.value && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(masonryRefreshRaf.value);
    }

    const runRefresh = () => {
      masonryRefreshRaf.value = 0;
      if (ioRegistry?.refresh) {
        ioRegistry.refresh();
      }
      bumpLayoutEpoch();
    };

    if (typeof requestAnimationFrame === "function") {
      masonryRefreshRaf.value = requestAnimationFrame(runRefresh);
    } else {
      runRefresh();
    }
  };

  onBeforeUnmount(() => {
    if (masonryRefreshRaf.value && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(masonryRefreshRaf.value);
      masonryRefreshRaf.value = 0;
    }
  });

  watch(
    () => [viewportSize.value.width, viewportSize.value.height],
    () => bumpLayoutEpoch()
  );

  const { updateAspectRatio, onItemsChanged, setZoomClass, scheduleLayout } =
    useChunkedMasonry({
      gridRef,
      zoomClassForLevel,
      getTileWidthForLevel: (level) =>
        ZOOM_TILE_WIDTHS[Math.max(0, Math.min(level, ZOOM_TILE_WIDTHS.length - 1))],
      onOrderChange: (order) => {
        visualOrderedIds.value = order;
      },
      onMetricsChange: handleMasonryMetrics,
      onLayoutComplete: handleMasonryLayoutComplete,
    });

  const randomOrderMap = computed(() => {
    const list = videos.value || [];
    if (sortKey.value !== SortKey.RANDOM) return null;
    return buildRandomOrderMap(
      list.map((v) => v.id),
      randomSeed.value ?? Date.now()
    );
  });

  const comparator = computed(() =>
    buildComparator({
      sortKey: sortKey.value,
      sortDir: sortDir.value,
      randomOrderMap: randomOrderMap.value,
    })
  );

  const orderedVideos = computed(() =>
    groupAndSort(filteredVideos.value || [], {
      groupByStories: groupByStories.value,
      comparator: comparator.value,
    })
  );

  const orderedIds = computed(() => orderedVideos.value.map((v) => v.id));

  const averageAspectRatio = computed(() => {
    const sampleLimit = 80;
    let sum = 0;
    let count = 0;
    const list = orderedVideos.value;
    for (let i = 0; i < list.length && count < sampleLimit; i += 1) {
      const video = list[i];
      if (!video) continue;
      const direct = Number(video?.aspectRatio);
      if (Number.isFinite(direct) && direct > 0) {
        sum += direct;
        count += 1;
        continue;
      }
      const meta = Number(video?.dimensions?.aspectRatio);
      if (Number.isFinite(meta) && meta > 0) {
        sum += meta;
        count += 1;
      }
    }
    if (!count) return 16 / 9;
    const avg = sum / count;
    return Math.min(3.5, Math.max(0.5, avg));
  });

  const fallbackTileWidth = computed(
    () => ZOOM_TILE_WIDTHS[clampZoomIndex(zoomLevel.value)] ?? 200
  );

  const effectiveColumnWidth = computed(() =>
    masonryMetrics.value.columnWidth && masonryMetrics.value.columnWidth > 0
      ? masonryMetrics.value.columnWidth
      : fallbackTileWidth.value
  );

  const approxTileHeight = computed(() =>
    Math.max(48, effectiveColumnWidth.value / averageAspectRatio.value)
  );

  const viewportHeight = computed(
    () => viewportSize.value.height || (typeof window !== "undefined" ? window.innerHeight : 0)
  );

  const viewportWidth = computed(
    () =>
      viewportSize.value.width ||
      (typeof window !== "undefined" ? window.innerWidth : effectiveColumnWidth.value)
  );

  const derivedColumnCount = computed(() => {
    if (masonryMetrics.value.columnCount && masonryMetrics.value.columnCount > 0) {
      return masonryMetrics.value.columnCount;
    }
    const available =
      masonryMetrics.value.gridWidth && masonryMetrics.value.gridWidth > 0
        ? masonryMetrics.value.gridWidth
        : viewportWidth.value;
    return Math.max(1, Math.floor(available / Math.max(1, effectiveColumnWidth.value)));
  });

  const viewportRows = computed(() =>
    Math.max(1, Math.ceil(viewportHeight.value / Math.max(1, approxTileHeight.value)))
  );

  const viewportItems = computed(() => {
    if (!Number.isFinite(derivedColumnCount.value) || derivedColumnCount.value <= 0) {
      return null;
    }
    return derivedColumnCount.value * viewportRows.value;
  });

  const activationTarget = computed(() => {
    if (!Number.isFinite(viewportItems.value) || viewportItems.value <= 0) {
      return null;
    }
    const multiplier = 2;
    const desired = Math.ceil(viewportItems.value * multiplier);
    const min = 100;
    const max = 600;
    return Math.max(min, Math.min(max, desired));
  });

  const progressiveMaxVisibleNumber = computed(() => activationTarget.value || undefined);

  let scrollEl = null;
  let scrollRaf = 0;
  let scrollHandler = null;

  onMounted(() => {
    scrollEl = scrollContainerRef.value;
    if (!scrollEl) return;

    const updateScroll = () => {
      scrollRaf = 0;
      const top = scrollEl.scrollTop || 0;
      if (Math.abs(scrollTop.value - top) > 0.5) {
        scrollTop.value = top;
      }
    };

    updateScroll();

    scrollHandler = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(updateScroll);
    };

    scrollEl.addEventListener("scroll", scrollHandler, { passive: true });
  });

  onBeforeUnmount(() => {
    if (scrollEl && scrollHandler) {
      scrollEl.removeEventListener("scroll", scrollHandler);
    }
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
  });

  watch(
    () => [effectiveColumnWidth.value, viewportHeight.value],
    () => {
      const mediumWidth = ZOOM_TILE_WIDTHS[1] ?? ZOOM_TILE_WIDTHS[0] ?? 200;
      const tileWidth = Math.max(80, effectiveColumnWidth.value || mediumWidth);
      const height = viewportHeight.value;
      const scale = Math.max(0.45, Math.min(1.6, tileWidth / mediumWidth));
      const nearPx = Math.max(360, Math.round(Math.max(480, height) * scale));
      const rootMargin = "100% 0px 100% 0px";
      if (ioConfig.value.nearPx === nearPx && ioConfig.value.rootMargin === rootMargin) {
        return;
      }
      ioConfig.value = { nearPx, rootMargin };
    }
  );

  watchEffect((onCleanup) => {
    if (!ioRegistry) return;
    if (typeof ioRegistry.setNearPx === "function") {
      ioRegistry.setNearPx(ioConfig.value.nearPx);
    }
    if (typeof ioRegistry.refresh === "function") {
      const raf = requestAnimationFrame(() => {
        ioRegistry.refresh();
      });
      onCleanup(() => {
        if (typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(raf);
        }
      });
    }
  });

  const orderForRange = computed(() =>
    visualOrderedIds.value.length ? visualOrderedIds.value : orderedIds.value
  );

  watchEffect(() => {
    if (!orderedVideos.value.length) return;
    const queue = [];
    orderedVideos.value.forEach((video) => {
      if (!video?.id) return;
      const direct = Number(video?.aspectRatio);
      const meta = Number(video?.dimensions?.aspectRatio);
      const ratio =
        Number.isFinite(direct) && direct > 0
          ? direct
          : Number.isFinite(meta) && meta > 0
          ? meta
          : null;
      if (!ratio) return;
      if (metadataAspectCache.get(video.id) === ratio) return;
      metadataAspectCache.set(video.id, ratio);
      queue.push([video.id, ratio]);
    });

    if (!queue.length) return;

    const processChunk = () => {
      const chunk = queue.splice(0, 120);
      chunk.forEach(([id, ratio]) => updateAspectRatio(id, ratio));
      if (queue.length) {
        if (
          typeof window !== "undefined" &&
          typeof window.requestIdleCallback === "function"
        ) {
          window.requestIdleCallback(processChunk, { timeout: 200 });
        } else {
          setTimeout(processChunk, 0);
        }
      }
    };

    if (
      typeof window !== "undefined" &&
      typeof window.requestIdleCallback === "function"
    ) {
      window.requestIdleCallback(processChunk, { timeout: 200 });
    } else {
      setTimeout(processChunk, 0);
    }
  });

  const viewportMetrics = computed(() => ({
    columnCount: derivedColumnCount.value,
    viewportRows: viewportRows.value,
    approxTileHeight: approxTileHeight.value,
    viewportHeight: viewportHeight.value,
    scrollTop: scrollTop.value,
  }));

  return {
    orderedVideos,
    orderedIds,
    visualOrderedIds,
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
    withLayoutHold,
    isLayoutTransitioning,
  };
}
