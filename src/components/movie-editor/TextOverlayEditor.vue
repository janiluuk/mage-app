<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="isEditing ? 'Edit Text Overlay' : 'Add Text Overlay'"
    :modal="true"
    :style="{ width: '550px' }"
  >
    <div class="flex flex-column gap-3">
      <!-- Text content -->
      <div class="field">
        <label class="font-semibold block mb-2">Text *</label>
        <Textarea
          v-model="form.text"
          placeholder="Enter overlay text..."
          rows="2"
          autoResize
          class="w-full"
        />
      </div>

      <!-- Position -->
      <div class="grid">
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">X Position (%)</label>
          <Slider v-model="form.x" :min="0" :max="100" :step="1" class="mt-2" />
          <small class="text-500">{{ form.x }}%</small>
        </div>
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">Y Position (%)</label>
          <Slider v-model="form.y" :min="0" :max="100" :step="1" class="mt-2" />
          <small class="text-500">{{ form.y }}%</small>
        </div>
      </div>

      <!-- Timing -->
      <div class="grid">
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">Start Time (s)</label>
          <InputNumber v-model="form.startTime" :min="0" :step="0.1" :minFractionDigits="1" class="w-full" />
        </div>
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">Duration (s)</label>
          <InputNumber v-model="form.duration" :min="0.5" :step="0.5" :minFractionDigits="1" class="w-full" />
        </div>
      </div>

      <!-- Style -->
      <div class="grid">
        <div class="col-4">
          <label class="block text-sm font-semibold mb-1">Font Size</label>
          <InputNumber v-model="form.fontSize" :min="10" :max="200" :step="2" class="w-full" />
        </div>
        <div class="col-4">
          <label class="block text-sm font-semibold mb-1">Color</label>
          <div class="flex align-items-center gap-2 mt-1">
            <input type="color" v-model="form.color" class="color-input" />
            <span class="text-xs">{{ form.color }}</span>
          </div>
        </div>
        <div class="col-4">
          <label class="block text-sm font-semibold mb-1">Style</label>
          <div class="flex gap-2 mt-1">
            <Button
              icon="pi pi-bold"
              :class="['p-button-sm', form.bold ? '' : 'p-button-outlined']"
              @click="form.bold = !form.bold"
            />
            <Button
              icon="pi pi-italic"
              :class="['p-button-sm', form.italic ? '' : 'p-button-outlined']"
              @click="form.italic = !form.italic"
            />
          </div>
        </div>
      </div>

      <!-- Animation -->
      <Divider />
      <div class="grid">
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">Entrance Animation</label>
          <Dropdown
            v-model="form.animationIn"
            :options="animationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div class="col-6">
          <label class="block text-sm font-semibold mb-1">Exit Animation</label>
          <Dropdown
            v-model="form.animationOut"
            :options="animationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- Preview -->
      <div class="overlay-preview" :style="previewStyle">
        <span :style="previewTextStyle">{{ form.text || 'Preview Text' }}</span>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button v-if="isEditing" label="Delete" icon="pi pi-trash" class="p-button-danger p-button-text" @click="onDelete" />
      <Button :label="isEditing ? 'Update' : 'Add'" icon="pi pi-check" @click="onSave" :disabled="!form.text" />
    </template>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Slider from 'primevue/slider';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import Button from 'primevue/button';

export default {
  name: 'TextOverlayEditor',
  components: { Dialog, Textarea, InputNumber, Slider, Dropdown, Divider, Button },
  props: {
    visible: Boolean,
    overlay: { type: Object, default: null }, // null = create new, object = edit
  },
  emits: ['update:visible', 'save', 'delete'],
  setup(props, { emit }) {
    const animationOptions = [
      { label: 'None', value: 'none' },
      { label: 'Fade', value: 'fade' },
      { label: 'Slide Up', value: 'slide-up' },
      { label: 'Slide Down', value: 'slide-down' },
      { label: 'Slide Left', value: 'slide-left' },
      { label: 'Slide Right', value: 'slide-right' },
      { label: 'Zoom', value: 'zoom' },
    ];

    const defaultForm = () => ({
      text: '',
      x: 50,
      y: 50,
      startTime: 0,
      duration: 5,
      fontSize: 32,
      color: '#ffffff',
      bold: false,
      italic: false,
      animationIn: 'fade',
      animationOut: 'fade',
    });

    const form = ref(defaultForm());

    const isEditing = computed(() => !!props.overlay?.id);

    watch(() => props.visible, (val) => {
      if (val) {
        if (props.overlay) {
          form.value = { ...defaultForm(), ...props.overlay };
        } else {
          form.value = defaultForm();
        }
      }
    });

    const previewStyle = computed(() => ({
      background: '#1a1a2e',
      borderRadius: 'var(--border-radius)',
      padding: '2rem',
      position: 'relative',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }));

    const previewTextStyle = computed(() => ({
      color: form.value.color,
      fontSize: Math.min(form.value.fontSize, 36) + 'px',
      fontWeight: form.value.bold ? 'bold' : 'normal',
      fontStyle: form.value.italic ? 'italic' : 'normal',
      textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
    }));

    function onSave() {
      emit('save', { ...form.value, id: props.overlay?.id || `overlay_${Date.now()}` });
      emit('update:visible', false);
    }

    function onDelete() {
      if (props.overlay?.id) {
        emit('delete', props.overlay.id);
      }
      emit('update:visible', false);
    }

    return {
      form,
      isEditing,
      animationOptions,
      previewStyle,
      previewTextStyle,
      onSave,
      onDelete,
    };
  },
};
</script>

<style scoped>
.color-input {
  width: 32px;
  height: 32px;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  padding: 0;
}

.overlay-preview {
  border: 1px solid var(--surface-border);
}
</style>
