/**
 * Unit tests for useBrowserData composable
 * @module useBrowserData.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useBrowserData } from '@/browser/composables/useBrowserData';

// Mock Vuex store
const mockStore = {
  dispatch: vi.fn(),
  getters: {},
};

vi.mock('vuex', () => ({
  useStore: () => mockStore,
}));

describe('useBrowserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.dispatch.mockResolvedValue({});
  });

  it('should initialize with loading state false', () => {
    const viewMode = ref('videojobs');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { isLoading } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    expect(isLoading.value).toBe(false);
  });

  it('should load jobs when loadJobs is called', async () => {
    const viewMode = ref('videojobs');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { loadJobs, isLoading } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    expect(isLoading.value).toBe(false);
    
    const promise = loadJobs();
    expect(isLoading.value).toBe(true);
    expect(mockStore.dispatch).toHaveBeenCalledWith('videojobs/list', {
      include: 'modelfile,user',
    });

    await promise;
    expect(isLoading.value).toBe(false);
  });

  it('should load files when loadFiles is called', async () => {
    const viewMode = ref('files');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref('name');
    const sortDir = ref('asc');

    const { loadFiles, isLoading } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    await loadFiles();

    expect(mockStore.dispatch).toHaveBeenCalledWith('files/list', {
      sort_by: 'original_name',
      sort_order: 'asc',
    });
    expect(isLoading.value).toBe(false);
  });

  it('should load files by tag when selectedTagId is set', async () => {
    const viewMode = ref('files');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref('123');
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { loadFiles } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    await loadFiles();

    expect(mockStore.dispatch).toHaveBeenCalledWith('files/listByTag', {
      tagId: '123',
    });
  });

  it('should load files grouped by tags', async () => {
    const viewMode = ref('files');
    const viewGroupedByTags = ref(true);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { loadFilesGroupedByTags } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    await loadFilesGroupedByTags();

    expect(mockStore.dispatch).toHaveBeenCalledWith('files/listByTags');
  });

  it('should refresh data based on view mode', async () => {
    const viewMode = ref('videojobs');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { refreshData } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    await refreshData();

    expect(mockStore.dispatch).toHaveBeenCalledWith('videojobs/list', {
      include: 'modelfile,user',
    });
  });

  it('should refresh files when in files mode', async () => {
    const viewMode = ref('files');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { refreshData } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    await refreshData();

    expect(mockStore.dispatch).toHaveBeenCalledWith('files/list', {});
  });

  it('should start and stop auto-refresh', () => {
    vi.useFakeTimers();
    
    const viewMode = ref('videojobs');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { startAutoRefresh, stopAutoRefresh } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    startAutoRefresh(1000);
    
    expect(mockStore.dispatch).toHaveBeenCalledTimes(0);
    
    vi.advanceTimersByTime(1000);
    
    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    
    stopAutoRefresh();
    
    vi.advanceTimersByTime(1000);
    
    // Should not call again after stop
    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('should prevent duplicate load calls', async () => {
    const viewMode = ref('videojobs');
    const viewGroupedByTags = ref(false);
    const selectedTagId = ref(null);
    const sortKey = ref(null);
    const sortDir = ref(null);

    const { loadJobs } = useBrowserData({
      viewMode,
      viewGroupedByTags,
      selectedTagId,
      sortKey,
      sortDir,
    });

    // Start two loads simultaneously
    const promise1 = loadJobs();
    const promise2 = loadJobs();

    await Promise.all([promise1, promise2]);

    // Should only dispatch once
    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
  });
});

