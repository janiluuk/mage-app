<template>
  <div class="projects-page">
    <div class="card">
      <div v-if="hasProjects" class="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="text-3xl font-bold m-0">Film Projects</h2>
          <p class="text-500 mt-2">Manage your film projects, sequences, and shots</p>
        </div>
        <Button 
          label="New Project" 
          icon="pi pi-plus" 
          @click="showCreateDialog"
          class="p-button-primary"
        />
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && (!projects || projects.length === 0)" class="empty-state">
        <i class="pi pi-video empty-state-icon" />
        <h3 class="empty-state-title">No projects</h3>
        <p class="empty-state-subtitle">Create your first film project to get started</p>
        <Button 
          label="New Project" 
          icon="pi pi-plus" 
          @click="showCreateDialog"
          class="p-button-primary mt-3"
        />
      </div>

      <!-- Data table (only when projects exist) -->
      <DataTable 
        v-else
        :value="projects" 
        :loading="isLoading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        responsiveLayout="scroll"
        :globalFilterFields="['name', 'description', 'status']"
        v-model:filters="filters"
        filterDisplay="row"
        :emptyMessage="'No projects found'"
      >
        <template #header>
          <div class="flex justify-content-between align-items-center">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText v-model="filters['global'].value" placeholder="Search projects..." />
            </span>
          </div>
        </template>

        <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex align-items-center gap-2">
              <img 
                v-if="data.thumbnail" 
                :src="data.thumbnail" 
                :alt="data.name"
                class="project-thumbnail"
              />
              <span class="font-semibold">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="description" header="Description" :sortable="true" style="min-width: 300px">
          <template #body="{ data }">
            <span class="text-500">{{ data.description || 'No description' }}</span>
          </template>
        </Column>

        <Column field="status" header="Status" :sortable="true" style="min-width: 120px">
          <template #body="{ data }">
            <Tag 
              :value="data.status || 'draft'" 
              :severity="getStatusSeverity(data.status)"
            />
          </template>
        </Column>

        <Column field="createdAt" header="Created" :sortable="true" style="min-width: 150px">
          <template #body="{ data }">
            <span>{{ formatDate(data.createdAt) }}</span>
          </template>
        </Column>

        <Column header="Actions" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text"
                v-tooltip.top="'View Project'"
                @click="viewProject(data.id)"
              />
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-text"
                v-tooltip.top="'Edit Project'"
                @click="editProject(data)"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-text p-button-danger"
                v-tooltip.top="'Delete Project'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="showDialog" 
      :header="dialogTitle" 
      :modal="true"
      :style="{ width: '600px' }"
      @hide="resetForm"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="name" class="font-semibold block mb-2">Project Name *</label>
          <InputText 
            id="name" 
            v-model="formData.name" 
            placeholder="Enter project name"
            :class="{ 'p-invalid': !formData.name && submitted }"
          />
          <small v-if="!formData.name && submitted" class="p-error">Name is required</small>
        </div>

        <div class="field">
          <label for="description" class="font-semibold block mb-2">Description</label>
          <Textarea 
            id="description" 
            v-model="formData.description" 
            placeholder="Enter project description"
            rows="4"
            autoResize
          />
        </div>

        <div class="field">
          <label for="status" class="font-semibold block mb-2">Status</label>
          <Dropdown 
            id="status" 
            v-model="formData.status" 
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showDialog = false"
        />
        <Button 
          label="Save" 
          icon="pi pi-check" 
          @click="saveProject"
          :loading="saving"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      header="Confirm Delete" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex align-items-center gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-red-500" />
        <span>Are you sure you want to delete "{{ projectToDelete?.name }}"? This action cannot be undone.</span>
      </div>
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="showDeleteDialog = false"
        />
        <Button 
          label="Delete" 
          icon="pi pi-trash" 
          class="p-button-danger" 
          @click="deleteProject"
          :loading="deleting"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from 'primevue/api';
import * as actions from '@/store/modules/film-project/types/actions';

const store = useStore();
const router = useRouter();

const projects = computed(() => store.getters['FilmProject/projects']);
const isLoading = computed(() => store.getters['FilmProject/isLoading']);
const hasProjects = computed(() => !isLoading.value && projects.value && projects.value.length > 0);

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const submitted = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editingId = ref(null);
const projectToDelete = ref(null);

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Post Production', value: 'post_production' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
];

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const formData = ref({
  name: '',
  description: '',
  status: 'draft',
});

const dialogTitle = computed(() => editingId.value ? 'Edit Project' : 'New Project');

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

const showCreateDialog = () => {
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

const editProject = (project) => {
  editingId.value = project.id;
  formData.value = {
    name: project.name || '',
    description: project.description || '',
    status: project.status || 'draft',
  };
  showDialog.value = true;
};

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    status: 'draft',
  };
  submitted.value = false;
  editingId.value = null;
};

const saveProject = async () => {
  submitted.value = true;
  if (!formData.value.name) return;

  saving.value = true;
  try {
    if (editingId.value) {
      await store.dispatch('FilmProject/' + actions.UPDATE_PRODUCTION, {
        id: editingId.value,
        data: formData.value,
      });
    } else {
      await store.dispatch('FilmProject/' + actions.CREATE_PRODUCTION, formData.value);
    }
    showDialog.value = false;
    resetForm();
    await loadProjects();
  } catch (error) {
    console.error('Error saving project:', error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (project) => {
  projectToDelete.value = project;
  showDeleteDialog.value = true;
};

const deleteProject = async () => {
  if (!projectToDelete.value) return;
  
  deleting.value = true;
  try {
    await store.dispatch('FilmProject/' + actions.DELETE_PRODUCTION, projectToDelete.value.id);
    showDeleteDialog.value = false;
    projectToDelete.value = null;
    await loadProjects();
  } catch (error) {
    console.error('Error deleting project:', error);
  } finally {
    deleting.value = false;
  }
};

const viewProject = (id) => {
  router.push({ name: 'project-detail', params: { id } });
};

const loadProjects = async () => {
  try {
    await store.dispatch('FilmProject/' + actions.GET_PRODUCTIONS);
  } catch (error) {
    console.error('Error loading projects:', error);
  }
};

onMounted(() => {
  loadProjects();
});
</script>

<style scoped>
.projects-page {
  padding: 1rem;
}

.project-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
}

.empty-state-icon {
  font-size: 5rem;
  color: var(--text-color-secondary);
  opacity: 0.4;
  margin-bottom: 1.5rem;
}

.empty-state-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-state-subtitle {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  margin: 0;
}
</style>
