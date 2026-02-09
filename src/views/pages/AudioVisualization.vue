<template>
  <div class="grid">
    <!-- Header -->
    <div class="col-12">
      <div class="card">
        <div class="flex justify-content-between align-items-center">
          <div>
            <h3 class="m-0">Audio-Reactive Video Generator</h3>
            <p class="text-color-secondary mt-1 mb-0">
              Upload audio, map frequency bands to Deforum parameters, and generate audio-reactive video.
            </p>
          </div>
          <div class="flex gap-2">
            <Button
              label="Export Config"
              icon="pi pi-download"
              class="p-button-outlined"
              :disabled="!analysisResult"
              @click="exportConfig"
            />
            <Button
              label="Generate Video"
              icon="pi pi-play"
              class="p-button-success"
              :disabled="!analysisResult"
              @click="generateVideo"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Step 1: Upload & Playback -->
    <div class="col-12 lg:col-5">
      <Card>
        <template #title>
          <div class="flex align-items-center gap-2">
            <Badge value="1" severity="info" />
            <span>Audio Source</span>
          </div>
        </template>
        <template #content>
          <FileUpload
            mode="basic"
            name="audio"
            accept="audio/*"
            :maxFileSize="104857600"
            :auto="false"
            chooseLabel="Choose Audio File"
            class="w-full mb-3"
            @select="onFileSelect"
          />

          <div v-if="audioFileName" class="mb-3">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-file-audio text-primary"></i>
              <span class="font-semibold">{{ audioFileName }}</span>
              <Tag v-if="audioDuration > 0" :value="formatDuration(audioDuration)" severity="info" />
            </div>

            <audio
              ref="audioEl"
              :src="audioSrc"
              controls
              class="w-full"
              @loadedmetadata="onAudioLoaded"
              @timeupdate="onTimeUpdate"
            />
          </div>

          <!-- Visualiser canvas -->
          <div v-if="audioSrc" class="visualization-container mb-3">
            <canvas ref="vizCanvas" :width="vizWidth" :height="160" class="w-full"></canvas>
          </div>

          <!-- Analysis settings -->
          <Divider />
          <div class="grid">
            <div class="col-6">
              <label class="block text-sm font-semibold mb-1">FPS</label>
              <InputNumber v-model="fps" :min="1" :max="60" :step="1" class="w-full" />
            </div>
            <div class="col-6">
              <label class="block text-sm font-semibold mb-1">Keyframe interval</label>
              <InputNumber v-model="keyframeInterval" :min="1" :max="30" :step="1" class="w-full" />
            </div>
          </div>

          <Button
            label="Analyse Audio"
            icon="pi pi-chart-bar"
            class="p-button-primary w-full mt-3"
            :disabled="!audioBuffer"
            :loading="analysing"
            @click="runAnalysis"
          />

          <ProgressBar v-if="analysing" mode="indeterminate" class="mt-2" style="height: 4px" />
        </template>
      </Card>

      <!-- Base Prompt -->
      <Card class="mt-3">
        <template #title>
          <div class="flex align-items-center gap-2">
            <Badge value="3" severity="info" />
            <span>Base Prompt</span>
          </div>
        </template>
        <template #content>
          <Textarea
            v-model="basePrompt"
            placeholder="Enter your base Deforum prompt. Band-driven prompt fragments will be appended per-frame."
            rows="3"
            class="w-full"
          />

          <div class="grid mt-3">
            <div class="col-4">
              <label class="block text-sm font-semibold mb-1">Width</label>
              <InputNumber v-model="genWidth" :min="256" :max="2048" :step="64" class="w-full" />
            </div>
            <div class="col-4">
              <label class="block text-sm font-semibold mb-1">Height</label>
              <InputNumber v-model="genHeight" :min="256" :max="2048" :step="64" class="w-full" />
            </div>
            <div class="col-4">
              <label class="block text-sm font-semibold mb-1">Steps</label>
              <InputNumber v-model="genSteps" :min="5" :max="150" :step="5" class="w-full" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Step 2: Band Mappings -->
    <div class="col-12 lg:col-7">
      <Card>
        <template #title>
          <div class="flex align-items-center gap-2">
            <Badge value="2" severity="info" />
            <span>Band → Deforum Mappings</span>
          </div>
        </template>
        <template #subtitle>
          Map each frequency band to a Deforum parameter. Adjust range and smoothing.
        </template>
        <template #content>
          <div class="band-mapping-list">
            <div
              v-for="(mapping, idx) in mappings"
              :key="idx"
              class="band-mapping-row"
              :class="{ 'band-mapping-row--disabled': !mapping.enabled }"
            >
              <div class="flex align-items-center gap-3 mb-2">
                <Checkbox v-model="mapping.enabled" :binary="true" />
                <Tag
                  :value="mapping.bandName"
                  :severity="bandSeverity(idx)"
                  class="text-xs"
                />
                <!-- Live energy meter -->
                <div class="band-meter flex-1">
                  <div
                    class="band-meter-fill"
                    :style="{ width: liveEnergy(idx) + '%' }"
                  ></div>
                </div>
              </div>

              <div v-if="mapping.enabled" class="grid pl-5">
                <div class="col-12 md:col-3">
                  <label class="block text-xs mb-1">Target</label>
                  <Dropdown
                    v-model="mapping.target"
                    :options="targetOptions"
                    optionLabel="label"
                    optionValue="key"
                    class="w-full"
                    placeholder="Select target"
                  />
                </div>
                <div class="col-6 md:col-2">
                  <label class="block text-xs mb-1">Min</label>
                  <InputNumber
                    v-model="mapping.min"
                    :step="0.01"
                    :minFractionDigits="2"
                    class="w-full"
                  />
                </div>
                <div class="col-6 md:col-2">
                  <label class="block text-xs mb-1">Max</label>
                  <InputNumber
                    v-model="mapping.max"
                    :step="0.01"
                    :minFractionDigits="2"
                    class="w-full"
                  />
                </div>
                <div class="col-6 md:col-2">
                  <label class="block text-xs mb-1">Smoothing</label>
                  <Slider v-model="mapping.smoothing" :min="0" :max="1" :step="0.05" class="mt-2" />
                </div>
                <div class="col-6 md:col-3">
                  <label class="block text-xs mb-1">Prompt fragment</label>
                  <InputText
                    v-model="mapping.promptFragment"
                    placeholder="e.g. explosive energy"
                    class="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Preview / Schedule Output -->
      <Card v-if="analysisResult" class="mt-3">
        <template #title>
          <div class="flex align-items-center gap-2">
            <Badge value="4" severity="success" />
            <span>Generated Schedules</span>
            <Tag :value="`${analysisResult.frameCount} frames`" severity="info" />
          </div>
        </template>
        <template #content>
          <TabView>
            <TabPanel
              v-for="(schedule, targetKey) in generatedSchedules"
              :key="targetKey"
              :header="targetLabel(targetKey)"
            >
              <div class="schedule-preview">
                <pre class="schedule-text">{{ schedule }}</pre>
              </div>
            </TabPanel>
            <TabPanel header="Prompts">
              <div class="schedule-preview">
                <pre class="schedule-text">{{ JSON.stringify(generatedPrompts, null, 2) }}</pre>
              </div>
            </TabPanel>
            <TabPanel header="Full Config">
              <div class="schedule-preview">
                <pre class="schedule-text">{{ JSON.stringify(fullConfig, null, 2) }}</pre>
              </div>
            </TabPanel>
          </TabView>
        </template>
      </Card>
    </div>

    <!-- Toast + Confirm -->
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import ConfirmDialog from 'primevue/confirmdialog';

