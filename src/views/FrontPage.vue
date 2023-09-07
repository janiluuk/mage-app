<template>
  <div class="w-100">
    <div class="text-center">
      <div class="hero-banner">What do you like to create today?</div>
    </div>
    <div class="banner-item-row">
      <div class="banner-item">
        <div class="banner-media-container">
            <img src="../../public/img/mona1.png" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="../../public/img/mona2.png" />
          </div>
        </div>
        <div class="banner-content-container">
          <div class="banner-header">Animation</div>
          <div class="banner-description">Turn images into gorgeous animated clips</div>
        </div>
      </div>
      <div class="banner-item">
        <div class="banner-media-container">
            <img src="../../public/img/mona1.png" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="../../public/img/mona2.png" />
          </div>
        </div>
        <div class="banner-content-container">
          <div class="banner-header">Video Effect</div>
          <div class="banner-description">Enhance videos with stunning visual effects</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      animationVideoSrc: "../../public/videos/Pic_preview.mp4",
      effectVideoSrc: "../../public/videos/Vid_preview.mp4"
    };
  }
};
</script>

<style scoped type="scss">
.hero-banner {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1.2;
}

.banner-item-row {
  margin: 4rem 0 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: row;
  column-gap: 2rem;
}

.banner-description {
  font-size: 1.4rem;
  opacity: 0.5;
}

.banner-header {
  font-size: 2rem;
  font-weight: bold;
}

.banner-media-container {
  position: relative;
  width: min-content;
}
.banner-media-main {
  max-width: 300px;
  display: block;
}
.banner-media-secondary {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  overflow: hidden;
  animation: slide 10s infinite ease-in-out;
}
.banner-media-secondary img {
  display: block;
  filter: grayscale(1);
  height: 100%;
}

@keyframes slide {
  0%, 10% {
    right: 0;
  }
  50%, 60% {
    right: 100%;
  }
  90%, 100% {
    right: 0;
  }
}

</style>
