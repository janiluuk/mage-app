import { ref, computed, watch, watchEffect } from "vue";

export function useProgressiveList(
  items = [],
  initial = 100,
  batchSize = 50,
  intervalMs = 100,
  options = {}
) {
  const {
    scrollRef = null,
    pauseOnScroll = true,
    longTaskAdaptation = true,
    hadLongTaskRecently = false,
    minBatch = Math.max(8, Math.floor(batchSize / 2)),
    maxBatch = Math.max(batchSize, batchSize * 3),
    scrollIdleMs = 120,
    forceInterval = false,
    maxVisible: maxVisibleOption = null,
    materializeAll = false,
  } = options;

  const safeItems = computed(() => (Array.isArray(items.value) ? items.value : []));
  const maxVisibleInput = computed(() => {
    if (maxVisibleOption && typeof maxVisibleOption === "object" && "value" in maxVisibleOption) {
      return maxVisibleOption.value;
    }
    return maxVisibleOption;
  });

  const resolvedMaxVisible = computed(() =>
    Number.isFinite(maxVisibleInput.value) && maxVisibleInput.value > 0
      ? Math.max(1, Math.floor(maxVisibleInput.value))
      : null
  );

  const visible = ref(0);
  const prevLen = ref(0);
  const didInit = ref(false);
  const maxVisibleRef = ref(Infinity);

  watch(
    () => safeItems.value.length,
    (len) => {
      if (!didInit.value) {
        didInit.value = true;
        visible.value = Math.min(initial, len, resolvedMaxVisible.value ?? len);
        prevLen.value = len;
        return;
      }

      if (len < prevLen.value && visible.value > len) {
        visible.value = len;
      }
      prevLen.value = len;
    },
    { immediate: true }
  );

  watch(
    () => resolvedMaxVisible.value,
    () => {
      maxVisibleRef.value = resolvedMaxVisible.value ?? Infinity;
      if (resolvedMaxVisible.value != null || safeItems.value.length < prevLen.value) {
        const cap = Math.min(safeItems.value.length, maxVisibleRef.value);
        if (visible.value > cap) {
          visible.value = cap;
        }
      }
    }
  );

  const maxCapForRender = computed(() =>
    resolvedMaxVisible.value != null
      ? Math.min(safeItems.value.length, resolvedMaxVisible.value)
      : safeItems.value.length
  );

  const allVisible = computed(() => visible.value >= maxCapForRender.value);

  const shouldUseInterval = computed(
    () =>
      forceInterval ||
      typeof window === "undefined" ||
      typeof window.requestIdleCallback !== "function"
  );

  const isScrolling = ref(false);

  watchEffect((onCleanup) => {
    if (!pauseOnScroll || shouldUseInterval.value) return;
    const target = scrollRef?.value ?? (typeof window !== "undefined" ? window : null);
    if (!target) return;

    let scrollingTimeout = null;
    const onScroll = () => {
      isScrolling.value = true;
      if (scrollingTimeout) clearTimeout(scrollingTimeout);
      scrollingTimeout = setTimeout(() => {
        isScrolling.value = false;
      }, scrollIdleMs);
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => {
      target.removeEventListener("scroll", onScroll);
      if (scrollingTimeout) clearTimeout(scrollingTimeout);
      isScrolling.value = false;
    });
  });

  const hadLongTaskInput = computed(() => {
    if (
      hadLongTaskRecently &&
      typeof hadLongTaskRecently === "object" &&
      "value" in hadLongTaskRecently
    ) {
      return hadLongTaskRecently.value;
    }
    return hadLongTaskRecently;
  });

  const hadLongTaskRecentlyRef = ref(false);
  let longTaskTimeout = null;

  watch(hadLongTaskInput, (next, _prev, onCleanup) => {
    if (!longTaskAdaptation || !next) return;
    hadLongTaskRecentlyRef.value = true;
    if (longTaskTimeout) clearTimeout(longTaskTimeout);
    longTaskTimeout = setTimeout(() => {
      hadLongTaskRecentlyRef.value = false;
    }, 800);
    onCleanup(() => {
      if (longTaskTimeout) clearTimeout(longTaskTimeout);
    });
  });

  watchEffect((onCleanup) => {
    if (!longTaskAdaptation || shouldUseInterval.value) return;
    if (typeof window === "undefined" || typeof PerformanceObserver !== "function") return;

    let observer;
    let observerTimeout = null;
    try {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries && list.getEntries().length) {
          hadLongTaskRecentlyRef.value = true;
          if (observerTimeout) clearTimeout(observerTimeout);
          observerTimeout = setTimeout(() => {
            hadLongTaskRecentlyRef.value = false;
          }, 800);
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      observer = null;
    }

    onCleanup(() => {
      if (observer) {
        try {
          observer.disconnect();
        } catch {}
      }
      if (observerTimeout) clearTimeout(observerTimeout);
    });
  });

  const dynamicBatch = ref(batchSize);

  const computeNextBatch = () => {
    let b = dynamicBatch.value;
    if (hadLongTaskRecentlyRef.value || isScrolling.value) {
      b = Math.max(minBatch, Math.floor(b / 2));
    } else {
      b = Math.min(maxBatch, b + Math.max(2, Math.floor(batchSize / 4)));
    }

    b = Math.max(minBatch, Math.min(maxBatch, b));
    dynamicBatch.value = b;
    return b;
  };

  const startIdleScheduler = () => {
    if (allVisible.value || shouldUseInterval.value) return () => {};

    let cancelled = false;
    let rafId = 0;
    let ricId = 0;

    const schedule = () => {
      if (cancelled) return;
      if (pauseOnScroll && isScrolling.value) {
        rafId = requestAnimationFrame(schedule);
        return;
      }

      const idleCb = () => {
        if (cancelled) return;
        if (!allVisible.value) {
          const add = computeNextBatch();
          const cap = Math.min(safeItems.value.length, maxVisibleRef.value);
          if (visible.value < cap) {
            visible.value = Math.min(visible.value + add, cap);
          }
        }
        rafId = requestAnimationFrame(schedule);
      };

      if (typeof window.requestIdleCallback === "function") {
        ricId = window.requestIdleCallback(idleCb, { timeout: 250 });
      } else {
        idleCb();
      }
    };

    rafId = requestAnimationFrame(schedule);

    return () => {
      cancelled = true;
      if (rafId && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      if (ricId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(ricId);
      }
    };
  };

  const startIntervalScheduler = () => {
    if (allVisible.value || !shouldUseInterval.value) return () => {};
    const id = setInterval(() => {
      const cap = Math.min(safeItems.value.length, maxVisibleRef.value);
      if (visible.value >= cap) return;
      visible.value = Math.min(visible.value + batchSize, cap);
    }, intervalMs);
    return () => clearInterval(id);
  };

  watchEffect((onCleanup) => {
    if (allVisible.value) return;
    const cleanup = shouldUseInterval.value ? startIntervalScheduler() : startIdleScheduler();
    if (cleanup) onCleanup(cleanup);
  });

  const materialized = computed(() =>
    materializeAll ? safeItems.value : safeItems.value.slice(0, visible.value)
  );

  const result = computed(() => ({
    items: materialized.value,
    visibleCount: visible.value,
    targetCount: maxCapForRender.value,
    totalCount: safeItems.value.length,
    materializedCount: materialized.value.length,
    isComplete: visible.value >= maxCapForRender.value,
  }));

  return result;
}
