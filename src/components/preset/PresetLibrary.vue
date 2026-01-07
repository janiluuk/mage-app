<template>
  <div class="preset-library">
    <Card>
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Preset Library</span>
          <Button
            label="New Preset"
            icon="pi pi-plus"
            @click="openCreateDialog"
            class="p-button-success"
          />
        </div>
      </template>
      <template #content>
        <!-- Search and Filters -->
        <div class="field mb-4">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-search"></i>
            </span>
            <InputText
              v-model="searchQuery"
              placeholder="Search presets..."
              @input="handleSearch"
            />
            <Button
              v-if="searchQuery"
              icon="pi pi-times"
              class="p-button-text"
              @click="clearSearch"
            />
          </div>
        </div>

        <!-- Category Filter -->
        <div class="field mb-4">
          <div class="flex gap-2 flex-wrap">
            <Button
              label="All"
              :class="{ 'p-button-outlined': selectedCategory !== null }"
              @click="filterByCategory(null)"
              class="p-button-sm"
            />
            <Button
              v-for="cat in categories"
              :key="cat"
              :label="formatCategory(cat)"
              :class="{ 'p-button-outlined': selectedCategory !== cat }"
              @click="filterByCategory(cat)"
              class="p-button-sm"
            />
          </div>
        </div>

        <!-- View Toggle -->
        <div class="field mb-4 flex justify-content-between align-items-center">
          <div class="text-muted">
            {{ filteredPresets.length }} preset(s)
          </div>
          <SelectButton
            v-model="viewMode"
            :options="viewOptions"
            optionLabel="label"
            optionValue="value"
          >
            <template #option="slotProps">
              <i :class="slotProps.option.icon"></i>
            </template>
          </SelectButton>
        </div>

        <!-- Presets Grid/List -->
        <div v-if="filteredPresets.length === 0" class="text-center py-6">
          <i class="pi pi-inbox text-6xl text-muted mb-3"></i>
          <div class="text-muted">
            {{ searchQuery ? 'No presets found matching your search' : 'No presets available' }}
          </div>
        </div>

        <div v-else>
          <!-- Grid View -->
          <div v-if="viewMode === 'grid'" class="grid">
            <div
              v-for="preset in filteredPresets"
              :key="preset.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <PresetCard
                :preset="preset"
                @select="selectPreset"
                @edit="editPreset"
                @duplicate="duplicatePreset"
                @delete="deletePreset"
              />
            </div>
          </div>

          <!-- List View -->
          <div v-else class="flex flex-column gap-2">
            <PresetCard
              v-for="preset in filteredPresets"
              :key="preset.id"
              :preset="preset"
              :compact="true"
              @select="selectPreset"
              @edit="editPreset"
              @duplicate="duplicatePreset"
              @delete="deletePreset"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Preset Dialog -->
    <PresetDialog
      v-model:visible="dialogVisible"
      :preset="selectedPresetForEdit"
      :mode="dialogMode"
      @save="handleSavePreset"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { usePresetService } from '@/services/presetService';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import PresetCard from './PresetCard.vue';
import PresetDialog from './PresetDialog.vue';

export default {
  name: 'PresetLibrary',
  components: {
    Card,
    Button,
    InputText,
    SelectButton,
    PresetCard,
    PresetDialog
  },
  emits: ['select-preset'],
  setup(props, { emit }) {
    const presetService = usePresetService();
    const presets = ref([]);
    const searchQuery = ref('');
    const selectedCategory = ref(null);
    const viewMode = ref('grid');
    const dialogVisible = ref(false);
    const dialogMode = ref('create');
    const selectedPresetForEdit = ref(null);

    const viewOptions = [
      { label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
      { label: 'List', value: 'list', icon: 'pi pi-list' }
    ];

    const categories = computed(() => {
      return ['camera_movements', 'effects', 'styles', 'general', 'custom'];
    });

    const filteredPresets = computed(() => {
      let results = presets.value;

      // Filter by category
      if (selectedCategory.value) {
        results = results.filter(p => p.category === selectedCategory.value);
      }

      // Filter by search
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        results = results.filter(p => {
          const searchText = `${p.name} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
          return searchText.includes(query);
        });
      }

      return results;
    });

    const loadPresets = () => {
      presets.value = presetService.getAll();
    };

    const handleSearch = () => {
      // Search is handled by computed property
    };

    const clearSearch = () => {
      searchQuery.value = '';
    };

    const filterByCategory = (category) => {
      selectedCategory.value = category;
    };

    const formatCategory = (category) => {
      return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const openCreateDialog = () => {
      selectedPresetForEdit.value = null;
      dialogMode.value = 'create';
      dialogVisible.value = true;
    };

    const selectPreset = (preset) => {
      presetService.markAsUsed(preset.id);
      emit('select-preset', preset);
    };

    const editPreset = (preset) => {
      selectedPresetForEdit.value = preset;
      dialogMode.value = 'edit';
      dialogVisible.value = true;
    };

    const duplicatePreset = (preset) => {
      try {
        presetService.duplicate(preset.id);
        loadPresets();
      } catch (error) {
        console.error('Failed to duplicate preset:', error);
      }
    };

    const deletePreset = (preset) => {
      try {
        presetService.delete(preset.id);
        loadPresets();
      } catch (error) {
        console.error('Failed to delete preset:', error);
      }
    };

    const handleSavePreset = (presetData) => {
      try {
        if (dialogMode.value === 'create') {
          presetService.create(presetData);
        } else {
          presetService.update(selectedPresetForEdit.value.id, presetData);
        }
        loadPresets();
        dialogVisible.value = false;
      } catch (error) {
        console.error('Failed to save preset:', error);
      }
    };

    onMounted(() => {
      loadPresets();
    });

    return {
      searchQuery,
      selectedCategory,
      viewMode,
      viewOptions,
      categories,
      filteredPresets,
      dialogVisible,
      dialogMode,
      selectedPresetForEdit,
      handleSearch,
      clearSearch,
      filterByCategory,
      formatCategory,
      openCreateDialog,
      selectPreset,
      editPreset,
      duplicatePreset,
      deletePreset,
      handleSavePreset
    };
  }
};
</script>

<style scoped>
.preset-library {
  width: 100%;
}
</style>
