<template>
  <Dialog
    v-model:visible="visible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @hide="onHide"
  >
    <div class="export-dialog">
      <div class="field mb-4">
        <label class="font-semibold mb-2">What would you like to export?</label>
        <div class="flex flex-column gap-2 mt-2">
          <div class="field-radiobutton">
            <RadioButton 
              v-model="exportType" 
              inputId="exportPreset" 
              value="preset" 
              :disabled="!canExportPreset"
            />
            <label for="exportPreset" class="ml-2">Current Preset</label>
          </div>
          <div class="field-radiobutton">
            <RadioButton 
              v-model="exportType" 
              inputId="exportPresets" 
              value="presets"
              :disabled="!canExportPresets"
            />
            <label for="exportPresets" class="ml-2">
              All Presets ({{ presetsCount }} total)
            </label>
          </div>
          <div class="field-radiobutton">
            <RadioButton 
              v-model="exportType" 
              inputId="exportSettings" 
              value="settings"
            />
            <label for="exportSettings" class="ml-2">Current Editor Settings</label>
          </div>
        </div>
      </div>

      <div class="field mb-4">
        <label class="font-semibold mb-2">Export Format</label>
        <Dropdown 
          v-model="exportFormat" 
          :options="formatOptions" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>

      <div class="field mb-4" v-if="showPreview">
        <label class="font-semibold mb-2">Preview</label>
        <Textarea 
          :value="previewContent" 
          :rows="10" 
          readonly 
          class="w-full font-mono text-sm"
        />
      </div>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>
    </div>

    <template #footer>
      <div class="flex justify-content-between align-items-center w-full">
        <div class="flex align-items-center gap-2">
          <Checkbox v-model="showPreview" inputId="showPreview" :binary="true" />
          <label for="showPreview" class="cursor-pointer">Show preview</label>
        </div>
        <div class="flex gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            @click="visible = false" 
            class="p-button-text"
          />
          <Button 
            label="Export" 
            icon="pi pi-download" 
            @click="handleExport" 
            :loading="isExporting"
            :disabled="!canExport"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import { useExportService } from '@/services/exportService';

export default {
  name: 'ExportDialog',
  components: {
    Dialog,
    RadioButton,
    Dropdown,
    Textarea,
    Button,
    Checkbox,
    Message
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    currentPreset: {
      type: Object,
      default: null
    },
    allPresets: {
      type: Array,
      default: () => []
    },
    currentSettings: {
      type: Object,
      default: null
    },
    editorType: {
      type: String,
      default: 'deforum'
    }
  },
  emits: ['update:modelValue', 'export'],
  setup(props, { emit }) {
    const exportService = useExportService();
    
    // State
    const visible = ref(props.modelValue);
    const exportType = ref('settings');
    const exportFormat = ref('json');
    const showPreview = ref(false);
    const isExporting = ref(false);
    const errorMessage = ref('');
    
    // Options
    const formatOptions = [
      { label: 'JSON', value: 'json' },
      { label: 'YAML', value: 'yaml' }
    ];
    
    // Computed
    const dialogTitle = computed(() => {
      return 'Export Settings';
    });
    
    const presetsCount = computed(() => {
      return props.allPresets.length;
    });
    
    const canExportPreset = computed(() => {
      return props.currentPreset !== null;
    });
    
    const canExportPresets = computed(() => {
      return props.allPresets.length > 0;
    });
    
    const canExport = computed(() => {
      if (exportType.value === 'preset' && !canExportPreset.value) return false;
      if (exportType.value === 'presets' && !canExportPresets.value) return false;
      if (exportType.value === 'settings' && !props.currentSettings) return false;
      return true;
    });
    
    const previewContent = computed(() => {
      if (!showPreview.value) return '';
      
      try {
        let data;
        if (exportType.value === 'preset' && props.currentPreset) {
          data = exportService.generatePreview({ presets: [props.currentPreset] });
        } else if (exportType.value === 'presets') {
          data = exportService.generatePreview({ presets: props.allPresets });
        } else if (exportType.value === 'settings') {
          data = exportService.generatePreview({ settings: props.currentSettings });
        }
        return data;
      } catch (error) {
        return 'Error generating preview';
      }
    });
    
    // Methods
    function handleExport() {
      errorMessage.value = '';
      isExporting.value = true;
      
      try {
        if (exportType.value === 'preset') {
          exportService.exportPreset(props.currentPreset);
        } else if (exportType.value === 'presets') {
          exportService.exportPresets(props.allPresets);
        } else if (exportType.value === 'settings') {
          exportService.exportSettings(props.currentSettings, props.editorType);
        }
        
        emit('export', {
          type: exportType.value,
          format: exportFormat.value
        });
        
        visible.value = false;
      } catch (error) {
        errorMessage.value = `Export failed: ${error.message}`;
      } finally {
        isExporting.value = false;
      }
    }
    
    function onHide() {
      errorMessage.value = '';
      showPreview.value = false;
      emit('update:modelValue', false);
    }
    
    // Watchers
    watch(() => props.modelValue, (newValue) => {
      visible.value = newValue;
    });
    
    watch(visible, (newValue) => {
      if (!newValue) {
        emit('update:modelValue', false);
      }
    });
    
    return {
      visible,
      exportType,
      exportFormat,
      showPreview,
      isExporting,
      errorMessage,
      formatOptions,
      dialogTitle,
      presetsCount,
      canExportPreset,
      canExportPresets,
      canExport,
      previewContent,
      handleExport,
      onHide
    };
  }
};
</script>

<style scoped>
.export-dialog {
  padding: 0.5rem 0;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.field-radiobutton {
  display: flex;
  align-items-center;
}

.field-radiobutton label {
  margin: 0;
}
</style>
