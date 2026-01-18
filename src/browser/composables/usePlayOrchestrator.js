import { ref, watch, onBeforeUnmount } from "vue";

export default function usePlayOrchestrator({ visibleIds, loadedIds, maxPlaying }) {
  const playingSet = ref(new Set());
  const hoveredId = ref(null);
  const startOrder = ref([]);
  const recentlyErrored = new Map();

  const pushStartOrder = (id) => {
    startOrder.value = startOrder.value.filter((x) => x !== id);
    startOrder.value.push(id);
  };

  const reportStarted = (id) => {
    if (playingSet.value.has(id)) return;
    const next = new Set(playingSet.value);
    next.add(id);
    playingSet.value = next;
    setTimeout(() => pushStartOrder(id), 0);
  };

  const reportPlayError = (id) => {
    recentlyErrored.set(id, performance.now());
    if (!playingSet.value.has(id)) return;
    const next = new Set(playingSet.value);
    next.delete(id);
    playingSet.value = next;
  };

  const evictIfNeeded = (baseSet) => {
    const cap = Math.max(0, Number(maxPlaying.value) || 0);
    if (baseSet.size <= cap) return baseSet;

    const hovered = hoveredId.value;
    const entries = Array.from(baseSet);
    const orderIdx = new Map();
    startOrder.value.forEach((id, idx) => orderIdx.set(id, idx));

    const desirability = (id) => {
      const isHovered = hovered && id === hovered ? 10 : 0;
      const visible = visibleIds.value.has(id) ? 5 : 0;
      const loaded = loadedIds.value.has(id) ? 1 : 0;
      return isHovered + visible + loaded;
    };

    entries.sort((a, b) => {
      const db = desirability(b);
      const da = desirability(a);
      if (db !== da) return db - da;
      const ib = orderIdx.get(b) ?? -1;
      const ia = orderIdx.get(a) ?? -1;
      return ib - ia;
    });

    const toKeep = new Set(entries.slice(0, cap));

    if (hovered && visibleIds.value.has(hovered)) {
      toKeep.add(hovered);
      if (toKeep.size > cap) {
        const nonHovered = entries.filter((id) => id !== hovered);
        const leastImportant = nonHovered[nonHovered.length - 1];
        if (leastImportant) toKeep.delete(leastImportant);
      }
    }

    return toKeep;
  };

  const reconcile = () => {
    const next = new Set(playingSet.value);
    let changed = false;

    for (const id of Array.from(next)) {
      if (!visibleIds.value.has(id) || !loadedIds.value.has(id)) {
        next.delete(id);
        changed = true;
        if (startOrder.value.length) {
          startOrder.value = startOrder.value.filter((x) => x !== id);
        }
      }
    }

    for (const id of visibleIds.value) {
      if (loadedIds.value.has(id) && !next.has(id)) {
        next.add(id);
        changed = true;
        setTimeout(() => pushStartOrder(id), 0);
      }
    }

    const hovered = hoveredId.value;
    if (hovered && visibleIds.value.has(hovered) && loadedIds.value.has(hovered)) {
      if (!next.has(hovered)) {
        next.add(hovered);
        changed = true;
        setTimeout(() => pushStartOrder(hovered), 0);
      }
    }

    if (next.size > maxPlaying.value * 1.1) {
      const evicted = evictIfNeeded(next);
      if (evicted.size !== next.size) {
        next.clear();
        evicted.forEach((id) => next.add(id));
        changed = true;
      }
    }

    if (changed) {
      playingSet.value = next;
    }
  };

  const markHover = (id) => {
    if (hoveredId.value === id) return;
    hoveredId.value = id;
    reconcile();
  };

  watch([visibleIds, loadedIds, maxPlaying], () => {
    reconcile();
  });

  const cleanup = setInterval(() => {
    const now = performance.now();
    for (const [id, ts] of recentlyErrored.entries()) {
      if (now - ts > 8000) {
        recentlyErrored.delete(id);
      }
    }
  }, 2000);

  onBeforeUnmount(() => clearInterval(cleanup));

  return {
    playingSet,
    markHover,
    reportStarted,
    reportPlayError,
    cleanup,
  };
}
