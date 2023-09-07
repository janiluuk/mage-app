<script setup lang="ts">
import ToolTip from "@/components/Deforum/ToolTip.vue";

defineEmits(["update:modelValue"]);

defineProps({
  modelValue: {
    type: Boolean,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
  tooltip: {
    type: String,
    required: false,
  },
  tooltipPosition: {
    type: String,
    required: false,
    default: "right",
  },
});
</script>

<template>
  <div class="flex mt-5 mb-5 p-fluid items-center">
    <label
      v-if="label"
      :for="`x-checkbox-${label.replace(' ', '-').toLowerCase()}`"
      class="text-sm mt-2 p-float-label font-medium  w-1/5 text-right flex items-center justify-end space-x-2"
      :class="{ 'text-red-500': hasError }"
    >
      <span class="p-float-label mr-2 ">{{ label }}</span>
      <ToolTip v-if="tooltip" :position="tooltipPosition">
        {{ tooltip }}
      </ToolTip>
    </label>
    <div class="p-checkbox-box p-component">
    <input
      class="p-checkbox ml-2 p-input p-component"
      type="checkbox"
      :id="`x-checkbox-${label.replace(' ', '-').toLowerCase()}`"
      :checked="modelValue"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "/>
      </div>
  </div>
</template>
