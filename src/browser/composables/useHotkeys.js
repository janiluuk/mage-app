import { onMounted, onBeforeUnmount, ref } from "vue";

const clampIndex = (value, min, max) => Math.min(max, Math.max(min, value));

const isEditableTarget = (target) => {
  if (!target) return false;
  const tag = typeof target.tagName === "string" ? target.tagName.toUpperCase() : "";
  if (target.isContentEditable) return true;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

export function useHotkeys({
  runAction,
  getSelection,
  getZoomIndex,
  setZoomIndexSafe,
  minZoomIndex = 0,
  maxZoomIndex = 4,
  wheelStepUnits = 120,
  maxStepsPerFrame = 3,
} = {}) {
  const accumRef = ref(0);
  const rafRef = ref(0);
  const lastDirRef = ref(0);

  const normalizeDelta = (event) => {
    let dy = event.deltaY;
    if (event.deltaMode === 1) dy *= 16;
    else if (event.deltaMode === 2) dy *= 120;
    return dy;
  };

  const handleKeydown = (event) => {
    if (isEditableTarget(event.target)) return;
    if (event.target?.closest?.("[data-hotkey-exempt]")) return;

    const selection = typeof getSelection === "function" ? getSelection() : null;
    const size = selection?.size ?? 0;

    if (size) {
      if (event.key === "Enter") {
        event.preventDefault();
        runAction?.("open-external", selection);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        runAction?.("copy-path", selection);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        runAction?.("move-to-trash", selection);
        return;
      }
    }

    if (getZoomIndex && setZoomIndexSafe) {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoomIndexSafe(clampIndex(getZoomIndex() + 1, minZoomIndex, maxZoomIndex));
      } else if (event.key === "-") {
        event.preventDefault();
        setZoomIndexSafe(clampIndex(getZoomIndex() - 1, minZoomIndex, maxZoomIndex));
      }
    }
  };

  const tickWheel = () => {
    rafRef.value = 0;
    const units = wheelStepUnits || 120;
    let stepsFloat = accumRef.value / units;
    let steps = stepsFloat < 0 ? Math.floor(stepsFloat) : Math.ceil(stepsFloat);
    steps = Math.max(-maxStepsPerFrame, Math.min(maxStepsPerFrame, steps));

    if (!steps) return;
    accumRef.value -= steps * units;

    let current = getZoomIndex();
    const dir = steps > 0 ? lastDirRef.value || 1 : lastDirRef.value || -1;
    const sign = steps > 0 ? Math.sign(dir) : Math.sign(dir);

    const iterations = Math.abs(steps);
    for (let i = 0; i < iterations; i += 1) {
      const next = clampIndex(current + (sign < 0 ? -1 : 1), minZoomIndex, maxZoomIndex);
      if (next === current) break;
      setZoomIndexSafe(next);
      current = next;
    }

    lastDirRef.value = sign;
  };

  const handleWheel = (event) => {
    if (!getZoomIndex || !setZoomIndexSafe) return;
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();

    const dy = normalizeDelta(event);
    accumRef.value -= dy;

    if (!rafRef.value) {
      rafRef.value = requestAnimationFrame(tickWheel);
    }
  };

  onMounted(() => {
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("wheel", handleWheel, { passive: false });
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("wheel", handleWheel, { passive: false });
    if (rafRef.value) cancelAnimationFrame(rafRef.value);
    rafRef.value = 0;
    accumRef.value = 0;
    lastDirRef.value = 0;
  });
}
