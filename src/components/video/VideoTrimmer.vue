<template>
  <div style="width: 100%">
    <canvas ref="sliderCanvas" @mousedown="handleMouseDown" @mouseup="handleMouseUp" style="user-select: none;" />
  </div>
</template>
  
  
<script>

const Handles = Object.freeze({
  START_HANDLE: 'START_HANDLE',
  END_HANDLE: 'END_HANDLE',
  TIME_HANDLE: 'TIME_HANDLE',
});

export default {
  name: 'VideoTrimmer',
  props: {
    frames: {
      type: Array,
      required: true,
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    videoDuration: {
      type: Number,
      required: true,
    },
    defaultTrim: {
      type: Object,
      default: null,
    },
    minTrimDuration: {
      type: Number,
      default: 8,
    },
    maxTrimDuration: {
      type: Number,
      default: 60,
    },
  },
  data() {
    return {
      startHandlePos: 0,
      endHandlePos: 800,
      timeHandlePos: 0,
      canvasWidth: 800,
      canvasHeight: 104,
      frameWidth: 80,
      handleWidth: 14,
      canvasContext: null,
      framesCanvas: null,
      trimStart: 0,
      trimEnd: 0,
      selectedElement: null,
    };
  },
  computed: {
    durationPositionRatio() {
      return this.videoDuration / this.canvasWidth;
    },
    positionDurationRatio() {
      return this.canvasWidth / this.videoDuration;
    },
  },
  watch: {
    frames() {
      this.setCanvasWidth();
    },
    currentTime(newValue) {
      this.timeHandlePos = newValue * this.positionDurationRatio;
      this.drawSlider();
    },
    defaultTrim(newValue) {
      const { start, end } = newValue;

      this.trimStart = start;
      this.startHandlePos = start * this.positionDurationRatio;

      this.trimEnd = end;
      this.endHandlePos = end * this.positionDurationRatio;
    },
  },
  async mounted() {
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.handleMouseMove);

    this.timeHandlePos = this.currentTime * this.positionDurationRatio;
    this.setCanvasWidth();
    this.handleDurationChange();

    // Get the canvas element and its context
    this.canvasContext = this.$refs.sliderCanvas.getContext('2d');

    // Set the canvas width and height
    this.$refs.sliderCanvas.width = this.$refs.sliderCanvas?.offsetWidth;
    this.$refs.sliderCanvas.height = this.canvasHeight;

    // Draw the frames
    this.drawFrames().then(() => {
      // Draw the offscreen canvas onto the main canvas
      this.canvasContext.drawImage(this.framesCanvas, 0, 0);

      // Draw the initial slider
      this.drawSlider();
    });
  },

  beforeUnmount() {
    // Remove the window resize and mousemove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
  },
  methods: {
    async onWindowResize() {
      this.setCanvasWidth();
      this.handleDurationChange();

      // Get the canvas element and its context
      this.canvasContext = this.$refs.sliderCanvas ? this.$refs.sliderCanvas.getContext('2d') : null;

      if (!this.canvasContext) {
        return;
      }

      // Set the canvas width and height
      this.$refs.sliderCanvas.width = this.canvasWidth;
      this.$refs.sliderCanvas.height = this.canvasHeight;

      await this.$nextTick();

      // Calculate the new handle positions based on the current trim duration
      const durationPositionRatio = this.videoDuration / this.canvasWidth;
      this.startHandlePos = this.trimStart / durationPositionRatio;
      this.endHandlePos = this.trimEnd / durationPositionRatio;
      this.timeHandlePos = this.currentTime / durationPositionRatio;

      // Draw the frames
      this.drawFrames().then(() => {
        // Draw the offscreen canvas onto the main canvas
        this.canvasContext.drawImage(this.framesCanvas, 0, 0);

        // Draw the initial slider
        this.drawSlider();
      });
    },
    async drawFrames() {
      // Create an offscreen canvas
      this.framesCanvas = document.createElement('canvas');
      this.framesCanvas.width = this.canvasWidth;
      this.framesCanvas.height = this.canvasHeight;
      const offscreenContext = this.framesCanvas.getContext('2d');

      this.framesCanvas.fillStyle = '#000000';

      // Load all frames and draw them on the offscreen canvas
      await Promise.all(
        this.frames.map((src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
          });
        })
      ).then((frames) => {
        let x = this.handleWidth;
        frames.forEach((img) => {
          // Finding the new width and height based on the scale factor
          let newWidth = this.frameWidth;
          let newHeight = (this.frameWidth * img.height) / img.width;

          // get the top left position of the image
          // in order to center the image within the framesCanvas
          let y = this.canvasHeight / 2 - newHeight / 2;

          offscreenContext.drawImage(img, x, y, newWidth, newHeight);
          x += this.frameWidth;
        });
      });
    },
    async drawSlider() {
      // Clear the canvas
      this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Draw the offscreen canvas onto the main canvas
      this.canvasContext.drawImage(this.framesCanvas, 0, 0);

      // Add a white filter over the non-intersecting areas
      this.updateGlobalCompositeOperation();

      // Draw handle current time
      this.canvasContext.fillStyle = '#ffffff';
      this.canvasContext.fillRect(
        this.timeHandlePos,
        0,
        this.handleWidth / 2,
        this.framesCanvas.height
      );
      this.canvasContext.shadowOffsetX = '0px';
      this.canvasContext.shadowOffsetY = '4px';
      this.canvasContext.shadowBlur = 4;
      this.canvasContext.shadowColor = 'rgba(0, 0, 0, 0.25)';

      // Draw handle 1
      this.canvasContext.fillStyle = '#ffffff';
      this.canvasContext.fillRect(
        this.startHandlePos,
        0,
        this.handleWidth,
        this.framesCanvas.height
      );
      // Set the font and alignment for the text
      this.canvasContext.font = 'bold 12px Rubik';
      this.canvasContext.textAlign = 'center';

      // Draw the '<' symbol in the middle of the rectangle
      this.canvasContext.fillStyle = '#273142';
      this.canvasContext.fillText(
        '<',
        this.startHandlePos + this.handleWidth / 2,
        this.framesCanvas.height / 2 + 8
      );

      // Draw handle 2
      this.canvasContext.fillStyle = '#ffffff';
      this.canvasContext.fillRect(
        this.endHandlePos - this.handleWidth,
        0,
        this.handleWidth,
        this.framesCanvas.height
      );
      // Set the font and alignment for the text
      this.canvasContext.font = 'bold 12px Rubik';
      this.canvasContext.textAlign = 'center';

      // Draw the '>' symbol in the middle of the rectangle
      this.canvasContext.fillStyle = '#273142';
      this.canvasContext.fillText(
        '>',
        this.endHandlePos - this.handleWidth / 2,
        this.framesCanvas.height / 2 + 8
      );

      // Set the font and alignment for the text
      this.canvasContext.font = 'bold 12px Rubik';
      this.canvasContext.textAlign = 'center';
    },
    updateHandles(mouseX) {
      // Move the closest handle to the mouse
      if (this.selectedElement === Handles.START_HANDLE) {
        const currentVideoDuration =
          this.durationPositionRatio * (this.endHandlePos - mouseX);
        if (
          currentVideoDuration < this.minTrimDuration ||
          currentVideoDuration > this.maxTrimDuration
        ) {
          return;
        }
        this.startHandlePos = mouseX;
        this.trimStart = this.durationPositionRatio * mouseX > 0 ? this.durationPositionRatio * mouseX : 0;
        this.$emit('trim-start', this.trimStart);
      } else if (this.selectedElement === Handles.END_HANDLE) {
        const currentVideoDuration =
          this.durationPositionRatio * (mouseX - this.startHandlePos);
        if (
          currentVideoDuration < this.minTrimDuration ||
          currentVideoDuration > this.maxTrimDuration
        ) {
          return;
        }
        this.endHandlePos = mouseX;
        this.trimEnd = this.durationPositionRatio * mouseX <= this.videoDuration ? this.durationPositionRatio * mouseX : this.videoDuration;
        this.$emit('trim-end', this.trimEnd);
      } else if (this.selectedElement === Handles.TIME_HANDLE) {
        this.timeHandlePos = mouseX;
        const currentTime = this.durationPositionRatio * mouseX;
        this.$emit('current-time', currentTime);
      }

      // Make sure the handles stay within the slider track
      if (this.startHandlePos < 0) {
        this.startHandlePos = 0;
      }
      if (this.endHandlePos > this.canvasWidth) {
        this.endHandlePos = this.canvasWidth;
      }
      if (this.startHandlePos > this.endHandlePos) {
        this.startHandlePos = this.endHandlePos;
      }

      // Redraw the slider using requestAnimationFrame
      requestAnimationFrame(() => {
        this.drawSlider();
      });
    },
    handleMouseDown(event) {
      const mouseX = event.offsetX;

      // Calculate the distance between the mouse and each handle
      const distStartHandlePos = Math.abs(mouseX - this.startHandlePos);
      const distEndHandlePos = Math.abs(mouseX - this.endHandlePos);
      const distTimeHandlePos = Math.abs(mouseX - this.timeHandlePos);

      // Set selected element to the closest handle to the mouse
      if (distStartHandlePos < this.handleWidth * 2) {
        this.selectedElement = Handles.START_HANDLE;
      } else if (distEndHandlePos < this.handleWidth * 2) {
        this.selectedElement = Handles.END_HANDLE;
      } else if (distTimeHandlePos < this.handleWidth * 2) {
        this.selectedElement = Handles.TIME_HANDLE;
      }
      this.updateHandles(mouseX);
    },
    handleMouseMove(event) {
      if (this.selectedElement) {
        if (event.buttons === 1) {
          this.updateHandles(event.offsetX);
        }
      }
    },
    handleMouseUp() {
      this.selectedElement = null;
    },
    setCanvasWidth() {
      this.canvasWidth = this.$refs.sliderCanvas?.offsetWidth;
      this.frameWidth = (this.canvasWidth - (this.handleWidth * 2)) / this.frames.length;
    },
    updateGlobalCompositeOperation() {
      // Set the global composite operation to draw the white filter over the non-intersecting areas
      this.canvasContext.globalCompositeOperation = 'source-over';
      this.canvasContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.canvasContext.fillRect(
        0,
        0,
        this.startHandlePos + this.handleWidth,
        this.framesCanvas.height
      );
      this.canvasContext.fillRect(
        this.endHandlePos,
        0,
        this.canvasWidth - this.endHandlePos,
        this.framesCanvas.height
      );
    },
    handleDurationChange() {
      if (this.videoDuration > this.maxTrimDuration) {
        this.endHandlePos = this.maxTrimDuration * this.positionDurationRatio;
        this.trimEnd = this.maxTrimDuration;
        this.$emit('trim-end', this.trimEnd);
      } else {
        this.endHandlePos = this.canvasWidth;
        this.trimEnd = this.defaultTrim.end || this.videoDuration;
        this.$emit('trim-end', this.trimEnd);
      }
    },
  },
};
</script>
  
<style scoped lang="scss">
canvas {
  border: 4px solid #ffffff;
  border-left: 1px solid #fff;
  border-right: 1px solid #fff;
  border-radius: 8px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  background: black;
  width: 100%;
  margin-bottom: 4px;
}

.second-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;

  &--bold {
    background: #6E7787;
  }

  &--light {
    background: #AFBBCA;
  }
}
</style>