<template>
  <div class="audio-visualization-controls">
    <div class="controls-header mb-3">
      <h4>Audio Visualization</h4>
    </div>

    <div class="visualization-canvas mb-3">
      <canvas ref="visualizationCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      <div v-if="volumeLevel > 0" class="volume-indicator">
        <small>Volume: {{ volumeLevel }}%</small>
      </div>
    </div>

    <div class="actions flex gap-2">
      <Button
        label="Export Image"
        icon="pi pi-download"
        @click="exportImage"
        class="p-button-outlined"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import Button from 'primevue/button';
import { useAudioAnalysisService } from '@/services/audioAnalysisService';

export default {
  name: 'AudioVisualizationControls',
  components: { Button },
  props: {
    audioElement: { type: Object, default: null }
  },
  emits: ['export'],
  setup(props, { emit }) {
    const audioService = useAudioAnalysisService();
    const visualizationCanvas = ref(null);
    const volumeLevel = ref(0);
    const canvasWidth = 800;
    const canvasHeight = 300;
    
    function exportImage() {
      if (!visualizationCanvas.value) return;
      const dataUrl = visualizationCanvas.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = \`audio-visualization-\${Date.now()}.png\`;
      link.href = dataUrl;
      link.click();
      emit('export', dataUrl);
    }
    
    onMounted(() => {
      if (props.audioElement) {
        audioService.initialize(props.audioElement);
      }
    });
    
    onUnmounted(() => {
      audioService.cleanup();
    });
    
    return {
      visualizationCanvas,
      volumeLevel,
      canvasWidth,
      canvasHeight,
      exportImage
    };
  }
};
</script>

<style scoped>
.audio-visualization-controls {
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
}
</style>
