<template>
  <div class="card" :class="darkMode ? 'bg-gradient-dark' : ''">
    <div class="pb-0 card-header" :class="darkMode ? 'bg-transparent' : ''">
      <h6 :class="darkMode ? 'text-white' : ''">{{ title }}</h6>
      <p class="text-sm" v-html="sanitizedDescription"></p>
    </div>
    <div class="p-3 card-body">
      <div
        class="timeline timeline-one-side"
        :data-timeline-axis-style="darkMode ? 'dashed' : 'dotted'"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
import { sanitize } from '@/utils/sanitize';

export default {
  name: "TimelineList",
  props: {
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    sanitizedDescription() {
      return sanitize(this.description || '');
    },
  },
};
</script>
