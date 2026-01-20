<template>
  <Dialog
    v-model:visible="showDialog"
    modal
    :style="{ width: '500px' }"
    header="Save Project"
    :closable="true"
  >
    <div class="save-project-content">
      <div class="field mb-4">
        <label for="project-name" class="block mb-2">Project Name</label>
        <InputText
          id="project-name"
          v-model="projectName"
          placeholder="My Video Project"
          class="w-full"
          @keyup.enter="save"
        />
      </div>

      <div class="field mb-4">
        <label for="project-description" class="block mb-2">Description (optional)</label>
        <Textarea
          id="project-description"
          v-model="projectDescription"
          placeholder="Project description..."
          rows="3"
          class="w-full"
        />
      </div>

      <Message v-if="error" severity="error" :closable="false" class="mb-3">
        {{ error }}
      </Message>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        @click="cancel"
      />
      <Button
        label="Save"
        :disabled="!projectName || saving"
        :loading="saving"
        @click="save"
      />
    </template>
  </Dialog>
</template>

<script>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Message from 'primevue/message';

export default {
  name: 'SaveProjectDialog',
  components: {
    Dialog,
    InputText,
    Textarea,
    Button,
    Message,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: [String, Number],
      default: null,
    },
  },
  emits: ['update:visible', 'saved'],
  setup(props, { emit }) {
    const store = useStore();
    const projectName = ref('');
    const projectDescription = ref('');
    const saving = ref(false);
    const error = ref(null);

    const showDialog = ref(props.visible);

    watch(() => props.visible, (newVal) => {
      showDialog.value = newVal;
      if (newVal) {
        error.value = null;
        // Load project data if editing
        if (props.projectId) {
          loadProject();
        }
      }
    });

    watch(showDialog, (newVal) => {
      emit('update:visible', newVal);
    });

    const loadProject = async () => {
      try {
        const project = await store.dispatch('videoeditor/loadProject', props.projectId);
        projectName.value = project.name || '';
        projectDescription.value = project.description || '';
      } catch (err) {
        error.value = err.message || 'Failed to load project';
      }
    };

    const save = async () => {
      if (!projectName.value.trim()) {
        error.value = 'Project name is required';
        return;
      }

      saving.value = true;
      error.value = null;

      try {
        await store.dispatch('videoeditor/saveProject', {
          name: projectName.value.trim(),
          description: projectDescription.value.trim(),
        });

        emit('saved');
        close();
      } catch (err) {
        error.value = err.message || 'Failed to save project';
      } finally {
        saving.value = false;
      }
    };

    const cancel = () => {
      close();
    };

    const close = () => {
      showDialog.value = false;
      projectName.value = '';
      projectDescription.value = '';
      error.value = null;
    };

    return {
      showDialog,
      projectName,
      projectDescription,
      saving,
      error,
      save,
      cancel,
    };
  },
};
</script>

<style scoped>
.save-project-content {
  padding: 1rem 0;
}

.field {
  margin-bottom: 1rem;
}
</style>

