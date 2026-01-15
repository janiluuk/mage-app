import { ref, computed } from "vue";

export default function useSelectionState() {
  const selected = ref(new Set());
  const anchorId = ref(null);

  const size = computed(() => selected.value.size);

  const selectOnly = (id) => {
    selected.value = (() => {
      const prev = selected.value;
      const alreadyOnly = prev.size === 1 && prev.has(id);
      if (alreadyOnly) {
        anchorId.value = null;
        return new Set();
      }

      anchorId.value = id;
      return new Set([id]);
    })();
  };

  const toggle = (id) => {
    const next = new Set(selected.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected.value = next;
    anchorId.value = id;
  };

  const clear = () => {
    selected.value = new Set();
    anchorId.value = null;
  };

  const selectRange = (orderedIds, endId, additive = false) => {
    if (!orderedIds?.length) return;
    const anchor = anchorId.value ?? endId;
    const i1 = orderedIds.indexOf(anchor);
    const i2 = orderedIds.indexOf(endId);
    if (i1 === -1 || i2 === -1) return;

    const [from, to] = i1 <= i2 ? [i1, i2] : [i2, i1];
    const rangeIds = orderedIds.slice(from, to + 1);

    const next = additive ? new Set(selected.value) : new Set();
    for (const id of rangeIds) next.add(id);
    selected.value = next;
    anchorId.value = anchor;
  };

  const setSelected = (next) => {
    const resolved = typeof next === "function" ? next(selected.value) : next;
    selected.value = resolved instanceof Set ? resolved : new Set(resolved || []);
  };

  return {
    selected,
    size,
    anchorId,
    setSelected,
    selectOnly,
    toggle,
    clear,
    selectRange,
  };
}
