<template>
  <div class="home-banner">
    <div class="text-center">
      <div class="hero-banner">What do you like to create today?</div>
      <div class="banner-item-row">
      <div class="banner-item" v-on:drop="uploadHandler($event, 'deforum')" v-on:dragover.prevent>
        <input class="file-input" type="file" accept="image/*" @change="uploadHandler($event, 'deforum')">
        <div class="banner-media-container">
          <img src="/public/img/mona.gif" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="/public/img/mona2.gif" />
          </div>
          <div class="banner-overlay">
            <div class="banner-overlay-icon">
              <i class="pi pi-upload"></i>
            </div>
            <div class="banner-overlay-body">
              <div class="banner-overlay-title">Upload an image</div>
              <div class="banner-overlay-desc">Formats .jpg, .jpeg, .png, .gif, size less than 2MB</div>

            </div>
          </div>
        </div>

        <ProgressBar :value="getProgress" v-if="getProgress > 0"></ProgressBar>
        <div class="banner-content-container">
          <div class="banner-header">Animation </div>
          <div class="banner-description">Turn images into gorgeous animated clips</div>
        </div>
      </div>
    <!--
      <div class="banner-item" v-on:drop="uploadHandler($event, 'vid2vid')" v-on:dragover.prevent>
        <input class="file-input" type="file" accept="video/*" @change="uploadHandler($event, 'vid2vid')">
        <div class="banner-media-container">
          <img src="/public/img/mona.jpg" class="banner-media-main"/>
          <div class="banner-media-secondary">
            <img src="/public/img/mona.jpg" />
          </div>
          <div class="banner-overlay">
            <div class="banner-overlay-icon">
              <i class="pi pi-upload"></i>
            </div>
            <div class="banner-overlay-body">
              <div class="banner-overlay-title">Upload a video</div>
              <div class="banner-overlay-desc">Format .mp4, size less than 50MB</div>
            </div>
          </div>
        </div>
        <div class="banner-content-container">
          <div class="banner-header">Video Effect</div>
          <div class="banner-description">Enhance videos with stunning visual effects</div>
        </div>
      </div>
      <div class="banner-item coming-soon hidden">
        <div class="banner-icon"><i class="pi pi-camera"></i></div>
        <div class="banner-content-container">
          <div class="banner-header with-tag">Record a video <Tag value="Coming Soon"></Tag></div>
          <div class="banner-description">Directly record a video with your device's camera</div>
        </div>
      </div>
    
    -->
      </div>
    </div>
  </div>
</template>

<script>
import * as notificationActions from '@/store/modules/notification/types/actions';
import { mapActions, mapGetters } from 'vuex';


export default {
  name: 'Upload',
  data() {
    return {
      generatorType: 'vid2vid',
      videoId: false,
      isLoading: false,
      status: '',
      errorMessage: false,
      fileSizeLimit: {'video/mp4': 50, 'image': 2 }
    };
  },
  watch: {
    videoId(newValue) {
      if (newValue) {
           this.$router.push(`/edit/${this.generatorType}/${newValue}`);
      }
    },
  },
  computed: {
    ...mapGetters('videojobs', {
      getProgress: 'progress'
    })
  },
  methods: {
    ...mapActions({
        upload: 'videojobs/upload',
        setErrorNotification: 'notification/'+notificationActions.SET_ERROR_NOTIFICATION,
        setSuccessNotification: 'notification/'+notificationActions.SET_SUCCESS_NOTIFICATION

    }),
    cancel() {
      this.isLoading = false;
      this.videoShow = false;
      this.videoFile = false;
      this.status = '';
      this.errorMessage = false;

    },
    uploadHandler(event, type) {
      let currentFile = event.target.files[0];
      let fileType = currentFile.type;
      let fileSize = currentFile.size;
      this.generatorType = type;
      this.setSuccessNotification('Uploading in progress');
      const reader = new FileReader();

      reader.addEventListener('progress', function(progress) {
          console.log(progress);
      });

      if (!this.fileSizeLimit[fileType]) {
       // alert("not supported");
      }

      if (fileSize > 1024 * 1024 * this.fileSizeLimit[fileType]) {

        this.errorMessage = "File is too big, maximum "+this.filesizeLimit+"mb or 15 seconds allowed!";
        this.setErrorNotification(this.errorMessage);

        return;
      }

      this.uploadFile(currentFile, type);

    },
    async uploadFile(file, type) {
      const response = this.upload({attachment: file, type: type }).then((result) => { this.status = result.status; this.videoId = result.id; return result;} );
    }
  }};

</script>




<style scoped lang="scss">

.home-banner {
  display: flex;
  flex-flow: column;
  padding-top: 1rem;
}
.hero-banner {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.banner-item-row {
  width: 100%;
  max-width: 576px;
  margin: 3rem auto 5rem auto;
  display: grid;
  grid-template: 1fr / fit-content(100%);
  align-items: self-start;
  justify-content: center;
  flex-flow: column;
  column-gap: 2rem;
  row-gap: 3rem;
}

.banner-item {
  position: relative;

  &.coming-soon {
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
    column-gap: 2rem;
    padding: 2rem;
    background: #eeeeee0a;
    border-radius: 6px;
  }
}

.file-input {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  z-index: 3;
  cursor: pointer;
}

.banner-icon i {
  font-size: 5rem;
}

.banner-description {
  font-size: 1rem;
  opacity: 0.5;
}

.banner-header {
  font-size: 1.2rem;
  font-weight: bold;

  &.with-tag {
    display: flex;
    align-items: center;
    column-gap: 0.5rem;
  }
}

.banner-media-container {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  margin-bottom: 0.5rem;
}
.banner-media-main {
  width: 100%;
  display: block;
}
.banner-media-secondary {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
  border-right: 2px solid rgba(18, 18, 18, 0.4);
  animation: slide 20s infinite ease-in-out;
}
.banner-media-secondary img {
  display: block;
  filter: grayscale(1);
  height: 100%;
}

.banner-overlay {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-flow: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  background: rgba(28, 28, 28, 0.2);
  backdrop-filter: blur(30px);
  row-gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.5rem;
  opacity: 0;

  .banner-item:hover & {
    animation: appear 0.3s ease-in-out;
    opacity: 1;
  }
}

.banner-overlay-icon i {
  font-size: 3em;
}

.banner-overlay-title {
  font-size: 1.5em;
}

.banner-overlay-desc {
  opacity: 0.5;
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

@keyframes appear {
  0% {
    opacity: 0;
    bottom: -2rem;
  }
  100% {
    opacity: 1;
    top: 0;
  }
}

@media (min-width: 768px) {
  .hero-banner {
    font-size: 2.5rem;
  }
  .home-banner {
    padding-top: 1.5rem;
  }
  .banner-item-row {
    grid-template: auto auto / 1fr 1fr;
    max-width: 960px;
    row-gap: 5rem;
  }
}

@media (min-width: 992px) {
  .home-banner {
    padding-top: 3rem;
  }
  .hero-banner {
    font-size: 3.5rem;
  }
  .banner-description {
    font-size: 1.4rem;
  }
  .banner-header {
    font-size: 2rem;
  }
  .banner-overlay {
    font-size: 1rem;
  }
}

</style>
