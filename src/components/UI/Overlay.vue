<template>
  <div
    :class="['StyledOverlay']"
    @click="handleClose"
    :style="{
      backgroundColor: disableBackground ? 'unset' : 'var(--overlay-background)',
      zIndex: zIndex
    }"
  ></div>
</template>

<script>
export default {
  name: 'Overlay',
  props: {
    disableBackground: {
      type: Boolean,
      default: false
    },
    handleClose: {
      type: Function,
      default: () => {}
    },
    zIndex: {
      type: Number,
      default: 30
    }
  }
};
</script>

<style scoped>
.StyledOverlay {
  opacity: 0.8;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
</style>
