<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Vimage Logo" class="mb-5 w-6rem flex-shrink-0" />
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <img src="/demo/images/login/avatar.png" alt="Image" height="50" class="mb-3" />
                        <div class="text-900 text-3xl font-medium mb-3">One more thing!</div>
                        <span class="text-600 font-medium">Enter verification code from your e-mail below</span>
                    </div>
                    <Form role="form" @submit.prevent="onVerifiedEmail">
                        <div>
                            <label for="hash" class="block text-900 text-xl font-medium mb-2">Enter verification code</label>

                            <InputText id="hash-input" type="text" name="hash" :validateOnBlur="false"   v-model="v$.verifiedEmailData.hash.$model"
                                placeholder="Verification code" class="w-full md:w-30rem mb-5" style="padding: 1rem" />

                            <Button type="submit" label="Activate"
                                class="w-full p-3 text-xl"></Button>
                        </div>

                    </Form>
                </div>
            </div>

        </div>
    </div>
    <AppConfig simple />
</template>

<script>
import { useLayout } from '@/layout/composables/layout';
import _ from 'lodash';
import { mapActions } from 'vuex';
import * as authActions from '@/store/modules/auth/types/actions';
import * as notificationActions from '@/store/modules/notification/types/actions';
import { required } from  '@vuelidate/validators';
import useVuelidate from "@vuelidate/core";
const { layoutConfig } = useLayout();

export default {
  name: 'Verification',
  setup () { return { v$: useVuelidate() } },
  data() {
    return {
      verifiedEmailData: {
        hash: '',
        id: this.$route.query
      }
    };
  },
  validations: {
    verifiedEmailData: {
      hash: {
        required
      },
      id: {
        required
      }
    }
  },
  computed: {
    logoUrl() { 
        return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
    }
  },
  mounted() {
    this.verifiedEmailData.hash = _.get(this.$route, 'query.hash', null);
    this.verifiedEmailData.id = _.get(this.$route, 'query.id', null);
  },
  methods: {
    ...mapActions('AuthService', {
      verifiedEmail: authActions.VERIFIED_EMAIL
    }),

    ...mapActions('notification', {
      setErrorNotification: notificationActions.SET_ERROR_NOTIFICATION
    }),

    status(validation) {
      return {
        error: validation.$error,
        dirty: validation.$dirty
      };
    },

    async onVerifiedEmail() {
      try {
        const verified = await this.verifiedEmail(this.verifiedEmailData);

        if (verified !== false) {
          await this.$router.push({ name: 'login' });
        }
      } catch (error) {
        this.setErrorNotification(error);
      }
    }
  }
};
</script>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
v