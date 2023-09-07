<template>
  <div>
    <div v-if="!isOpen">
      <img :src="previewImg" @click="$emit('update:isOpen', true);" />
    </div>
    <div v-if="isOpen">

      <div :class="classNames.modalVideo" tabIndex='-1' role='dialog' :aria-label="aria.openMessage"
        @keydown.esc="$emit('update:isOpen', false);">
        <div :class="classNames.modalVideoBody">
          <button :class="classNames.modalVideoCloseBtn" :aria-label="aria.dismissBtnMessage" ref="closeBtn"
            @click="$emit('update:isOpen', false);" />
          <div :class="classNames.modalVideoInner">
            <div :class="classNames.modalVideoIframeWrap" :style="{ 'padding-bottom': paddingBottom }">

              <p>Playing {{ url }}</p>
              <button @click="nextVideo">Next</button>
              <button @click="prevVideo">Previous</button>
            </div>

            <vue3-video-player v-if="channel == 'local'" :src="url" @global-auto-play="autoPlay" :title="url" />



            <!-- <video v-if="channel == 'local' && currentUrl" controls :src="currentUrl.url" @click="toggle"></video>
            <iframe
              v-if="channel !== 'local'"
              width='460px'
              height='230px'
              :src="fullVideoUrl"
              frameBorder='0'v
              :allowFullScreen="allowFullScreen"
              tabIndex='-1'
              style="max-height: 230px"
            /> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash';

export default {

  props: {
    videoId: String,
    url: String,
    title: String,
    channel: String,
    isOpen: Boolean,
    youtube: {
      type: Object,
      default: function () {
        return {
          autoplay: 1,
          cc_load_policy: 1,
          color: null,
          controls: 1,
          disablekb: 0,
          enablejsapi: 0,
          end: null,
          fs: 1,
          h1: null,
          iv_load_policy: 1,
          list: null,
          listType: null,
          loop: 0,
          modestbranding: null,
          origin: null,
          playlist: null,
          playsinline: null,
          rel: 0,
          showinfo: 1,
          start: 0,
          wmode: 'transparent',
          theme: 'dark'
        }
      }
    },
    data() {
      return {
        previewUrl: '/layout/images/default-video-thumb.svg'
      };
    },

    ratio: {
      type: String,
      default: '16:9'
    },
    jobs: {
      type: Array,
      default: []
    },
    vimeo: {
      type: Object,
      default: function () {
        return {
          api: false,
          autopause: true,
          autoplay: true,
          byline: true,
          callback: null,
          color: null,
          height: null,
          loop: false,
          maxheight: null,
          maxwidth: null,
          player_id: null,
          portrait: true,
          title: true,
          width: null,
          xhtml: false
        }
      }
    },
    allowFullScreen: {
      type: Boolean,
      default: true
    },
    animationSpeed: {
      type: Number,
      default: 300
    },
    classNames: {
      type: Object,
      default: function () {
        return {
          modalVideoEffect: 'modal-video-effect',
          modalVideo: 'modal-video',
          modalVideoClose: 'modal-video-close',
          modalVideoBody: 'modal-video-body',
          modalVideoInner: 'modal-video-inner media-player video box-shrink',
          modalVideoIframeWrap: 'modal-video-movie-wrap',
          modalVideoCloseBtn: 'modal-video-close-btn'
        }
      }
    },
    aria: {
      type: Object,
      default: function () {
        return {
          openMessage: 'Modal video opened',
          dismissBtnMessage: 'Close the modal video'
        }
      }
    }
  },
  emits: ['update:isOpen'],
  mounted() {
    let currentIndex = 0;
    console.log(this.url);
    this.playlist = this.generatePlaylist();
  },
  methods: {
    generatePlaylist() {
      return _.filter(this.library, function (job) { return job.status == 'finished' && job.url != ""; });
    },
    close() {
      this.$emit('update:isOpen', false);
    },

    getQueryString(obj) {
      let url = ''
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] !== null) {
            url += key + '=' + obj[key] + '&'
          }
        }
      }
      return url.substr(0, url.length - 1)
    },
    getYoutubeUrl(youtube, videoId) {
      const query = this.getQueryString(youtube)
      return '//www.youtube.com/embed/' + videoId + '?' + query
    },
    getVimeoUrl(vimeo, videoId) {
      const query = this.getQueryString(vimeo)
      return '//player.vimeo.com/video/' + videoId + '?' + query
    },
    getLocalUrl(local, url) {
      const query = this.getQueryString(local)
      return url + '?' + query
    },
    getPadding(ratio) {
      const arr = ratio.split(':')
      const width = Number(arr[0])
      const height = Number(arr[1])
      const padding = height * 100 / width
      return padding + '%'
    },

  },
  computed: {
    getVideo(id) {
      this.jobs.find(job => job.id === id);
    },
    fullVideoUrl() {
      if (this.channel === 'youtube') {
        return this.getYoutubeUrl(this.youtube, this.videoId)
      } else if (this.channel === 'vimeo') {
        return this.getVimeoUrl(this.vimeo, this.videoId)
      }
    },
    paddingBottom() {
      return this.getPadding(this.ratio)
    }
  },
  watch: {
    isOpen: {
      handler: function (val) {
        this.$nextTick(() => {
          if (typeof this.$refs.closeBtn !== 'undefined' && this.$refs.closeBtn !== null) {
            this.$refs.closeBtn.focus()
          }
        });
      },
      deep: true
    }
  }
}

