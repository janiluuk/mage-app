<template>
  <div class="filters-popover" ref="rootRef" :style="style" role="dialog" aria-label="Video filters">
    <div class="filters-popover__header">
      <div>
        <h3>Filters</h3>
        <p>Refine the grid without leaving the gallery.</p>
      </div>
      <div class="filters-popover__header-actions">
        <button type="button" class="filters-link" @click="onReset">Reset</button>
        <button type="button" class="filters-link" @click="onClose">Close</button>
      </div>
    </div>

    <section class="filters-section">
      <header class="filters-section__title">Tags</header>
      <div class="filters-chip-group">
        <span class="filters-chip-group__label">Include</span>
        <div class="filters-chip-group__chips">
          <span v-if="includeTags.length === 0" class="filters-chip--empty">None</span>
          <button
            v-for="tag in includeTags"
            :key="`include-${tag}`"
            type="button"
            class="filters-chip filters-chip--include"
            :title="`Remove include tag ${tag}`"
            @click="cycleInclude(tag)"
          >
            #{{ tag }}
            <span class="filters-chip__remove">x</span>
          </button>
        </div>
      </div>

      <div class="filters-chip-group">
        <span class="filters-chip-group__label">Exclude</span>
        <div class="filters-chip-group__chips">
          <span v-if="excludeTags.length === 0" class="filters-chip--empty">None</span>
          <button
            v-for="tag in excludeTags"
            :key="`exclude-${tag}`"
            type="button"
            class="filters-chip filters-chip--exclude"
            :title="`Remove exclude tag ${tag}`"
            @click="cycleExclude(tag)"
          >
            #{{ tag }}
            <span class="filters-chip__remove">x</span>
          </button>
        </div>
      </div>

      <div class="filters-tag-search">
        <input
          v-model="tagQuery"
          type="search"
          placeholder="Search available tags"
          aria-label="Search available tags"
        />
      </div>

      <div class="filters-tag-list__header">
        <span>Available tags</span>
        <span v-if="normalizedTags.length">{{ normalizedTags.length }} shown</span>
      </div>
      <div class="filters-tag-list" role="list">
        <span v-if="normalizedTags.length === 0" class="filters-empty-hint">No tags found.</span>
        <div
          v-for="tag in normalizedTags"
          :key="tag.name"
          class="filters-tag-option"
          :class="{
            'filters-tag-option--include': includeSet.has(tag.name),
            'filters-tag-option--exclude': excludeSet.has(tag.name),
          }"
        >
          <div class="filters-tag-option__info">
            <span class="filters-tag-option__name">#{{ tag.name }}</span>
            <span v-if="tag.usageCount" class="filters-tag-option__count">{{ tag.usageCount }}</span>
          </div>
          <div class="filters-tag-option__actions">
            <button
              type="button"
              class="filters-pill"
              :class="{ 'filters-pill--active': includeSet.has(tag.name) }"
              @click="cycleInclude(tag.name)"
            >
              Include
            </button>
            <button
              type="button"
              class="filters-pill"
              :class="{ 'filters-pill--active': excludeSet.has(tag.name) }"
              @click="cycleExclude(tag.name)"
            >
              Exclude
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="filters-section">
      <header class="filters-section__title">Ratings</header>
      <div class="filters-rating-group">
        <span class="filters-chip-group__label">Minimum</span>
        <div class="filters-rating-row">
          <button
            v-for="option in minRatingOptions"
            :key="`min-${option.value}`"
            type="button"
            class="filters-pill"
            :class="{ 'filters-pill--active': option.value === minRating }"
            @click="handleMinRatingChange(option.value)"
          >
            <span v-html="option.label"></span>
          </button>
        </div>
      </div>

      <div class="filters-rating-group">
        <span class="filters-chip-group__label">Exact</span>
        <div class="filters-rating-row">
          <button
            v-for="option in exactRatingOptions"
            :key="`exact-${option.value}`"
            type="button"
            class="filters-pill"
            :class="{ 'filters-pill--active': option.value === exactRating }"
            @click="handleExactRatingChange(option.value)"
          >
            <span v-html="option.label"></span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from "vue";

const props = defineProps({
  filters: { type: Object, required: true },
  availableTags: { type: Array, default: () => [] },
  onChange: { type: Function, default: () => {} },
  onReset: { type: Function, default: () => {} },
  onClose: { type: Function, default: () => {} },
  style: { type: Object, default: () => ({}) },
});

const rootRef = ref(null);

