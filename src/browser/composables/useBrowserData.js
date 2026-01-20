/**
 * Composable for managing browser data loading and view modes
 * @module useBrowserData
 */

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

/**
 * Manages data loading, view modes, and refresh logic for the browser
 * @param {Object} options - Configuration options
 * @param {import('vue').Ref<string>} options.viewMode - Current view mode ('videojobs' | 'files')
 * @param {import('vue').Ref<boolean>} options.viewGroupedByTags - Whether to group by tags
 * @param {import('vue').Ref<string>} options.selectedTagId - Selected tag ID
 * @param {import('vue').Ref<string>} options.sortKey - Sort key
 * @param {import('vue').Ref<string>} options.sortDir - Sort direction
 * @returns {Object} Browser data management utilities
 */
export function useBrowserData({
  viewMode,
  viewGroupedByTags,
  selectedTagId,
  sortKey,
  sortDir,
}) {
  const store = useStore();
  const isLoading = ref(false);
  const refreshInterval = ref(null);

  /**
   * Load video jobs from the store
   * @returns {Promise<void>}
   */
  const loadJobs = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      await store.dispatch("videojobs/list", { include: "modelfile,user" });
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Load files from the store
   * @returns {Promise<void>}
   */
  const loadFiles = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      const params = {};
      
      if (selectedTagId.value) {
        await store.dispatch("files/listByTag", {
          tagId: selectedTagId.value,
        });
      } else {
        // Regular file list
        // Add sorting
        if (sortKey.value && sortDir.value) {
          const sortByMap = {
            'name': 'original_name',
            'created': 'created_at',
            'modified': 'updated_at',
            'size': 'size',
            'type': 'type',
          };
          params.sort_by = sortByMap[sortKey.value] || sortKey.value;
          params.sort_order = sortDir.value;
        }
        
        await store.dispatch("files/list", params);
      }
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Load files grouped by tags
   * @returns {Promise<void>}
   */
  const loadFilesGroupedByTags = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
      await store.dispatch("files/listByTags");
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh data based on current view mode
   * @returns {Promise<void>}
   */
  const refreshData = async () => {
    if (viewMode.value === 'files') {
      if (viewGroupedByTags.value) {
        await loadFilesGroupedByTags();
      } else {
        await loadFiles();
      }
    } else {
      await loadJobs();
    }
  };

  /**
   * Start auto-refresh interval
   * @param {number} intervalMs - Refresh interval in milliseconds
   */
  const startAutoRefresh = (intervalMs = 10000) => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
    refreshInterval.value = setInterval(refreshData, intervalMs);
  };

  /**
   * Stop auto-refresh interval
   */
  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  };

  // Watch for sort changes and reload files if in files mode
  watch(
    () => [sortKey.value, sortDir.value, viewMode.value, selectedTagId.value],
    async () => {
      if (viewMode.value === 'files' && !viewGroupedByTags.value) {
        await loadFiles();
      }
    }
  );

  return {
    isLoading,
    loadJobs,
    loadFiles,
    loadFilesGroupedByTags,
    refreshData,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

