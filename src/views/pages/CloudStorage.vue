<template>
  <div class="page-container">
    <div class="page-header">
      <h2>Cloud Storage</h2>
      <p>Connect storage to sync projects and keep backups accessible across devices.</p>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Message v-if="success" severity="success" :closable="false">{{ success }}</Message>

    <Card class="section-card">
      <template #title>Connection</template>
      <template #content>
        <div class="form-grid">
          <label for="provider">Provider</label>
          <InputText id="provider" v-model="form.provider" placeholder="s3" />

          <label for="mode">Mode</label>
          <InputText id="mode" v-model="form.mode" placeholder="local or api" />

          <label for="bucket">Bucket</label>
          <InputText id="bucket" v-model="form.bucket" placeholder="mage-projects" />

          <label for="region">Region</label>
          <InputText id="region" v-model="form.region" placeholder="us-east-1" />

          <label for="endpoint">Endpoint</label>
          <InputText id="endpoint" v-model="form.endpoint" placeholder="https://s3.amazonaws.com" />

          <label for="accessKey">Access Key</label>
          <InputText id="accessKey" v-model="form.accessKeyId" placeholder="Access key ID" />

          <label for="secretKey">Secret Key</label>
          <InputText id="secretKey" v-model="form.secretAccessKey" placeholder="Secret access key" />
        </div>

        <div class="button-row">
          <Button
            data-testid="connect-button"
            label="Connect"
            icon="pi pi-link"
            :disabled="isConnected"
            @click="handleConnect"
          />
          <Button
            data-testid="disconnect-button"
            label="Disconnect"
            icon="pi pi-times"
            severity="secondary"
            :disabled="!isConnected"
            @click="handleDisconnect"
          />
        </div>
      </template>
    </Card>

    <Card class="section-card">
      <template #title>Files</template>
      <template #content>
        <div class="files-toolbar">
          <Button
            data-testid="refresh-files"
            label="Refresh"
            icon="pi pi-refresh"
            :loading="loading"
            @click="refreshFiles"
          />
          <div class="add-file">
            <InputText
              v-model="newFilePath"
              placeholder="users/1/example.mp4"
              data-testid="new-file-path"
            />
            <InputText
              v-model="newFileSize"
              placeholder="Size (bytes)"
              data-testid="new-file-size"
            />
            <Button
              data-testid="add-file"
              label="Add"
              icon="pi pi-plus"
              severity="secondary"
              @click="addLocalFile"
            />
          </div>
        </div>

        <div v-if="!files.length" class="empty-state">
          <p>No files available yet.</p>
        </div>

        <table v-else class="files-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Size</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file.path">
              <td>{{ file.path }}</td>
              <td>{{ file.size }}</td>
              <td>{{ file.updatedAt }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </Card>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import cloudStorageService from '@/services/cloudStorageService';

export default {
  name: 'CloudStorage',
  components: {
    Button,
    Card,
    InputText,
    Message
  },
  setup() {
    const form = ref({
      provider: 's3',
      mode: 'local',
      bucket: '',
      region: '',
      endpoint: '',
      accessKeyId: '',
      secretAccessKey: ''
    });

    const isConnected = ref(false);
    const files = ref([]);
    const error = ref('');
    const success = ref('');
    const loading = ref(false);
    const newFilePath = ref('');
    const newFileSize = ref('');

    const refreshFiles = async () => {
      if (!isConnected.value) {
        files.value = [];
        return;
      }
      loading.value = true;
      try {
        files.value = await cloudStorageService.listFiles();
      } catch (err) {
        error.value = err.message || 'Failed to fetch files';
      } finally {
        loading.value = false;
      }
    };

    const handleConnect = () => {
      error.value = '';
      success.value = '';
      try {
        const config = cloudStorageService.connect(form.value);
        form.value = { ...form.value, ...config };
        isConnected.value = true;
        success.value = 'Cloud storage connected';
        refreshFiles();
      } catch (err) {
        error.value = err.message || 'Failed to connect';
      }
    };

    const handleDisconnect = () => {
      cloudStorageService.disconnect();
      isConnected.value = false;
      files.value = [];
      success.value = 'Cloud storage disconnected';
      error.value = '';
    };

    const addLocalFile = () => {
      if (!newFilePath.value) {
        error.value = 'File path is required';
        return;
      }
      const entry = cloudStorageService.addLocalFile({
        path: newFilePath.value,
        size: Number(newFileSize.value || 0)
      });
      files.value = [entry, ...files.value.filter((file) => file.path !== entry.path)];
      newFilePath.value = '';
      newFileSize.value = '';
    };

    onMounted(() => {
      const config = cloudStorageService.getConfig();
      if (config) {
        form.value = { ...form.value, ...config };
        isConnected.value = true;
        refreshFiles();
      }
    });

    return {
      form,
      isConnected,
      files,
      error,
      success,
      loading,
      newFilePath,
      newFileSize,
      handleConnect,
      handleDisconnect,
      refreshFiles,
      addLocalFile
    };
  }
};
</script>

<style scoped>
.page-container {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0 0 0.5rem;
}

.page-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.section-card {
  margin-top: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.75rem 1rem;
  align-items: center;
}

.button-row {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
}

.files-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.add-file {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table th,
.files-table td {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.empty-state {
  color: var(--text-color-secondary);
  padding: 0.5rem 0;
}
</style>

