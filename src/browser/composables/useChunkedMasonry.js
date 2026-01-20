import { onMounted, onBeforeUnmount } from "vue";
import { zoomClassForLevel } from "../zoom/utils.js";

const FIXED_ASPECT_RATIO = 16 / 9;

export default function useChunkedMasonry({
  gridRef,
  zoomClassForLevel: zoomClassForLevelProp = zoomClassForLevel,
  getTileWidthForLevel,
  defaultAspect = 16 / 9,
  chunkSize = 200,
  columnGapFallback = 12,
  onOrderChange,
  onMetricsChange,
  onLayoutComplete,
}) {
  const aspectRatioCache = new Map();
  let cachedGridMeasurements = null;
  let lastOrder = null;
  let lastMetrics = null;
  
  // Memoization cache for column count calculations
  const columnCountCache = new Map();
  const COLUMN_CACHE_KEY = (width, zoomLevel) => `${width}_${zoomLevel}`;

  let isLayingOut = false;
  let relayoutRequested = false;

  let resizeTimeout = null;
  let pendingZoomLevel = null;
  let zoomFrame = 0;
  let currentZoomLevel = null;

  const getColumnCount = (grid, computedStyle) => {
    if (typeof getTileWidthForLevel === "function") {
      const cs = computedStyle;
      const gridWidth = grid.clientWidth || grid.getBoundingClientRect().width || 0;
      const padding =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const available = Math.max(0, gridWidth - padding);
      const cls = grid.className || "";
      const match = cls.match(/zoom-(small|medium|large|xlarge|xxlarge)/);
      const levelIndex = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ].indexOf(match?.[1] || "medium");
      
      // Check cache first
      const cacheKey = COLUMN_CACHE_KEY(available, levelIndex);
      if (columnCountCache.has(cacheKey)) {
        return columnCountCache.get(cacheKey);
      }
      
      const desired = Math.max(
        80,
        Math.floor(getTileWidthForLevel(levelIndex) || 200)
      );
      // Ensure we get at least 2 columns if possible, but never less than 1
      let calculated = Math.floor(available / desired);
      
      // Debug: Log if we're getting only 1 column (dev only)
      if (import.meta.env.DEV && calculated === 1 && available > 0) {
        console.warn('Masonry: Only 1 column calculated', {
          available,
          desired,
          calculated,
          gridWidth: available + padding,
          levelIndex
        });
      }
      
      // If we only get 1 column but have enough space, force at least 2 columns
      // Use a smaller desired width to get more columns
      if (calculated === 1 && available >= desired * 0.8) {
        const smallerDesired = Math.max(80, Math.floor(desired * 0.7));
        const recalculated = Math.floor(available / smallerDesired);
        return Math.max(2, Math.min(recalculated, Math.floor(available / 80)));
      }
      
      // Ensure minimum of 2 columns if we have enough space
      if (calculated >= 1 && available >= 200) {
        calculated = Math.max(2, calculated);
      }
      
      const result = Math.max(1, calculated);
      // Cache the result
      columnCountCache.set(cacheKey, result);
      // Limit cache size to prevent memory issues
      if (columnCountCache.size > 50) {
        const firstKey = columnCountCache.keys().next().value;
        columnCountCache.delete(firstKey);
      }
      return result;
    }
    const gtc = computedStyle.gridTemplateColumns;
    if (!gtc || gtc === "none") return 1;
    return gtc.split(" ").length;
  };

  const updateCachedGridMeasurements = () => {
    const grid = gridRef.value;
    if (!grid) return;

    const cs = window.getComputedStyle(grid);
    // Get grid width more reliably
    const gridRect = grid.getBoundingClientRect();
    const gridWidth = gridRect.width || grid.clientWidth || 0;
    
    // Clear column count cache when grid size changes significantly
    if (cachedGridMeasurements && Math.abs(cachedGridMeasurements.gridWidth - gridWidth) > 50) {
      columnCountCache.clear();
    }
    
    let columnCount = getColumnCount(grid, cs);
    const columnGap =
      parseFloat(cs.columnGap) || parseFloat(cs.gap) || columnGapFallback;
    const padding =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const availableWidth = Math.max(0, gridWidth - padding);
    
    // Debug: Log grid measurements (dev only)
    if (import.meta.env.DEV && availableWidth < 100) {
      console.warn('Masonry: Very small available width', {
        gridWidth,
        padding,
        availableWidth,
        clientWidth: grid.clientWidth,
        rectWidth: gridRect.width
      });
    }

    // Handle single-column case for wide grids - force at least 2 columns
    // This prevents layout issues when getColumnCount returns 1 for wide grids
    if (columnCount === 1 && gridWidth > 300) {
      if (import.meta.env.DEV) {
        console.warn('Masonry: Forcing 2 columns for wide grid', {
          gridWidth,
          availableWidth,
          originalColumnCount: columnCount
        });
      }
      // Force at least 2 columns by calculating with a reasonable minimum width
      columnCount = Math.max(2, Math.floor(availableWidth / 200));
    }

    const totalGapWidth = columnGap * Math.max(0, columnCount - 1);
    // Use Math.floor to ensure consistent column widths and avoid fractional pixels
    let columnWidth = Math.max(
      1,
      Math.floor((availableWidth - totalGapWidth) / Math.max(1, columnCount))
    );
    
    // Ensure columnWidth is reasonable - if it's too small, recalculate with fewer columns
    let finalColumnCount = columnCount;
    if (columnWidth < 80 && columnCount > 1) {
      // Recalculate with one less column if width is too small
      finalColumnCount = Math.max(1, columnCount - 1);
      const newTotalGapWidth = columnGap * Math.max(0, finalColumnCount - 1);
      columnWidth = Math.max(
        80,
        Math.floor((availableWidth - newTotalGapWidth) / Math.max(1, finalColumnCount))
      );
    }
    
    // Recalculate available width to account for rounding, ensuring no wasted space
    const actualTotalWidth = columnWidth * finalColumnCount + (columnGap * Math.max(0, finalColumnCount - 1));

    cachedGridMeasurements = {
      columnWidth,
      columnCount: finalColumnCount,
      columnGap,
      gridWidth: availableWidth,
    };

    if (typeof onMetricsChange === "function") {
      const next = {
        columnWidth,
        columnCount: finalColumnCount,
        columnGap,
        gridWidth: availableWidth,
      };
      const prev = lastMetrics;
      const changed =
        !prev ||
        prev.columnWidth !== next.columnWidth ||
        prev.columnCount !== next.columnCount ||
        prev.columnGap !== next.columnGap ||
        prev.gridWidth !== next.gridWidth;
      if (changed) {
        lastMetrics = next;
        onMetricsChange(next);
      }
    }
  };

  const scheduleLayout = () => {
    if (isLayingOut) {
      relayoutRequested = true;
      return;
    }
    isLayingOut = true;

    // Throttle layout updates to reduce flickering
    requestAnimationFrame(() => {
      const grid = gridRef.value;
      if (!grid) {
        isLayingOut = false;
        return;
      }

      if (!cachedGridMeasurements) updateCachedGridMeasurements();
      const { columnWidth, columnCount, columnGap } = cachedGridMeasurements || {};
      if (!columnWidth || !columnCount) {
        isLayingOut = false;
        return;
      }

      // Use the column count from cached measurements
      const effectiveColumnCount = columnCount;
      const columnHeights = new Array(effectiveColumnCount).fill(0);
      const items = Array.from(grid.querySelectorAll(".video-item"));
      const positions = [];

      let i = 0;
      const step = () => {
        const end = Math.min(i + chunkSize, items.length);
        for (; i < end; i += 1) {
          const el = items[i];

          const id = el.dataset.videoId || el.dataset.filename || `__idx_${i}`;
          let ar = aspectRatioCache.get(id);
          if (!ar) {
            const datasetRatio = Number(el.dataset?.aspectRatio);
            if (Number.isFinite(datasetRatio) && datasetRatio > 0) {
              ar = datasetRatio;
              aspectRatioCache.set(id, ar);
            }
          }
          if (!ar) {
            const v = el.querySelector("video");
            if (v && v.videoWidth && v.videoHeight) {
              ar = v.videoWidth / v.videoHeight;
              aspectRatioCache.set(id, ar);
            } else {
              ar = defaultAspect;
            }
          }

          // Use fixed 16:9 aspect ratio for consistent grid
          const h = Math.max(1, Math.round(columnWidth / FIXED_ASPECT_RATIO));

          let minIdx = 0;
          let minVal = columnHeights[0];
          // Use effectiveColumnCount instead of columnCount to match array size
          for (let c = 1; c < effectiveColumnCount; c += 1) {
            const val = columnHeights[c];
            if (val < minVal) {
              minVal = val;
              minIdx = c;
            }
          }

          // Calculate precise position to avoid alignment issues
          // Ensure minIdx doesn't exceed column count
          const safeMinIdx = Math.min(minIdx, effectiveColumnCount - 1);
          const x = safeMinIdx * (columnWidth + columnGap);
          const y = columnHeights[safeMinIdx];

          el.style.position = "absolute";
          el.style.width = `${columnWidth}px`;
          el.style.height = `${h}px`;
          el.style.transform = `translate(${x}px, ${y}px)`;
          el.style.margin = "0"; // Ensure no margin interferes

          const vc = el.querySelector(
            ".video-container, .video-placeholder, .error-indicator"
          );
          if (vc) vc.style.height = `${h}px`;

          if (el.dataset.pos !== "1") {
            el.dataset.pos = "1";
          }

          el.dataset.x = String(x);
          el.dataset.y = String(y);
          positions.push({ id, x, y });

          columnHeights[safeMinIdx] = Math.round(y + h + columnGap);
        }

        if (i < items.length) {
          // Throttle step execution to reduce flickering
          setTimeout(() => requestAnimationFrame(step), 0);
        } else {
          const maxHeight = columnHeights.length
            ? Math.max(...columnHeights)
            : 0;
          grid.style.height = `${maxHeight}px`;
          grid.style.position = "relative";

          if (typeof onOrderChange === "function") {
            positions.sort((a, b) => a.y - b.y || a.x - b.x);
            const order = positions.map((p) => p.id);
            const prev = lastOrder || [];
            const changed =
              order.length !== prev.length ||
              order.some((id, idx) => id !== prev[idx]);
            if (changed) {
              lastOrder = order;
              onOrderChange(order);
            }
          }

          isLayingOut = false;
          if (typeof onLayoutComplete === "function") {
            try {
              const metrics = cachedGridMeasurements || null;
              onLayoutComplete({
                columnHeights: columnHeights.slice(),
                maxHeight,
                metrics,
              });
            } catch (err) {
              if (import.meta.env.DEV) {
                console.error("useChunkedMasonry onLayoutComplete error", err);
              }
            }
          }
          if (relayoutRequested) {
            relayoutRequested = false;
            scheduleLayout();
          }
        }
      };

      step();
    });
  };

  const updateAspectRatio = (id, ar) => {
    if (!id || !Number.isFinite(ar) || ar <= 0) return;
    const prev = aspectRatioCache.get(id);
    if (prev !== ar) {
      aspectRatioCache.set(id, ar);
      const grid = gridRef.value;
      if (grid) {
        const selectorId = window.CSS?.escape ? window.CSS.escape(id) : id;
        const el = selectorId
          ? grid.querySelector(`[data-video-id="${selectorId}"]`)
          : null;
        if (el) {
          el.dataset.aspectRatio = String(ar);
          el.style.aspectRatio = String(ar);
        }
      }
      scheduleLayout();
    }
  };

  const onItemsChanged = () => {
    cachedGridMeasurements = null;
    scheduleLayout();
  };

  const setZoomClass = (level) => {
    const desired = Math.max(0, Math.floor(level));
    pendingZoomLevel = desired;

    if (zoomFrame) return;

    zoomFrame = requestAnimationFrame(() => {
      zoomFrame = 0;
      const target = pendingZoomLevel;
      pendingZoomLevel = null;

      if (!Number.isFinite(target)) return;

      const grid = gridRef.value;
      if (!grid) return;

      if (currentZoomLevel === target) return;
      currentZoomLevel = target;

      const classes = [
        "zoom-small",
        "zoom-medium",
        "zoom-large",
        "zoom-xlarge",
        "zoom-xxlarge",
      ];
      classes.forEach((c) => grid.classList.remove(c));
      grid.classList.add(zoomClassForLevelProp(target));
      cachedGridMeasurements = null;
      updateCachedGridMeasurements();
      scheduleLayout();
    });
  };

  const onScroll = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scheduleLayout();
    }, 150);
  };

  const onResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cachedGridMeasurements = null;
      scheduleLayout();
    }, 300);
  };

  onMounted(() => {
    scheduleLayout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
  });

  onBeforeUnmount(() => {
    if (zoomFrame) {
      cancelAnimationFrame(zoomFrame);
      zoomFrame = 0;
    }
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    clearTimeout(resizeTimeout);
  });

  return {
    updateAspectRatio,
    onItemsChanged,
    setZoomClass,
    scheduleLayout,
  };
}
