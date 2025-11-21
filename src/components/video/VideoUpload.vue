<template>
  <div class="main-container w-100" :class="{ loading: isLoading, banner: (!videoFile || errorMessage) }">
    <div class="page-container w-100">
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center position-absolute"
        v-if="isLoading">
        <h1 class="position-absolute">
          <i class="fw-bolder fa fa-spin fa-atom"></i>
          <i class="text-warning me-3 md:me-5 fa fa-spin fa-atom blur-spinner"></i>
          <i class="text-primary ms-3 md:ms-5 fa fa-spin fa-atom blur-spinner"></i>
        </h1>
      </div>
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
        v-if="errorMessage">
        <span class="text-primary text-lg">{{ errorMessage }}</span>
        <p></p><Button @click="cancel" class="p-button p-button-warning">Try Again</Button>
      </div>
      <div class="w-100 d-flex flex-column justify-content-center align-items-center text-align-center"
        v-if="status == 'error' && !errorMessage">
        <span class="text-primary text-lg">Error occcured while processing, please try again. {{ errorMessage }}</span>
      </div>          
      <div v-if="videoFile">
        <ProgressBar :value="progress" v-if="isLoading || progress > 0 "></ProgressBar>

        <div class="card" v-if="videoShow">
          <VideoClipper ref="VideoClip" @getTime="getTime" @trimvideo="trimVideo" @cancel="cancel" @save="saveVideo" :url="url" :videoInfo="videoInfo"></VideoClipper>
        </div>
      </div>
      <span class="text-primary text-xl" v-if="isLoading">Loading ... {{ message }}</span>
      <div v-if="!videoFile && !errorMessage">
        <div v-on:drop="uploadHandler" v-on:dragover.prevent class="upload-area upload-page">
          <div class="text-center mb-3">
            <h1 class="text-vibrant">This shit is the shit</h1>
            <h5 class="text-white">Drag and drop here
            </h5>
          </div>
          <div>
            <label
              class="bg-gradient-vibrant p-button p-component bg-gradient-vibrant p-button-lg p-button-rounded p-button-success hero-button">
              <input class="display-none" type="file" accept="video/* image/*" @change="uploadHandler">
              <span class="p-button-icon p-button-icon-left pi pi-upload"></span>
              <span class="p-button-label">Select a video</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import moment from 'moment';
import { defineComponent } from "vue";
import { mapActions } from 'vuex';
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import MediaInfoFactory from 'mediainfo.js'
import VideoClipper from '@/components/video/VideoClipper.vue';

