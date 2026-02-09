<template>
  <div class="video-trim-panel">
    <Panel header="Video Trimming" :toggleable="true" :collapsed="collapsed" @toggle="collapsed = !collapsed">
      <div class="grid">
        <!-- Trim Controls -->
        <div class="col-12">
          <div class="flex align-items-center gap-3 mb-3">
            <div class="flex-1">
              <label class="block text-sm font-semibold mb-1">Start Time</label>
              <div class="p-inputgroup">
                <InputText
                  v-model="startTimeDisplay"
                  placeholder="00:00:00.000"
                  class="text-sm"
                  @blur="onStartTimeInput"
                  @keyup.enter="onStartTimeInput"
                />
                <Button
                  icon="pi pi-angle-left"
                  class="p-button-outlined p-button-sm"
                  v-tooltip.top="'Set to current position'"
                  @click="setStartFromPlayhead"
                />
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-semibold mb-1">End Time</label>
              <div class="p-inputgroup">
                <InputText
                  v-model="endTimeDisplay"
                  placeholder="00:00:00.000"
                  class="text-sm"
                  @blur="onEndTimeInput"
                  @keyup.enter="onEndTimeInput"
                />
                <Button
                  icon="pi pi-angle-right"
                  class="p-button-outlined p-button-sm"
                  v-tooltip.top="'Set to current position'"
                  @click="setEndFromPlayhead"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Range Slider -->
        <div class="col-12">
          <div class="trim-slider-container">
            <Slider
              v-model="trimRange"
              :range="true"
              :min="0"
              :max="sliderMax"
              :step="1"
              class="w-full"
              @change="onSliderChange"
            />
            <div class="flex justify-content-between text-xs text-color-secondary mt-1">
              <span>{{ formatTime(0) }}</span>
              <span>{{ formatTime(videoDuration) }}</span>
            </div>
          </div>
        </div>

        <!-- Duration Info -->
        <div class="col-12">
          <div class="flex justify-content-between align-items-center">
            <div class="flex gap-4">
              <div class="text-sm">
                <span class="text-color-secondary">Duration: </span>
                <span class="font-semibold">{{ formatTime(trimDuration) }}</span>
              </div>
              <div class="text-sm" v-if="isTrimmed">
                <Tag value="TRIMMED" severity="warning" class="text-xs" />
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                label="Preview"
                icon="pi pi-play"
                class="p-button-outlined p-button-sm"
                :disabled="!isTrimmed"
                @click="previewTrim"
              />
              <Button
                label="Reset"
                icon="pi pi-refresh"
                class="p-button-text p-button-sm"
                :disabled="!isTrimmed"
                @click="resetTrim"
              />
              <Button
                label="Apply Trim"
                icon="pi pi-check"
                class="p-button-success p-button-sm"
                :disabled="!isTrimmed || !isValid"
                @click="applyTrim"
              />
            </div>
          </div>
        </div>

        <!-- Validation Message -->
        <div class="col-12" v-if="validationError">
          <Message severity="warn" :closable="false" class="text-sm">
            {{ validationError }}
          </Message>
        </div>

        <!-- Thumbnail Strip -->
        <div class="col-12" v-if="isTrimmed">
          <div class="thumbnail-strip">
            <div class="trim-region" :style="trimRegionStyle"></div>
          </div>
        </div>
      </div>
    </Panel>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Slider from 'primevue/slider';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Tooltip from 'primevue/tooltip';
import {
  formatTime,
  parseTime,
  validateTrimPoints,
  calculateDuration,
  snapToFrame,
} from '@/services/videoTrimService';

