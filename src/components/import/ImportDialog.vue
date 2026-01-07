<template>
  <Dialog
    v-model:visible="visible"
    header="Import Settings"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @hide="onHide"
  >
    <div class="import-dialog">
      <!-- File Upload -->
      <div class="field mb-4" v-if="!fileSelected">
        <label class="font-semibold mb-2">Select File to Import</label>
        <FileUpload
          mode="basic"
          accept=".json"
          :maxFileSize="1000000"
          :auto="false"
          chooseLabel="Choose File"
          @select="onFileSelect"
          class="w-full"
        />
        <small class="text-muted mt-2 block">
          Supported formats: JSON (.json)
        </small>
      </div>

      <!-- Preview -->
      <div v-if="fileSelected && !importing">
        <div class="field mb-3">
          <div class="flex justify-content-between align-items-center">
            <span class="font-semibold">Selected File:</span>
            <Button 
              label="Change" 
              icon="pi pi-refresh" 
              @click="resetFile" 
              class="p-button-sm p-button-text"
            />
          </div>
          <div class="mt-2 p-3 bg-gray-100 border-round">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file text-xl"></i>
              <div>
                <div class="font-semibold">{{ selectedFile.name }}</div>
                <small class="text-muted">{{ fileSize }}</small>
              </div>
            </div>
          </div>
        </div>

        <div v-if="previewData" class="field mb-3">
          <div class="font-semibold mb-2">Import Summary</div>
          <div class="p-3 bg-blue-50 border-round">
            <div class="flex flex-column gap-2">
              <div><strong>Type:</strong> {{ previewData.type }}</div>
              <div><strong>Items:</strong> {{ previewData.itemCount }}</div>
              <div v-if="previewData.metadata">
                <strong>Version:</strong> {{ previewData.metadata.version }}
              </div>
              <div v-if="previewData.metadata && previewData.metadata.date">
                <strong>Export Date:</strong> {{ formatDate(previewData.metadata.date) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Conflicts -->
        <div v-if="conflicts.length > 0" class="field mb-3">
          <Message severity="warn" :closable="false">
            Found {{ conflicts.length }} conflict(s). Choose how to resolve:
          </Message>
          
          <div class="mt-3">
            <div class="field-radiobutton mb-2">
              <RadioButton 
                v-model="conflictResolution" 
                inputId="skip" 
                value="skip"
              />
              <label for="skip" class="ml-2">Skip conflicting items</label>
            </div>
            <div class="field-radiobutton mb-2">
              <RadioButton 
                v-model="conflictResolution" 
                inputId="replace" 
                value="replace"
              />
              <label for="replace" class="ml-2">Replace existing items</label>
            </div>
            <div class="field-radiobutton">
              <RadioButton 
                v-model="conflictResolution" 
                inputId="keep_both" 
                value="keep_both"
              />
              <label for="keep_both" class="ml-2">Keep both (rename imported)</label>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-3">
          {{ errorMessage }}
        </Message>

        <!-- Success Message -->
        <Message v-if="successMessage" severity="success" :closable="false" class="mb-3">
          {{ successMessage }}
        </Message>
      </div>

      <!-- Importing State -->
      <div v-if="importing" class="text-center py-4">
        <ProgressSpinner />
        <p class="mt-3">Importing...</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          @click="visible = false" 
          class="p-button-text"
          :disabled="importing"
        />
        <Button 
          label="Import" 
          icon="pi pi-upload" 
          @click="handleImport" 
          :loading="importing"
          :disabled="!canImport"
        />
      </div>
    </template>
  </Dialog>
</template>

<script>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import Button from 'primevue/button';
import RadioButton from 'primevue/radiobutton';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { useImportService, detectConflicts, resolveConflict } from '@/services/importService';

export default {
  name: 'ImportDialog',
  components: {
    Dialog,
    FileUpload,
    Button,
    RadioButton,
    Message,
    ProgressSpinner
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    existingPresets: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'import'],
  setup(props, { emit }) {
    const importService = useImportService();
    
    // State
    const visible = ref(props.modelValue);
    const selectedFile = ref(null);
    const previewData = ref(null);
    const conflicts = ref([]);
    const conflictResolution = ref('skip');
    const importing = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');
    
    // Computed
    const fileSelected = computed(() => selectedFile.value !== null);
    
    const fileSize = computed(() => {
      if (!selectedFile.value) return '';
      const bytes = selectedFile.value.size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    });
    
    const canImport = computed(() => {
      return fileSelected.value && 
             previewData.value && 
             previewData.value.isValid &&
             !importing.value;
    });
    
    // Methods
    async function onFileSelect(event) {
      const file = event.files[0];
      if (!file) return;
      
      selectedFile.value = file;
      errorMessage.value = '';
      successMessage.value = '';
      
      try {
        // Preview the import
        previewData.value = await importService.previewImport(file);
        
        if (!previewData.value.isValid) {
          errorMessage.value = previewData.value.error || 'Invalid file format';
          return;
        }
        
        // Check for conflicts if importing presets
        if (previewData.value.type === 'presets') {
          const result = await importService.importPresets(file);
          if (result.success) {
            conflicts.value = detectConflicts(result.presets, props.existingPresets);
          }
        }
      } catch (error) {
        errorMessage.value = `Failed to preview file: ${error.message}`;
      }
    }
    
    function resetFile() {
      selectedFile.value = null;
      previewData.value = null;
      conflicts.value = [];
      errorMessage.value = '';
      successMessage.value = '';
    }
    
    async function handleImport() {
      if (!selectedFile.value) return;
      
      importing.value = true;
      errorMessage.value = '';
      successMessage.value = '';
      
      try {
        let result;
        
        if (previewData.value.type === 'presets') {
          result = await importService.importPresets(selectedFile.value);
          
          if (result.success) {
            // Resolve conflicts
            let presets = result.presets;
            if (conflicts.value.length > 0) {
              presets = result.presets.map(preset => {
                const conflict = conflicts.value.find(c => c.preset.id === preset.id);
                if (conflict) {
                  return resolveConflict(preset, conflict.existingPreset, conflictResolution.value);
                }
                return preset;
              }).filter(p => p !== null);
            }
            
            emit('import', {
              type: 'presets',
              data: presets
            });
            
            successMessage.value = `Successfully imported ${presets.length} preset(s)`;
            setTimeout(() => {
              visible.value = false;
            }, 2000);
          } else {
            errorMessage.value = result.error;
          }
        } else if (previewData.value.type === 'settings') {
          result = await importService.importSettings(selectedFile.value);
          
          if (result.success) {
            emit('import', {
              type: 'settings',
              data: result.settings
            });
            
            successMessage.value = 'Successfully imported settings';
            setTimeout(() => {
              visible.value = false;
            }, 2000);
          } else {
            errorMessage.value = result.error;
          }
        }
      } catch (error) {
        errorMessage.value = `Import failed: ${error.message}`;
      } finally {
        importing.value = false;
      }
    }
    
    function formatDate(dateString) {
      try {
        return new Date(dateString).toLocaleString();
      } catch {
        return dateString;
      }
    }
    
    function onHide() {
      resetFile();
      emit('update:modelValue', false);
    }
    
    return {
      visible,
      selectedFile,
      previewData,
      conflicts,
      conflictResolution,
      importing,
      errorMessage,
      successMessage,
      fileSelected,
      fileSize,
      canImport,
      onFileSelect,
      resetFile,
      handleImport,
      formatDate,
      onHide
    };
  }
};
</script>

<style scoped>
.import-dialog {
  padding: 0.5rem 0;
}

.field-radiobutton {
  display: flex;
  align-items: center;
}

.field-radiobutton label {
  margin: 0;
  cursor: pointer;
}

.bg-gray-100 {
  background-color: var(--surface-100);
}

.bg-blue-50 {
  background-color: var(--blue-50);
}
</style>
