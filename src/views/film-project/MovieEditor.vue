<template>
  <div class="movie-editor-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else class="grid">
      <!-- Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <Button
                icon="pi pi-arrow-left"
                class="p-button-text"
                @click="$router.push({ name: 'project-detail', params: { id: projectId } })"
                v-tooltip.top="'Back to Project'"
              />
              <div>
                <h3 class="m-0">Movie Editor</h3>
                <p class="text-color-secondary mt-1 mb-0">
                  {{ project?.name || 'Untitled Project' }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                label="Add Text Overlay"
                icon="pi pi-comment"
                class="p-button-outlined"
                @click="showOverlayDialog = true"
              />
              <Button
                label="Export"
                icon="pi pi-download"
                class="p-button-success"
                @click="exportProject"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview + Scene List -->
      <div class="col-12 lg:col-7">
        <Card>
          <template #content>
            <PreviewPlayer
              ref="previewPlayer"
              :clips="clips"
              :overlays="overlays"
              :transitions="transitions"
              :fps="fps"
              @time-update="onTimeUpdate"
              @seek="onSeek"
            />
          </template>
        </Card>
      </div>

      <!-- Scenes / Clips panel -->
      <div class="col-12 lg:col-5">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Scenes</span>
              <Tag :value="clips.length + ' clips'" severity="info" />
            </div>
          </template>
          <template #content>
            <div v-if="clips.length === 0" class="text-center p-4">
              <i class="pi pi-film text-4xl text-500 mb-3" style="display:block" />
              <p class="text-500">No clips yet. Add scenes from your project sequences.</p>
            </div>

            <div v-else class="clip-list">
              <div
                v-for="(clip, idx) in clips"
                :key="clip.id"
                class="clip-item"
                :class="{ 'clip-item--active': activeClipIndex === idx }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
              >
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-bars text-500 cursor-move" />
                  <div
                    class="clip-thumbnail"
                    :style="{ background: clipColor(idx) }"
                  >
                    <i class="pi pi-video" />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-sm">{{ clip.name }}</div>
                    <div class="text-xs text-500">{{ formatDuration(getClipDuration(clip)) }}</div>
                  </div>
                  <Button
                    icon="pi pi-times"
                    class="p-button-text p-button-sm p-button-danger"
                    @click="removeClip(idx)"
                  />
                </div>

                <!-- Transition between clips -->
                <div v-if="idx < clips.length - 1" class="transition-slot">
                  <TransitionPicker
                    :modelValue="getTransition(idx)"
                    @update:modelValue="setTransition(idx, $event)"
                  />
                  <span class="text-xs text-500 ml-2">{{ getTransition(idx).type }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Overlays list -->
        <Card class="mt-3" v-if="overlays.length > 0">
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Text Overlays</span>
              <Tag :value="overlays.length + ''" severity="info" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-column gap-2">
              <div
                v-for="overlay in overlays"
                :key="overlay.id"
                class="overlay-item flex align-items-center justify-content-between p-2 border-round surface-ground"
              >
                <div>
                  <div class="font-semibold text-sm">{{ overlay.text }}</div>
                  <div class="text-xs text-500">
                    {{ formatDuration(overlay.startTime) }} — {{ formatDuration(overlay.startTime + overlay.duration) }}
                    · {{ overlay.animationIn }}
                  </div>
                </div>
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editOverlay(overlay)" />
                  <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="removeOverlay(overlay.id)" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Timeline -->
      <div class="col-12">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Timeline</span>
              <div class="flex align-items-center gap-2">
                <span class="text-xs text-500 font-mono">{{ formatDuration(currentTime) }}</span>
                <Slider v-model="zoomLevel" :min="1" :max="10" :step="0.5" style="width:120px" />
                <span class="text-xs text-500">Zoom</span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="timeline-container" ref="timelineContainer">
              <!-- Time ruler -->
              <div class="timeline-ruler">
                <div
                  v-for="tick in timeRulerTicks"
                  :key="tick.time"
                  class="timeline-tick"
                  :style="{ left: timeToPixel(tick.time) + 'px' }"
                >
                  <span class="text-xs text-500">{{ formatDuration(tick.time) }}</span>
                </div>
              </div>

              <!-- Playhead -->
              <div
                class="timeline-playhead"
                :style="{ left: timeToPixel(currentTime) + 'px' }"
              />

              <!-- Clip track -->
              <div class="timeline-track" @click="onTimelineClick">
                <div
                  v-for="(clip, idx) in clips"
                  :key="clip.id"
                  class="timeline-clip"
                  :style="{
                    left: timeToPixel(getClipStartOnTimeline(idx)) + 'px',
                    width: timeToPixel(getClipDuration(clip)) + 'px',
                    background: clipColor(idx),
                  }"
                  :title="clip.name"
                >
                  <span class="timeline-clip-label">{{ clip.name }}</span>
                </div>
              </div>

              <!-- Overlay track -->
              <div class="timeline-track timeline-track--overlays" @click="onTimelineClick">
                <div
                  v-for="overlay in overlays"
                  :key="overlay.id"
                  class="timeline-overlay"
                  :style="{
                    left: timeToPixel(overlay.startTime) + 'px',
                    width: timeToPixel(overlay.duration) + 'px',
                  }"
                  @click.stop="editOverlay(overlay)"
                >
                  <span class="timeline-overlay-label">{{ overlay.text }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Text Overlay Editor Dialog -->
    <TextOverlayEditor
      v-model:visible="showOverlayDialog"
      :overlay="editingOverlay"
      @save="onOverlaySave"
      @delete="removeOverlay"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Slider from 'primevue/slider';
import ProgressSpinner from 'primevue/progressspinner';

import PreviewPlayer from '@/components/movie-editor/PreviewPlayer.vue';
import TransitionPicker from '@/components/movie-editor/TransitionPicker.vue';
import TextOverlayEditor from '@/components/movie-editor/TextOverlayEditor.vue';

import * as actions from '@/store/modules/film-project/types/actions';

export default {
  name: 'MovieEditor',
  components: {
    Card,
    Button,
    Tag,
    Slider,
    ProgressSpinner,
    PreviewPlayer,
    TransitionPicker,
    TextOverlayEditor,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const projectId = computed(() => route.params.id);
    const project = computed(() => store.getters['FilmProject/project']);
    const isLoading = computed(() => store.getters['FilmProject/isLoading']);
    const sequences = computed(() =>
      store.getters['FilmProject/sequencesByProject'](projectId.value)
    );
    const allShots = computed(() => store.getters['FilmProject/shots']);

    const previewPlayer = ref(null);
    const timelineContainer = ref(null);
    const currentTime = ref(0);
    const zoomLevel = ref(3);
    const fps = ref(30);
    const dragFromIndex = ref(-1);
    const activeClipIndex = ref(-1);

    // ── Clips (derived from project shots) ───────────────────────────
    const clips = ref([]);
    const transitions = ref([]);
    const overlays = ref([]);

    const showOverlayDialog = ref(false);
    const editingOverlay = ref(null);

    // ── Clip colours ─────────────────────────────────────────────────
    const palette = [
      '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    ];
    function clipColor(idx) {
      return palette[idx % palette.length];
    }

    function getClipDuration(clip) {
      return (clip.endTime || clip.duration || 5) - (clip.startTime || 0);
    }

    function getClipStartOnTimeline(idx) {
      let start = 0;
      for (let i = 0; i < idx; i++) {
        start += getClipDuration(clips.value[i]);
        if (transitions.value[i]) {
          start -= transitions.value[i].duration || 0;
        }
      }
      return start;
    }

    function getTransition(idx) {
      return transitions.value[idx] || { type: 'cut', duration: 0.5 };
    }

    function setTransition(idx, value) {
      while (transitions.value.length <= idx) {
        transitions.value.push({ type: 'cut', duration: 0.5 });
      }
      transitions.value[idx] = value;
    }

    // ── Drag-drop reordering ─────────────────────────────────────────
    function onDragStart(idx) {
      dragFromIndex.value = idx;
    }

    function onDragOver(idx) {
      // visual feedback could go here
    }

    function onDrop(idx) {
      if (dragFromIndex.value < 0 || dragFromIndex.value === idx) return;
      const item = clips.value.splice(dragFromIndex.value, 1)[0];
      clips.value.splice(idx, 0, item);
      dragFromIndex.value = -1;
    }

    function removeClip(idx) {
      clips.value.splice(idx, 1);
      if (transitions.value.length > idx) {
        transitions.value.splice(idx, 1);
      }
    }

    // ── Overlays ─────────────────────────────────────────────────────
    function editOverlay(overlay) {
      editingOverlay.value = { ...overlay };
      showOverlayDialog.value = true;
    }

    function onOverlaySave(data) {
      const idx = overlays.value.findIndex((o) => o.id === data.id);
      if (idx >= 0) {
        overlays.value[idx] = data;
      } else {
        overlays.value.push(data);
      }
      editingOverlay.value = null;
    }

    function removeOverlay(id) {
      overlays.value = overlays.value.filter((o) => o.id !== id);
      editingOverlay.value = null;
    }

    // ── Timeline ─────────────────────────────────────────────────────
    const pixelsPerSecond = computed(() => zoomLevel.value * 40);
    const totalDuration = computed(() => {
      let dur = 0;
      for (const clip of clips.value) {
        dur += getClipDuration(clip);
      }
      for (const t of transitions.value) {
        dur -= t.duration || 0;
      }
      return Math.max(0, dur);
    });

    function timeToPixel(time) {
      return time * pixelsPerSecond.value;
    }

    const timeRulerTicks = computed(() => {
      const ticks = [];
      const step = Math.max(1, Math.round(5 / zoomLevel.value));
      for (let t = 0; t <= totalDuration.value + step; t += step) {
        ticks.push({ time: t });
      }
      return ticks;
    });

    function onTimelineClick(e) {
      if (!timelineContainer.value) return;
      const rect = timelineContainer.value.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineContainer.value.scrollLeft;
      const time = x / pixelsPerSecond.value;
      currentTime.value = Math.max(0, Math.min(totalDuration.value, time));
      if (previewPlayer.value) {
        previewPlayer.value.seekTo(currentTime.value);
      }
    }

    function onTimeUpdate(time) {
      currentTime.value = time;
      // Determine which clip is active
      let elapsed = 0;
      for (let i = 0; i < clips.value.length; i++) {
        const dur = getClipDuration(clips.value[i]);
        const transOverlap = i > 0 && transitions.value[i - 1]
          ? (transitions.value[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;
        if (time >= elapsed && time < elapsed + dur) {
          activeClipIndex.value = i;
          return;
        }
        elapsed += dur;
      }
      activeClipIndex.value = -1;
    }

    function onSeek(time) {
      currentTime.value = time;
    }

    // ── Export ────────────────────────────────────────────────────────
    function exportProject() {
      const exportData = {
        projectId: projectId.value,
        projectName: project.value?.name || 'Untitled',
        clips: clips.value,
        transitions: transitions.value,
        overlays: overlays.value,
        fps: fps.value,
        totalDuration: totalDuration.value,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `movie-project-${projectId.value}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.add({ severity: 'success', summary: 'Exported', detail: 'Project exported', life: 3000 });
    }

    // ── Helpers ───────────────────────────────────────────────────────
    function formatDuration(secs) {
      if (secs == null || isNaN(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    // ── Load project data ────────────────────────────────────────────
    async function loadProject() {
      try {
        await store.dispatch('FilmProject/' + actions.GET_PRODUCTION, projectId.value);
        await store.dispatch('FilmProject/' + actions.GET_SEQUENCES, projectId.value);

        // Load shots for all sequences and build clips
        const seqs = store.getters['FilmProject/sequencesByProject'](projectId.value);
        for (const seq of seqs) {
          await store.dispatch('FilmProject/' + actions.GET_SHOTS, {
            projectId: projectId.value,
            sequenceId: seq.id,
          });
        }

        // Build clips from shots
        const shots = store.getters['FilmProject/shots'];
        clips.value = shots
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((shot) => ({
            id: shot.id,
            name: shot.name || 'Untitled Shot',
            url: shot.sceneData?.videoUrl || '',
            duration: shot.duration || 5,
            startTime: 0,
            endTime: shot.duration || 5,
          }));

        // Initialize default transitions
        transitions.value = clips.value.slice(0, -1).map(() => ({
          type: 'cut',
          duration: 0.5,
        }));
      } catch (error) {
        console.error('Error loading project for editor:', error);
      }
    }

    onMounted(() => {
      loadProject();
    });

    return {
      projectId,
      project,
      isLoading,
      previewPlayer,
      timelineContainer,
      currentTime,
      zoomLevel,
      fps,
      clips,
      transitions,
      overlays,
      showOverlayDialog,
      editingOverlay,
      activeClipIndex,
      totalDuration,
      pixelsPerSecond,
      timeRulerTicks,
      clipColor,
      getClipDuration,
      getClipStartOnTimeline,
      getTransition,
      setTransition,
      onDragStart,
      onDragOver,
      onDrop,
      removeClip,
      editOverlay,
      onOverlaySave,
      removeOverlay,
      timeToPixel,
      onTimelineClick,
      onTimeUpdate,
      onSeek,
      exportProject,
      formatDuration,
    };
  },
};
</script>

<style scoped>
.movie-editor-page {
  padding: 0.5rem;
}

.clip-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.clip-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.15s;
}

.clip-item:hover {
  background: var(--surface-hover);
}

.clip-item--active {
  background: var(--primary-50);
  border-left: 3px solid var(--primary-color);
}

.clip-thumbnail {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
}

.transition-slot {
  display: flex;
  align-items: center;
  padding: 0.25rem 0 0.25rem 2.5rem;
}

.cursor-move {
  cursor: move;
}

/* Timeline */
.timeline-container {
  position: relative;
  overflow-x: auto;
  min-height: 120px;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding-top: 24px;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  border-bottom: 1px solid var(--surface-border);
}

.timeline-tick {
  position: absolute;
  top: 0;
  height: 20px;
  border-left: 1px solid var(--surface-300);
  padding-left: 4px;
}

.timeline-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--red-500);
  z-index: 20;
  pointer-events: none;
}

.timeline-playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -5px;
  width: 12px;
  height: 12px;
  background: var(--red-500);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.timeline-track {
  position: relative;
  height: 40px;
  margin: 4px 0;
  cursor: pointer;
}

.timeline-track--overlays {
  height: 30px;
}

.timeline-clip {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.timeline-clip:hover {
  opacity: 1;
}

.timeline-clip-label {
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.timeline-overlay {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid var(--primary-300);
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  overflow: hidden;
}

.timeline-overlay:hover {
  background: rgba(255, 255, 255, 0.3);
}

.timeline-overlay-label {
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-700);
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>

  <div class="movie-editor-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else class="grid">
      <!-- Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <Button
                icon="pi pi-arrow-left"
                class="p-button-text"
                @click="$router.push({ name: 'project-detail', params: { id: projectId } })"
                v-tooltip.top="'Back to Project'"
              />
              <div>
                <h3 class="m-0">Movie Editor</h3>
                <p class="text-color-secondary mt-1 mb-0">
                  {{ project?.name || 'Untitled Project' }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                label="Add Text Overlay"
                icon="pi pi-comment"
                class="p-button-outlined"
                @click="showOverlayDialog = true"
              />
              <Button
                label="Export"
                icon="pi pi-download"
                class="p-button-success"
                @click="exportProject"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview + Scene List -->
      <div class="col-12 lg:col-7">
        <Card>
          <template #content>
            <PreviewPlayer
              ref="previewPlayer"
              :clips="clips"
              :overlays="overlays"
              :transitions="transitions"
              :fps="fps"
              @time-update="onTimeUpdate"
              @seek="onSeek"
            />
          </template>
        </Card>
      </div>

      <!-- Scenes / Clips panel -->
      <div class="col-12 lg:col-5">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Scenes</span>
              <Tag :value="clips.length + ' clips'" severity="info" />
            </div>
          </template>
          <template #content>
            <div v-if="clips.length === 0" class="text-center p-4">
              <i class="pi pi-film text-4xl text-500 mb-3" style="display:block" />
              <p class="text-500">No clips yet. Add scenes from your project sequences.</p>
            </div>

            <div v-else class="clip-list">
              <div
                v-for="(clip, idx) in clips"
                :key="clip.id"
                class="clip-item"
                :class="{ 'clip-item--active': activeClipIndex === idx }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
              >
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-bars text-500 cursor-move" />
                  <div
                    class="clip-thumbnail"
                    :style="{ background: clipColor(idx) }"
                  >
                    <i class="pi pi-video" />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-sm">{{ clip.name }}</div>
                    <div class="text-xs text-500">{{ formatDuration(getClipDuration(clip)) }}</div>
                  </div>
                  <Button
                    icon="pi pi-times"
                    class="p-button-text p-button-sm p-button-danger"
                    @click="removeClip(idx)"
                  />
                </div>

                <!-- Transition between clips -->
                <div v-if="idx < clips.length - 1" class="transition-slot">
                  <TransitionPicker
                    :modelValue="getTransition(idx)"
                    @update:modelValue="setTransition(idx, $event)"
                  />
                  <span class="text-xs text-500 ml-2">{{ getTransition(idx).type }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Overlays list -->
        <Card class="mt-3" v-if="overlays.length > 0">
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Text Overlays</span>
              <Tag :value="overlays.length + ''" severity="info" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-column gap-2">
              <div
                v-for="overlay in overlays"
                :key="overlay.id"
                class="overlay-item flex align-items-center justify-content-between p-2 border-round surface-ground"
              >
                <div>
                  <div class="font-semibold text-sm">{{ overlay.text }}</div>
                  <div class="text-xs text-500">
                    {{ formatDuration(overlay.startTime) }} — {{ formatDuration(overlay.startTime + overlay.duration) }}
                    · {{ overlay.animationIn }}
                  </div>
                </div>
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editOverlay(overlay)" />
                  <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="removeOverlay(overlay.id)" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Timeline -->
      <div class="col-12">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Timeline</span>
              <div class="flex align-items-center gap-2">
                <span class="text-xs text-500 font-mono">{{ formatDuration(currentTime) }}</span>
                <Slider v-model="zoomLevel" :min="1" :max="10" :step="0.5" style="width:120px" />
                <span class="text-xs text-500">Zoom</span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="timeline-container" ref="timelineContainer">
              <!-- Time ruler -->
              <div class="timeline-ruler">
                <div
                  v-for="tick in timeRulerTicks"
                  :key="tick.time"
                  class="timeline-tick"
                  :style="{ left: timeToPixel(tick.time) + 'px' }"
                >
                  <span class="text-xs text-500">{{ formatDuration(tick.time) }}</span>
                </div>
              </div>

              <!-- Playhead -->
              <div
                class="timeline-playhead"
                :style="{ left: timeToPixel(currentTime) + 'px' }"
              />

              <!-- Clip track -->
              <div class="timeline-track" @click="onTimelineClick">
                <div
                  v-for="(clip, idx) in clips"
                  :key="clip.id"
                  class="timeline-clip"
                  :style="{
                    left: timeToPixel(getClipStartOnTimeline(idx)) + 'px',
                    width: timeToPixel(getClipDuration(clip)) + 'px',
                    background: clipColor(idx),
                  }"
                  :title="clip.name"
                >
                  <span class="timeline-clip-label">{{ clip.name }}</span>
                </div>
              </div>

              <!-- Overlay track -->
              <div class="timeline-track timeline-track--overlays" @click="onTimelineClick">
                <div
                  v-for="overlay in overlays"
                  :key="overlay.id"
                  class="timeline-overlay"
                  :style="{
                    left: timeToPixel(overlay.startTime) + 'px',
                    width: timeToPixel(overlay.duration) + 'px',
                  }"
                  @click.stop="editOverlay(overlay)"
                >
                  <span class="timeline-overlay-label">{{ overlay.text }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Text Overlay Editor Dialog -->
    <TextOverlayEditor
      v-model:visible="showOverlayDialog"
      :overlay="editingOverlay"
      @save="onOverlaySave"
      @delete="removeOverlay"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Slider from 'primevue/slider';
import ProgressSpinner from 'primevue/progressspinner';

import PreviewPlayer from '@/components/movie-editor/PreviewPlayer.vue';
import TransitionPicker from '@/components/movie-editor/TransitionPicker.vue';
import TextOverlayEditor from '@/components/movie-editor/TextOverlayEditor.vue';

import * as actions from '@/store/modules/film-project/types/actions';

export default {
  name: 'MovieEditor',
  components: {
    Card,
    Button,
    Tag,
    Slider,
    ProgressSpinner,
    PreviewPlayer,
    TransitionPicker,
    TextOverlayEditor,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const projectId = computed(() => route.params.id);
    const project = computed(() => store.getters['FilmProject/project']);
    const isLoading = computed(() => store.getters['FilmProject/isLoading']);
    const sequences = computed(() =>
      store.getters['FilmProject/sequencesByProject'](projectId.value)
    );
    const allShots = computed(() => store.getters['FilmProject/shots']);

    const previewPlayer = ref(null);
    const timelineContainer = ref(null);
    const currentTime = ref(0);
    const zoomLevel = ref(3);
    const fps = ref(30);
    const dragFromIndex = ref(-1);
    const activeClipIndex = ref(-1);

    // ── Clips (derived from project shots) ───────────────────────────
    const clips = ref([]);
    const transitions = ref([]);
    const overlays = ref([]);

    const showOverlayDialog = ref(false);
    const editingOverlay = ref(null);

    // ── Clip colours ─────────────────────────────────────────────────
    const palette = [
      '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    ];
    function clipColor(idx) {
      return palette[idx % palette.length];
    }

    function getClipDuration(clip) {
      return (clip.endTime || clip.duration || 5) - (clip.startTime || 0);
    }

    function getClipStartOnTimeline(idx) {
      let start = 0;
      for (let i = 0; i < idx; i++) {
        start += getClipDuration(clips.value[i]);
        if (transitions.value[i]) {
          start -= transitions.value[i].duration || 0;
        }
      }
      return start;
    }

    function getTransition(idx) {
      return transitions.value[idx] || { type: 'cut', duration: 0.5 };
    }

    function setTransition(idx, value) {
      while (transitions.value.length <= idx) {
        transitions.value.push({ type: 'cut', duration: 0.5 });
      }
      transitions.value[idx] = value;
    }

    // ── Drag-drop reordering ─────────────────────────────────────────
    function onDragStart(idx) {
      dragFromIndex.value = idx;
    }

    function onDragOver(idx) {
      // visual feedback could go here
    }

    function onDrop(idx) {
      if (dragFromIndex.value < 0 || dragFromIndex.value === idx) return;
      const item = clips.value.splice(dragFromIndex.value, 1)[0];
      clips.value.splice(idx, 0, item);
      dragFromIndex.value = -1;
    }

    function removeClip(idx) {
      clips.value.splice(idx, 1);
      if (transitions.value.length > idx) {
        transitions.value.splice(idx, 1);
      }
    }

    // ── Overlays ─────────────────────────────────────────────────────
    function editOverlay(overlay) {
      editingOverlay.value = { ...overlay };
      showOverlayDialog.value = true;
    }

    function onOverlaySave(data) {
      const idx = overlays.value.findIndex((o) => o.id === data.id);
      if (idx >= 0) {
        overlays.value[idx] = data;
      } else {
        overlays.value.push(data);
      }
      editingOverlay.value = null;
    }

    function removeOverlay(id) {
      overlays.value = overlays.value.filter((o) => o.id !== id);
      editingOverlay.value = null;
    }

    // ── Timeline ─────────────────────────────────────────────────────
    const pixelsPerSecond = computed(() => zoomLevel.value * 40);
    const totalDuration = computed(() => {
      let dur = 0;
      for (const clip of clips.value) {
        dur += getClipDuration(clip);
      }
      for (const t of transitions.value) {
        dur -= t.duration || 0;
      }
      return Math.max(0, dur);
    });

    function timeToPixel(time) {
      return time * pixelsPerSecond.value;
    }

    const timeRulerTicks = computed(() => {
      const ticks = [];
      const step = Math.max(1, Math.round(5 / zoomLevel.value));
      for (let t = 0; t <= totalDuration.value + step; t += step) {
        ticks.push({ time: t });
      }
      return ticks;
    });

    function onTimelineClick(e) {
      if (!timelineContainer.value) return;
      const rect = timelineContainer.value.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineContainer.value.scrollLeft;
      const time = x / pixelsPerSecond.value;
      currentTime.value = Math.max(0, Math.min(totalDuration.value, time));
      if (previewPlayer.value) {
        previewPlayer.value.seekTo(currentTime.value);
      }
    }

    function onTimeUpdate(time) {
      currentTime.value = time;
      // Determine which clip is active
      let elapsed = 0;
      for (let i = 0; i < clips.value.length; i++) {
        const dur = getClipDuration(clips.value[i]);
        const transOverlap = i > 0 && transitions.value[i - 1]
          ? (transitions.value[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;
        if (time >= elapsed && time < elapsed + dur) {
          activeClipIndex.value = i;
          return;
        }
        elapsed += dur;
      }
      activeClipIndex.value = -1;
    }

    function onSeek(time) {
      currentTime.value = time;
    }

    // ── Export ────────────────────────────────────────────────────────
    function exportProject() {
      const exportData = {
        projectId: projectId.value,
        projectName: project.value?.name || 'Untitled',
        clips: clips.value,
        transitions: transitions.value,
        overlays: overlays.value,
        fps: fps.value,
        totalDuration: totalDuration.value,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `movie-project-${projectId.value}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.add({ severity: 'success', summary: 'Exported', detail: 'Project exported', life: 3000 });
    }

    // ── Helpers ───────────────────────────────────────────────────────
    function formatDuration(secs) {
      if (secs == null || isNaN(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    // ── Load project data ────────────────────────────────────────────
    async function loadProject() {
      try {
        await store.dispatch('FilmProject/' + actions.GET_PRODUCTION, projectId.value);
        await store.dispatch('FilmProject/' + actions.GET_SEQUENCES, projectId.value);

        // Load shots for all sequences and build clips
        const seqs = store.getters['FilmProject/sequencesByProject'](projectId.value);
        for (const seq of seqs) {
          await store.dispatch('FilmProject/' + actions.GET_SHOTS, {
            projectId: projectId.value,
            sequenceId: seq.id,
          });
        }

        // Build clips from shots
        const shots = store.getters['FilmProject/shots'];
        clips.value = shots
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((shot) => ({
            id: shot.id,
            name: shot.name || 'Untitled Shot',
            url: shot.sceneData?.videoUrl || '',
            duration: shot.duration || 5,
            startTime: 0,
            endTime: shot.duration || 5,
          }));

        // Initialize default transitions
        transitions.value = clips.value.slice(0, -1).map(() => ({
          type: 'cut',
          duration: 0.5,
        }));
      } catch (error) {
        console.error('Error loading project for editor:', error);
      }
    }

    onMounted(() => {
      loadProject();
    });

    return {
      projectId,
      project,
      isLoading,
      previewPlayer,
      timelineContainer,
      currentTime,
      zoomLevel,
      fps,
      clips,
      transitions,
      overlays,
      showOverlayDialog,
      editingOverlay,
      activeClipIndex,
      totalDuration,
      pixelsPerSecond,
      timeRulerTicks,
      clipColor,
      getClipDuration,
      getClipStartOnTimeline,
      getTransition,
      setTransition,
      onDragStart,
      onDragOver,
      onDrop,
      removeClip,
      editOverlay,
      onOverlaySave,
      removeOverlay,
      timeToPixel,
      onTimelineClick,
      onTimeUpdate,
      onSeek,
      exportProject,
      formatDuration,
    };
  },
};
</script>

<style scoped>
.movie-editor-page {
  padding: 0.5rem;
}

.clip-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.clip-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.15s;
}

.clip-item:hover {
  background: var(--surface-hover);
}

.clip-item--active {
  background: var(--primary-50);
  border-left: 3px solid var(--primary-color);
}

.clip-thumbnail {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
}

.transition-slot {
  display: flex;
  align-items: center;
  padding: 0.25rem 0 0.25rem 2.5rem;
}

.cursor-move {
  cursor: move;
}

/* Timeline */
.timeline-container {
  position: relative;
  overflow-x: auto;
  min-height: 120px;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding-top: 24px;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  border-bottom: 1px solid var(--surface-border);
}

.timeline-tick {
  position: absolute;
  top: 0;
  height: 20px;
  border-left: 1px solid var(--surface-300);
  padding-left: 4px;
}

.timeline-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--red-500);
  z-index: 20;
  pointer-events: none;
}

.timeline-playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -5px;
  width: 12px;
  height: 12px;
  background: var(--red-500);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.timeline-track {
  position: relative;
  height: 40px;
  margin: 4px 0;
  cursor: pointer;
}

.timeline-track--overlays {
  height: 30px;
}

.timeline-clip {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.timeline-clip:hover {
  opacity: 1;
}

.timeline-clip-label {
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.timeline-overlay {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid var(--primary-300);
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  overflow: hidden;
}

.timeline-overlay:hover {
  background: rgba(255, 255, 255, 0.3);
}

.timeline-overlay-label {
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-700);
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>

  <div class="movie-editor-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else class="grid">
      <!-- Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <Button
                icon="pi pi-arrow-left"
                class="p-button-text"
                @click="$router.push({ name: 'project-detail', params: { id: projectId } })"
                v-tooltip.top="'Back to Project'"
              />
              <div>
                <h3 class="m-0">Movie Editor</h3>
                <p class="text-color-secondary mt-1 mb-0">
                  {{ project?.name || 'Untitled Project' }}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                label="Add Text Overlay"
                icon="pi pi-comment"
                class="p-button-outlined"
                @click="showOverlayDialog = true"
              />
              <Button
                label="Export"
                icon="pi pi-download"
                class="p-button-success"
                @click="exportProject"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Preview + Scene List -->
      <div class="col-12 lg:col-7">
        <Card>
          <template #content>
            <PreviewPlayer
              ref="previewPlayer"
              :clips="clips"
              :overlays="overlays"
              :transitions="transitions"
              :fps="fps"
              @time-update="onTimeUpdate"
              @seek="onSeek"
            />
          </template>
        </Card>
      </div>

      <!-- Scenes / Clips panel -->
      <div class="col-12 lg:col-5">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Scenes</span>
              <Tag :value="clips.length + ' clips'" severity="info" />
            </div>
          </template>
          <template #content>
            <div v-if="clips.length === 0" class="text-center p-4">
              <i class="pi pi-film text-4xl text-500 mb-3" style="display:block" />
              <p class="text-500">No clips yet. Add scenes from your project sequences.</p>
            </div>

            <div v-else class="clip-list">
              <div
                v-for="(clip, idx) in clips"
                :key="clip.id"
                class="clip-item"
                :class="{ 'clip-item--active': activeClipIndex === idx }"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @drop="onDrop(idx)"
              >
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-bars text-500 cursor-move" />
                  <div
                    class="clip-thumbnail"
                    :style="{ background: clipColor(idx) }"
                  >
                    <i class="pi pi-video" />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold text-sm">{{ clip.name }}</div>
                    <div class="text-xs text-500">{{ formatDuration(getClipDuration(clip)) }}</div>
                  </div>
                  <Button
                    icon="pi pi-times"
                    class="p-button-text p-button-sm p-button-danger"
                    @click="removeClip(idx)"
                  />
                </div>

                <!-- Transition between clips -->
                <div v-if="idx < clips.length - 1" class="transition-slot">
                  <TransitionPicker
                    :modelValue="getTransition(idx)"
                    @update:modelValue="setTransition(idx, $event)"
                  />
                  <span class="text-xs text-500 ml-2">{{ getTransition(idx).type }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Overlays list -->
        <Card class="mt-3" v-if="overlays.length > 0">
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Text Overlays</span>
              <Tag :value="overlays.length + ''" severity="info" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-column gap-2">
              <div
                v-for="overlay in overlays"
                :key="overlay.id"
                class="overlay-item flex align-items-center justify-content-between p-2 border-round surface-ground"
              >
                <div>
                  <div class="font-semibold text-sm">{{ overlay.text }}</div>
                  <div class="text-xs text-500">
                    {{ formatDuration(overlay.startTime) }} — {{ formatDuration(overlay.startTime + overlay.duration) }}
                    · {{ overlay.animationIn }}
                  </div>
                </div>
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" class="p-button-text p-button-sm" @click="editOverlay(overlay)" />
                  <Button icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" @click="removeOverlay(overlay.id)" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Timeline -->
      <div class="col-12">
        <Card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>Timeline</span>
              <div class="flex align-items-center gap-2">
                <span class="text-xs text-500 font-mono">{{ formatDuration(currentTime) }}</span>
                <Slider v-model="zoomLevel" :min="1" :max="10" :step="0.5" style="width:120px" />
                <span class="text-xs text-500">Zoom</span>
              </div>
            </div>
          </template>
          <template #content>
            <div class="timeline-container" ref="timelineContainer">
              <!-- Time ruler -->
              <div class="timeline-ruler">
                <div
                  v-for="tick in timeRulerTicks"
                  :key="tick.time"
                  class="timeline-tick"
                  :style="{ left: timeToPixel(tick.time) + 'px' }"
                >
                  <span class="text-xs text-500">{{ formatDuration(tick.time) }}</span>
                </div>
              </div>

              <!-- Playhead -->
              <div
                class="timeline-playhead"
                :style="{ left: timeToPixel(currentTime) + 'px' }"
              />

              <!-- Clip track -->
              <div class="timeline-track" @click="onTimelineClick">
                <div
                  v-for="(clip, idx) in clips"
                  :key="clip.id"
                  class="timeline-clip"
                  :style="{
                    left: timeToPixel(getClipStartOnTimeline(idx)) + 'px',
                    width: timeToPixel(getClipDuration(clip)) + 'px',
                    background: clipColor(idx),
                  }"
                  :title="clip.name"
                >
                  <span class="timeline-clip-label">{{ clip.name }}</span>
                </div>
              </div>

              <!-- Overlay track -->
              <div class="timeline-track timeline-track--overlays" @click="onTimelineClick">
                <div
                  v-for="overlay in overlays"
                  :key="overlay.id"
                  class="timeline-overlay"
                  :style="{
                    left: timeToPixel(overlay.startTime) + 'px',
                    width: timeToPixel(overlay.duration) + 'px',
                  }"
                  @click.stop="editOverlay(overlay)"
                >
                  <span class="timeline-overlay-label">{{ overlay.text }}</span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Text Overlay Editor Dialog -->
    <TextOverlayEditor
      v-model:visible="showOverlayDialog"
      :overlay="editingOverlay"
      @save="onOverlaySave"
      @delete="removeOverlay"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Slider from 'primevue/slider';
import ProgressSpinner from 'primevue/progressspinner';

import PreviewPlayer from '@/components/movie-editor/PreviewPlayer.vue';
import TransitionPicker from '@/components/movie-editor/TransitionPicker.vue';
import TextOverlayEditor from '@/components/movie-editor/TextOverlayEditor.vue';

import * as actions from '@/store/modules/film-project/types/actions';

export default {
  name: 'MovieEditor',
  components: {
    Card,
    Button,
    Tag,
    Slider,
    ProgressSpinner,
    PreviewPlayer,
    TransitionPicker,
    TextOverlayEditor,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const projectId = computed(() => route.params.id);
    const project = computed(() => store.getters['FilmProject/project']);
    const isLoading = computed(() => store.getters['FilmProject/isLoading']);
    const sequences = computed(() =>
      store.getters['FilmProject/sequencesByProject'](projectId.value)
    );
    const allShots = computed(() => store.getters['FilmProject/shots']);

    const previewPlayer = ref(null);
    const timelineContainer = ref(null);
    const currentTime = ref(0);
    const zoomLevel = ref(3);
    const fps = ref(30);
    const dragFromIndex = ref(-1);
    const activeClipIndex = ref(-1);

    // ── Clips (derived from project shots) ───────────────────────────
    const clips = ref([]);
    const transitions = ref([]);
    const overlays = ref([]);

    const showOverlayDialog = ref(false);
    const editingOverlay = ref(null);

    // ── Clip colours ─────────────────────────────────────────────────
    const palette = [
      '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    ];
    function clipColor(idx) {
      return palette[idx % palette.length];
    }

    function getClipDuration(clip) {
      return (clip.endTime || clip.duration || 5) - (clip.startTime || 0);
    }

    function getClipStartOnTimeline(idx) {
      let start = 0;
      for (let i = 0; i < idx; i++) {
        start += getClipDuration(clips.value[i]);
        if (transitions.value[i]) {
          start -= transitions.value[i].duration || 0;
        }
      }
      return start;
    }

    function getTransition(idx) {
      return transitions.value[idx] || { type: 'cut', duration: 0.5 };
    }

    function setTransition(idx, value) {
      while (transitions.value.length <= idx) {
        transitions.value.push({ type: 'cut', duration: 0.5 });
      }
      transitions.value[idx] = value;
    }

    // ── Drag-drop reordering ─────────────────────────────────────────
    function onDragStart(idx) {
      dragFromIndex.value = idx;
    }

    function onDragOver(idx) {
      // visual feedback could go here
    }

    function onDrop(idx) {
      if (dragFromIndex.value < 0 || dragFromIndex.value === idx) return;
      const item = clips.value.splice(dragFromIndex.value, 1)[0];
      clips.value.splice(idx, 0, item);
      dragFromIndex.value = -1;
    }

    function removeClip(idx) {
      clips.value.splice(idx, 1);
      if (transitions.value.length > idx) {
        transitions.value.splice(idx, 1);
      }
    }

    // ── Overlays ─────────────────────────────────────────────────────
    function editOverlay(overlay) {
      editingOverlay.value = { ...overlay };
      showOverlayDialog.value = true;
    }

    function onOverlaySave(data) {
      const idx = overlays.value.findIndex((o) => o.id === data.id);
      if (idx >= 0) {
        overlays.value[idx] = data;
      } else {
        overlays.value.push(data);
      }
      editingOverlay.value = null;
    }

    function removeOverlay(id) {
      overlays.value = overlays.value.filter((o) => o.id !== id);
      editingOverlay.value = null;
    }

    // ── Timeline ─────────────────────────────────────────────────────
    const pixelsPerSecond = computed(() => zoomLevel.value * 40);
    const totalDuration = computed(() => {
      let dur = 0;
      for (const clip of clips.value) {
        dur += getClipDuration(clip);
      }
      for (const t of transitions.value) {
        dur -= t.duration || 0;
      }
      return Math.max(0, dur);
    });

    function timeToPixel(time) {
      return time * pixelsPerSecond.value;
    }

    const timeRulerTicks = computed(() => {
      const ticks = [];
      const step = Math.max(1, Math.round(5 / zoomLevel.value));
      for (let t = 0; t <= totalDuration.value + step; t += step) {
        ticks.push({ time: t });
      }
      return ticks;
    });

    function onTimelineClick(e) {
      if (!timelineContainer.value) return;
      const rect = timelineContainer.value.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineContainer.value.scrollLeft;
      const time = x / pixelsPerSecond.value;
      currentTime.value = Math.max(0, Math.min(totalDuration.value, time));
      if (previewPlayer.value) {
        previewPlayer.value.seekTo(currentTime.value);
      }
    }

    function onTimeUpdate(time) {
      currentTime.value = time;
      // Determine which clip is active
      let elapsed = 0;
      for (let i = 0; i < clips.value.length; i++) {
        const dur = getClipDuration(clips.value[i]);
        const transOverlap = i > 0 && transitions.value[i - 1]
          ? (transitions.value[i - 1].duration || 0) : 0;
        elapsed -= transOverlap;
        if (time >= elapsed && time < elapsed + dur) {
          activeClipIndex.value = i;
          return;
        }
        elapsed += dur;
      }
      activeClipIndex.value = -1;
    }

    function onSeek(time) {
      currentTime.value = time;
    }

    // ── Export ────────────────────────────────────────────────────────
    function exportProject() {
      const exportData = {
        projectId: projectId.value,
        projectName: project.value?.name || 'Untitled',
        clips: clips.value,
        transitions: transitions.value,
        overlays: overlays.value,
        fps: fps.value,
        totalDuration: totalDuration.value,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `movie-project-${projectId.value}-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.add({ severity: 'success', summary: 'Exported', detail: 'Project exported', life: 3000 });
    }

    // ── Helpers ───────────────────────────────────────────────────────
    function formatDuration(secs) {
      if (secs == null || isNaN(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    }

    // ── Load project data ────────────────────────────────────────────
    async function loadProject() {
      try {
        await store.dispatch('FilmProject/' + actions.GET_PRODUCTION, projectId.value);
        await store.dispatch('FilmProject/' + actions.GET_SEQUENCES, projectId.value);

        // Load shots for all sequences and build clips
        const seqs = store.getters['FilmProject/sequencesByProject'](projectId.value);
        for (const seq of seqs) {
          await store.dispatch('FilmProject/' + actions.GET_SHOTS, {
            projectId: projectId.value,
            sequenceId: seq.id,
          });
        }

        // Build clips from shots
        const shots = store.getters['FilmProject/shots'];
        clips.value = shots
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((shot) => ({
            id: shot.id,
            name: shot.name || 'Untitled Shot',
            url: shot.sceneData?.videoUrl || '',
            duration: shot.duration || 5,
            startTime: 0,
            endTime: shot.duration || 5,
          }));

        // Initialize default transitions
        transitions.value = clips.value.slice(0, -1).map(() => ({
          type: 'cut',
          duration: 0.5,
        }));
      } catch (error) {
        console.error('Error loading project for editor:', error);
      }
    }

    onMounted(() => {
      loadProject();
    });

    return {
      projectId,
      project,
      isLoading,
      previewPlayer,
      timelineContainer,
      currentTime,
      zoomLevel,
      fps,
      clips,
      transitions,
      overlays,
      showOverlayDialog,
      editingOverlay,
      activeClipIndex,
      totalDuration,
      pixelsPerSecond,
      timeRulerTicks,
      clipColor,
      getClipDuration,
      getClipStartOnTimeline,
      getTransition,
      setTransition,
      onDragStart,
      onDragOver,
      onDrop,
      removeClip,
      editOverlay,
      onOverlaySave,
      removeOverlay,
      timeToPixel,
      onTimelineClick,
      onTimeUpdate,
      onSeek,
      exportProject,
      formatDuration,
    };
  },
};
</script>

<style scoped>
.movie-editor-page {
  padding: 0.5rem;
}

.clip-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.clip-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  transition: background 0.15s;
}

.clip-item:hover {
  background: var(--surface-hover);
}

.clip-item--active {
  background: var(--primary-50);
  border-left: 3px solid var(--primary-color);
}

.clip-thumbnail {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
}

.transition-slot {
  display: flex;
  align-items: center;
  padding: 0.25rem 0 0.25rem 2.5rem;
}

.cursor-move {
  cursor: move;
}

/* Timeline */
.timeline-container {
  position: relative;
  overflow-x: auto;
  min-height: 120px;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding-top: 24px;
}

.timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  border-bottom: 1px solid var(--surface-border);
}

.timeline-tick {
  position: absolute;
  top: 0;
  height: 20px;
  border-left: 1px solid var(--surface-300);
  padding-left: 4px;
}

.timeline-playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--red-500);
  z-index: 20;
  pointer-events: none;
}

.timeline-playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -5px;
  width: 12px;
  height: 12px;
  background: var(--red-500);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.timeline-track {
  position: relative;
  height: 40px;
  margin: 4px 0;
  cursor: pointer;
}

.timeline-track--overlays {
  height: 30px;
}

.timeline-clip {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  overflow: hidden;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.timeline-clip:hover {
  opacity: 1;
}

.timeline-clip-label {
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.timeline-overlay {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid var(--primary-300);
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  overflow: hidden;
}

.timeline-overlay:hover {
  background: rgba(255, 255, 255, 0.3);
}

.timeline-overlay-label {
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-700);
}

.font-mono {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>

