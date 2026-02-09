<template>
  <div
    v-if="visible && position"
    ref="rootRef"
    class="context-menu"
    :style="menuStyle"
    data-context-menu
    @click.stop
  >
    <div class="context-menu-header" :title="headerText">
      <span class="context-menu-title">{{ headerText }}</span>
    </div>
    <div class="context-menu-items">
      <template v-for="(item, index) in menuItems" :key="item.id || `sep-${index}`">
        <div v-if="item.type === 'separator'" class="context-menu-separator" />
        <button
          v-else
          class="context-menu-item"
          :class="{ 'context-menu-item--danger': item.dangerous }"
          :disabled="item.disabled"
          type="button"
          @click="handleAction(item)"
        >
          {{ item.label }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: null },
  contextId: { type: [String, Number], default: undefined },
  getById: { type: Function, default: null },
  selectionCount: { type: Number, default: 0 },
  onClose: { type: Function, default: () => {} },
  onAction: { type: Function, default: () => {} },
});

const rootRef = ref(null);

const primaryVideo = computed(() => {
  if (!props.contextId || !props.getById) return undefined;
  try {
    return props.getById(props.contextId);
  } catch {
    return undefined;
  }
});

const headerText = computed(() => {
  if (props.selectionCount > 1) return `${props.selectionCount} items selected`;
  if (primaryVideo.value?.name) return primaryVideo.value.name;
  return "Actions";
});

const menuItems = computed(() => {
  if (!props.contextId || !primaryVideo.value) {
    return [
      {
        id: "copy-filename",
        label: "Copy Filename",
        action: "copy-filename",
        disabled: true,
      },
    ];
  }
  const status = primaryVideo.value.status || "";
  const items = [];

  const pushSection = (sectionItems) => {
    const cleaned = sectionItems.filter(Boolean);
    if (!cleaned.length) return;
    if (items.length) items.push({ type: "separator" });
    items.push(...cleaned);
  };

  pushSection([
    { id: "edit", label: "Edit", action: "edit" },
    { id: "download", label: "Download", action: "download", disabled: status !== "finished" },
    { id: "soundtrack", label: "Add Soundtrack", action: "soundtrack", disabled: status !== "finished" },
    { id: "extend", label: "Extend Video", action: "extend", disabled: status !== "finished" },
    {
      id: "open-external",
      label: "Open in new tab",
      action: "open-external",
      disabled: !primaryVideo.value?.fullPath,
    },
  ]);

  // Batch actions — only shown when multiple items are selected
  if (props.selectionCount > 1) {
    pushSection([
      { id: "batch-download", label: `Download ${props.selectionCount} items`, action: "batch:download" },
      { id: "batch-reprocess", label: `Re-process ${props.selectionCount} items`, action: "batch:reprocess" },
      { id: "batch-apply-preset", label: "Apply Preset to Selection", action: "batch:apply-preset" },
    ]);
  }

  pushSection([
    {
      id: "copy-path",
      label: "Copy Path",
      action: "copy-path",
      disabled: !primaryVideo.value?.fullPath,
    },
    { id: "copy-filename", label: "Copy Filename", action: "copy-filename" },
    { id: "copy-relative-path", label: "Copy Relative Path", action: "copy-relative-path" },
  ]);

  const ratingItems = [5, 4, 3, 2, 1].map((value) => ({
    id: `metadata-rate-${value}`,
    label: `Rate ${value} star${value === 1 ? "" : "s"}`,
    action: `metadata:rate:${value}`,
  }));

  pushSection([
    { id: "metadata-open", label: "Manage tags", action: "metadata:open" },
    ...ratingItems,
    { id: "metadata-rate-clear", label: "Clear rating", action: "metadata:rate:clear" },
  ]);

  pushSection([{ id: "file-properties", label: "File details", action: "file-properties" }]);

  pushSection([{ id: "delete", label: "Delete", action: "delete", dangerous: true }]);

  return items;
});

const menuStyle = computed(() => {
  const menuWidth = 260;
  const approxHeight = menuItems.value.reduce((total, item) => {
    if (item.type === "separator") return total + 8;
    return total + 36;
  }, 40);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x = props.position?.x ?? 0;
  let y = props.position?.y ?? 0;
  if (x + menuWidth > vw) x = Math.max(10, vw - menuWidth - 10);
  if (y + approxHeight > vh) y = Math.max(10, vh - approxHeight - 10);
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

const handleAction = (item) => {
  if (item.disabled) return;
  props.onAction(item.action);
  props.onClose();
};

const handlePointerDown = (event) => {
  const root = rootRef.value;
  if (root && !root.contains(event.target)) props.onClose();
};

const handleKeyDown = (event) => {
  if (event.key === "Escape") props.onClose();
};

const handleWindowChange = () => props.onClose();

onMounted(() => {
  document.addEventListener("mousedown", handlePointerDown, true);
  document.addEventListener("touchstart", handlePointerDown, true);
  document.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("resize", handleWindowChange);
  window.addEventListener("scroll", handleWindowChange, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handlePointerDown, true);
  document.removeEventListener("touchstart", handlePointerDown, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  window.removeEventListener("resize", handleWindowChange);
  window.removeEventListener("scroll", handleWindowChange, true);
});
</script>
