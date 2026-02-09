<template>
  <div class="edit-toolbar">
    <div class="toolbar-section">
      <!-- Trim/Split Group -->
      <div class="button-group">
        <Button
          :disabled="!canCut"
          icon="pi pi-code"
          size="small"
          text
          v-tooltip.top="'Split at current position'"
          @click="split"
        />
        <Button
          :disabled="!canCut"
          icon="pi pi-angle-left"
          size="small"
          text
          v-tooltip.top="'Set start point'"
          @click="setStartPoint"
        />
        <Button
          :disabled="!canCut"
          icon="pi pi-angle-right"
          size="small"
          text
          v-tooltip.top="'Set end point'"
          @click="setEndPoint"
        />
      </div>

      <Divider layout="vertical" />

      <!-- Volume & Playback Rate -->
      <div class="slider-group">
        <VolumeSlider />
        <PlaybackRateSlider />
      </div>

      <Divider layout="vertical" />

      <!-- Fragment Actions -->
      <div class="button-group">
        <Button
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          v-tooltip.top="'Delete fragment'"
          @click="removeFragment"
        />
        <Button
          :disabled="!canMoveLeft"
          icon="pi pi-chevron-left"
          size="small"
          text
          v-tooltip.top="'Move left'"
          @click="shiftFragment(-1)"
        />
        <Button
          :disabled="!canMoveRight"
          icon="pi pi-chevron-right"
          size="small"
          text
          v-tooltip.top="'Move right'"
          @click="shiftFragment(1)"
        />
      </div>

      <Divider layout="vertical" />

      <!-- Undo/Redo -->
      <div class="button-group">
        <Button
          :disabled="!canUndo"
          icon="pi pi-undo"
          size="small"
          text
          v-tooltip.top="'Undo'"
          @click="undo"
        />
        <Button
          :disabled="!canRedo"
          icon="pi pi-redo"
          size="small"
          text
          v-tooltip.top="'Redo'"
          @click="redo"
        />
      </div>

      <div class="spacer"></div>

      <!-- Project Actions -->
      <div class="button-group">
        <Button
          v-tooltip.bottom="'Save project'"
          :disabled="!hasProject"
          size="small"
          icon="pi pi-save"
          text
          @click="showSaveProjectDialog"
        />
        <Button
          v-tooltip.bottom="'Load project'"
          size="small"
          icon="pi pi-folder-open"
          text
          @click="showLoadProjectDialog"
        />
      </div>

      <!-- Export -->
      <Button
        :disabled="!hasProject"
        icon="pi pi-download"
        label="Export"
        severity="success"
        size="small"
        v-tooltip.bottom="'Export video'"
        @click="showExportDialog"
      />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tooltip from 'primevue/tooltip';
import VolumeSlider from './VolumeSlider.vue';
import PlaybackRateSlider from './PlaybackRateSlider.vue';

export default {
  name: 'EditButtons',
  components: { 
    Button,
    Divider,
    VolumeSlider, 
    PlaybackRateSlider 
  },
  directives: {
    tooltip: Tooltip,
  },
  setup() {
    const store = useStore();

    const canUndo = computed(() => store.getters['videoeditor/canUndo']);
    const canRedo = computed(() => store.getters['videoeditor/canRedo']);
    const canMoveRight = computed(() => store.getters['videoeditor/canMoveRight']);
    const canMoveLeft = computed(() => store.getters['videoeditor/canMoveLeft']);
    const canCut = computed(() => store.getters['videoeditor/canCut']);
    const hasProject = computed(() => store.getters['videoeditor/hasProject']);

    const split = () => {
      store.dispatch('videoeditor/split');
    };

    const setStartPoint = () => {
      store.dispatch('videoeditor/setStartPoint');
    };

    const setEndPoint = () => {
      store.dispatch('videoeditor/setEndPoint');
    };

    const removeFragment = () => {
      const fragment = store.state.videoeditor.activeFragment;
      if (fragment) {
        store.dispatch('videoeditor/removeFragment', fragment);
      }
    };

    const shiftFragment = (shift) => {
      store.dispatch('videoeditor/shiftFragment', shift);
    };

    const undo = () => {
      store.dispatch('videoeditor/undo');
    };

    const redo = () => {
      store.dispatch('videoeditor/redo');
    };

      const showExportDialog = () => {
        store.dispatch('videoeditor/showExportDialog', true);
      };

      const showSaveProjectDialog = () => {
        // Emit event to parent to show save dialog
        // The parent component (Editor.vue) will handle this
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('show-save-project-dialog'));
        }
      };

      const showLoadProjectDialog = () => {
        // Emit event to parent to show load dialog
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('show-load-project-dialog'));
        }
      };
      
      return {
      canUndo,
      canRedo,
      canMoveRight,
      canMoveLeft,
      canCut,
      hasProject,
      split,
      setStartPoint,
      setEndPoint,
      removeFragment,
      shiftFragment,
      undo,
      redo,
      showExportDialog,
      showSaveProjectDialog,
      showLoadProjectDialog,
    };
  },
};
</script>

<style scoped>
.edit-toolbar {
  width: 100%;
  background-color: var(--surface-ground, rgba(128, 128, 128, 0.1));
  border-bottom: 1px solid var(--surface-border, rgba(255, 255, 255, 0.1));
  padding: 0.5rem 1rem;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spacer {
  flex: 1;
}

/* Compact slider styling */
:deep(.slider-group .p-slider) {
  width: 120px;
}

:deep(.slider-group .p-slider-horizontal .p-slider-handle) {
  margin-top: -0.5rem;
}

:deep(.slider-group label) {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  min-width: 80px;
}
</style>
