<template>

    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
          <NotificationsComponent></NotificationsComponent>
  
          <img :src="logoUrl" alt="Vimage LogoS" class="mb-5 w-6rem flex-shrink-0" />
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">

                    <div class="text-center mb-5">
                        <img src="/public/img/bird.png" alt="Image" height="50" class="mb-3" />
                        <div class="text-900 text-3xl font-medium mb-3">Welcome!</div>
		<span class="text-600 font-medium">Enter details below to register.</span>

            <span class="text-600 font-medium">Have account already? <router-link to="/login" custom v-slot="{ navigate }">
                <a class="font-medium no-underline ml-2 text-right cursor-pointer" @click="navigate"
                  style="color: var(--primary-color)">Login here</a></router-link></span>
                    </div>
                    <Form role="form" @submit.prevent="onRegister">
                        <div>

                            <label for="email" class="block text-900 text-xl font-medium mb-2">E-mail</label>

                            <InputText id="userEmail" name="email" type="text" v-model="v$.registerData.email.$model"
                                placeholder="Email address" class="w-full md:w-30rem mb-5" style="padding: 1rem" />

                            <label for="password" class="block text-900 font-medium text-xl mb-2">Password</label>

                            <Password id="password-input" name="password" placeholder="Password" v-model="v$.registerData.password.$model" :toggleMask="true"
                                class="w-full mb-3" inputClass="w-full" inputStyle="padding:1rem"></Password>
                            <label class="block text-900 font-medium text-xl mb-2">Confirm
                                password</label>
                            <Password id="confirm-password-input" placeholder="Password" v-model="v$.registerData.password_confirmation.$model"
                                :toggleMask="true" class="w-full mb-3" inputClass="w-full" inputStyle="padding:1rem">
                            </Password>

                            <div class="col-12 md:col-8">

                                <div class="field-checkbox mb-5">
                                    <Checkbox name="checkbox" value="true" :binary="true" v-model="registerData.license" />

                                    <label for="checkbox"> I agree the
                                        <a href="#" class="text-dark font-weight-bolder"> Terms and
                                            Conditions</a></label> 
                                </div>
                            </div>

                            <Button type="submit" label="Register"
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
import { required, sameAs, minLength, email } from  '@vuelidate/validators';
import useVuelidate from "@vuelidate/core";
import { mapActions } from 'vuex';
import NotificationsComponent from '@/components/notification/NotificationsComponent.vue';

import * as authActions from '@/store/modules/auth/types/actions';
import * as notificationActions from '@/store/modules/notification/types/actions';
const { layoutConfig } = useLayout();

export default {
  name: 'RegistrationComponent',
  setup () { return { v$: useVuelidate() } },
  data() {
    return {
        
      clickedEmail: false,
      clickedPassword: false,
      clickedConfirmationPassword: false,
      registerData: {
        email: '',
        password: '',
        password_confirmation: '',
        license: false
      }
    };
  },
  computed: {
    logoUrl() { 
        return `/img/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.png`;
    }
  },
  components: { NotificationsComponent },

  validations () {
    return {
    registerData: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(8)
      },
      password_confirmation: {
        required,
        minLength: minLength(8),
        sameAsPassword: sameAs(this.registerData.password),

      }
    }
    };
  },
  methods: {
    ...mapActions('AuthService', {
      registerUser: authActions.REGISTER_USER
    }),

    ...mapActions('notification', {
      setErrorNotification: notificationActions.SET_ERROR_NOTIFICATION
    }),

    clickEmail() {
      this.clickedEmail = true;
    },
    clickPassword() {
      this.clickedPassword = true;
    },
    clickConfirmationPassword() {
      this.clickedConfirmationPassword = true;
    },
    validationRegisterForm() {
      this.v$.$touch();
      return this.v$.$invalid;
    },
    async onRegister() {

      if (this.registerData.license !== false) this.registerData.license = true; 

      if (!this.validationRegisterForm()) {
        try {
          const isRegisterSuccessful = await this.registerUser(
            this.registerData
          );
          if (isRegisterSuccessful !== false) {
            await this.$router.push({
              name: 'verification',
              query: { id: isRegisterSuccessful.id }
            });
          } else {
          }
        } catch (error) {
        }
      } else {
        this.setErrorNotification("Validation failed!");

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
