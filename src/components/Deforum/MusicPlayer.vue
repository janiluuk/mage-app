<template>
  <div class="col-12">
    <div class="col-12 md:col-6">
      <h5>Music player</h5>
      <div class="row justify-between">

        <p class="text-gray-600 text-sm">
          Upload music file and play it to add new frames to your config.
        </p>
      </div>
    </div>

    <audio style="display:none" ref="audioplayer" class="w-full shadow rounded-md" controls @timeupdate="handleTimeUpdate"
          :src="audioSource"></audio>
    <div class="col-12 md:col-12">
      <div class="field p-fluid items-left card">
        <label class=" mb-2 md:col-1 md:mb-0 items-left" for="music-upload" style="display:inline"><h4>Upload</h4></label>
        <FileUpload name="file" id="music-upload" @uploader="handleFileChange($event)" :multiple="false" accept="audio/*"
          :maxFileSize="10000100" simple  mode="basic"/>

      </div>

      <div class="col-12 mb-4 md:col-8 md:mb-0 flex">
        <div class="card">
          <div v-show="file" class="flex mb-5">
        <div class="col-12 md:col-12">
          <av-waveform :src="audioSource" noplayed-line-color="#CFCFCF" played-line-color="lime" />

        </div>
      </div>

          <span class="text-xs">Current frame:</span>
          <span class="font-mono font-bold">
            {{ currentFrame }}
          </span>
        </div>
      </div>
      <Button v-for="speedValue in speeds" :key="speedValue" @click="speed = speedValue" :title="speed === speedValue
        ? 'Current speed'
        : 'Play at ' + speedValue + 'x speed'
        " :colors="getButtonColors(speedValue)" class="ml-2">
        <span></span>
        {{ speedValue }}x
      </Button>

      <Button icon="pi pi-play" :label="playPauseLabel" class="ml-2  px-2  p-button-raised p-button-warning" @click="handlePlayPause" :title="playPauseLabel">
    </Button>
      <Button class="ml-2 p-button p-button-raised p-button-info" icon="pi pi-plus" @click="handleAddFrameBetween" title="Add a frame where the music is at the current time" label="Add frame">
      </Button>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from "vue";
import { AVWaveform, useAVBars } from 'vue-audio-visual';

export default {
  name: "MusicPlayer",
  components: {
  },
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
  
    const file = ref(null);
    const isPlaying = ref(false);
    const time = ref(0);
    const speed = ref(1);
    const speeds = [0.25, 0.5, 1, 2, 4];
    const audioplayer = ref(null);
    const canvas = ref(null);

    const handleFileChange = e => {

      if (e.files[0]) {
        file.value = e.files[0];
        time.value = audioplayer.value.currentTime;

      }

      isPlaying.value = false;
    };

    const audioSource = computed(() => {
      if (file.value) {
        return URL.createObjectURL(file.value);
      }
      return "";
    });


    const handlePlayPause = () => {
      if (audioplayer.value) {
        if (isPlaying.value) {
          audioplayer.value.pause();
        } else {
          audioplayer.value.play();
        }
        isPlaying.value = !isPlaying.value;
      }
    };

    const playPauseLabel = computed(() => {
      return isPlaying.value ? "Pause" : "Play";
    });

    const currentFrame = computed(() => {
      if (audioplayer.value) {
        return Math.floor(time.value * props.config.fps);
      }
      return 0;
    });

    const handleTimeUpdate = () => {
      if (audioplayer.value) {

        time.value = audioplayer.value.currentTime;
      }
    };

    const handleAddFrameBetween = () => {
      if (audioplayer.value) {
        emit("update:addFrameAt", currentFrame.value);
      }
    };

    const getButtonColors = speedValue => {
      return speed.value === speedValue
        ? undefined
        : "hover:bg-gray-300 focus:ring-gray-200";
    };

    watch(
      () => speed.value,
      newSpeed => {
        if (audioplayer.value) {
          audioplayer.value.playbackRate = newSpeed;
        }
      }
    );

    return {
      file,
      audioplayer,
      isPlaying,
      time,
      speed,
      speeds,
      handleFileChange,
      audioSource,
      handlePlayPause,
      playPauseLabel,
      currentFrame,
      handleTimeUpdate,
      handleAddFrameBetween,
      getButtonColors
    };
  }
};
</script>
