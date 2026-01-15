import { ref, watch, onBeforeUnmount } from "vue";

export function useFullScreenModal(videosRef) {
  const fullScreenVideo = ref(null);
  const fullScreenIndex = ref(-1);

  const openFullScreen = (video, playingVideos) => {
    const list = videosRef.value || [];
    const index = list.findIndex((v) => v.id === video.id);
    fullScreenVideo.value = video;
    fullScreenIndex.value = index;

    if (playingVideos && playingVideos.size > 0) {
      playingVideos.forEach((videoId) => {
        const videoElement = document.querySelector(
          `[data-video-id="${videoId}"] video`
        );
        if (videoElement) {
          videoElement.pause();
        }
      });
    }
  };

  const closeFullScreen = () => {
    fullScreenVideo.value = null;
    fullScreenIndex.value = -1;
  };

  const navigateFullScreen = (direction) => {
    const list = videosRef.value || [];
    if (fullScreenIndex.value === -1 || !list.length) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (fullScreenIndex.value + 1) % list.length;
    } else {
      newIndex =
        fullScreenIndex.value === 0 ? list.length - 1 : fullScreenIndex.value - 1;
    }

    const newVideo = list[newIndex];
    if (newVideo) {
      fullScreenVideo.value = newVideo;
      fullScreenIndex.value = newIndex;
    }
  };

  const handleKeyDown = (event) => {
    if (!fullScreenVideo.value) return;
    switch (event.key) {
      case "Escape":
        closeFullScreen();
        break;
      case "ArrowLeft":
        event.preventDefault();
        navigateFullScreen("prev");
        break;
      case "ArrowRight":
        event.preventDefault();
        navigateFullScreen("next");
        break;
      default:
        break;
    }
  };

  watch(fullScreenVideo, (next) => {
    if (next) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return {
    fullScreenVideo,
    openFullScreen,
    closeFullScreen,
    navigateFullScreen,
  };
}