</script>
<style lang="scss" scoped>
$animation-speed: 0.3s;
$animation-function: ease-out;
$backdrop-color: rgba(0, 0, 0, 0.7);
$modal-bg-color: #333;

@keyframes modal-video {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes modal-video-inner {
  from {
    transform: translate(0, 100px);
  }

  to {
    transform: translate(0, 0);
  }
}

.modal-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: $backdrop-color;
  z-index: 9999;
  cursor: pointer;
  opacity: 1;
  animation-timing-function: $animation-function;
  animation-duration: $animation-speed;
  animation-name: modal-video;
  transition: opacity $animation-speed $animation-function;
}

.modal-video-close {
  opacity: 0;

  & .modal-video-movie-wrap {
    transform: translate(0, 100px);
  }
}

.modal-video-body {
  max-width: 1100px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  display: table;
}

.modal-video-inner {
  display: table-cell;
  vertical-align: middle;
  width: 100%;
  height: 100%;
}

.modal-video-movie-wrap {
  width: 100%;
  height: 0;
  position: relative;
  padding-bottom: 56.25%;
  background-color: $modal-bg-color;
  animation-timing-function: $animation-function;
  animation-duration: $animation-speed;
  animation-name: modal-video-inner;
  transform: translate(0, 0);
  transition: transform $animation-speed $animation-function;

  & iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.modal-video-close-btn {
  position: absolute;
  z-index: 10;
  top: 50px;
  right: 50px;
  display: inline-block;
  width: 35px;
  height: 35px;
  overflow: hidden;
  border: none;
  background: transparent;

  // @media screen and (max-width: 1170px) {
  //   right: 15px;
  // }
  &:before {
    transform: rotate(45deg) translateY(-50%);
  }

  &:after {
    transform: rotate(-45deg) translateY(-50%);
  }

  &:before,
  &:after {
    content: '';
    position: absolute;
    height: 2px;
    width: 100%;
    top: 50%;
    left: 0;
    background: #fff;
    border-radius: 5px;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.container {
  height: 80vh;
  width: 80vw;
  margin: 8px;
  border: 2px solid #000;
}

.col {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.box {
  flex-basis: auto;
}

.box-shrink {
  flex: 1 1 auto;
  height: 32px;
  margin: 4px;
  border: 2px solid #00f;
}

video {
  max-height: 100%;
  max-width: 100%;
  display: block;
  margin: 0px auto;
  border: 2px solid #f00;
}</style>
