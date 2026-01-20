<template>
  <div
    :class="spinnerClasses"
    :style="spinnerStyle"
    role="status"
    :aria-label="ariaLabel"
  >
    <div class="spinner-circle"></div>
    <span v-if="showText" class="spinner-text">{{ text }}</span>
  </div>
</template>

<script setup>
/**
 * Loading spinner component
 * @component LoadingSpinner
 */

import { computed } from 'vue';

/**
 * @typedef {Object} Props
 * @property {string} size - Spinner size: 'small' | 'medium' | 'large'
 * @property {string} variant - Spinner variant: 'primary' | 'secondary'
 * @property {boolean} showText - Whether to show loading text
 * @property {string} text - Loading text to display
 * @property {string} ariaLabel - ARIA label for accessibility
 */

const props = withDefaults(defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  showText: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    default: 'Loading...',
  },
  ariaLabel: {
    type: String,
    default: 'Loading',
  },
}), {
  size: 'medium',
  variant: 'primary',
  showText: false,
  text: 'Loading...',
  ariaLabel: 'Loading',
});

/**
 * Computed spinner classes
 * @returns {string} CSS classes for the spinner
 */
const spinnerClasses = computed(() => {
  return [
    'loading-spinner',
    `loading-spinner--${props.size}`,
    `loading-spinner--${props.variant}`,
  ].join(' ');
});

/**
 * Computed spinner style
 * @returns {Object} Inline styles for the spinner
 */
const spinnerStyle = computed(() => {
  return {};
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.spinner-circle {
  border: 3px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner--small .spinner-circle {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.loading-spinner--medium .spinner-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

.loading-spinner--large .spinner-circle {
  width: 4rem;
  height: 4rem;
  border-width: 4px;
}

.loading-spinner--primary {
  color: var(--primary-color, #007bff);
}

.loading-spinner--secondary {
  color: var(--secondary-color, #6c757d);
}

.spinner-text {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6c757d);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

