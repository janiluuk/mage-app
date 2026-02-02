<template>
  <div class="sequence-detail-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else-if="sequence" class="grid">
      <!-- Sequence Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-start mb-4">
            <div class="flex align-items-center gap-3">
              <Button 
                icon="pi pi-arrow-left" 
                class="p-button-text"
                @click="$router.push({ name: 'production-detail', params: { id: productionId } })"
                v-tooltip.top="'Back to Production'"
              />
              <div>
                <h2 class="text-3xl font-bold m-0">{{ sequence.name }}</h2>
                <p class="text-500 mt-2">{{ sequence.description || 'No description' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button 
                label="Edit" 
                icon="pi pi-pencil" 
                @click="editSequence"
              />
            </div>
          </div>

          <div class="mb-4" v-if="sequence.script">
            <h4 class="font-semibold mb-2">Script</h4>
            <div class="p-3 border-round surface-ground">
              <pre class="m-0 text-sm" style="white-space: pre-wrap;">{{ sequence.script }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Shots Section -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="text-2xl font-semibold m-0">Shots</h3>
            <Button 
              label="New Shot" 
              icon="pi pi-plus" 
              @click="showShotDialog = true"
            />
          </div>

          <DataTable 
            :value="shots" 
            :loading="isLoadingShots"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            :emptyMessage="'No shots found. Create your first shot!'"
          >
            <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
              <template #body="{ data }">
                <span class="font-semibold cursor-pointer" @click="viewShot(data.id)">
                  {{ data.name }}
                </span>
              </template>
            </Column>

            <Column field="description" header="Description" :sortable="true" style="min-width: 300px">
              <template #body="{ data }">
                <span class="text-500">{{ data.description || 'No description' }}</span>
              </template>
            </Column>

            <Column field="duration" header="Duration (s)" :sortable="true" style="min-width: 120px">
              <template #body="{ data }">
                <span>{{ data.duration || 'N/A' }}</span>
              </template>
            </Column>

            <Column field="order" header="Order" :sortable="true" style="min-width: 100px" />

            <Column header="Actions" style="min-width: 250px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text"
                    v-tooltip.top="'View Shot'"
                    @click="viewShot(data.id)"
                  />
                  <Button 
                    icon="pi pi-magic" 
                    class="p-button-rounded p-button-text"
                    v-tooltip.top="'Generate Scene'"
                    @click="openSceneDialog(data)"
                  />
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-text"
                    v-tooltip.top="'Edit Shot'"
                    @click="editShot(data)"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-text p-button-danger"
                    v-tooltip.top="'Delete Shot'"
                    @click="confirmDeleteShot(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Shot Dialog -->
    <Dialog 
      v-model:visible="showShotDialog" 
      :header="shotDialogTitle" 
      :modal="true"
      :style="{ width: '600px' }"
      @hide="resetShotForm"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="shot-name" class="font-semibold block mb-2">Shot Name *</label>
          <InputText 
            id="shot-name" 
            v-model="shotForm.name" 
            placeholder="Enter shot name"
            :class="{ 'p-invalid': !shotForm.name && shotSubmitted }"
          />
        </div>

        <div class="field">
          <label for="shot-description" class="font-semibold block mb-2">Description</label>
          <Textarea 
            id="shot-description" 
            v-model="shotForm.description" 
            placeholder="Enter shot description"
            rows="4"
            autoResize
          />
        </div>

        <div class="field">
          <label for="shot-duration" class="font-semibold block mb-2">Duration (seconds)</label>
          <InputNumber 
            id="shot-duration" 
            v-model="shotForm.duration" 
            :min="0.1"
            :max="300"
            :step="0.1"
          />
        </div>

        <div class="field">
          <label for="shot-order" class="font-semibold block mb-2">Order</label>
          <InputNumber 
            id="shot-order" 
            v-model="shotForm.order" 
            :min="1"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showShotDialog = false"
        />
        <Button 
          label="Save" 
          icon="pi pi-check" 
          @click="saveShot"
          :loading="savingShot"
        />
      </template>
    </Dialog>

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

    <!-- Delete Shot Confirmation -->
    <Dialog 
      v-model:visible="showDeleteShotDialog" 
      header="Confirm Delete" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex align-items-center gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
        <span>Are you sure you want to delete "{{ shotToDelete?.name }}"?</span>
      </div>
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showDeleteShotDialog = false"
        />
        <Button 
          label="Delete" 
          icon="pi pi-trash" 
          class="p-button-danger" 
          @click="deleteShot"
          :loading="deletingShot"
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
const sequence = computed(() => store.getters['FilmProduction/sequence']);
const shots = computed(() => 
  store.getters['FilmProduction/shotsBySequence'](sequenceId.value)
);
const isLoading = computed(() => store.getters['FilmProduction/isLoading']);

const showShotDialog = ref(false);
const showSceneDialog = ref(false);
const showDeleteShotDialog = ref(false);
const shotSubmitted = ref(false);
const savingShot = ref(false);
const deletingShot = ref(false);
const generatingScene = ref(false);
const editingShotId = ref(null);
const shotToDelete = ref(null);
const currentShotForScene = ref(null);

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

const shotForm = ref({
  name: '',
  description: '',
  duration: 5,
  order: 1,
});

const scenePrompt = ref('');
const sceneOptions = ref({
  style: 'cinematic',
  resolution: '1080p',
});

const shotDialogTitle = computed(() => 
  editingShotId.value ? 'Edit Shot' : 'New Shot'
);

const resetShotForm = () => {
  shotForm.value = {
    name: '',
    description: '',
    duration: 5,
    order: shots.value.length + 1,
  };
  shotSubmitted.value = false;
  editingShotId.value = null;
};

const editShot = (shot) => {
  editingShotId.value = shot.id;
  shotForm.value = {
    name: shot.name || '',
    description: shot.description || '',
    duration: shot.duration || 5,
    order: shot.order || 1,
  };
  showShotDialog.value = true;
};

const saveShot = async () => {
  shotSubmitted.value = true;
  if (!shotForm.value.name) return;

  savingShot.value = true;
  try {
    if (editingShotId.value) {
      await store.dispatch('FilmProduction/' + actions.UPDATE_SHOT, {
        productionId: productionId.value,
        sequenceId: sequenceId.value,
        shotId: editingShotId.value,
        data: shotForm.value,
      });
    } else {
      await store.dispatch('FilmProduction/' + actions.CREATE_SHOT, {
        productionId: productionId.value,
        sequenceId: sequenceId.value,
        data: shotForm.value,
      });
    }
    showShotDialog.value = false;
    resetShotForm();
    await loadShots();
  } catch (error) {
    console.error('Error saving shot:', error);
  } finally {
    savingShot.value = false;
  }
};

const confirmDeleteShot = (shot) => {
  shotToDelete.value = shot;
  showDeleteShotDialog.value = true;
};

const deleteShot = async () => {
  if (!shotToDelete.value) return;
  
  deletingShot.value = true;
  try {
    await store.dispatch('FilmProduction/' + actions.DELETE_SHOT, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
      shotId: shotToDelete.value.id,
    });
    showDeleteShotDialog.value = false;
    shotToDelete.value = null;
    await loadShots();
  } catch (error) {
    console.error('Error deleting shot:', error);
  } finally {
    deletingShot.value = false;
  }
};

const viewShot = (shotId) => {
  router.push({ 
    name: 'shot-detail', 
    params: { 
      productionId: productionId.value, 
      sequenceId: sequenceId.value,
      shotId 
    } 
  });
};

const openSceneDialog = (shot) => {
  currentShotForScene.value = shot;
  scenePrompt.value = shot.description || '';
  showSceneDialog.value = true;
};

const generateScene = async () => {
  if (!scenePrompt.value.trim() || !currentShotForScene.value) return;

  generatingScene.value = true;
  try {
    const result = await store.dispatch('FilmProduction/' + actions.GENERATE_SCENE, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
      shotId: currentShotForScene.value.id,
      prompt: scenePrompt.value,
      options: sceneOptions.value,
    });
    
    // Update shot with generated scene data
    if (result?.sceneData) {
      await store.dispatch('FilmProduction/' + actions.UPDATE_SHOT, {
        productionId: productionId.value,
        sequenceId: sequenceId.value,
        shotId: currentShotForScene.value.id,
        data: { sceneData: result.sceneData },
      });
    }
    
    showSceneDialog.value = false;
    scenePrompt.value = '';
    currentShotForScene.value = null;
    await loadShots();
  } catch (error) {
    console.error('Error generating scene:', error);
  } finally {
    generatingScene.value = false;
  }
};

const editSequence = () => {
  // Navigate to edit or show edit dialog
  router.push({ name: 'production-detail', params: { id: productionId.value } });
};

const loadSequence = async () => {
  try {
    await store.dispatch('FilmProduction/' + actions.GET_SEQUENCE, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
    });
  } catch (error) {
    console.error('Error loading sequence:', error);
  }
};

const loadShots = async () => {
  try {
    await store.dispatch('FilmProduction/' + actions.GET_SHOTS, {
      productionId: productionId.value,
      sequenceId: sequenceId.value,
    });
  } catch (error) {
    console.error('Error loading shots:', error);
  }
};

onMounted(async () => {
  await loadSequence();
  await loadShots();
});
</script>

<style scoped>
.sequence-detail-page {
  padding: 1rem;
}
</style>

