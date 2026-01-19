# Shared Components Library

This directory contains reusable components that can be used across the application.

## Structure

```
shared/
├── README.md           # This file
├── forms/              # Form-related components
├── feedback/           # User feedback components (toasts, alerts)
├── layout/             # Layout components
└── data/               # Data display components
```

## Guidelines

1. **Reusability**: Components should be generic and reusable
2. **Documentation**: All components should have JSDoc comments
3. **Props**: Use TypeScript or JSDoc for prop types
4. **Events**: Document all emitted events
5. **Styling**: Use PrimeVue or CSS variables for theming

## Usage

Import shared components using the `@/components/shared` alias:

```vue
<script setup>
import SharedButton from '@/components/shared/forms/SharedButton.vue'
</script>
```

