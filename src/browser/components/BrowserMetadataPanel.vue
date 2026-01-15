<template>
  <aside
    v-if="isOpen || showCollapsedHint"
    ref="rootRef"
    :class="[
      'metadata-panel',
      isOpen ? 'metadata-panel--open' : '',
      !hasSelection ? 'metadata-panel--empty' : '',
      !isOpen ? 'metadata-panel--collapsed' : '',
    ]"
  >
    <button
      v-if="!isOpen && showCollapsedHint"
      class="metadata-panel__collapsed-shell"
      type="button"
      :aria-label="collapsedLabel"
      @click="onToggle"
    >
      <span class="metadata-panel__collapsed-handle" aria-hidden="true" />
      <span class="metadata-panel__collapsed-label">Details</span>
      <span class="metadata-panel__collapsed-count">
        {{ collapsedCountLabel }}
      </span>
    </button>

    <div
      v-else
      class="metadata-panel__container"
      role="complementary"
      aria-label="Selection metadata"
      :style="{ '--metadata-panel-height': `${Math.round(resolvedDockHeight)}px` }"
    >
      <div class="metadata-panel__header">
        <div
          class="metadata-panel__handle"
          role="slider"
          tabindex="0"
          aria-label="Resize metadata panel"
          aria-orientation="vertical"
          :aria-valuemin="Math.round(minHeight)"
          :aria-valuemax="Math.round(effectiveMaxHeight)"
          :aria-valuenow="Math.round(resolvedDockHeight)"
          title="Drag or use arrow keys to resize"
          @pointerdown="handleResizePointerDown"
          @keydown="handleResizeKeyDown"
        />
        <div class="metadata-panel__titles">
          <span class="metadata-panel__title">Details</span>
          <span class="metadata-panel__subtitle">
            {{ hasSelection ? `${derivedSelectionCount} selected` : "No selection" }}
          </span>
        </div>
        <button
          v-if="showFocusButton"
          class="metadata-panel__focus"
          type="button"
          aria-label="Focus selection in grid"
          title="Scroll to selected videos"
          @click="onFocusSelection"
        >
          Focus
        </button>
        <button class="metadata-panel__toggle" type="button" @click="onToggle">
          {{ isOpen ? "Hide" : "Show" }}
        </button>
      </div>

      <div
        :class="[
          'metadata-panel__content',
          !hasSelection ? 'metadata-panel__content--empty' : '',
        ]"
      >
        <div v-if="!hasSelection" class="metadata-panel__empty-state" aria-live="polite">
          <h3>No clips selected</h3>
          <p>Pick videos from the grid to see quick stats and tags here.</p>
          <p>Tip: Use Shift or Ctrl/Cmd to build multi-select batches.</p>
        </div>

        <div v-else class="metadata-panel__body">
          <section v-if="infoLineItems.length" class="metadata-panel__section metadata-panel__info">
            <div class="metadata-panel__info-line" role="text">
              <span
                v-for="(item, index) in infoLineItems"
                :key="item.key || index"
                class="metadata-panel__info-item"
                :class="item.className"
                :title="item.title"
              >
                <span v-if="index > 0" aria-hidden="true" class="metadata-panel__info-separator">•</span>
                <span>{{ item.label }}</span>
              </span>
            </div>
          </section>

          <div class="metadata-panel__grid">
            <section class="metadata-panel__section metadata-panel__section--rating">
              <div class="metadata-panel__section-header">
                <span>Rating</span>
                <span v-if="ratingInfo.mixed" class="metadata-panel__badge">Mixed</span>
                <span
                  v-else-if="ratingInfo.hasAny"
                  class="metadata-panel__badge metadata-panel__badge--accent"
                >
                  {{ `${ratingInfo.value} / 5` }}
                </span>
                <span v-else class="metadata-panel__badge">Not rated</span>
              </div>
              <div class="metadata-panel__rating-row">
                <div
                  class="metadata-panel__stars"
                  :class="ratingInfo.mixed ? 'metadata-panel__stars--mixed' : ''"
                >
                  <button
                    v-for="star in starValues"
                    :key="star"
                    type="button"
                    class="metadata-panel__star"
                    :class="ratingInfo.value != null && ratingInfo.value >= star ? 'is-filled' : ''"
                    :disabled="!hasSelection"
                    :aria-label="`Rate ${star} star${star === 1 ? '' : 's'}`"
                    @click="() => hasSelection && onSetRating(star)"
                  >
                    &#9733;
                  </button>
                </div>
                <button
                  type="button"
                  class="metadata-panel__clear-rating"
                  :disabled="!hasSelection"
                  @click="() => hasSelection && onClearRating()"
                >
                  Clear
                </button>
              </div>
            </section>

            <section class="metadata-panel__section metadata-panel__section--tags">
              <div class="metadata-panel__section-header">
                <span>Tags</span>
                <span class="metadata-panel__badge">
                  {{ sharedTags.length ? `${sharedTags.length} applied` : "None" }}
                </span>
              </div>
              <div class="metadata-panel__chips">
                <span v-if="sharedTags.length === 0" class="metadata-panel__hint">
                  No shared tags yet.
                </span>
                <button
                  v-for="tag in sharedTags"
                  :key="tag"
                  type="button"
                  class="metadata-panel__chip"
                  @click="() => onRemoveTag(tag)"
                >
                  <span>#{{ tag }}</span>
                  <span aria-hidden="true">x</span>
                </button>
              </div>

              <div v-if="partialTags.length" class="metadata-panel__partial-group">
                <div class="metadata-panel__section-subtitle">
                  Appears on some selected clips
                </div>
                <div class="metadata-panel__chips">
                  <button
                    v-for="entry in partialTags"
                    :key="entry.tag"
                    type="button"
                    class="metadata-panel__chip metadata-panel__chip--ghost"
                    :title="`Apply to all (${entry.count}/${derivedSelectionCount})`"
                    @click="() => onApplyTagToSelection(entry.tag)"
                  >
                    <span>#{{ entry.tag }}</span>
                    <span class="metadata-panel__chip-count">
                      {{ entry.count }}/{{ derivedSelectionCount }}
                    </span>
                  </button>
                </div>
              </div>

              <div class="metadata-panel__input-row">
                <input
                  ref="inputRef"
                  type="text"
                  :disabled="!hasSelection"
                  placeholder="Add tag and press Enter"
                  v-model="inputValue"
                  @keydown="handleInputKeyDown"
                />
                <button
                  type="button"
                  :disabled="!hasSelection || !inputValue.trim()"
                  @click="handleTagSubmit"
                >
                  Add
                </button>
              </div>
            </section>

            <section
              v-if="suggestionTags.length"
              class="metadata-panel__section metadata-panel__section--suggestions"
              aria-live="polite"
            >
              <div class="metadata-panel__section-subtitle metadata-panel__suggestions-title">
                {{ hasSuggestionQuery ? "Matching tags" : `Popular tags (top ${maxSuggestionTags})` }}
              </div>
              <div class="metadata-panel__suggestion-list">
                <button
                  v-for="suggestion in suggestionTags"
                  :key="suggestion.name"
                  type="button"
                  class="metadata-panel__suggestion"
                  :title="`Apply #${suggestion.name} to selection`"
                  @click="() => onApplyTagToSelection(suggestion.name)"
                >
                  <span>#{{ suggestion.name }}</span>
                  <span v-if="typeof suggestion.usageCount === 'number'" class="metadata-panel__suggestion-count">
                    {{ suggestion.usageCount }}
                  </span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  onToggle: { type: Function, default: () => {} },
  showCollapsedHint: { type: Boolean, default: false },
  selectionCount: { type: Number, default: 0 },
  selectedVideos: { type: Array, default: () => [] },
  availableTags: { type: Array, default: () => [] },
  onAddTag: { type: Function, default: () => {} },
  onRemoveTag: { type: Function, default: () => {} },
  onApplyTagToSelection: { type: Function, default: () => {} },
  onSetRating: { type: Function, default: () => {} },
  onClearRating: { type: Function, default: () => {} },
  focusToken: { type: Number, default: 0 },
  onFocusSelection: { type: Function, default: () => {} },
  dockHeight: { type: Number, default: 280 },
  minDockHeight: { type: Number, default: 200 },
  maxDockHeight: { type: Number, default: 520 },
  onDockHeightChange: { type: Function, default: () => {} },
});

