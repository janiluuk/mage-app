<template>
  <div class="w-100">
    <NavBar />
    <div>
      <h1>What do you like to create today?</h1>
    </div>
    <div class="flex gap-6 w-100 justify-content-center align-items-center">
      <div class="w-50">
        <h2 class="">Animation</h2>
                <video :width="250" :height="250" loop autoplay muted>
        <source :src="animationVideoSrc" type="video/mp4">
        Your browser does not support the video tag.
        </video>
      </div>
      <div class="w-50">
        <h2 class="">Video Effect</h2>
                <video :width="250" :height="250" loop autoplay muted>
        <source :src="effectVideoSrc" type="video/mp4">
        Your browser does not support the video tag.
        </video>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from "../components/NavBar.vue";

export default {
  components: {
    NavBar
  },
  data() {
    return {
      animationVideoSrc: "../../public/videos/Pic_preview.mp4",
      effectVideoSrc: "../../public/videos/Vid_preview.mp4"
    };
  }
};
</script>
