<template>
  <div class="header">
    <div class="nav-left">
      <button
        class="file-input-label"
        :disabled="isLoading"
        title="Refresh library"
        type="button"
        @click="onRefresh"
      >
        <FolderIcon />
      </button>
      <span v-if="isLoading" class="selection-info">Refreshing...</span>
    </div>

    <div class="controls">
      <button
        class="toggle-button"
        :class="{ active: showFilenames }"
        :disabled="isLoading"
        title="Show/hide filenames"
        type="button"
        @click="onToggleFilenames"
      >
        <TextIcon />
      </button>

      <div :style="dividerStyle">
        <div class="video-limit-control" title="Limit rendered VideoCards">
          <FilmIcon />
          <input
            type="range"
            min="0"
            :max="renderLimitMaxStep"
            :value="renderLimitStep"
            step="1"
            style="width: 100px"
            :disabled="isLoading"
            aria-label="Rendered VideoCards limit"
            :aria-valuetext="renderLimitLabel"
            @input="handleRenderLimitChange"
          />
          <span style="font-size: 0.8rem">{{ renderLimitLabel }}</span>
        </div>

        <div class="zoom-control" title="Zoom">
          <ZoomInIcon />
          <input
            type="range"
            :min="minZoomIndex"
            :max="zoomMaxIndex"
            :value="zoomLevel"
            step="1"
            :disabled="isLoading"
            :style="{ accentColor: zoomLevel >= minZoomIndex ? '#51cf66' : '#ffa726' }"
            @input="handleZoomInput"
          />
          <span v-if="zoomLevel < minZoomIndex" style="color: #ffa726; font-size: 0.65rem">!</span>
        </div>
      </div>

      <div :style="dividerStyle">
        <SortIcon />
        <select
          class="select-control"
          :value="sortSelection"
          :disabled="isLoading"
          title="Choose sort order"
          @change="(e) => onSortChange(e.target.value)"
        >
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="created-asc" title="Falls back to Modified time if creation time is unavailable.">
            Created ↑
          </option>
          <option value="created-desc" title="Falls back to Modified time if creation time is unavailable.">
            Created ↓
          </option>
          <option value="random">Random</option>
        </select>

        <button
          class="toggle-button"
          :class="{ active: groupByStories }"
          :disabled="isLoading"
          title="Group by stories"
          type="button"
          @click="onGroupByStoriesToggle"
        >
          <GridIcon />
        </button>

        <button
          v-if="sortKey === SortKey.RANDOM"
          class="toggle-button"
          :disabled="isLoading"
          title="Reshuffle"
          type="button"
          @click="onReshuffle"
        >
          <ShuffleIcon />
        </button>

        <div style="position: relative">
          <button
            :ref="setFiltersButtonRef"
            class="toggle-button"
            :class="{ active: filtersActiveCount > 0 || filtersAreOpen }"
            :disabled="isLoading"
            :title="filtersActiveCount > 0 ? `Filters active (${filtersActiveCount})` : 'Open filters'"
            type="button"
            @click="onFiltersToggle"
          >
            <FilterIcon />
            <span class="filters-button-label">Filters</span>
            <span v-if="filtersActiveCount > 0" class="filters-button-badge">{{ filtersActiveCount }}</span>
          </button>
        </div>

        <div v-if="viewMode === 'files'" :style="dividerStyle">
          <select
            class="select-control"
            :value="viewMode"
            :disabled="isLoading"
            title="Select view mode"
            @change="(e) => onViewModeChange(e.target.value)"
          >
            <option value="videojobs">Video Jobs</option>
            <option value="files">Files</option>
          </select>

          <button
            class="toggle-button"
            :class="{ active: viewGroupedByTags }"
            :disabled="isLoading"
            title="Group files by tags"
            type="button"
            @click="onToggleGroupedByTags"
          >
            <TagIcon />
            <span>Group by Tags</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h } from "vue";
import { ZOOM_MAX_INDEX } from "../zoom/config";
import { clampZoomIndex } from "../zoom/utils";
import { SortKey } from "../utils/sorting";

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  onRefresh: { type: Function, default: () => {} },
  showFilenames: { type: Boolean, default: true },
  onToggleFilenames: { type: Function, default: () => {} },
  renderLimitStep: { type: Number, default: 10 },
  renderLimitLabel: { type: String, default: "Max" },
  renderLimitMaxStep: { type: Number, default: 10 },
  onRenderLimitChange: { type: Function, default: () => {} },
  zoomLevel: { type: Number, default: 1 },
  handleZoomChangeSafe: { type: Function, default: () => {} },
  getMinimumZoomLevel: { type: Function, default: () => 0 },
  sortKey: { type: String, default: SortKey.NAME },
  sortSelection: { type: String, default: "name-asc" },
  groupByStories: { type: Boolean, default: false },
  onSortChange: { type: Function, default: () => {} },
  onGroupByStoriesToggle: { type: Function, default: () => {} },
  onReshuffle: { type: Function, default: () => {} },
  filtersActiveCount: { type: Number, default: 0 },
  filtersAreOpen: { type: Boolean, default: false },
  filtersButtonRef: { type: Object, default: null },
  onFiltersToggle: { type: Function, default: () => {} },
  viewMode: { type: String, default: 'videojobs' },
  viewGroupedByTags: { type: Boolean, default: false },
  onViewModeChange: { type: Function, default: () => {} },
  onToggleGroupedByTags: { type: Function, default: () => {} },
});