const rootRef = ref(null);
const inputRef = ref(null);
const inputValue = ref("");

const starValues = [1, 2, 3, 4, 5];
const maxSuggestionTags = 15;

const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

const minHeight = computed(() =>
  Number.isFinite(props.minDockHeight) ? Math.max(160, props.minDockHeight) : 200
);

const maxHeight = computed(() =>
  Number.isFinite(props.maxDockHeight) ? props.maxDockHeight : 520
);

const effectiveMaxHeight = computed(() => {
  if (typeof window !== "undefined" && Number.isFinite(window.innerHeight)) {
    const limit = window.innerHeight - 96;
    if (Number.isFinite(limit)) {
      return clampValue(limit, minHeight.value, maxHeight.value);
    }
  }
  return maxHeight.value;
});

const resolvedDockHeight = computed(() =>
  clampValue(props.dockHeight, minHeight.value, effectiveMaxHeight.value)
);

const derivedSelectionCount = computed(() => {
  if (Number.isFinite(props.selectionCount) && props.selectionCount > 0) {
    return props.selectionCount;
  }
  return Array.isArray(props.selectedVideos) ? props.selectedVideos.length : 0;
});

const hasSelection = computed(() => derivedSelectionCount.value > 0);
const showFocusButton = computed(
  () => hasSelection.value && typeof props.onFocusSelection === "function"
);

