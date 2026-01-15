export default function useMasonryBoxSelection(gridRef) {
  const getBoxSelectionIds = (anchorId, endId) => {
    const grid = gridRef?.value;
    if (!grid || !anchorId || !endId) return new Set();

    const items = Array.from(grid.querySelectorAll(".video-item"));
    if (!items.length) return new Set();

    const rects = items.map((el) => ({
      id: el.dataset.videoId || el.dataset.filename,
      rect: el.getBoundingClientRect(),
    }));

    const a = rects.find((r) => r.id === anchorId)?.rect;
    const b = rects.find((r) => r.id === endId)?.rect;
    if (!a || !b) return new Set();

    const minX = Math.min(a.left, b.left);
    const maxX = Math.max(a.right, b.right);
    const minY = Math.min(a.top, b.top);
    const maxY = Math.max(a.bottom, b.bottom);

    const ids = rects
      .filter(
        (r) =>
          r.rect.left < maxX &&
          r.rect.right > minX &&
          r.rect.top < maxY &&
          r.rect.bottom > minY
      )
      .map((r) => r.id);

    return new Set(ids);
  };

  const selectRangeByBox = (selection, anchorId, endId, additive = false) => {
    const boxIds = getBoxSelectionIds(anchorId, endId);
    if (!boxIds.size) return;

    if (additive) {
      selection.setSelected((prev) => {
        const next = new Set(prev instanceof Set ? prev : []);
        boxIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      selection.setSelected(boxIds);
    }
  };

  return { getBoxSelectionIds, selectRangeByBox };
}
