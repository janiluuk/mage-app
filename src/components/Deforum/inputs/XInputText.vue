<script>
import { onUpdated, ref } from "vue";
import ToolTip from "@/components/Deforum/ToolTip.vue";

export default {
  components: {
    ToolTip
  },
  props: {
    modelValue: {
      type: String,
      required: false,
    },
    label: {
      type: String,
      required: false,
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
    required: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const hasError = ref(false);

    const handleValueChange = event => {
      const value = event.target.value;
      hasError.value = !validateValue(value);
      emit("update:modelValue", value);
    };

    const validateValue = value => {
      if (props.required && value === "") {
        return false;
      }
      return true;
    };

    onUpdated(() => {
      hasError.value = !validateValue(props.modelValue);
    });

    return {
      hasError,
      handleValueChange,
    };
  },
};
</script>

<template>
  <div class="flex space-x-4 mb-10 items-start" :class="{ 'items-center': label }">
    <label
      v-if="label"
      :for="`x-text-${label.replace(' ', '-').toLowerCase()}`"
      class="text-sm mt-2 p-float-label font-medium  w-1/5 text-right flex items-center justify-end space-x-2"
      :class="{ 'text-red-500': hasError }"
    >
      <span class="p-float-label mr-5">{{ label }}</span>
      <ToolTip v-if="tooltip" :position="tooltipPosition">
        {{ tooltip }}
      </ToolTip>
    </label>
    
    <input
      class="ml-2 p-inputtext p-component w-full"
      :class="{
        'w-full flex-grow-0': !label,
        'border-red-500': hasError,
        'focus:ring-blue-300': !hasError,
        'focus:ring-red-300': hasError,
      }"
      type="text"
      :id="`x-text-${label?.replace(' ', '-').toLowerCase()}`"
      :value="modelValue"
      @input="handleValueChange"
      autocomplete="off"
    />
  </div>
</template>