const zoomMaxIndex = ZOOM_MAX_INDEX;

const minZoomIndex = computed(() => props.getMinimumZoomLevel());

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  marginLeft: "0.6rem",
  paddingLeft: "0.6rem",
  borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
};

const handleRenderLimitChange = (event) => {
  const value = parseInt(event.target.value, 10);
  props.onRenderLimitChange(value);
};

const handleZoomInput = (event) => {
  const value = clampZoomIndex(parseInt(event.target.value, 10));
  props.handleZoomChangeSafe(value);
};

const setFiltersButtonRef = (el) => {
  if (props.filtersButtonRef && typeof props.filtersButtonRef === "object") {
    props.filtersButtonRef.value = el;
  }
};

const Icon = defineComponent({
  name: "BrowserIcon",
  props: {
    viewBox: { type: String, default: "0 0 24 24" },
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        "svg",
        {
          viewBox: props.viewBox,
          width: "1em",
          height: "1em",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          fill: "none",
          ...attrs,
        },
        slots.default ? slots.default() : []
      );
  },
});

const FolderIcon = defineComponent({
  name: "FolderIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [h("path", { d: "M3 4h5l2 2h11v14H3z" })]);
  },
});

const TextIcon = defineComponent({
  name: "TextIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("path", { d: "M4 7V4h16v3" }),
        h("path", { d: "M12 4v16" }),
        h("path", { d: "M9 20h6" }),
      ]);
  },
});

const FilmIcon = defineComponent({
  name: "FilmIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("rect", { x: "2", y: "2", width: "20", height: "20", rx: "2" }),
        h("line", { x1: "7", y1: "2", x2: "7", y2: "22" }),
        h("line", { x1: "17", y1: "2", x2: "17", y2: "22" }),
        h("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
      ]);
  },
});

const ZoomInIcon = defineComponent({
  name: "ZoomInIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("circle", { cx: "11", cy: "11", r: "7" }),
        h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
        h("line", { x1: "11", y1: "8", x2: "11", y2: "14" }),
        h("line", { x1: "8", y1: "11", x2: "14", y2: "11" }),
      ]);
  },
});

const GridIcon = defineComponent({
  name: "GridIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("rect", { x: "3", y: "3", width: "7", height: "7" }),
        h("rect", { x: "14", y: "3", width: "7", height: "7" }),
        h("rect", { x: "14", y: "14", width: "7", height: "7" }),
        h("rect", { x: "3", y: "14", width: "7", height: "7" }),
      ]);
  },
});

const ShuffleIcon = defineComponent({
  name: "ShuffleIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("polyline", { points: "16 3 21 3 21 8" }),
        h("line", { x1: "4", y1: "20", x2: "21", y2: "3" }),
        h("polyline", { points: "21 16 21 21 16 21" }),
        h("line", { x1: "4", y1: "4", x2: "9", y2: "9" }),
        h("line", { x1: "15", y1: "15", x2: "21", y2: "21" }),
      ]);
  },
});

const SortIcon = defineComponent({
  name: "SortIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("path", { d: "M3 9l4-4 4 4" }),
        h("path", { d: "M7 5v14" }),
        h("path", { d: "M21 15l-4 4-4-4" }),
        h("path", { d: "M17 5v14" }),
      ]);
  },
});

const FilterIcon = defineComponent({
  name: "FilterIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("path", { d: "M4 4h16" }),
        h("path", { d: "M6 9h12" }),
        h("path", { d: "M10 14h4" }),
        h("path", { d: "M12 14v6" }),
      ]);
  },
});

const TagIcon = defineComponent({
  name: "TagIcon",
  setup(_, { attrs }) {
    return () =>
      h(Icon, attrs, () => [
        h("path", { d: "M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.3-8.3a1 1 0 0 0 0-1.41L12 2z" }),
        h("circle", { cx: "7", cy: "7", r: "1.5" }),
      ]);
  },
});
</script>