const collapsedLabel = computed(() => {
  if (!hasSelection.value) return "Show clip details";
  return derivedSelectionCount.value === 1
    ? "Show clip details"
    : `Show details (${derivedSelectionCount.value})`;
});

const collapsedCountLabel = computed(() => {
  if (!hasSelection.value) return "No selection";
  return derivedSelectionCount.value === 1
    ? "1 clip"
    : `${derivedSelectionCount.value} clips`;
});

watch(
  () => props.focusToken,
  (value) => {
    if (!props.isOpen || !value) return;
    nextTick(() => {
      inputRef.value?.focus?.();
      inputRef.value?.select?.();
    });
  }
);

watch(
  () => props.isOpen,
  (next) => {
    if (!next) {
      inputValue.value = "";
    }
  }
);

const tagCounts = computed(() => {
  const counts = new Map();
  props.selectedVideos.forEach((video) => {
    (video?.tags || []).forEach((tag) => {
      const key = (tag ?? "").toString().trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return counts;
});

const sharedTags = computed(() => {
  if (!hasSelection.value) return [];
  const tags = [];
  tagCounts.value.forEach((count, tag) => {
    if (count === derivedSelectionCount.value) tags.push(tag);
  });
  return tags.sort((a, b) => a.localeCompare(b));
});

const partialTags = computed(() => {
  if (!hasSelection.value) return [];
  const tags = [];
  tagCounts.value.forEach((count, tag) => {
    if (count > 0 && count < derivedSelectionCount.value) {
      tags.push({ tag, count });
    }
  });
  return tags.sort((a, b) => a.tag.localeCompare(b.tag));
});

const ratingInfo = computed(() => {
  if (!props.selectedVideos.length) {
    return { value: null, mixed: false, hasAny: false };
  }
  const values = props.selectedVideos.map((video) =>
    typeof video?.rating === "number"
      ? Math.max(0, Math.min(5, Math.round(video.rating)))
      : null
  );
  const unique = new Set(values.map((value) => (value === null ? "none" : value)));
  if (unique.size === 1) {
    const raw = values[0];
    return {
      value: raw === null ? null : raw,
      mixed: false,
      hasAny: raw !== null,
    };
  }
  const hasAny = values.some((value) => value !== null);
  return { value: null, mixed: true, hasAny };
});

const singleSelectionInfo = computed(() => {
  if (derivedSelectionCount.value !== 1 || !props.selectedVideos.length) {
    return null;
  }

  const video = props.selectedVideos[0];
  if (!video) return null;

  const parseToDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === "string" && value.trim()) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const createdDate =
    parseToDate(video?.metadata?.dateCreatedFormatted) ||
    parseToDate(video?.createdMs) ||
    parseToDate(video?.dateCreated) ||
    parseToDate(video?.metadata?.dateCreated);

  const formatDateTime = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return null;
    }
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(date);
    } catch {
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`;
    }
  };

  let createdDisplay = formatDateTime(createdDate);
  if (!createdDisplay && typeof video?.metadata?.dateCreatedFormatted === "string") {
    createdDisplay = video.metadata.dateCreatedFormatted;
  }

  const deriveFilename = () => {
    const fromMetadata = video?.metadata?.filename || video?.metadata?.fileName;
    const primary = video?.name || video?.filename || video?.fileName || fromMetadata;
    if (primary) return primary;
    const path = video?.fullPath || video?.path || video?.sourcePath;
    if (typeof path === "string" && path.trim()) {
      const segments = path.split(/[\\/]/).filter(Boolean);
      if (segments.length) {
        return segments[segments.length - 1];
      }
    }
    return null;
  };

  const filename = deriveFilename();
  const width = Number(video?.dimensions?.width);
  const height = Number(video?.dimensions?.height);
  const hasResolution = Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0;
  const resolution = hasResolution ? `${width}x${height}` : null;

  if (!filename && !createdDisplay && !resolution) {
    return null;
  }

  return {
    filename,
    created: createdDisplay,
    resolution,
  };
});

const infoLineItems = computed(() => {
  if (!singleSelectionInfo.value) return [];
  const items = [];
  if (singleSelectionInfo.value.filename) {
    items.push({
      key: "filename",
      label: singleSelectionInfo.value.filename,
      title: singleSelectionInfo.value.filename,
      className: "metadata-panel__info-item--filename",
    });
  }
  if (singleSelectionInfo.value.resolution) {
    items.push({
      key: "resolution",
      label: singleSelectionInfo.value.resolution,
    });
  }
  if (singleSelectionInfo.value.created) {
    items.push({ key: "created", label: singleSelectionInfo.value.created });
  }
  return items;
});

const sharedTagSet = computed(() => new Set(sharedTags.value));

const dedupedAvailableTags = computed(() => {
  if (!Array.isArray(props.availableTags)) return [];
  const deduped = new Map();
  props.availableTags.forEach((entry) => {
    const name = (entry?.name ?? "").toString().trim();
    if (!name) return;
    const usageCount =
      typeof entry.usageCount === "number" && Number.isFinite(entry.usageCount)
        ? entry.usageCount
        : 0;
    const existing = deduped.get(name);
    if (!existing || (existing.usageCount || 0) < usageCount) {
      deduped.set(name, { name, usageCount });
    }
  });
  return Array.from(deduped.values());
});

const suggestionTags = computed(() => {
  if (!props.isOpen) return [];
  const query = inputValue.value.trim().toLowerCase();
  let list = dedupedAvailableTags.value.filter((entry) => !sharedTagSet.value.has(entry.name));
  if (query) {
    list = list.filter((item) => item.name.toLowerCase().includes(query));
  }
  list.sort((a, b) => {
    const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
    if (usageDiff !== 0) return usageDiff;
    return a.name.localeCompare(b.name);
  });
  return list.slice(0, maxSuggestionTags);
});

const hasSuggestionQuery = computed(() => inputValue.value.trim().length > 0);

const handleTagSubmit = () => {
  const tokens = inputValue.value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) return;
  props.onAddTag(tokens);
  inputValue.value = "";
};

const handleInputKeyDown = (event) => {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    handleTagSubmit();
    return;
  }

  if (event.key === "Tab") {
    const rawTokens = inputValue.value.split(",");
    const lastTokenRaw = rawTokens[rawTokens.length - 1] ?? "";
    const query = lastTokenRaw.trim().toLowerCase();
    if (!query) return;

    const candidates = dedupedAvailableTags.value.filter((entry) =>
      entry.name.toLowerCase().startsWith(query)
    );
    if (!candidates.length) return;

    candidates.sort((a, b) => {
      const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
      if (usageDiff !== 0) return usageDiff;
      return a.name.localeCompare(b.name);
    });

    const selected = candidates[0]?.name;
    if (!selected) return;
    event.preventDefault();
    props.onAddTag([selected]);
    inputValue.value = "";
  }
};

let resizeCleanup = null;

const endResize = () => {
  if (typeof resizeCleanup === "function") {
    resizeCleanup();
    resizeCleanup = null;
  }
};

const handleResizePointerDown = (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (typeof window === "undefined") return;
  endResize();

  event.preventDefault();
  event.stopPropagation();

  const startY = event.clientY;
  const startHeight = resolvedDockHeight.value;
  const pointerId = event.pointerId;

  const handlePointerMove = (moveEvent) => {
    if (moveEvent.pointerId !== pointerId) return;
    const delta = startY - moveEvent.clientY;
    const next = clampValue(startHeight + delta, minHeight.value, effectiveMaxHeight.value);
    props.onDockHeightChange(next);
  };

  const handlePointerUp = (upEvent) => {
    if (upEvent.pointerId !== pointerId) return;
    endResize();
    try {
      event.currentTarget?.releasePointerCapture(pointerId);
    } catch {}
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);

  resizeCleanup = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
  };

  try {
    event.currentTarget?.setPointerCapture(pointerId);
  } catch {}
};

const handleResizeKeyDown = (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    const delta = event.key === "ArrowUp" ? 24 : -24;
    props.onDockHeightChange(
      clampValue(resolvedDockHeight.value + delta, minHeight.value, effectiveMaxHeight.value)
    );
  } else if (event.key === "Home") {
    event.preventDefault();
    props.onDockHeightChange(effectiveMaxHeight.value);
  } else if (event.key === "End") {
    event.preventDefault();
    props.onDockHeightChange(minHeight.value);
  }
};

onBeforeUnmount(() => endResize());
</script>
