<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="dialogTitle"
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @hide="onHide"
  >
    <div class="preset-dialog">
      <!-- Name -->
      <div class="field mb-4">
        <label for="preset-name" class="font-semibold mb-2 block">
          Preset Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="preset-name"
          v-model="formData.name"
          placeholder="Enter preset name"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- Description -->
      <div class="field mb-4">
        <label for="preset-description" class="font-semibold mb-2 block">
          Description
        </label>
        <Textarea
          id="preset-description"
          v-model="formData.description"
          placeholder="Enter preset description"
          rows="3"
          class="w-full"
        />
      </div>

      <!-- Category -->
      <div class="field mb-4">
        <label for="preset-category" class="font-semibold mb-2 block">
          Category
        </label>
        <Dropdown
          id="preset-category"
          v-model="formData.category"
          :options="categoryOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select a category"
          class="w-full"
        />
      </div>

      <!-- Tags -->
      <div class="field mb-4">
        <label for="preset-tags" class="font-semibold mb-2 block">
          Tags
        </label>
        <Chips
          id="preset-tags"
          v-model="formData.tags"
          placeholder="Add tags (press Enter)"
          class="w-full"
        />
        <small class="text-muted">Press Enter to add multiple tags</small>
      </div>

      <!-- Settings Preview -->
      <div class="field mb-4" v-if="mode === 'edit'">
        <label class="font-semibold mb-2 block">Settings</label>
        <div class="p-3 bg-gray-100 border-round">
          <ScrollPanel style="width: 100%; height: 200px">
            <pre class="text-sm">{{ JSON.stringify(formData.settings, null, 2) }}</pre>
          </ScrollPanel>
        </div>
        <small class="text-muted">Settings are managed from the editor</small>
      </div>

      <!-- Public/Private -->
      <div class="field mb-4">
        <div class="flex align-items-center">
          <Checkbox
            id="preset-public"
            v-model="formData.isPublic"
            :binary="true"
          />
          <label for="preset-public" class="ml-2">
            Make this preset public (visible to all users)
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          @click="onCancel"
          class="p-button-text"
        />
        <Button
          :label="mode === 'create' ? 'Create' : 'Save'"
          icon="pi pi-check"
          @click="onSave"
          :disabled="!isValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Chips from 'primevue/chips';
import Checkbox from 'primevue/checkbox';
import ScrollPanel from 'primevue/scrollpanel';
import { PresetCategory } from '@/services/presetService';

export default {
  name: 'PresetDialog',
  components: {
    Dialog,
    Button,
    InputText,
    Textarea,
    Dropdown,
    Chips,
    Checkbox,
    ScrollPanel
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    preset: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value)
    }
  },
  emits: ['update:visible', 'save'],
  setup(props, { emit }) {
    const formData = ref({
      name: '',
      description: '',
      category: PresetCategory.GENERAL,
      tags: [],
      settings: {},
      isPublic: false
    });

    const errors = ref({
      name: ''
    });

    // Computed property to handle v-model
    const dialogVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    });

    const categoryOptions = [
      { label: 'Camera Movements', value: PresetCategory.CAMERA_MOVEMENTS },
      { label: 'Effects', value: PresetCategory.EFFECTS },
      { label: 'Styles', value: PresetCategory.STYLES },
      { label: 'General', value: PresetCategory.GENERAL },
      { label: 'Custom', value: PresetCategory.CUSTOM }
    ];

    const dialogTitle = computed(() => {
      return props.mode === 'create' ? 'Create New Preset' : 'Edit Preset';
    });

    const isValid = computed(() => {
      return formData.value.name.trim().length > 0;
    });

    const resetForm = () => {
      if (props.preset && props.mode === 'edit') {
        formData.value = {
          name: props.preset.name,
          description: props.preset.description || '',
          category: props.preset.category || PresetCategory.GENERAL,
          tags: props.preset.tags ? [...props.preset.tags] : [],
          settings: props.preset.settings || {},
          isPublic: props.preset.isPublic || false
        };
      } else {
        formData.value = {
          name: '',
          description: '',
          category: PresetCategory.GENERAL,
          tags: [],
          settings: {},
          isPublic: false
        };
      }
      errors.value = { name: '' };
    };

    const validateForm = () => {
      errors.value = { name: '' };
      
      if (!formData.value.name.trim()) {
        errors.value.name = 'Preset name is required';
        return false;
      }
      
      if (formData.value.name.length > 100) {
        errors.value.name = 'Preset name is too long (max 100 characters)';
        return false;
      }
      
      return true;
    };

    const onSave = () => {
      if (!validateForm()) {
        return;
      }

      emit('save', {
        ...formData.value,
        name: formData.value.name.trim(),
        description: formData.value.description.trim(),
        tags: formData.value.tags.filter(tag => tag.trim() !== '')
      });
    };

    const onCancel = () => {
      emit('update:visible', false);
    };

    const onHide = () => {
      emit('update:visible', false);
    };

    watch(() => props.visible, (newValue) => {
      if (newValue) {
        resetForm();
      }
    });

    return {
      formData,
      errors,
      categoryOptions,
      dialogTitle,
      isValid,
      dialogVisible,
      onSave,
      onCancel,
      onHide
    };
  }
};
</script>

<style scoped>
.preset-dialog {
  padding: 0.5rem 0;
}
</style>
