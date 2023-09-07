<script setup lang="ts">
import ToolTip from "@/components/Deforum/ToolTip.vue";

defineEmits(["update:modelValue"]);

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: false,
  },
  options: {
    type: Array,
    required: true,
  },
  tooltip: {
    type: String,
    required: false,
  },
  nullable: {
    type: Boolean,
    required: false,
    default: false,
  },
  tooltipPosition: {
    type: String,
    required: false,
    default: "right",
  },
});
</script>

<template>
  <div class="flex space-x-4 mt-5 items-start" :class="{ 'items-center': label }">
    <label
      v-if="label"
      :for="`x-select-${label.replaceAll(' ', '-').toLowerCase()}`"
      class="text-sm font-medium mt-3 w-1/5 text-left flex  items-center justify-end space-x-2"
      ><span>{{ label }}</span>
      <ToolTip v-if="tooltip" :position="tooltipPosition">{{
        tooltip
      }}</ToolTip>
    </label>
    <span class="flex p-input p-component p-inputwrapper px-5 py-1 flex-grow font-mono">

    <select
      class="p-component p-input px-5 p-2 p-dropdown flex"
      :class="{ 'w-full flex-grow-0': !label }"
      :id="`x-select-${label?.replaceAll(' ', '-').toLowerCase()}`"
      :value="modelValue"
      autocomplete="off"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    >
      <option v-if="nullable" placeholder="None" value="" selected>None</option>
      
      
      <option v-for="option in options" :value="option">
        {{ option }}
      </option>
    </select>
  </span>
  </div>
</template>