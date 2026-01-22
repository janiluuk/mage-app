<template>
  <Dialog
    v-model:visible="showDialog"
    modal
    :style="{ width: '600px' }"
    header="Load Project"
    :closable="true"
  >
    <div class="load-project-content">
      <div v-if="loading" class="text-center py-4">
        <ProgressSpinner />
        <p class="mt-3">Loading projects...</p>
      </div>

      <div v-else-if="error" class="mb-3">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-4">
        <p>No saved projects found.</p>
      </div>

      <div v-else class="projects-list">
        <DataTable
          :value="projects"
          :paginator="true"
          :rows="10"
          selectionMode="single"
          v-model:selection="selectedProject"
          dataKey="id"
          @row-select="onProjectSelect"
        >
          <Column field="name" header="Name" sortable>
            <template #body="slotProps">
              <div class="project-name-cell">
                <strong>{{ slotProps.data.name }}</strong>
                <span v-if="slotProps.data.description" class="text-sm text-color-secondary ml-2">
                  {{ slotProps.data.description }}
                </span>
              </div>
            </template>
          </Column>
          <Column field="created_at" header="Created" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.created_at) }}
            </template>
          </Column>
          <Column header="Actions" :exportable="false">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  text
                  v-tooltip.top="'Delete project'"
                  @click="confirmDelete(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="cancel"
      />
      <Button
        label="Load"
        :disabled="!selectedProject"
        @click="load"
      />
    </template>

    <ConfirmDialog />
  </Dialog>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Tooltip from 'primevue/tooltip';

export default {
  name: 'LoadProjectDialog',
  components: {
    Dialog,
    DataTable,
    Column,
    Button,
    Message,
    ProgressSpinner,
    ConfirmDialog,
  },
  directives: {
    tooltip: Tooltip,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible', 'loaded'],
  setup(props, { emit }) {
    const store = useStore();
    const confirm = useConfirm();
    const toast = useToast();

    const showDialog = ref(props.visible);
    const projects = ref([]);
    const selectedProject = ref(null);
    const loading = ref(false);
    const error = ref(null);

    watch(() => props.visible, (newVal) => {
      showDialog.value = newVal;
      if (newVal) {
        loadProjects();
      }
    });

    watch(showDialog, (newVal) => {
      emit('update:visible', newVal);
    });

    const loadProjects = async () => {
      loading.value = true;
      error.value = null;

      try {
        const projectList = await store.dispatch('videoeditor/listProjects');
        projects.value = projectList;
      } catch (err) {
        error.value = err.message || 'Failed to load projects';
      } finally {
        loading.value = false;
      }
    };

    const onProjectSelect = (event) => {
      selectedProject.value = event.data;
    };

    const load = async () => {
      if (!selectedProject.value) return;

      loading.value = true;
      error.value = null;

      try {
        await store.dispatch('videoeditor/loadProject', selectedProject.value.id);
        
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Project loaded successfully',
          life: 3000,
        });

        emit('loaded');
        close();
      } catch (err) {
        error.value = err.message || 'Failed to load project';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to load project',
          life: 5000,
        });
      } finally {
        loading.value = false;
      }
    };

    const confirmDelete = (project) => {
      confirm.require({
        message: `Are you sure you want to delete "${project.name}"?`,
        header: 'Delete Project',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            await store.dispatch('videoeditor/deleteProject', project.id);
            toast.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Project deleted',
              life: 3000,
            });
            await loadProjects();
            if (selectedProject.value?.id === project.id) {
              selectedProject.value = null;
            }
          } catch (err) {
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: err.message || 'Failed to delete project',
              life: 5000,
            });
          }
        },
      });
    };

    const cancel = () => {
      close();
    };

    const close = () => {
      showDialog.value = false;
      selectedProject.value = null;
      error.value = null;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return {
      showDialog,
      projects,
      selectedProject,
      loading,
      error,
      load,
      cancel,
      confirmDelete,
      onProjectSelect,
      formatDate,
    };
  },
};
</script>

<style scoped>
.load-project-content {
  padding: 1rem 0;
  min-height: 300px;
}

.project-name-cell {
  display: flex;
  flex-direction: column;
}
</style>

