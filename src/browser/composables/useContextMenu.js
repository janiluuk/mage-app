import { ref } from "vue";

export function useContextMenu() {
  const contextMenu = ref({
    visible: false,
    position: { x: 0, y: 0 },
    contextId: undefined,
  });

  const showOnItem = (event, videoId) => {
    if (!event || !videoId) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    contextMenu.value = {
      visible: true,
      position: {
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      },
      contextId: videoId,
    };
  };

  const showOnEmpty = (event) => {
    if (!event) return;
    event.stopPropagation?.();
    contextMenu.value = {
      visible: true,
      position: {
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      },
      contextId: undefined,
    };
  };

  const hide = () => {
    contextMenu.value = { ...contextMenu.value, visible: false };
  };

  return { contextMenu, showOnItem, showOnEmpty, hide };
}
