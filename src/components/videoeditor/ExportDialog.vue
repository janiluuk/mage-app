<template>
  <Dialog 
    v-model:visible="showDialog" 
    modal 
    :style="{ width: '700px' }"
    :closable="true"
    header="Export Video"
  >
    <div class="export-dialog-content">
      <Accordion :activeIndex="activePanel">
        <AccordionTab>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-cog"></i>
              <span>Export Settings</span>
            </div>
          </template>
          
          <div class="export-settings">
            <div class="field mb-4">
              <label for="fps" class="block mb-2">Output FPS (optional)</label>
              <InputNumber 
                id="fps"
                v-model="exportFPS" 
                :useGrouping="false"
                :min="1"
                :max="120"
                placeholder="e.g. 30"
                class="w-full"
              />
            </div>
            
            <div v-if="exportFPS" class="field mb-4">
              <div class="flex align-items-center">
                <Checkbox 
                  v-model="interpolate" 
                  inputId="interpolate"
                  :binary="true"
                />
                <label for="interpolate" class="ml-2">Interpolate frames</label>
              </div>
            </div>
            
            <div class="field mb-4">
              <label for="bitrate" class="block mb-2">Video bitrate (MB/s, optional)</label>
              <InputNumber 
                id="bitrate"
                v-model="exportBitrate" 
                :useGrouping="false"
                :min="0.1"
                :max="100"
                :step="0.1"
                placeholder="e.g. 5"
                class="w-full"
              />
            </div>
            
            <div class="field mb-4">
              <div class="flex align-items-center mb-3">
                <Checkbox 
                  v-model="customResolution" 
                  inputId="customResolution"
                  :binary="true"
                />
                <label for="customResolution" class="ml-2">Change output resolution</label>
              </div>
              
              <div v-if="customResolution" class="flex gap-2">
                <div class="field flex-1">
                  <label for="width" class="block mb-2">Width</label>
                  <InputNumber 
                    id="width"
                    v-model="exportWidth" 
                    :useGrouping="false"
                    :min="1"
                    :max="7680"
                    class="w-full"
                  />
                </div>
                <div class="field flex-1">
                  <label for="height" class="block mb-2">Height</label>
                  <InputNumber 
                    id="height"
                    v-model="exportHeight" 
                    :useGrouping="false"
                    :min="1"
                    :max="4320"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </AccordionTab>
        
        <AccordionTab>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-filter"></i>
              <span>Advanced Options</span>
            </div>
          </template>
          
          <div class="advanced-options">
            <div v-if="selectedFilters.length > 0" class="mb-3">
              <div class="flex flex-wrap gap-2">
                <Chip 
                  v-for="(filter, index) in selectedFilters" 
                  :key="index"
                  :label="`${filter.name}${filter.options ? '=' + filter.options : ''}`"
                  removable
                  @remove="removeFilter(filter)"
                  @click="editFilter(filter)"
                  class="cursor-pointer"
                />
              </div>
            </div>
            
            <AdvancedExportOptions />
          </div>
        </AccordionTab>
      </Accordion>
    </div>
    
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button 
          label="Cancel" 
          severity="secondary"
          @click="cancel"
        />
        <Button 
          label="Export" 
          @click="confirm"
          :loading="exporting"
        />
      </div>
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import Dialog from 'primevue/dialog';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import AdvancedExportOptions from '@/components/videoeditor/AdvancedExportOptions.vue';