export default {
  name: 'VideoTrimPanel',
  components: {
    Panel,
    Button,
    InputText,
    Slider,
    Tag,
    Message,
  },
  directives: {
    tooltip: Tooltip,
  },
  emits: ['trim-applied', 'trim-preview'],
  setup(props, { emit }) {
    const store = useStore();
    const collapsed = ref(true);
    const trimStart = ref(0);
    const trimEnd = ref(0);
    const startTimeDisplay = ref('00:00:00.000');
    const endTimeDisplay = ref('00:00:00.000');
    const sliderMax = ref(10000); // Using integer slider (milliseconds)

    const videoDuration = computed(() => {
      const fragment = store.state.videoeditor.activeFragment;
      return fragment ? fragment.duration || 0 : 0;
    });

    const fps = computed(() => {
      const fragment = store.state.videoeditor.activeFragment;
      return fragment ? fragment.fps || 30 : 30;
    });

    const currentTime = computed(() => {
      const progress = store.state.videoeditor.player.progress || 0;
      const fullDuration = store.getters['videoeditor/fullDuration'] || 0;
      return progress * fullDuration;
    });

    const trimRange = computed({
      get() {
        return [
          Math.round(trimStart.value * 1000),
          Math.round(trimEnd.value * 1000),
        ];
      },
      set(val) {
        trimStart.value = val[0] / 1000;
        trimEnd.value = val[1] / 1000;
        updateDisplayTimes();
      },
    });

    const trimDuration = computed(() => {
      return calculateDuration(trimStart.value, trimEnd.value);
    });

    const isTrimmed = computed(() => {
      return trimStart.value > 0.05 || trimEnd.value < videoDuration.value - 0.05;
    });

    const validation = computed(() => {
      return validateTrimPoints(trimStart.value, trimEnd.value, videoDuration.value);
    });

    const isValid = computed(() => validation.value.isValid);
    const validationError = computed(() => validation.value.error);

    const trimRegionStyle = computed(() => {
      if (videoDuration.value <= 0) return {};
      const left = (trimStart.value / videoDuration.value) * 100;
      const width = ((trimEnd.value - trimStart.value) / videoDuration.value) * 100;
      return {
        left: `${left}%`,
        width: `${width}%`,
      };
    });

    const updateDisplayTimes = () => {
      startTimeDisplay.value = formatTime(trimStart.value);
      endTimeDisplay.value = formatTime(trimEnd.value);
    };

    const onStartTimeInput = () => {
      const parsed = parseTime(startTimeDisplay.value);
      const snapped = snapToFrame(parsed, fps.value);
      trimStart.value = Math.max(0, Math.min(snapped, trimEnd.value - 0.1));
      updateDisplayTimes();
    };

    const onEndTimeInput = () => {
      const parsed = parseTime(endTimeDisplay.value);
      const snapped = snapToFrame(parsed, fps.value);
      trimEnd.value = Math.max(trimStart.value + 0.1, Math.min(snapped, videoDuration.value));
      updateDisplayTimes();
    };

    const onSliderChange = () => {
      updateDisplayTimes();
    };

    const setStartFromPlayhead = () => {
      const snapped = snapToFrame(currentTime.value, fps.value);
      trimStart.value = Math.max(0, Math.min(snapped, trimEnd.value - 0.1));
      updateDisplayTimes();
    };

    const setEndFromPlayhead = () => {
      const snapped = snapToFrame(currentTime.value, fps.value);
      trimEnd.value = Math.max(trimStart.value + 0.1, Math.min(snapped, videoDuration.value));
      updateDisplayTimes();
    };

    const resetTrim = () => {
      trimStart.value = 0;
      trimEnd.value = videoDuration.value;
      updateDisplayTimes();
    };

    const timeToProgress = (seconds) => {
      const fullDuration = store.getters['videoeditor/fullDuration'] || 0;
      if (fullDuration <= 0) return 0;
      return Math.max(0, Math.min(1, seconds / fullDuration));
    };

    const previewTrim = () => {
      emit('trim-preview', {
        start: trimStart.value,
        end: trimEnd.value,
      });
      // Seek to start — seek expects a 0-1 progress value
      const progress = timeToProgress(trimStart.value);
      store.dispatch('videoeditor/seek', progress);
    };

    const applyTrim = async () => {
      if (!isValid.value) return;
      emit('trim-applied', {
        start: trimStart.value,
        end: trimEnd.value,
        duration: trimDuration.value,
      });
      // setStartPoint/setEndPoint derive the cut position from
      // the current player progress, so we must seek first, then call them.
      const startProgress = timeToProgress(trimStart.value);
      await store.dispatch('videoeditor/seek', startProgress);
      await store.dispatch('videoeditor/setStartPoint');

      const endProgress = timeToProgress(trimEnd.value);
      await store.dispatch('videoeditor/seek', endProgress);
      await store.dispatch('videoeditor/setEndPoint');
    };

    // Initialize when video duration changes
    watch(videoDuration, (newDuration) => {
      if (newDuration > 0) {
        sliderMax.value = Math.round(newDuration * 1000);
        if (trimEnd.value === 0 || trimEnd.value > newDuration) {
          trimEnd.value = newDuration;
        }
        updateDisplayTimes();
      }
    }, { immediate: true });

    onMounted(() => {
      if (videoDuration.value > 0) {
        trimEnd.value = videoDuration.value;
        sliderMax.value = Math.round(videoDuration.value * 1000);
        updateDisplayTimes();
      }
    });

    return {
      collapsed,
      trimStart,
      trimEnd,
      startTimeDisplay,
      endTimeDisplay,
      trimRange,
      sliderMax,
      videoDuration,
      trimDuration,
      isTrimmed,
      isValid,
      validationError,
      trimRegionStyle,
      formatTime,
      onStartTimeInput,
      onEndTimeInput,
      onSliderChange,
      setStartFromPlayhead,
      setEndFromPlayhead,
      resetTrim,
      previewTrim,
      applyTrim,
    };
  },
};
</script>

<style scoped>
.video-trim-panel {
  width: 100%;
}

.trim-slider-container {
  padding: 0 0.5rem;
}

.thumbnail-strip {
  position: relative;
  height: 40px;
  background: var(--surface-200);
  border-radius: 4px;
  overflow: hidden;
}

.trim-region {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(var(--primary-color-rgb, 59, 130, 246), 0.3);
  border-left: 2px solid var(--primary-color);
  border-right: 2px solid var(--primary-color);
}
</style>

