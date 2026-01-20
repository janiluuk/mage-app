/**
 * Composable for managing metadata overrides and panel state
 * @module useBrowserMetadata
 */

import { ref, computed } from 'vue';

/**
 * Manages metadata overrides and metadata panel state
 * @param {import('vue').ComputedRef<number>} selectionSize - Size of current selection
 * @returns {Object} Metadata management utilities
 */
export function useBrowserMetadata(selectionSize) {
  const metadataOverrides = ref(new Map());
  const isMetadataPanelOpen = ref(false);
  const metadataPanelDismissed = ref(false);
  const metadataDockHeight = ref(280);
  const metadataFocusToken = ref(0);

  const MIN_METADATA_DOCK_HEIGHT = 200;
  const MAX_METADATA_DOCK_HEIGHT = 520;

  /**
   * Apply metadata patch updates
   * @param {Object} updates - Map of video ID to metadata patch
   */
  const applyMetadataPatch = (updates) => {
    if (!updates || typeof updates !== "object") return;
    const next = new Map(metadataOverrides.value);
    Object.entries(updates).forEach(([id, patch]) => {
      if (!id || !patch) return;
      const prev = next.get(id) || {};
      next.set(id, { ...prev, ...patch });
    });
    metadataOverrides.value = next;
  };

  /**
   * Apply metadata overrides to a video object
   * @param {Object} video - Video object to apply overrides to
   * @returns {Object} Video with metadata overrides applied
   */
  const applyMetadataOverrides = (video) => {
    if (!video?.id) return video;
    const overrides = metadataOverrides.value.get(video.id);
    if (!overrides) return video;
    return { ...video, ...overrides };
  };

  /**
   * Open metadata panel
   */
  const openMetadataPanel = () => {
    isMetadataPanelOpen.value = true;
    metadataPanelDismissed.value = false;
    metadataFocusToken.value += 1;
  };

  /**
   * Toggle metadata panel visibility
   */
  const toggleMetadataPanel = () => {
    const next = !isMetadataPanelOpen.value;
    isMetadataPanelOpen.value = next;
    if (!next) {
      metadataPanelDismissed.value = true;
    } else {
      metadataPanelDismissed.value = false;
      metadataFocusToken.value += 1;
    }
  };

  /**
   * Handle metadata dock height change
   * @param {number} height - New height value
   */
  const handleMetadataDockHeightChange = (height) => {
    metadataDockHeight.value = Math.max(
      MIN_METADATA_DOCK_HEIGHT,
      Math.min(MAX_METADATA_DOCK_HEIGHT, height)
    );
  };

  /**
   * Whether to render collapsed hint
   */
  const shouldRenderCollapsedHint = computed(
    () => metadataPanelDismissed.value || selectionSize.value > 0
  );

  return {
    metadataOverrides,
    isMetadataPanelOpen,
    metadataPanelDismissed,
    metadataDockHeight,
    metadataFocusToken,
    MIN_METADATA_DOCK_HEIGHT,
    MAX_METADATA_DOCK_HEIGHT,
    applyMetadataPatch,
    applyMetadataOverrides,
    openMetadataPanel,
    toggleMetadataPanel,
    handleMetadataDockHeightChange,
    shouldRenderCollapsedHint,
  };
}

