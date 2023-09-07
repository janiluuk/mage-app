<script>
import { onUpdated, ref } from "vue";
import ToolTip from "@/components/Deforum/ToolTip.vue";

export default {
  components: {
    ToolTip
  },
  props: {
    modelValue: {},
    label: {
      type: String,
      required: false,
    },
    min: {
      type: Number,
      required: false,
    },
    max: {
      type: Number,
      required: false,
    },
    step: {
      type: Number,
      required: false,
      default: 1,
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
      let finalValue = value === "" ? undefined : Number(value);
      hasError.value = !validateValue(finalValue);
      emit("update:modelValue", finalValue);
    };

    const validateValue = value => {
      if (props.required && value === undefined) {
        return false;
      } else if (value === undefined) {
        return true;
      }

      if (isNaN(value)) {
        return false;
      }
      if (props.min !== undefined && value < props.min) {
        return false;
      }
      if (props.max !== undefined && value > props.max) {
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
   <div class="flex space-x-4 mt-3 items-start" :class="{ 'items-center': label }">
    <label
      v-if="label"
      :for="`x-number-${label.replaceAll(' ', '-').toLowerCase()}`"
      class="text-sm mt-3 font-medium  w-1/5 text-left flex items-left justify-end space-x-2"
      :class="{ 'text-red-500': hasError }"
      ><span>{{ label }}</span>
      <ToolTip v-if="tooltip" :position="tooltipPosition">{{
        tooltip
      }}</ToolTip>
    </label>
    <span class="p-inputnumber p-component p-inputwrapper border p-5 rounded px-2 py-1 flex-grow font-mono focus:ring-2 focus:ring-offset-0 focus:outline-none " type="number" id="x-number-width" >

    <input
      v-tooltip="tooltip"
      class="p-inputtext p-component p-inputnumber-input"
      type="number"
      :class="{
              'w-full flex-grow-0': !label,
        'border-red-500': hasError,
        'focus:ring-blue-300': !hasError,
        'focus:ring-red-300': hasError,
      }"
      :id="`x-number-${label?.replace(' ', '-').toLowerCase()}`"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="handleValueChange"
    /></span>
  </div>
</template>
