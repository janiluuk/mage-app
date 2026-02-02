<template>
  <div class="shot-detail-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else-if="shot" class="grid">
      <!-- Shot Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-start mb-4">
            <div class="flex align-items-center gap-3">
              <Button 
                icon="pi pi-arrow-left" 
                class="p-button-text"
                @click="$router.push({ 
                  name: 'sequence-detail', 
                  params: { 
                    productionId: productionId, 
                    sequenceId: sequenceId 
                  } 
                })"
                v-tooltip.top="'Back to Sequence'"
              />
              <div>
                <h2 class="text-3xl font-bold m-0">{{ shot.name }}</h2>
                <p class="text-500 mt-2">{{ shot.description || 'No description' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button 
                label="Generate Scene" 
                icon="pi pi-magic" 
                class="p-button-primary"
                @click="showSceneDialog = true"
              />
              <Button 
                label="Edit" 
                icon="pi pi-pencil" 
                @click="editShot"
              />
            </div>
          </div>

          <div class="flex gap-3 mb-4">
            <span class="text-500">Duration: {{ shot.duration || 'N/A' }}s</span>
            <span class="text-500">Order: {{ shot.order || 'N/A' }}</span>
          </div>
        </div>
      </div>

      <!-- Generated Scene -->
      <div class="col-12" v-if="shot.sceneData">
        <div class="card">
          <h3 class="text-2xl font-semibold mb-4">Generated Scene</h3>
          <div class="grid">
            <div class="col-12 md:col-6" v-if="shot.sceneData.videoUrl">
              <div class="video-preview">
                <video 
                  :src="shot.sceneData.videoUrl" 
                  controls 
                  class="w-full border-round"
                  style="max-height: 400px;"
                />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="p-3 border-round surface-ground">
                <h4 class="font-semibold mb-2">Scene Details</h4>
                <div class="flex flex-column gap-2">
                  <div v-if="shot.sceneData.prompt">
                    <strong>Prompt:</strong>
                    <p class="text-500 mt-1">{{ shot.sceneData.prompt }}</p>
                  </div>
                  <div v-if="shot.sceneData.style">
                    <strong>Style:</strong>
                    <Tag :value="shot.sceneData.style" class="ml-2" />
                  </div>
                  <div v-if="shot.sceneData.resolution">
                    <strong>Resolution:</strong>
                    <span class="text-500 ml-2">{{ shot.sceneData.resolution }}</span>
                  </div>
                  <div v-if="shot.sceneData.generatedAt">
                    <strong>Generated:</strong>
                    <span class="text-500 ml-2">{{ formatDate(shot.sceneData.generatedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scene Generation Prompt -->
      <div class="col-12" v-else>
        <div class="card">
          <div class="text-center p-6">
            <i class="pi pi-magic text-6xl text-500 mb-4" />
            <h3 class="text-2xl font-semibold mb-2">No Scene Generated Yet</h3>
            <p class="text-500 mb-4">Generate a scene for this shot using AI</p>
            <Button 
              label="Generate Scene" 
              icon="pi pi-magic" 
              class="p-button-primary"
              @click="showSceneDialog = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Scene Generation Dialog -->
    <Dialog 
      v-model:visible="showSceneDialog" 
      header="Generate Scene with AI" 
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="scene-prompt" class="font-semibold block mb-2">Prompt *</label>
          <Textarea 
            id="scene-prompt" 
            v-model="scenePrompt" 
            placeholder="Describe the scene: camera angles, lighting, mood, action, characters..."
            rows="6"
            autoResize
          />
        </div>

        <div class="field">
          <label for="scene-style" class="font-semibold block mb-2">Visual Style</label>
          <Dropdown 
            id="scene-style" 
            v-model="sceneOptions.style" 
            :options="sceneStyles"
            placeholder="Select style"
          />
        </div>

        <div class="field">
          <label for="scene-resolution" class="font-semibold block mb-2">Resolution</label>
          <Dropdown 
            id="scene-resolution" 
            v-model="sceneOptions.resolution" 
            :options="resolutions"
            placeholder="Select resolution"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showSceneDialog = false"
        />
        <Button 
          label="Generate Scene" 
          icon="pi pi-magic" 
          @click="generateScene"
          :loading="generatingScene"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import * as actions from '@/store/modules/film-production/types/actions';

const store = useStore();
const route = useRoute();
const router = useRouter();

const productionId = computed(() => route.params.productionId);
const sequenceId = computed(() => route.params.sequenceId);
const shotId = computed(() => route.params.shotId);
const shot = computed(() => store.getters['FilmProduction/shot']);
const isLoading = computed(() => store.getters['FilmProduction/isLoading']);

const showSceneDialog = ref(false);
const generatingScene = ref(false);

const sceneStyles = [
  { label: 'Realistic', value: 'realistic' },
  { label: 'Cinematic', value: 'cinematic' },
  { label: 'Animated', value: 'animated' },
  { label: 'Artistic', value: 'artistic' },
];

const resolutions = [
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
  { label: '4K', value: '4k' },
];

const scenePrompt = ref('');
const sceneOptions = ref({
  style: 'cinematic',
  resolution: '1080p',
});

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const editShot = () => {
  router.push({ 
    name: 'sequence-detail', 
    params: { 
      productionId: productionId.value, 
      sequenceId: sequenceId.value 
    } 
  });
};

const generateScene = async () => {
  if (!scenePrompt.value.trim()) return;

  generatingScene.value = true;
  try {
    const result = await store.dispatch('FilmProduction/' + actions.GENERATE_SCENE, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
      shotId: shotId.value,
      prompt: scenePrompt.value,
      options: sceneOptions.value,
    });
    
    // Update shot with generated scene data
    if (result?.sceneData) {
      await store.dispatch('FilmProduction/' + actions.UPDATE_SHOT, {
        productionId: productionId.value,
        sequenceId: sequenceId.value,
        shotId: shotId.value,
        data: { sceneData: result.sceneData },
      });
    }
    
    showSceneDialog.value = false;
    scenePrompt.value = '';
    await loadShot();
  } catch (error) {
    console.error('Error generating scene:', error);
  } finally {
    generatingScene.value = false;
  }
};

const loadShot = async () => {
  try {
    await store.dispatch('FilmProduction/' + actions.GET_SHOT, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
      shotId: shotId.value,
    });
  } catch (error) {
    console.error('Error loading shot:', error);
  }
};

onMounted(async () => {
  await loadShot();
  if (shot.value?.description) {
    scenePrompt.value = shot.value.description;
  }
});
</script>

<style scoped>
.shot-detail-page {
  padding: 1rem;
}

.video-preview {
  background: var(--surface-ground);
  border-radius: 8px;
  overflow: hidden;
}
</style>

