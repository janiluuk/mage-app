/**
 * Unit tests for useBrowserMetadata composable
 * @module useBrowserMetadata.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { useBrowserMetadata } from '@/browser/composables/useBrowserMetadata';

describe('useBrowserMetadata', () => {
  let selectionSize;

  beforeEach(() => {
    selectionSize = computed(() => 0);
  });

  it('should initialize with default values', () => {
    const {
      metadataOverrides,
      isMetadataPanelOpen,
      metadataPanelDismissed,
      metadataDockHeight,
      metadataFocusToken,
    } = useBrowserMetadata(selectionSize);

    expect(metadataOverrides.value.size).toBe(0);
    expect(isMetadataPanelOpen.value).toBe(false);
    expect(metadataPanelDismissed.value).toBe(false);
    expect(metadataDockHeight.value).toBe(280);
    expect(metadataFocusToken.value).toBe(0);
  });

  it('should apply metadata patch', () => {
    const { metadataOverrides, applyMetadataPatch } = useBrowserMetadata(selectionSize);

    applyMetadataPatch({
      'video-1': { name: 'Test Video', rating: 5 },
      'video-2': { tags: ['tag1', 'tag2'] },
    });

    expect(metadataOverrides.value.get('video-1')).toEqual({
      name: 'Test Video',
      rating: 5,
    });
    expect(metadataOverrides.value.get('video-2')).toEqual({
      tags: ['tag1', 'tag2'],
    });
  });

  it('should merge metadata patches', () => {
    const { metadataOverrides, applyMetadataPatch } = useBrowserMetadata(selectionSize);

    applyMetadataPatch({
      'video-1': { name: 'Test Video' },
    });

    applyMetadataPatch({
      'video-1': { rating: 5 },
    });

    expect(metadataOverrides.value.get('video-1')).toEqual({
      name: 'Test Video',
      rating: 5,
    });
  });

  it('should apply metadata overrides to video', () => {
    const { applyMetadataOverrides, applyMetadataPatch } = useBrowserMetadata(selectionSize);

    const video = {
      id: 'video-1',
      name: 'Original Name',
      rating: 3,
    };

    applyMetadataPatch({
      'video-1': { name: 'Updated Name', rating: 5 },
    });

    const result = applyMetadataOverrides(video);

    expect(result.name).toBe('Updated Name');
    expect(result.rating).toBe(5);
    expect(result.id).toBe('video-1');
  });

  it('should return original video if no overrides', () => {
    const { applyMetadataOverrides } = useBrowserMetadata(selectionSize);

    const video = {
      id: 'video-1',
      name: 'Original Name',
    };

    const result = applyMetadataOverrides(video);

    expect(result).toBe(video);
  });

  it('should handle video without id', () => {
    const { applyMetadataOverrides } = useBrowserMetadata(selectionSize);

    const video = {
      name: 'Test Video',
    };

    const result = applyMetadataOverrides(video);

    expect(result).toBe(video);
  });

  it('should open metadata panel', () => {
    const {
      isMetadataPanelOpen,
      metadataPanelDismissed,
      metadataFocusToken,
      openMetadataPanel,
    } = useBrowserMetadata(selectionSize);

    const initialToken = metadataFocusToken.value;

    openMetadataPanel();

    expect(isMetadataPanelOpen.value).toBe(true);
    expect(metadataPanelDismissed.value).toBe(false);
    expect(metadataFocusToken.value).toBe(initialToken + 1);
  });

  it('should toggle metadata panel', () => {
    const {
      isMetadataPanelOpen,
      metadataPanelDismissed,
      metadataFocusToken,
      toggleMetadataPanel,
    } = useBrowserMetadata(selectionSize);

    const initialToken = metadataFocusToken.value;

    // Open
    toggleMetadataPanel();
    expect(isMetadataPanelOpen.value).toBe(true);
    expect(metadataPanelDismissed.value).toBe(false);
    expect(metadataFocusToken.value).toBe(initialToken + 1);

    // Close
    toggleMetadataPanel();
    expect(isMetadataPanelOpen.value).toBe(false);
    expect(metadataPanelDismissed.value).toBe(true);
    expect(metadataFocusToken.value).toBe(initialToken + 1); // Token doesn't increment on close
  });

  it('should handle metadata dock height change', () => {
    const {
      metadataDockHeight,
      MIN_METADATA_DOCK_HEIGHT,
      MAX_METADATA_DOCK_HEIGHT,
      handleMetadataDockHeightChange,
    } = useBrowserMetadata(selectionSize);

    handleMetadataDockHeightChange(300);
    expect(metadataDockHeight.value).toBe(300);

    // Test min constraint
    handleMetadataDockHeightChange(100);
    expect(metadataDockHeight.value).toBe(MIN_METADATA_DOCK_HEIGHT);

    // Test max constraint
    handleMetadataDockHeightChange(600);
    expect(metadataDockHeight.value).toBe(MAX_METADATA_DOCK_HEIGHT);
  });

  it('should compute shouldRenderCollapsedHint correctly', () => {
    const { shouldRenderCollapsedHint, metadataPanelDismissed, toggleMetadataPanel } = useBrowserMetadata(selectionSize);

    // Initially false (no selection, panel not dismissed)
    expect(shouldRenderCollapsedHint.value).toBe(false);

    // Dismiss panel
    toggleMetadataPanel(); // Open
    toggleMetadataPanel(); // Close (dismisses)
    expect(shouldRenderCollapsedHint.value).toBe(true);
  });

  it('should show collapsed hint when selection size > 0', () => {
    const selectionSizeWithItems = computed(() => 3);
    const { shouldRenderCollapsedHint } = useBrowserMetadata(selectionSizeWithItems);

    expect(shouldRenderCollapsedHint.value).toBe(true);
  });
});

