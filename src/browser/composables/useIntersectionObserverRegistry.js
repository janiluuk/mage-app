import { onBeforeUnmount, watchEffect } from "vue";

export default function useIntersectionObserverRegistry(
  rootRef,
  {
    rootMargin = "1600px 0px",
    threshold = [0, 0.15],
    nearPx = 900,
  } = {}
) {
  const handlers = new Map();
  const ids = new Map();
  const visibleIds = new Set();
  const nearIds = new Set();
  let observer = null;
  let currentNearPx = Math.max(0, Number.isFinite(nearPx) ? nearPx : 0);

  const getRootRect = () => {
    const rootEl = rootRef?.value ?? null;
    if (rootEl && rootEl.getBoundingClientRect) {
      return rootEl.getBoundingClientRect();
    }
    const height = typeof window !== "undefined" ? window.innerHeight : 0;
    return { top: 0, bottom: height };
  };

  const updateFlags = (entry, id, rootRect) => {
    if (id == null) return;
    const r = entry.boundingClientRect;
    if (!r) return;

    const isVisible = r.bottom > rootRect.top && r.top < rootRect.bottom;
    if (isVisible) visibleIds.add(id);
    else visibleIds.delete(id);

    const top = rootRect.top - currentNearPx;
    const bottom = rootRect.bottom + currentNearPx;
    const isNear = r.bottom > top && r.top < bottom;
    if (isNear) nearIds.add(id);
    else nearIds.delete(id);
  };

  const handleEntries = (entries) => {
    const rootRect = getRootRect();
    entries.forEach((entry) => {
      const id = ids.get(entry.target);
      updateFlags(entry, id, rootRect);
      const cb = handlers.get(entry.target);
      if (cb) {
        cb(visibleIds.has(id), entry);
      }
    });
  };

  const ensureObserver = () => {
    if (observer || typeof IntersectionObserver !== "function") return;
    observer = new IntersectionObserver(handleEntries, {
      root: rootRef?.value ?? null,
      rootMargin,
      threshold,
    });
  };

  const observe = (el, id, cb) => {
    if (!el) return;
    ensureObserver();
    if (!observer) return;
    handlers.set(el, cb);
    ids.set(el, id);
    observer.observe(el);
  };

  const unobserve = (el) => {
    if (!el || !observer) return;
    observer.unobserve(el);
    handlers.delete(el);
    ids.delete(el);
  };

  const refresh = () => {
    const rootRect = getRootRect();
    const now =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();

    handlers.forEach((cb, el) => {
      const id = ids.get(el);
      if (!id) return;
      const rect = el.getBoundingClientRect?.();
      if (!rect) return;
      const entry = {
        target: el,
        boundingClientRect: rect,
        intersectionRect: rect,
        isIntersecting: false,
        intersectionRatio: 0,
        time: now,
      };
      updateFlags(entry, id, rootRect);
      entry.isIntersecting = visibleIds.has(id);
      entry.intersectionRatio = entry.isIntersecting ? 1 : 0;
      cb(entry.isIntersecting, entry);
    });
  };

  const setNearPx = (px) => {
    currentNearPx = Math.max(0, Number.isFinite(px) ? px : 0);
  };

  watchEffect(() => {
    if (!rootRef?.value) return;
    ensureObserver();
  });

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    handlers.clear();
    ids.clear();
    visibleIds.clear();
    nearIds.clear();
  });

  return {
    observe,
    unobserve,
    isVisible: (id) => visibleIds.has(id),
    isNear: (id) => nearIds.has(id),
    refresh,
    setNearPx,
    getNearPx: () => currentNearPx,
    getRootMargin: () => rootMargin,
  };
}