export default {
  name: 'VideoUpload',

  components: {
    VideoClipper
  },

  setup() {
    const ffmpeg = createFFmpeg({
      log: true
    });

    return { ffmpeg }
  },
  async mounted() {

    this.ffmpeg.setProgress(({ ratio }) => { // Update the progress bar
          this.progress = Math.floor(ratio * 100);
    });

  },
  data() {
    return {
      isLoading: false,
      ffmpegLoaded: false,
      currentTrimRange: { start: 0.0, end:0.0 },
      videoInfo: {},
      videoShow: false,
      url: null,
      progress: 0,
      filesizeLimit: 50,
      isPortrait: false,
      video: null,
      videoFile: null,
      videoPreview: null,
      videoId: null,
      fileURL: null,
      errorMessage: '',
      status: null,
      message: ''
    };
  },
  watch: {
    videoId(newValue) {
      if (newValue) {
           this.$router.push(`/edit/${newValue}`);
      }
    },
  },
  constructor() {
    this.uploadHandler = this.uploadHandler.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
  },
  methods: {
    ...mapActions({
            upload: 'videojobs/upload',
    }),
    getTime(val) {
      this.currentTrimRange = val;
    },
    saveVideo() {

      this.videoShow = false;

      this.uploadVideo(false, this.currentFile.name);
    },
    async transcode(file) {

      this.progress = 0;
      this.isLoading = true;
      
      try { 
      if (this.ffmpegLoaded == false) {
        await this.ffmpeg.load();
        this.ffmpegLoaded = true;
      }
      await this.ffmpeg.FS("writeFile", file.name, await fetchFile(file));
   
      if (this.fileType != "video/mp4") {
        
        this.message = "Loading ffmeg-core.js";

        this.message = "Transcoding "+this.fileType+" to video/mp4";

        await this.ffmpeg.run("-i", file.name,  "-codec", "copy", "-acodec", "copy", "out"+this.getExtension(file.name));

        this.message = "Completed transcoding";
        var data = await this.ffmpeg.FS("readFile", "out."+this.getExtension(file.name));
        
        this.url = URL.createObjectURL(
        new Blob([data.buffer], { type: file.type})
      ); 

      } else {
        this.url = URL.createObjectURL(file);
      }


      this.videoShow = true;
      this.isLoading = false;
      setTimeout(() => {
        this.$nextTick(() => {
          this.$refs.VideoClip.init();
        })
      }, 150);
        } catch (error) {
          if (error.message)
            this.errorMessage = error.message;
      }

    },
    async trimVideo(timeArray) {
      try {
      this.message = "Trimming video...";
      const start = this.secondsToFFmpegTime(timeArray[0]);
      const end = this.secondsToFFmpegTime(timeArray[1]);
      this.isLoading = true;
      this.videoShow = false;
      var file = this.currentFile;
      this.ffmpeg.FS("writeFile", "test.mp4", await fetchFile(file));
      await this.ffmpeg.run("-i", "test.mp4", "-ss", start, "-to", end, "-r", "30", "-acodec", "copy",  "out.mp4");
      const data = await this.ffmpeg.FS("readFile", "out.mp4");
      let trimmedVideo = new Blob([data.buffer], { type: "video/mp4" });
      this.uploadVideo(trimmedVideo, file.name);
      this.isLoading = false;
     } catch (error) {
      alert("error");
    }
    },
    cancel() {
      this.isLoading = false;
      this.videoShow = false;
      this.videoFile = false;
      this.status = '';
      this.errorMessage = false;

    },
    secondsToFFmpegTime(seconds) {
      // Ensure the input is a valid number
      if (isNaN(seconds) || seconds < 0) {
          return null;
      }

      // Calculate hours, minutes, and seconds
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      const milliseconds = Math.round((seconds % 1) * 1000);

      // Convert each component to a string and pad with zeros if needed
      const hoursStr = String(hours).padStart(2, '0');
      const minutesStr = String(minutes).padStart(2, '0');
      const secondsStr = String(remainingSeconds).padStart(2, '0');
      const millisecondsStr = String(milliseconds).padStart(3, '0');

      // Concatenate the components into the final FFmpeg-compatible time string
      const ffmpegTime = `${hoursStr}:${minutesStr}:${secondsStr}.${millisecondsStr}`;

      return ffmpegTime;
    },
    getToken() {
      return localStorage.getItem('auth.accessToken');
    },
    getSize() {
      return this.currentFile.size;
    },
    removeExtension(filename) {
      return filename.substring(0, ) || filename;
    },
    getExtension(filename) {
      return filename.substring(filename.lastIndexOf('.')).substring(1) || filename;
    },
    getMediaMetadata(metadata) {
        
        var mediaInfo = metadata?.media?.track[1];
        if (!mediaInfo || mediaInfo.length < 1) return {};
        return {
          duration: mediaInfo.Duration,
          filesize: mediaInfo.StreamSize,
          format: mediaInfo.Format,
          codec: mediaInfo.CodecID,
          frameRate: mediaInfo.FrameRate,
          frameCount: mediaInfo.FrameCount,
          width: mediaInfo.Width,
          height: mediaInfo.Height,
          bitrate: mediaInfo.BitRate,
          aspectRatio: mediaInfo.DisplayAspectRatio,
        }
    },
    uploadHandler(event) {
      this.files = event.target.files;
      this.currentFile = this.files[0];
      this.fileType = this.currentFile.type;
      this.fileSize = this.currentFile.size;
      const reader = new FileReader();
      
      reader.addEventListener('progress', function(progress) { 
          console.log(progress);
      });
  
      if (this.currentFile.size > 1024 * 1024 * this.filesizeLimit) {
        this.errorMessage = "File is too big, maximum "+this.filesizeLimit+"mb or 15 seconds allowed!";
        return;
      }
      this.videoFile = event.target.files[0];
      this.videoPreview = URL.createObjectURL(this.videoFile);
        
        if (this.status !== "error")
        this.uploadVideo(false)
        else {
          this.errorMessage = "error";
        }
//      this.transcode(this.currentFile);
    },

  
    async uploadVideo(blob=false, filename=false) {
      this.isLoading = true;
      const getSize = () => this.currentFile.size;
          const readChunk = (chunkSize, offset) =>
            new Promise((resolve, reject) => {
              const filereader = new FileReader();
              filereader.onload = (event) => {
                if (event.target.error) {
                  reject(event.target.error);
                }
                resolve(new Uint8Array(event.target.result));
              }
              filereader.readAsArrayBuffer(this.currentFile.slice(offset, offset + chunkSize));
            });
          MediaInfoFactory().then((mediainfo) => {
            mediainfo
              .analyzeData(getSize, readChunk)
              .then((result) => {
                this.videoInfo = this.getMediaMetadata(result);
              
                if (this.videoInfo && this.videoInfo.duration > 15) {
                    this.status='error';
                    this.isLoading = false;
                    this.errorMessage = "File is too long, maximum 15 seconds allowed!";
                  return;
                } 
              })
              .catch((error) => {
                alert(error);
              });
          });
      
      if (this.status == 'error') return;

      let formData = new FormData();

      if (blob == false) {
        formData.append("video", this.videoFile);
      } else {
        formData.append("video", blob, this.currentFile.name);
      }
      formData.append("start", this.secondsToFFmpegTime(this.currentTrimRange.end));
      formData.append("end", this.secondsToFFmpegTime(this.currentTrimRange.end));

      try {
        const response = await
          axios.post('https://api.dudeisland.eu/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': 'Bearer ' + this.getToken()
            }r
          });
        this.videoUrl = response.data.url;

        this.videoId = response.data.id;
        this.status = response.data.status;

      } catch (error) {
        this.errorMessage = error.message;
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        }
      }
      this.isLoading = false;
    },
  }
};
</script>
<style scoped lang="scss">
@import '@/assets/vimage.scss';
</style>
