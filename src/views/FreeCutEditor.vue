<template>
  <div class="freecut-wrapper">
    <div v-if="!freecutReady" class="freecut-loading">
      <div class="freecut-loading-inner">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color)"></i>
        <p>Loading FreeCut Editor...</p>
      </div>
    </div>
    <iframe
      ref="iframeRef"
      :src="freecutUrl"
      class="freecut-frame"
      :class="{ 'freecut-frame--ready': freecutReady }"
      allow="camera; microphone; display-capture; autoplay; clipboard-read; clipboard-write"
      @load="onIframeLoad"
      @error="onIframeError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const iframeRef = ref(null);
const freecutReady = ref(false);
const loadTimeout = ref(null);

const freecutUrl = computed(() => {
  return import.meta.env.VITE_FREECUT_URL || '/freecut/';
});

function onIframeLoad() {
  freecutReady.value = true;
  if (loadTimeout.value) clearTimeout(loadTimeout.value);
}

function onIframeError() {
  freecutReady.value = false;
}

onMounted(() => {
  // Show loading state for up to 15s, then reveal iframe anyway
  loadTimeout.value = setTimeout(() => {
    freecutReady.value = true;
  }, 15000);
});

onBeforeUnmount(() => {
  if (loadTimeout.value) clearTimeout(loadTimeout.value);
});
</script>

<style scoped>
.freecut-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: #0d1421;
  display: flex;
  flex-direction: column;
}

.freecut-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background: #0d1421;
}

.freecut-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.87);
}

.freecut-loading-inner p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.7;
}

.freecut-frame {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.freecut-frame--ready {
  opacity: 1;
}
</style>
