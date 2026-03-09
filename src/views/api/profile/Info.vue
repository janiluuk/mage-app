<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const store = useStore();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const file = ref(null);
const previewUrl = ref(null);

const user = ref({
  name: '',
  email: '',
  profile_image: null,
});

const profileImage = computed(() => {
  if (previewUrl.value) return previewUrl.value;
  if (user.value.profile_image) return user.value.profile_image;
  return null;
});

const initials = computed(() => {
  const name = user.value.name || '';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
});

onMounted(async () => {
  loading.value = true;
  try {
    await store.dispatch('profile/getProfile');
    const profile = store.getters['profile/getUserProfile'];
    if (profile) {
      user.value = {
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        profile_image: profile.profile_image || null,
      };
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile', life: 4000 });
  } finally {
    loading.value = false;
  }
});

function onFileSelect(event) {
  const selected = event.files?.[0] || event.target?.files?.[0];
  if (selected) {
    file.value = selected;
    previewUrl.value = URL.createObjectURL(selected);
  }
}

function removeImage() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = null;
  previewUrl.value = null;
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (file.value) {
      await store.dispatch('profile/uploadPic', file.value);
      user.value.profile_image = store.getters['profile/getUserProfileImage'];
      file.value = null;
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }

    await store.dispatch('profile/editProfile', user.value);
    const updated = store.getters['profile/getUserProfile'];
    if (updated) {
      user.value = {
        id: updated.id,
        name: updated.name || '',
        email: updated.email || '',
        profile_image: updated.profile_image || null,
      };
    }
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 4000 });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="loading" class="flex justify-content-center p-5">
    <ProgressSpinner />
  </div>

  <div v-else class="profile-info">
    <!-- Avatar / Image -->
    <div class="flex flex-column align-items-center mb-4">
      <div class="profile-avatar-wrapper mb-3">
        <img v-if="profileImage" :src="profileImage" alt="Profile" class="profile-avatar" />
        <div v-else class="profile-avatar profile-avatar--placeholder">
          {{ initials }}
        </div>
      </div>

      <div class="flex gap-2">
        <label class="p-button p-button-outlined p-button-sm cursor-pointer">
          <i class="pi pi-upload mr-2"></i>
          {{ file ? 'Change Photo' : 'Upload Photo' }}
          <input type="file" accept="image/*" style="display: none" @change="onFileSelect" />
        </label>
        <Button
          v-if="file || profileImage"
          icon="pi pi-times"
          class="p-button-text p-button-sm p-button-danger"
          label="Remove"
          @click="removeImage"
        />
      </div>
    </div>

    <!-- Fields -->
    <div class="flex flex-column gap-4">
      <div class="field">
        <label for="profile-name" class="font-semibold block mb-2">Name</label>
        <InputText id="profile-name" v-model="user.name" class="w-full" />
      </div>

      <div class="field">
        <label for="profile-email" class="font-semibold block mb-2">Email</label>
        <InputText id="profile-email" v-model="user.email" type="email" class="w-full" />
      </div>

      <div class="flex justify-content-end">
        <Button
          label="Save Changes"
          icon="pi pi-check"
          :loading="saving"
          @click="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-info {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem 0;
}

.profile-avatar-wrapper {
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--surface-border);
}

.profile-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: var(--primary-color-text);
  font-size: 2.5rem;
  font-weight: 700;
}
</style>
