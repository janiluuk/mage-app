import { ref, computed, watch, onBeforeUnmount } from "vue";
import {
  createDefaultFilters,
  normalizeTagList,
  sanitizeMinRating,
  sanitizeExactRating,
  formatRatingLabel,
  countActiveFilters,
} from "../filters/filtersUtils";

const resolveValue = (value, fallback) =>
  value === undefined ? fallback : value;

const normalizeFiltersDraft = (draft, prev) => {
  const includeTagsRaw = resolveValue(draft?.includeTags, prev.includeTags);
  const excludeTagsRaw = resolveValue(draft?.excludeTags, prev.excludeTags);
  const minRatingRaw = resolveValue(draft?.minRating, prev.minRating);
  const exactRatingRaw = resolveValue(draft?.exactRating, prev.exactRating);

  return {
    includeTags: normalizeTagList(includeTagsRaw),
    excludeTags: normalizeTagList(excludeTagsRaw),
    minRating: sanitizeMinRating(minRatingRaw),
    exactRating: sanitizeExactRating(exactRatingRaw),
  };
};

export function useFilterState({ videos, filtersButtonRef, filtersPopoverRef }) {
  const filters = ref(createDefaultFilters());
  const isFiltersOpen = ref(false);

  const updateFilters = (updater) => {
    const prev = filters.value;
    const nextDraft =
      typeof updater === "function" ? updater(prev) ?? prev : { ...prev, ...updater };
    filters.value = normalizeFiltersDraft(nextDraft, prev);
  };

  const resetFilters = () => {
    filters.value = createDefaultFilters();
  };

  const filteredVideos = computed(() => {
    const list = Array.isArray(videos.value) ? videos.value : [];
    const includeTags = filters.value.includeTags ?? [];
    const excludeTags = filters.value.excludeTags ?? [];
    const minRating = sanitizeMinRating(filters.value.minRating);
    const exactRating = sanitizeExactRating(filters.value.exactRating);

    const includeSet = includeTags.length
      ? new Set(includeTags.map((tag) => tag.toLowerCase()))
      : null;
    const excludeSet = excludeTags.length
      ? new Set(excludeTags.map((tag) => tag.toLowerCase()))
      : null;

    if (!includeSet && !excludeSet && minRating === null && exactRating === null) {
      return list;
    }

    return list.filter((video) => {
      const tagList = Array.isArray(video.tags)
        ? video.tags
            .map((tag) => (tag ?? "").toString().trim().toLowerCase())
            .filter(Boolean)
        : [];

      if (includeSet) {
        for (const tag of includeSet) {
          if (!tagList.includes(tag)) {
            return false;
          }
        }
      }

      if (excludeSet) {
        for (const tag of excludeSet) {
          if (tagList.includes(tag)) {
            return false;
          }
        }
      }

      const ratingValue = Number.isFinite(video.rating) ? Math.round(video.rating) : null;

      if (exactRating !== null) {
        return (ratingValue ?? null) === exactRating;
      }

      if (minRating !== null) {
        return (ratingValue ?? 0) >= minRating;
      }

      return true;
    });
  });

  const filteredVideoIds = computed(
    () => new Set(filteredVideos.value.map((video) => video.id))
  );

  const handleRemoveIncludeFilter = (tag) => {
    if (!tag) return;
    updateFilters((prev) => ({
      ...prev,
      includeTags: (prev.includeTags ?? []).filter((entry) => entry !== tag),
    }));
  };

  const handleRemoveExcludeFilter = (tag) => {
    if (!tag) return;
    updateFilters((prev) => ({
      ...prev,
      excludeTags: (prev.excludeTags ?? []).filter((entry) => entry !== tag),
    }));
  };

  const clearMinRatingFilter = () => {
    updateFilters((prev) => ({ ...prev, minRating: null }));
  };

  const clearExactRatingFilter = () => {
    updateFilters((prev) => ({ ...prev, exactRating: null }));
  };

  const ratingSummary = computed(() => {
    if (filters.value.exactRating !== null && filters.value.exactRating !== undefined) {
      const label = formatRatingLabel(filters.value.exactRating, "exact");
      return label
        ? {
            key: "exact",
            label,
            onClear: clearExactRatingFilter,
          }
        : null;
    }

    if (filters.value.minRating !== null && filters.value.minRating !== undefined) {
      const label = formatRatingLabel(filters.value.minRating, "min");
      return label
        ? {
            key: "min",
            label,
            onClear: clearMinRatingFilter,
          }
        : null;
    }

    return null;
  });

  const resolveElement = (maybeRef) => {
    if (!maybeRef) return null;
    const raw = maybeRef.value ?? maybeRef;
    if (!raw) return null;
    return raw.$el || raw.el?.value || raw.el || raw;
  };

  const onOutsidePointer = (event) => {
    const anchor = resolveElement(filtersButtonRef);
    const panel = resolveElement(filtersPopoverRef);
    if (panel?.contains(event.target) || anchor?.contains(event.target)) {
      return;
    }
    isFiltersOpen.value = false;
  };

  const onEscape = (event) => {
    if (event.key === "Escape") {
      isFiltersOpen.value = false;
    }
  };

  watch(isFiltersOpen, (nextOpen) => {
    if (nextOpen) {
      document.addEventListener("mousedown", onOutsidePointer);
      document.addEventListener("touchstart", onOutsidePointer);
      window.addEventListener("keydown", onEscape);
    } else {
      document.removeEventListener("mousedown", onOutsidePointer);
      document.removeEventListener("touchstart", onOutsidePointer);
      window.removeEventListener("keydown", onEscape);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", onOutsidePointer);
    document.removeEventListener("touchstart", onOutsidePointer);
    window.removeEventListener("keydown", onEscape);
  });

  const filtersActiveCount = computed(() => countActiveFilters(filters.value));

  return {
    filters,
    isFiltersOpen,
    setFiltersOpen: (next) => {
      isFiltersOpen.value = next;
    },
    updateFilters,
    resetFilters,
    filteredVideos,
    filteredVideoIds,
    filtersActiveCount,
    ratingSummary,
    handleRemoveIncludeFilter,
    handleRemoveExcludeFilter,
    clearMinRatingFilter,
    clearExactRatingFilter,
  };
}