import {
  BAND_NAMES,
  DEFORUM_TARGETS,
  createDefaultMappings,
  decodeAudio,
  analyseAudio,
  generateParseqKeyframes,
  buildDeforumConfig,
} from '@/services/audioDeforumService';

import {
  drawSpectrum,
  ColorScheme,
} from '@/services/audioAnalysisService';

export default {
  name: 'AudioVisualization',
  components: {
    Card,
    Button,
    Badge,
    Tag,
    Divider,
    InputNumber,
    InputText,
    Textarea,
    Slider,
    Checkbox,
    Dropdown,
    FileUpload,
    ProgressBar,
    TabView,
    TabPanel,
    ConfirmDialog,
  },
  setup() {
    const toast = useToast();
    const confirm = useConfirm();

    // ── Audio state ───────────────────────────────────────────────────
    const audioEl = ref(null);
    const vizCanvas = ref(null);
    const audioSrc = ref(null);
    const audioFileName = ref('');
    const audioDuration = ref(0);
    const audioBuffer = ref(null);     // decoded AudioBuffer for offline analysis
    const audioRawBuffer = ref(null);  // raw ArrayBuffer for re-decode
    const vizWidth = 600;

    // Live visualisation
    let liveAudioCtx = null;
    let liveAnalyser = null;
    let liveSource = null;
    let liveFreqData = null;
    let animFrame = null;
    const liveBandEnergies = ref(new Array(BAND_NAMES.length).fill(0));

    // ── Analysis settings ─────────────────────────────────────────────
    const fps = ref(15);
    const keyframeInterval = ref(1);
    const analysing = ref(false);
    const analysisResult = ref(null); // { bandData, frameCount, duration }

    // ── Mappings ──────────────────────────────────────────────────────
    const mappings = ref(createDefaultMappings());
    const targetOptions = DEFORUM_TARGETS;

    // ── Generation config ─────────────────────────────────────────────
    const basePrompt = ref('');
    const genWidth = ref(512);
    const genHeight = ref(512);
    const genSteps = ref(30);

    // ── Computed schedule ─────────────────────────────────────────────
    const generatedSchedules = ref({});
    const generatedPrompts = ref({});
    const fullConfig = ref(null);

    // ── File handling ─────────────────────────────────────────────────
    async function onFileSelect(event) {
      const files = event.files ?? event.target?.files;
      if (!files || files.length === 0) return;
      const file = files[0];

      audioFileName.value = file.name;
      audioSrc.value = URL.createObjectURL(file);

      // Read as ArrayBuffer for offline analysis
      const reader = new FileReader();
      reader.onload = async (e) => {
        audioRawBuffer.value = e.target.result;
        try {
          audioBuffer.value = await decodeAudio(e.target.result.slice(0));
          audioDuration.value = audioBuffer.value.duration;
        } catch (err) {
          toast.add({ severity: 'error', summary: 'Decode Error', detail: err.message, life: 5000 });
        }
      };
      reader.readAsArrayBuffer(file);

      // Reset previous analysis
      analysisResult.value = null;
      generatedSchedules.value = {};
      generatedPrompts.value = {};
      fullConfig.value = null;
    }

    function onAudioLoaded() {
      if (audioEl.value) {
        audioDuration.value = audioEl.value.duration;
        setupLiveVisualisation();
      }
    }

    // ── Live visualisation ────────────────────────────────────────────
    function setupLiveVisualisation() {
      cleanupLiveVisualisation();
      if (!audioEl.value) return;

      try {
        liveAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        liveAnalyser = liveAudioCtx.createAnalyser();
        liveAnalyser.fftSize = 256;
        liveFreqData = new Uint8Array(liveAnalyser.frequencyBinCount);

        liveSource = liveAudioCtx.createMediaElementSource(audioEl.value);
        liveSource.connect(liveAnalyser);
        liveAnalyser.connect(liveAudioCtx.destination);

        renderLoop();
      } catch (err) {
        console.warn('Live visualisation failed:', err);
      }
    }

    function renderLoop() {
      animFrame = requestAnimationFrame(renderLoop);
      if (!liveAnalyser || !vizCanvas.value) return;

      liveAnalyser.getByteFrequencyData(liveFreqData);

      // Draw spectrum to canvas
      const ctx = vizCanvas.value.getContext('2d');
      drawSpectrum(ctx, liveFreqData, vizWidth, 160, ColorScheme.RAINBOW);

      // Compute per-band energies for meters
      const bandSize = Math.floor(liveFreqData.length / BAND_NAMES.length);
      for (let b = 0; b < BAND_NAMES.length; b++) {
        let sum = 0;
        const start = b * bandSize;
        for (let i = start; i < start + bandSize && i < liveFreqData.length; i++) {
          sum += liveFreqData[i];
        }
        liveBandEnergies.value[b] = Math.round((sum / bandSize / 255) * 100);
      }
    }

    function cleanupLiveVisualisation() {
      if (animFrame) cancelAnimationFrame(animFrame);
      animFrame = null;
      try { liveSource?.disconnect(); } catch (_) { /* noop */ }
      try { liveAnalyser?.disconnect(); } catch (_) { /* noop */ }
      if (liveAudioCtx && liveAudioCtx.state !== 'closed') liveAudioCtx.close();
      liveSource = null;
      liveAnalyser = null;
      liveAudioCtx = null;
    }

    function onTimeUpdate() {
      // Resume context if suspended (autoplay policy)
      if (liveAudioCtx && liveAudioCtx.state === 'suspended') {
        liveAudioCtx.resume();
      }
    }

    // ── Offline analysis ──────────────────────────────────────────────
    async function runAnalysis() {
      if (!audioBuffer.value) return;
      analysing.value = true;

      try {
        // Run analysis in next tick so the UI can update
        await nextTick();
        const result = analyseAudio(audioBuffer.value, fps.value);
        analysisResult.value = result;

        // Generate schedules
        regenerateSchedules();

        toast.add({ severity: 'success', summary: 'Analysis Complete', detail: `${result.frameCount} frames analysed`, life: 3000 });
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Analysis Failed', detail: err.message, life: 5000 });
      } finally {
        analysing.value = false;
      }
    }

    function regenerateSchedules() {
      if (!analysisResult.value) return;

      const { schedules, prompts, frameCount } = generateParseqKeyframes(
        analysisResult.value.bandData,
        mappings.value,
        fps.value,
        { keyframeInterval: keyframeInterval.value },
      );

      generatedSchedules.value = schedules;
      generatedPrompts.value = prompts;

      fullConfig.value = buildDeforumConfig({
        basePrompt: basePrompt.value,
        schedules,
        prompts,
        frameCount,
        fps: fps.value,
        globalConfig: {
          width: genWidth.value,
          height: genHeight.value,
          steps: genSteps.value,
        },
      });
    }

    // Re-generate schedules when mappings change
    watch(
      [mappings, basePrompt, keyframeInterval, genWidth, genHeight, genSteps],
      () => { if (analysisResult.value) regenerateSchedules(); },
      { deep: true },
    );

    // ── Export / Generate ─────────────────────────────────────────────
    function exportConfig() {
      if (!fullConfig.value) return;
      const blob = new Blob([JSON.stringify(fullConfig.value, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audio-deforum-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.add({ severity: 'success', summary: 'Exported', detail: 'Config downloaded', life: 3000 });
    }

    function generateVideo() {
      if (!fullConfig.value) return;
      confirm.require({
        message: `Generate a Deforum video with ${analysisResult.value?.frameCount ?? 0} frames at ${fps.value} fps? This will submit a generation job.`,
        header: 'Generate Audio-Reactive Video',
        icon: 'pi pi-play',
        accept: () => {
          toast.add({ severity: 'info', summary: 'Submitted', detail: 'Generation job queued. Check your jobs list.', life: 5000 });
          // TODO: wire to actual API submission via DeforumControlService or videojobs.service
        },
      });
    }

    // ── Helpers ────────────────────────────────────────────────────────
    function formatDuration(secs) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    function bandSeverity(idx) {
      const severities = ['danger', 'danger', 'warning', 'info', 'info', 'success', 'success'];
      return severities[idx] || 'info';
    }

    function liveEnergy(bandIdx) {
      return liveBandEnergies.value[bandIdx] || 0;
    }

    function targetLabel(key) {
      const t = DEFORUM_TARGETS.find((d) => d.key === key);
      return t ? t.label : key;
    }

    onUnmounted(() => {
      cleanupLiveVisualisation();
      if (audioSrc.value) URL.revokeObjectURL(audioSrc.value);
    });

    return {
      // Audio
      audioEl,
      vizCanvas,
      audioSrc,
      audioFileName,
      audioDuration,
      audioBuffer,
      vizWidth,
      onFileSelect,
      onAudioLoaded,
      onTimeUpdate,

      // Analysis
      fps,
      keyframeInterval,
      analysing,
      analysisResult,
      runAnalysis,

      // Mappings
      mappings,
      targetOptions,

      // Generation
      basePrompt,
      genWidth,
      genHeight,
      genSteps,

      // Output
      generatedSchedules,
      generatedPrompts,
      fullConfig,
      exportConfig,
      generateVideo,

      // Helpers
      formatDuration,
      bandSeverity,
      liveEnergy,
      targetLabel,
    };
  },
};
</script>

<style scoped>
.visualization-container {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.band-mapping-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.band-mapping-row {
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background: var(--surface-ground);
  transition: opacity 0.2s;
}

.band-mapping-row--disabled {
  opacity: 0.5;
}

.band-meter {
  height: 8px;
  background: var(--surface-200);
  border-radius: 4px;
  overflow: hidden;
}

.band-meter-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.1s;
}

.schedule-preview {
  max-height: 250px;
  overflow: auto;
  background: var(--surface-ground);
  padding: 0.75rem;
  border-radius: var(--border-radius);
}

.schedule-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.75rem;
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>