export default {
  name: 'ExportDialog',
  components: {
    Dialog,
    Accordion,
    AccordionTab,
    InputNumber,
    Checkbox,
    Button,
    Chip,
    AdvancedExportOptions,
  },
  setup() {
    const store = useStore();
    const activePanel = ref([0]);
    const exporting = ref(false);
    
    const showDialog = computed({
      get: () => store.state.videoeditor.export.showDialog,
      set: (value) => store.commit('videoeditor/SET_EXPORT_DIALOG', value),
    });
    
    const exportState = computed(() => store.state.videoeditor.export);
    const activeFragment = computed(() => store.state.videoeditor.activeFragment);
    
    const exportFPS = computed({
      get: () => exportState.value.fps ? parseFloat(exportState.value.fps) : null,
      set: (value) => store.commit('videoeditor/SET_EXPORT_FPS', value ? value.toString() : ''),
    });
    
    const exportBitrate = computed({
      get: () => exportState.value.bitrate ? parseFloat(exportState.value.bitrate) : null,
      set: (value) => store.commit('videoeditor/SET_EXPORT_BITRATE', value ? value.toString() : ''),
    });
    
    const customResolution = computed({
      get: () => exportState.value.customResolution,
      set: (value) => {
        if (value) {
          const width = exportState.value.width || (activeFragment.value?.video?.width || 1920);
          const height = exportState.value.height || (activeFragment.value?.video?.height || 1080);
          store.dispatch('videoeditor/setExportCustomResolution', { width, height });
        } else {
          store.commit('videoeditor/SET_EXPORT_CUSTOM_RESOLUTION', { width: null, height: null });
        }
      },
    });
    
    const exportWidth = computed({
      get: () => {
        if (exportState.value.customResolution) {
          return exportState.value.width || (activeFragment.value?.video?.width || 1920);
        }
        return activeFragment.value?.video?.width || 1920;
      },
      set: (value) => {
        if (exportState.value.customResolution && value) {
          // Use store state directly to avoid circular dependency with exportHeight
          const currentHeight = exportState.value.height || (activeFragment.value?.video?.height || 1080);
          store.dispatch('videoeditor/setExportCustomResolution', { 
            width: value, 
            height: currentHeight
          });
        }
      },
    });
    
    const exportHeight = computed({
      get: () => {
        if (exportState.value.customResolution) {
          return exportState.value.height || (activeFragment.value?.video?.height || 1080);
        }
        return activeFragment.value?.video?.height || 1080;
      },
      set: (value) => {
        if (exportState.value.customResolution && value) {
          // Use store state directly to avoid circular dependency with exportWidth
          const currentWidth = exportState.value.width || (activeFragment.value?.video?.width || 1920);
          store.dispatch('videoeditor/setExportCustomResolution', { 
            width: currentWidth,
            height: value 
          });
        }
      },
    });
    
    const interpolate = computed({
      get: () => {
        // Only return interpolate value if FPS is set, otherwise force to false
        if (!exportFPS.value) {
          return false;
        }
        return exportState.value.interpolate || false;
      },
      set: (value) => {
        // Only allow setting interpolate if FPS is set
        if (exportFPS.value) {
          store.commit('videoeditor/SET_EXPORT_INTERPOLATE', value);
        } else {
          store.commit('videoeditor/SET_EXPORT_INTERPOLATE', false);
        }
      },
    });
    
    const selectedFilters = computed(() => exportState.value.filters || []);
    
    // Watch exportFPS to reset interpolate when FPS is cleared
    watch(exportFPS, (newFPS) => {
      if (!newFPS && exportState.value.interpolate) {
        store.commit('videoeditor/SET_EXPORT_INTERPOLATE', false);
      }
    });
    
    watch(() => showDialog.value, (newVal) => {
      if (newVal) {
        activePanel.value = [0];
      }
    });
    
    const editFilter = async (filter) => {
      // TODO: Implement filter editing dialog
      console.log('Edit filter:', filter);
    };
    
    const removeFilter = (filter) => {
      store.dispatch('videoeditor/removeExportFilter', filter);
    };
    
    const cancel = () => {
      store.dispatch('videoeditor/showExportDialog', false);
    };
    
    const confirm = async () => {
      exporting.value = true;
      try {
        await store.dispatch('videoeditor/exportVideo', {
          fps: exportFPS.value ? exportFPS.value.toString() : '',
          bitrate: exportBitrate.value ? exportBitrate.value.toString() : '',
          customResolution: customResolution.value,
          width: exportWidth.value,
          height: exportHeight.value,
          // Only include interpolate if FPS is set (enforced by computed property)
          interpolate: exportFPS.value ? interpolate.value : false,
          filters: selectedFilters.value,
        });
        store.dispatch('videoeditor/showExportDialog', false);
      } catch (error) {
        console.error('Export failed:', error);
        // Error is handled by the store and shown in ExportStatus
      } finally {
        exporting.value = false;
      }
    };
    
    return {
      showDialog,
      activePanel,
      exporting,
      exportFPS,
      exportBitrate,
      customResolution,
      exportWidth,
      exportHeight,
      interpolate,
      selectedFilters,
      editFilter,
      removeFilter,
      cancel,
      confirm,
    };
  },
};
</script>

<style scoped>
.export-dialog-content {
  padding: 1rem 0;
}

.export-settings {
  padding: 0.5rem 0;
}

.advanced-options {
  padding: 0.5rem 0;
}

.field {
  margin-bottom: 1rem;
}

.field:last-child {
  margin-bottom: 0;
}
</style>
