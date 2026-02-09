<template>
  <div class="project-detail-page">
    <div v-if="isLoading" class="card">
      <div class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <ProgressSpinner />
      </div>
    </div>

    <div v-else-if="project" class="grid">
      <!-- Project Header -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-start mb-4">
            <div class="flex align-items-center gap-3">
              <Button 
                icon="pi pi-arrow-left" 
                class="p-button-text"
                @click="$router.push({ name: 'projects' })"
                v-tooltip.top="'Back to Projects'"
              />
              <div>
                <h2 class="text-3xl font-bold m-0">{{ project.name }}</h2>
                <p class="text-500 mt-2">{{ project.description || 'No description' }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button 
                label="Movie Editor" 
                icon="pi pi-play" 
                class="p-button-success"
                @click="openMovieEditor"
              />
              <Button 
                label="Generate Script" 
                icon="pi pi-magic" 
                class="p-button-outlined"
                @click="showScriptDialog = true"
              />
              <Button 
                label="Edit" 
                icon="pi pi-pencil" 
                @click="showEditDialog"
              />
            </div>
          </div>

          <div class="flex gap-3 mb-4">
            <Tag :value="project.status || 'draft'" :severity="getStatusSeverity(project.status)" />
            <span class="text-500">Created: {{ formatDate(project.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Sequences Section -->
      <div class="col-12">
        <div class="card">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="text-2xl font-semibold m-0">Sequences</h3>
            <Button 
              label="New Sequence" 
              icon="pi pi-plus" 
              @click="showSequenceDialog = true"
            />
          </div>

          <DataTable 
            :value="sequences" 
            :loading="isLoading"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            :emptyMessage="'No sequences found. Create your first sequence!'"
          >
            <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
              <template #body="{ data }">
                <span class="font-semibold cursor-pointer" @click="viewSequence(data.id)">
                  {{ data.name }}
                </span>
              </template>
            </Column>

            <Column field="description" header="Description" :sortable="true" style="min-width: 300px">
              <template #body="{ data }">
                <span class="text-500">{{ data.description || 'No description' }}</span>
              </template>
            </Column>

            <Column field="order" header="Order" :sortable="true" style="min-width: 100px" />

            <Column header="Actions" style="min-width: 200px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-rounded p-button-text"
                    v-tooltip.top="'View Sequence'"
                    @click="viewSequence(data.id)"
                  />
                  <Button 
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-text"
                    v-tooltip.top="'Edit Sequence'"
                    @click="editSequence(data)"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-text p-button-danger"
                    v-tooltip.top="'Delete Sequence'"
                    @click="confirmDeleteSequence(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- Sequence Dialog -->
    <Dialog 
      v-model:visible="showSequenceDialog" 
      :header="sequenceDialogTitle" 
      :modal="true"
      :style="{ width: '600px' }"
      @hide="resetSequenceForm"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="seq-name" class="font-semibold block mb-2">Sequence Name *</label>
          <InputText 
            id="seq-name" 
            v-model="sequenceForm.name" 
            placeholder="Enter sequence name"
            :class="{ 'p-invalid': !sequenceForm.name && sequenceSubmitted }"
          />
        </div>

        <div class="field">
          <label for="seq-description" class="font-semibold block mb-2">Description</label>
          <Textarea 
            id="seq-description" 
            v-model="sequenceForm.description" 
            placeholder="Enter sequence description"
            rows="4"
            autoResize
          />
        </div>

        <div class="field">
          <label for="seq-order" class="font-semibold block mb-2">Order</label>
          <InputNumber 
            id="seq-order" 
            v-model="sequenceForm.order" 
            :min="1"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showSequenceDialog = false"
        />
        <Button 
          label="Save" 
          icon="pi pi-check" 
          @click="saveSequence"
          :loading="savingSequence"
        />
      </template>
    </Dialog>

    <!-- Script Generation Dialog -->
    <Dialog 
      v-model:visible="showScriptDialog" 
      header="Generate Script with AI" 
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="script-prompt" class="font-semibold block mb-2">Prompt *</label>
          <Textarea 
            id="script-prompt" 
            v-model="scriptPrompt" 
            placeholder="Describe the story, genre, tone, and key scenes you want in your script..."
            rows="6"
            autoResize
          />
        </div>

        <div class="field">
          <label for="script-style" class="font-semibold block mb-2">Script Style</label>
          <Dropdown 
            id="script-style" 
            v-model="scriptOptions.style" 
            :options="scriptStyles"
            optionLabel="label"
            optionValue="value"
            placeholder="Select style"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="script-length" class="font-semibold block mb-2">Estimated Length (minutes)</label>
          <InputNumber 
            id="script-length" 
            v-model="scriptOptions.length" 
            :min="1"
            :max="120"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showScriptDialog = false"
        />
        <Button 
          label="Generate Script" 
          icon="pi pi-magic" 
          @click="generateScript"
          :loading="generatingScript"
        />
      </template>
    </Dialog>

    <!-- Edit Project Dialog -->
    <Dialog 
      v-model:visible="showProjectEditDialog" 
      header="Edit Project" 
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="proj-name" class="font-semibold block mb-2">Project Name *</label>
          <InputText id="proj-name" v-model="projectForm.name" class="w-full" />
        </div>
        <div class="field">
          <label for="proj-desc" class="font-semibold block mb-2">Description</label>
          <Textarea id="proj-desc" v-model="projectForm.description" rows="4" autoResize class="w-full" />
        </div>
        <div class="field">
          <label for="proj-status" class="font-semibold block mb-2">Status</label>
          <Dropdown 
            id="proj-status" 
            v-model="projectForm.status" 
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="showProjectEditDialog = false" />
        <Button label="Save" icon="pi pi-check" @click="saveProjectEdit" :loading="savingProject" />
      </template>
    </Dialog>

    <!-- Delete Sequence Confirmation -->
    <Dialog 
      v-model:visible="showDeleteSequenceDialog" 
      header="Confirm Delete" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex align-items-center gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
        <span>Are you sure you want to delete "{{ sequenceToDelete?.name }}"?</span>
      </div>
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showDeleteSequenceDialog = false"
        />
        <Button 
          label="Delete" 
          icon="pi pi-trash" 
          class="p-button-danger" 
          @click="deleteSequence"
          :loading="deletingSequence"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import * as actions from '@/store/modules/film-project/types/actions';

const store = useStore();
const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id);
const project = computed(() => store.getters['FilmProject/project']);
const sequences = computed(() => 
  store.getters['FilmProject/sequencesByProject'](projectId.value)
);
const isLoading = computed(() => store.getters['FilmProject/isLoading']);

const showSequenceDialog = ref(false);
const showScriptDialog = ref(false);
const showDeleteSequenceDialog = ref(false);
const sequenceSubmitted = ref(false);
const savingSequence = ref(false);
const deletingSequence = ref(false);
const generatingScript = ref(false);
const editingSequenceId = ref(null);
const sequenceToDelete = ref(null);

const scriptStyles = [
  { label: 'Screenplay', value: 'screenplay' },
  { label: 'Short Film', value: 'short_film' },
  { label: 'Documentary', value: 'documentary' },
  { label: 'Commercial', value: 'commercial' },
];

const sequenceForm = ref({
  name: '',
  description: '',
  order: 1,
});

const scriptPrompt = ref('');
const scriptOptions = ref({
  style: 'screenplay',
  length: 5,
});

const sequenceDialogTitle = computed(() => 
  editingSequenceId.value ? 'Edit Sequence' : 'New Sequence'
);

const getStatusSeverity = (status) => {
  const severityMap = {
    draft: 'secondary',
    in_progress: 'info',
      post_production: 'warning',
    completed: 'success',
    on_hold: 'danger',
  };
  return severityMap[status] || 'secondary';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

const resetSequenceForm = () => {
  sequenceForm.value = {
    name: '',
    description: '',
    order: sequences.value.length + 1,
  };
  sequenceSubmitted.value = false;
  editingSequenceId.value = null;
};

const editSequence = (sequence) => {
  editingSequenceId.value = sequence.id;
  sequenceForm.value = {
    name: sequence.name || '',
    description: sequence.description || '',
    order: sequence.order || 1,
  };
  showSequenceDialog.value = true;
};

const saveSequence = async () => {
  sequenceSubmitted.value = true;
  if (!sequenceForm.value.name) return;

  savingSequence.value = true;
  try {
    if (editingSequenceId.value) {
      await store.dispatch('FilmProject/' + actions.UPDATE_SEQUENCE, {
        projectId: projectId.value,
        sequenceId: editingSequenceId.value,
        data: sequenceForm.value,
      });
    } else {
      await store.dispatch('FilmProject/' + actions.CREATE_SEQUENCE, {
        projectId: projectId.value,
        data: sequenceForm.value,
      });
    }
    showSequenceDialog.value = false;
    resetSequenceForm();
    await loadSequences();
  } catch (error) {
    console.error('Error saving sequence:', error);
  } finally {
    savingSequence.value = false;
  }
};

const confirmDeleteSequence = (sequence) => {
  sequenceToDelete.value = sequence;
  showDeleteSequenceDialog.value = true;
};

const deleteSequence = async () => {
  if (!sequenceToDelete.value) return;
  
  deletingSequence.value = true;
  try {
    await store.dispatch('FilmProject/' + actions.DELETE_SEQUENCE, {
      projectId: projectId.value,
      sequenceId: sequenceToDelete.value.id,
    });
    showDeleteSequenceDialog.value = false;
    sequenceToDelete.value = null;
    await loadSequences();
  } catch (error) {
    console.error('Error deleting sequence:', error);
  } finally {
    deletingSequence.value = false;
  }
};

const viewSequence = (sequenceId) => {
  router.push({ 
    name: 'sequence-detail', 
    params: { 
      projectId: projectId.value, 
      sequenceId 
    } 
  });
};

const generateScript = async () => {
  if (!scriptPrompt.value.trim()) return;

  generatingScript.value = true;
  try {
    const result = await store.dispatch('FilmProject/' + actions.GENERATE_SCRIPT, {
      projectId: projectId.value,
      prompt: scriptPrompt.value,
      options: scriptOptions.value,
    });
    
    // Update project with generated script
    if (result?.script) {
      await store.dispatch('FilmProject/' + actions.UPDATE_PRODUCTION, {
        id: projectId.value,
        data: { script: result.script },
      });
    }
    
    showScriptDialog.value = false;
    scriptPrompt.value = '';
  } catch (error) {
    console.error('Error generating script:', error);
  } finally {
    generatingScript.value = false;
  }
};

const openMovieEditor = () => {
  router.push({ name: 'movie-editor', params: { id: projectId.value } });
};

// ── Project editing ─────────────────────────────────────────────────
const showProjectEditDialog = ref(false);
const savingProject = ref(false);
const projectForm = ref({ name: '', description: '', status: 'draft' });

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Post Production', value: 'post_production' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
];

const showEditDialog = () => {
  if (project.value) {
    projectForm.value = {
      name: project.value.name || '',
      description: project.value.description || '',
      status: project.value.status || 'draft',
    };
  }
  showProjectEditDialog.value = true;
};

const saveProjectEdit = async () => {
  if (!projectForm.value.name) return;
  savingProject.value = true;
  try {
    await store.dispatch('FilmProject/' + actions.UPDATE_PRODUCTION, {
      id: projectId.value,
      data: projectForm.value,
    });
    showProjectEditDialog.value = false;
    await loadProject();
  } catch (error) {
    console.error('Error updating project:', error);
  } finally {
    savingProject.value = false;
  }
};

const loadProject = async () => {
  try {
    await store.dispatch('FilmProject/' + actions.GET_PRODUCTION, projectId.value);
  } catch (error) {
    console.error('Error loading project:', error);
  }
};

const loadSequences = async () => {
  try {
    await store.dispatch('FilmProject/' + actions.GET_SEQUENCES, projectId.value);
  } catch (error) {
    console.error('Error loading sequences:', error);
  }
};

onMounted(async () => {
  await loadProject();
  await loadSequences();
});
</script>

<style scoped>
.project-detail-page {
  padding: 1rem;
}
</style>

