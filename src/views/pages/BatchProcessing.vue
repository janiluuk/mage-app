<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Batch Processing</h2>
      <p>Process multiple files with shared settings and track progress per item.</p>
    </div>
    <BatchProcessor data-testid="batch-processor" />
  </div>
</template>

<script>
import BatchProcessor from '@/components/batch/BatchProcessor.vue';

export default {
  name: 'BatchProcessing',
  components: {
    BatchProcessor
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