const minRatingOptions = [
  { value: null, label: "Any" },
  { value: 1, label: "&#9733;&#9734;&#9734;&#9734;&#9734;+" },
  { value: 2, label: "&#9733;&#9733;&#9734;&#9734;&#9734;+" },
  { value: 3, label: "&#9733;&#9733;&#9733;&#9734;&#9734;+" },
  { value: 4, label: "&#9733;&#9733;&#9733;&#9733;&#9734;+" },
  { value: 5, label: "&#9733;&#9733;&#9733;&#9733;&#9733;" },
];

const exactRatingOptions = [
  { value: null, label: "Any" },
  { value: 1, label: "&#9733;&#9734;&#9734;&#9734;&#9734;" },
  { value: 2, label: "&#9733;&#9733;&#9734;&#9734;&#9734;" },
  { value: 3, label: "&#9733;&#9733;&#9733;&#9734;&#9734;" },
  { value: 4, label: "&#9733;&#9733;&#9733;&#9733;&#9734;" },
  { value: 5, label: "&#9733;&#9733;&#9733;&#9733;&#9733;" },
];

const includeTags = computed(() => props.filters?.includeTags ?? []);
const excludeTags = computed(() => props.filters?.excludeTags ?? []);
const minRating = computed(() => props.filters?.minRating ?? null);
const exactRating = computed(() =>
  props.filters?.exactRating === 0 ? 0 : props.filters?.exactRating ?? null
);

const tagQuery = ref("");

const normalizedTags = computed(() => {
  const source = Array.isArray(props.availableTags) ? props.availableTags : [];
  const deduped = new Map();

  source.forEach((entry) => {
    if (entry == null) return;
    let name = "";
    let usageCount = 0;

    if (typeof entry === "string") {
      name = entry.trim();
    } else if (typeof entry === "object") {
      name = (entry.name ?? "").toString().trim();
      if (Number.isFinite(entry.usageCount)) {
        usageCount = Number(entry.usageCount);
      }
    } else {
      name = entry.toString().trim();
    }

    if (!name) return;
    const existing = deduped.get(name);
    if (!existing || existing.usageCount < usageCount) {
      deduped.set(name, { name, usageCount });
    }
  });

  let list = Array.from(deduped.values());
  const query = tagQuery.value.trim().toLowerCase();

  if (query) {
    list = list
      .filter((item) => item.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
        if (usageDiff !== 0) return usageDiff;
        return a.name.localeCompare(b.name);
      });
    return list;
  }

  list.sort((a, b) => {
    const usageDiff = (b.usageCount || 0) - (a.usageCount || 0);
    if (usageDiff !== 0) return usageDiff;
    return a.name.localeCompare(b.name);
  });

  return list.slice(0, 10);
});

const includeSet = computed(() => new Set(includeTags.value));
const excludeSet = computed(() => new Set(excludeTags.value));

const cycleInclude = (tag) => {
  if (!tag) return;
  props.onChange((prev) => {
    const nextInclude = new Set(prev.includeTags ?? []);
    const nextExclude = new Set(prev.excludeTags ?? []);
    if (nextInclude.has(tag)) {
      nextInclude.delete(tag);
    } else {
      nextInclude.add(tag);
      nextExclude.delete(tag);
    }
    return {
      ...prev,
      includeTags: Array.from(nextInclude),
      excludeTags: Array.from(nextExclude),
    };
  });
};

const cycleExclude = (tag) => {
  if (!tag) return;
  props.onChange((prev) => {
    const nextInclude = new Set(prev.includeTags ?? []);
    const nextExclude = new Set(prev.excludeTags ?? []);
    if (nextExclude.has(tag)) {
      nextExclude.delete(tag);
    } else {
      nextExclude.add(tag);
      nextInclude.delete(tag);
    }
    return {
      ...prev,
      includeTags: Array.from(nextInclude),
      excludeTags: Array.from(nextExclude),
    };
  });
};

const handleMinRatingChange = (value) => {
  props.onChange((prev) => {
    const nextValue = value === null || value === prev.minRating ? null : value;
    return {
      ...prev,
      minRating: nextValue,
      exactRating: nextValue !== null ? null : prev.exactRating ?? null,
    };
  });
};

const handleExactRatingChange = (value) => {
  props.onChange((prev) => {
    const nextValue = value === null || value === prev.exactRating ? null : value;
    return {
      ...prev,
      exactRating: nextValue,
      minRating: nextValue !== null ? null : prev.minRating ?? null,
    };
  });
};

watchEffect(() => {
  if (!rootRef.value) return;
});

defineExpose({ el: rootRef });
</script>
