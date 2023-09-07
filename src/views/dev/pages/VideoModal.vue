<template>
  <div>
    <div class="media-component size-small"> 
      <button class="video-trigger" @click="openVideo">Play</button>
       <video-modal :channel="videoChannel" :url="url" :jobs="jobs" :videoId="videoId" :isOpen.sync="videoIsOpen" @update:isOpen="handleUpdate"/>
    </div>
    <div id="canvas">

    </div>
  </div>
  </template>
  
  <script>
  import { mapActions, mapGetters } from 'vuex';
  import VideoModal from '@/components/video/VideoModal.vue'
  export default {
    components: {
      VideoModal
    },
    data: () => {
      return {
        videoIsOpen: false,
        url: 'https://api.dudeisland.eu/processed/tuba_new.mp4'
      }
    },
    setup() {
        return  {
        ...mapActions('videojobs', ["list"])
        }
    },
    async mounted() {
      await this.list();
    },
    methods: {
      openVideo() {
        this.videoIsOpen = !this.videoIsOpen
      },
      handleUpdate(value) {
        this.videoIsOpen = value;
      }
    },
    computed: {
      videoChannel: function () {
        //Logic to extract based on URL
        return 'local'
      },
      videoId: function () {
        //Logic to extract based on URL
        return '387913227'
      },
      ...mapGetters('videojobs', {
        jobs: 'list',
        finishedJobs: 'listFinished'
      }),

    }
  }
  </script>

<style lang="scss" scoped>
.evanyou-canvas{
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  z-index: 0;
}
* {
  margin: 0;
  padding: 0;
}
.title {
  font-size: 20px;
  padding: 20px;
  text-align: center;
}
.btn {
  cursor: pointer;
  font-size: 14px;
  background: #ffc7d1;
  width: 100px;
  padding: 5px 10px;
  border-radius: 5px;
  color: #fff;
  margin: 10px auto;
  &:active {
    opacity: .8;
  }
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  position: relative;
  z-index: 10;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
