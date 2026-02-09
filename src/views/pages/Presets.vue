<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar>
          <template #start>
            <h4 class="m-0">Preset Library</h4>
          </template>
          <template #end>
            <div class="flex gap-2">
              <Button
                label="Import"
                icon="pi pi-upload"
                class="p-button-outlined"
                @click="showImportDialog = true"
              />
              <Button
                label="Export All"
                icon="pi pi-download"
                class="p-button-outlined"
                @click="showExportDialog = true"
              />
            </div>
          </template>
        </Toolbar>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="col-12 md:col-3">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-primary">{{ totalPresets }}</div>
            <div class="text-color-secondary mt-1">Total Presets</div>
          </div>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-3">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-500">{{ categoryCounts.length }}</div>
            <div class="text-color-secondary mt-1">Categories</div>
          </div>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-3">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-500">{{ recentPresets.length }}</div>
            <div class="text-color-secondary mt-1">Recently Used</div>
          </div>
        </template>
      </Card>
    </div>
    <div class="col-12 md:col-3">
      <Card>
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-500">{{ popularPresets.length }}</div>
            <div class="text-color-secondary mt-1">Most Popular</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Preset Library -->
    <div class="col-12">
      <PresetLibrary
        ref="presetLibraryRef"
        @select-preset="onSelectPreset"
      />
    </div>

    <!-- Selected Preset Preview -->
    <Dialog
      v-model:visible="showPresetPreview"
      :header="selectedPreset ? selectedPreset.name : 'Preset Details'"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div v-if="selectedPreset" class="grid">
        <div class="col-12 md:col-6">
          <div class="field">
            <label class="font-semibold">Category</label>
            <div><Tag :value="formatCategory(selectedPreset.category)" /></div>
          </div>
          <div class="field" v-if="selectedPreset.description">
            <label class="font-semibold">Description</label>
            <p class="text-color-secondary">{{ selectedPreset.description }}</p>
          </div>
          <div class="field" v-if="selectedPreset.tags && selectedPreset.tags.length">
            <label class="font-semibold">Tags</label>
            <div class="flex gap-1 flex-wrap mt-1">
              <Chip v-for="tag in selectedPreset.tags" :key="tag" :label="tag" />
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field">
            <label class="font-semibold">Settings Preview</label>
            <ScrollPanel style="width: 100%; height: 200px">
              <pre class="text-sm p-3 surface-ground border-round">{{ JSON.stringify(selectedPreset.settings, null, 2) }}</pre>
            </ScrollPanel>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" class="p-button-text" @click="showPresetPreview = false" />
        <Button label="Use This Preset" icon="pi pi-check" @click="applyPreset" />
      </template>
    </Dialog>

    <!-- Import Dialog -->
    <ImportDialog
      v-model="showImportDialog"
      :existingPresets="allPresets"
      @import="onImport"
    />

    <!-- Export Dialog -->
    <ExportDialog
      v-model="showExportDialog"
      :currentPreset="selectedPreset"
      :allPresets="allPresets"
      :currentSettings="{}"
      editorType="presets"
      @export="onExport"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Chip from 'primevue/chip';
import ScrollPanel from 'primevue/scrollpanel';
import PresetLibrary from '@/components/preset/PresetLibrary.vue';
import ImportDialog from '@/components/import/ImportDialog.vue';
import ExportDialog from '@/components/export/ExportDialog.vue';
import { usePresetService } from '@/services/presetService';

export default {
  name: 'Presets',
  components: {
    Toolbar,
    Button,
    Card,
    Dialog,
    Tag,
    Chip,
    ScrollPanel,
    PresetLibrary,
    ImportDialog,
    ExportDialog,
  },
  setup() {
    const presetService = usePresetService();
    const presetLibraryRef = ref(null);
    const showImportDialog = ref(false);
    const showExportDialog = ref(false);
    const showPresetPreview = ref(false);
    const selectedPreset = ref(null);

    const allPresets = computed(() => presetService.getAll());
    const totalPresets = computed(() => presetService.count());
    const categoryCounts = computed(() => presetService.getCategoryCounts());
    const recentPresets = computed(() => presetService.getRecent(5));
    const popularPresets = computed(() => presetService.getPopular(5));

    const onSelectPreset = (preset) => {
      selectedPreset.value = preset;
      showPresetPreview.value = true;
    };

    const applyPreset = () => {
      if (selectedPreset.value) {
        presetService.markAsUsed(selectedPreset.value.id);
        showPresetPreview.value = false;
      }
    };

    const formatCategory = (category) => {
      if (!category) return 'General';
      return category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const onImport = (data) => {
      if (data.type === 'presets' && data.data) {
        presetService.import(data.data);
      }
    };

    const onExport = () => {
      // Export handled by ExportDialog
    };

    return {
      presetLibraryRef,
      showImportDialog,
      showExportDialog,
      showPresetPreview,
      selectedPreset,
      allPresets,
      totalPresets,
      categoryCounts,
      recentPresets,
      popularPresets,
      onSelectPreset,
      applyPreset,
      formatCategory,
      onImport,
      onExport,
    };
  },
};
</script>
