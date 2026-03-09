<script setup>
import { ref, reactive } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';

const store = useStore();
const toast = useToast();

const saving = ref(false);
const user = reactive({
  password: '',
  password_confirmation: '',
});

const apiValidationErrors = reactive({});

function resetApiValidation() {
  apiValidationErrors.password = undefined;
  apiValidationErrors.password_confirmation = undefined;
}

function setApiValidation(serverErrors) {
  if (!serverErrors || typeof serverErrors !== 'object') return;

  // Plain object format: { password: ["..."], password_confirmation: ["..."] }
  if (Array.isArray(serverErrors) === false) {
    Object.keys(serverErrors).forEach((key) => {
      const messages = Array.isArray(serverErrors[key]) ? serverErrors[key] : [serverErrors[key]];
      apiValidationErrors[key] = messages;
    });
    return;
  }

  // JSON:API format: [{ source: { pointer: "/data/attributes/password" }, detail: "..." }]
  const reduced = serverErrors.reduce((acc, errorObject) => {
    if (typeof errorObject?.source?.pointer === 'undefined') return acc;
    const fieldName = errorObject.source.pointer.split('/').pop();
    const detail = errorObject.detail ?? '';
    const list = (acc[fieldName] || []).concat(detail);
    return { ...acc, [fieldName]: list };
  }, {});
  Object.assign(apiValidationErrors, reduced);
}

async function handleChange() {
  resetApiValidation();
  saving.value = true;
  try {
    await store.dispatch('profile/editProfile', {
      password: user.password,
      password_confirmation: user.password_confirmation,
    });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password updated successfully!',
      life: 3000,
    });
    user.password = '';
    user.password_confirmation = '';
  } catch (error) {
    const data = error?.response?.data;
    setApiValidation(data?.errors ?? {});
    const message = data?.message || 'Something went wrong. Please try again.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 4000,
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="profile-password">
    <h5 class="font-weight-bolder mb-0">Change Password</h5>

    <div class="flex flex-column gap-4 mt-4">
      <div class="field">
        <label for="password" class="font-semibold block mb-2">Password</label>
        <Password
          id="password"
          v-model="user.password"
          name="password"
          :feedback="false"
          toggle-mask
          class="w-full"
          input-class="w-full"
          :invalid="!!(apiValidationErrors.password?.length)"
        />
        <small v-if="apiValidationErrors.password?.length" class="p-error block mt-1">
          {{ apiValidationErrors.password[0] }}
        </small>
      </div>

      <div class="field">
        <label for="confirmPassword" class="font-semibold block mb-2">Confirm Password</label>
        <Password
          id="confirmPassword"
          v-model="user.password_confirmation"
          name="confirmPassword"
          :feedback="false"
          toggle-mask
          class="w-full"
          input-class="w-full"
          :invalid="!!(apiValidationErrors.password_confirmation?.length)"
        />
        <small v-if="apiValidationErrors.password_confirmation?.length" class="p-error block mt-1">
          {{ apiValidationErrors.password_confirmation[0] }}
        </small>
      </div>

      <div class="flex justify-content-end mt-2">
        <Button
          label="Change Password"
          icon="pi pi-lock"
          :loading="saving"
          @click="handleChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-password {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem 0;
}
</style>
