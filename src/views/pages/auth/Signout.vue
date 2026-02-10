<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <ProgressSpinner v-if="signingOut" />
      <div v-else class="text-center">
        <i class="pi pi-check-circle text-5xl text-green-400 mb-3" style="display: block"></i>
        <p class="text-xl text-color">You have been signed out.</p>
        <Button label="Go to Login" icon="pi pi-sign-in" @click="$router.push('/login')" class="mt-3" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import * as authActions from '@/store/modules/auth/types/actions';

export default {
  name: 'SignoutComponent',
  setup() {
    const store = useStore();
    const router = useRouter();
    const signingOut = ref(true);

    onMounted(async () => {
      try {
        await store.dispatch('AuthService/' + authActions.SIGN_OUT);
      } catch (error) {
        console.error('Sign out error:', error);
      } finally {
        signingOut.value = false;
        router.push('/login');
      }
    });

    return { signingOut };
  }
};
</script>
