<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="button-spinner" aria-hidden="true"></span>
    <slot name="icon" />
    <span v-if="$slots.default" class="button-content">
      <slot />
    </span>
  </button>
</template>

<script setup>
/**
 * Base button component with loading state and variants
 * @component BaseButton
 */

import { computed } from 'vue';

/**
 * @typedef {Object} Props
 * @property {string} variant - Button variant: 'primary' | 'secondary' | 'danger' | 'success'
 * @property {string} size - Button size: 'small' | 'medium' | 'large'
 * @property {boolean} disabled - Whether button is disabled
 * @property {boolean} loading - Whether button is in loading state
 * @property {string} type - HTML button type: 'button' | 'submit' | 'reset'
 * @property {boolean} outlined - Whether button has outlined style
 * @property {boolean} rounded - Whether button has rounded corners
 */

const props = withDefaults(defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'success', 'warning'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: Boolean,
    default: false,
  },
}), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button',
  outlined: false,
  rounded: false,
});

/**
 * @typedef {Object} Emits
 * @property {Function} click - Emitted when button is clicked
 */

const emit = defineEmits(['click']);

/**
 * Computed button classes
 * @returns {string} CSS classes for the button
 */
const buttonClasses = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`,
    `base-button--${props.size}`,
    {
      'base-button--outlined': props.outlined,
      'base-button--rounded': props.rounded,
      'base-button--disabled': props.disabled,
      'base-button--loading': props.loading,
    },
  ].filter(Boolean).join(' ');
});

/**
 * Handle button click
 * @param {Event} event - Click event
 */
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.base-button:disabled,
.base-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.base-button--small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.base-button--medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.base-button--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.base-button--primary {
  background-color: var(--primary-color, #007bff);
  color: white;
}

.base-button--primary:hover:not(:disabled) {
  background-color: var(--primary-color-dark, #0056b3);
}

.base-button--secondary {
  background-color: var(--secondary-color, #6c757d);
  color: white;
}

.base-button--secondary:hover:not(:disabled) {
  background-color: var(--secondary-color-dark, #545b62);
}

.base-button--danger {
  background-color: var(--danger-color, #dc3545);
  color: white;
}

.base-button--danger:hover:not(:disabled) {
  background-color: var(--danger-color-dark, #c82333);
}

.base-button--success {
  background-color: var(--success-color, #28a745);
  color: white;
}

.base-button--success:hover:not(:disabled) {
  background-color: var(--success-color-dark, #218838);
}

.base-button--warning {
  background-color: var(--warning-color, #ffc107);
  color: #212529;
}

.base-button--warning:hover:not(:disabled) {
  background-color: var(--warning-color-dark, #e0a800);
}

.base-button--outlined {
  background-color: transparent;
}

.base-button--outlined.base-button--primary {
  border-color: var(--primary-color, #007bff);
  color: var(--primary-color, #007bff);
}

.base-button--outlined.base-button--primary:hover:not(:disabled) {
  background-color: var(--primary-color, #007bff);
  color: white;
}

.base-button--rounded {
  border-radius: 9999px;
}

.base-button--loading {
  position: relative;
  pointer-events: none;
}

.button-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.button-content {
  display: inline-flex;
  align-items: center;
}
</style>

