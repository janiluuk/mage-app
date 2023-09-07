<template>
  <div>
    <video ref="videoPlayer"></video>
  </div>
</template>

<script>
import videojs from 'video.js';

export default {
  name: 'VideoPlayer',
  props: {
    sources: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      player: null,
      canvas: null,
      context: null,
      numFrames: 12,
    };
  },
  methods: {
    extractFrames () {
      // Create a new video element
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.volume = 0;
      video.src = this.sources[0]?.src;
      video.play();

      // Handle the 'durationchange' event
      const handleDurationChange = () => {
        const duration = video.duration;
        const interval = duration / this.numFrames;
        let currentTime = 0;
        const frames = [];

        // Create a canvas element to draw the frames on
        const actualVideoHeight = video.videoHeight;
        const actualVideoWidth = video.videoWidth;
        const thumbnailWidth = 200;
        const thumbnailHeight = (thumbnailWidth / actualVideoWidth) * actualVideoHeight;
        this.canvas.width = thumbnailWidth;
        this.canvas.height = thumbnailHeight;

        // Extract frames from the video
        const extractFrame = () => {
          if (currentTime > duration || frames.length === this.numFrames) {
            // Set the frames in the store
            console.log(frames);
            video.currentTime = 0;
            return;
          }
          currentTime += interval;
          video.currentTime = currentTime;
          this.context.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
          const dataUrl = this.canvas.toDataURL();
          frames.push(dataUrl);
          video.requestVideoFrameCallback(extractFrame);
        };
        video.requestVideoFrameCallback(extractFrame);
        video.currentTime = 0;
      };

      video.addEventListener('durationchange', handleDurationChange);
    },
  },
  mounted () {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.player = videojs(this.$refs.videoPlayer, {
      sources: this.sources,
    });
    this.extractFrames();
  },
  beforeDestroy () {
    if (this.player) {
      this.player.dispose();
    }
  },
};
</script>
