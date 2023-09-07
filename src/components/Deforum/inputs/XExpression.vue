<script>
import { onMounted, ref } from "vue";
import Parser from "@/components/Deforum/services/Parser";

export default {
  components: {
  },
  emits: ["update:modelValue", "error:change"],
  props: {
    modelValue: {},
    label: {
      type: String,
      default: null
    },
    tooltip: {
      type: String,
      default: null
    },
    tooltipPosition: {
      type: String,
      default: "right"
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const hasError = ref(false);
    const input = ref(null);

    const handleValueChange = event => {
      const value = event.target.value;
      const errorMessage = validateValue(value);
      hasError.value = errorMessage !== undefined;
      emit("error:change", errorMessage, event.target);
      emit("update:modelValue", value);
    };

    const validateValue = value => {
      if (props.required && value === "") {
        return undefined;
      }
      if (value === undefined) {
        return undefined;
      }
      return new Parser().validate(value);
    };

    onMounted(() => {
      const value = props.modelValue;
      const errorMessage = validateValue(value);
      hasError.value = errorMessage !== undefined;
      emit("error:change", errorMessage, input.value);
      emit("update:modelValue", value);
    });

    return {
      hasError,
      input,
      handleValueChange
    };
  }
};
</script>

<template>
  <div class="flex space-x-4 items-start" :class="{ 'items-center': label }">
    <label
      v-if="label"
      :for="`x-text-${label.replaceAll(' ', '-').toLowerCase()}`"
      class="p-label"
      :class="{ 'text-red-500': hasError }"
    >
    <span>{{ label }}</span>
    </label>
    <InputText
      class=""
      ref="input"
      :class="{
        'w-full flex-grow-0': !label,
        'border-red-500': hasError,
        'focus:ring-blue-300': !hasError,
        'focus:ring-red-300': hasError,
      }"
      :id="`x-text-${label?.replaceAll(' ', '-').toLowerCase()}`"
      :value="modelValue"
      @input="handleValueChange"
    />
  </div>
</template>
