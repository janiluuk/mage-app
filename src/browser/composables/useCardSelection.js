import useMasonryBoxSelection from "./useMasonryBoxSelection";

export default function useCardSelection({
  gridRef,
  selection,
  getById,
  openFullScreen,
  playingVideos,
  showOnItem,
  showOnEmpty,
  showContextMenu,
}) {
  const { selectRangeByBox } = useMasonryBoxSelection(gridRef);

  const handleVideoSelect = (videoId, isCtrlClick, isShiftClick, isDoubleClick) => {
    const video = getById?.(videoId);

    if (isDoubleClick && video) {
      openFullScreen?.(video, playingVideos?.value || playingVideos);
      return;
    }

    if (isShiftClick) {
      if (!selection.anchorId.value) {
        selection.selectOnly(videoId);
        return;
      }
      selectRangeByBox(selection, selection.anchorId.value, videoId, isCtrlClick);
      return;
    }

    if (isCtrlClick) {
      selection.toggle(videoId);
    } else {
      selection.selectOnly(videoId);
    }
  };

  const handleCardContextMenu = (event, video) => {
    const id = video?.id;
    if (!id) return;

    if (showOnItem) {
      showOnItem(event, id);
      return;
    }

    event.preventDefault?.();
    event.stopPropagation?.();
    showContextMenu?.(event, video);
  };

  const handleBackgroundContextMenu = (event) => {
    if (showOnEmpty) {
      showOnEmpty(event);
      return;
    }
    event.stopPropagation?.();
    showContextMenu?.(event, null);
  };

  return {
    handleVideoSelect,
    handleCardContextMenu,
    handleBackgroundContextMenu,
  };
}
