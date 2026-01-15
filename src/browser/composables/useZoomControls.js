import { watch } from "vue";
import { clampZoomIndex, calculateSafeZoom } from "../zoom/utils";

const ZOOM_LABELS = ["Compact", "Cozy", "Comfy", "Roomy", "Immersive"];

export function getZoomLabelByIndex(index) {
  const clamped = clampZoomIndex(index);
  return ZOOM_LABELS[clamped] ?? `Level ${clamped}`;
}

export function useZoomControls({
  zoomLevel,
  setZoomLevel,
  orderedVideoCount = 0,
  renderLimitStep,
  showFilenames,
  setZoomClass,
  scheduleLayout,
}) {
  const applyZoom = (level) => {
    const clamped = clampZoomIndex(level);
    if (clamped === zoomLevel.value) return;
    setZoomLevel(clamped);
    setZoomClass?.(clamped);
    scheduleLayout?.();
  };

  const getMinimumZoomLevel = () => {
    const windowWidth = window.innerWidth;
    if (orderedVideoCount.value > 200 && windowWidth > 2560) return 2;
    if (orderedVideoCount.value > 150 && windowWidth > 1920) return 1;
    return 0;
  };

  const handleZoomChangeSafe = (desiredZoom) => {
    const minZoom = getMinimumZoomLevel();
    const safeZoom = Math.max(desiredZoom, minZoom);
    applyZoom(safeZoom);
  };

  const applyZoomFromSettings = (value) => {
    const clamped = clampZoomIndex(value);
    setZoomLevel(clamped);
    setZoomClass?.(clamped);
    scheduleLayout?.();
  };

  watch(zoomLevel, (next) => {
    setZoomClass?.(next);
  });

  watch(
    () => orderedVideoCount.value,
    (count) => {
      if (count <= 100) return;
      const safeZoom = calculateSafeZoom(
        window.innerWidth,
        window.innerHeight,
        count
      );
      if (safeZoom > zoomLevel.value) {
        applyZoom(safeZoom);
      }
    }
  );

  return {
    handleZoomChangeSafe,
    getMinimumZoomLevel,
    applyZoomFromSettings,
    setZoomLevel: applyZoom,
  };
}
