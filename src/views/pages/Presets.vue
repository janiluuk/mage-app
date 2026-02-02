<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Preset Library</h2>
      <p>Save, organize, and reuse settings across projects.</p>
    </div>
    <PresetLibrary data-testid="preset-library" />
  </div>
</template>

<script>
import PresetLibrary from '@/components/preset/PresetLibrary.vue';

export default {
  name: 'Presets',
  components: {
    PresetLibrary
  }
};
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0 0 0.5rem;
}

.page-header p {
  margin: 0;
  color: var(--text-color-secondary);
}
</style>

