<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: var(--primary-color)"></i>
        <div class="text-900 text-2xl font-medium mt-4">
          {{ loading ? `Authenticating with ${providerName}...` : 'Redirecting...' }}
        </div>
        <div v-if="error" class="text-red-500 mt-3">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as notificationActions from '@/store/modules/notification/types/actions';
import * as actions from '@/store/modules/auth/types/actions';
import { mapActions } from 'vuex';

export default {
  name: 'SocialiteAuth',
  props: ['provider'],
  data() {
    return {
      loading: true,
      error: null
    };
  },
  computed: {
    providerName() {
      return this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
    }
  },
  methods: {
    ...mapActions('AuthService', {
      fetchLoggedUser: actions.FETCH_LOGGED_USER,
      login: actions.PROVIDER_CALLBACK
    }),
    ...mapActions('notification', {
      setErrorNotification: notificationActions.SET_ERROR_NOTIFICATION
    }),
    async loginUser() {
      try {
        this.loading = true;
        this.error = null;
        
        await this.login({
          code: this.$route.query.code,
          provider: this.provider
        });
        await this.fetchLoggedUser();

        this.loading = false;
        await this.$router.push({ name: 'Library' });
      } catch (error) {
        this.loading = false;
        this.error = error.message || 'OAuth login failed';
        this.setErrorNotification(this.error);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          this.$router.push({ name: 'login' });
        }, 2000);
      }
    }
  },
  mounted() {
    this.loginUser();
  }
};
</script>

<style scoped></style>
