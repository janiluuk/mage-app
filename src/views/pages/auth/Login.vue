<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <img :src="logoUrl" alt="Vimage Logo" class="mb-5 w-6rem flex-shrink-0" />
      <div
        style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
          <div class="text-center mb-5">
            <img src="/public/img/bird.png" alt="Image" height="50" class="mb-3" />
            <div class="text-900 text-3xl font-medium mb-3">Welcome!</div>
            <span class="text-600 font-medium">Sign in to continue</span><p></p>
            <span class="text-600 font-medium">No account? <router-link to="/signup" custom v-slot="{ navigate }">
                <a class="font-medium no-underline ml-2 text-right cursor-pointer" @click="navigate"
                  style="color: var(--primary-color); font-size: 1.5em">Sign up here</a></router-link></span>
          </div>
          <Form role="form" class="text-start mt-3" @submit.prevent="login">
            <div>
              <label for="email1" class="block text-900 text-xl font-medium mb-2">Email</label>
              <InputText id="email1" type="text" v-model="loginData.email" placeholder="Email address"
                class="w-full md:w-30rem mb-5" style="padding: 1rem" />

              <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
              <Password id="password1" placeholder="Password" v-model="loginData.password" :toggleMask="false"
                class="w-full mb-3" inputClass="w-full" inputStyle="padding:1rem"></Password>

              <div class="flex align-items-center justify-content-between mb-5 gap-5">
                <div class="flex align-items-center">
                  <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                  <label for="rememberme1">Remember me</label>
                </div><router-link to="/password-forgot" custom v-slot="{ navigate }">
                <a class="font-medium no-underline ml-2 text-right cursor-pointer" @click="navigate"
                  style="color: var(--primary-color)">Forgot password?</a></router-link>
              </div>

              <Button label="Sign In" @click="login" :loading="loading" class="w-full mr-2 mb-2 p-3 text-xl"></Button>
            </div>
            <hr/>
            <div class="flex flex-wrap gap-2">
              <Button type="button" class="google" @click="socialite('google')" >
                <span class=" flex align-items-center px-2 bg-purple-700 text-white">
                <i className="pi pi-google"></i>
                </span>
                <span className="px-3 py-2 flex align-items-center text-white">Google</span>
              </Button>
              <Button @click="socialite('facebook')" type ="button" class="facebook">
                <span class="flex align-items-center px-2 bg-blue-500 text-white">
                  <i className="pi pi-facebook"></i>
                </span>
                <span className="px-3 py-2 flex align-items-center text-white">Facebook</span>
              </Button>
              <Button type="button" class="discord" @click="socialite('discord')">
                <span class=" flex align-items-center px-2 bg-bluegray-800 text-white">
                <i className="pi pi-discord"></i>
                </span>
                <span className="px-3 py-2 flex align-items-center text-white">Discord</span>
              </Button>
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
import * as notificationActions from '@/store/modules/notification/types/actions';
import * as actions from '@/store/modules/auth/types/actions';
import { mapActions } from 'vuex';
const { layoutConfig } = useLayout();
import { required, minLength, email } from '@vuelidate/validators';
import useVuelidate from "@vuelidate/core";

export default {
  name: 'AuthComponent',
  data() {
    return {
      loading:false,
      clickedEmail: false,
      clickedPassword: false,
      loginData: {
        email: '',
        checked: false,
        password: ''
      }
    };
  },
  setup() {
    const v = useVuelidate();
    return { v };
  },
  validations: {
    loginData: {
      email: {
        required,
        email
      },
      password: {
        required
      }
    }
  },
  computed: {
    logoUrl() {
      return `/img/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.png`;
    }
  },
  methods: {
    ...mapActions('AuthService', {
      fetchLoggedUser: actions.FETCH_LOGGED_USER,
      signIn: actions.SIGN_IN,
      signInByProvider: actions.SIGN_IN_BY_PROVIDER
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
    validationLoginForm() {
      this.v.$touch();
      return this.v.$invalid;
    },
    async login() {
      this.loading = true;
      if (!this.validationLoginForm()) {
        try {

          const isSignInSuccessful = await this.signIn(this.loginData);
          this.setErrorNotification("welcome notification");

          if (isSignInSuccessful !== false) {
            await this.fetchLoggedUser();
            this.$router.replace(this.$route.query.redirect || '/library/');
          }
          this.loading = false;
          
        } catch (error) {
          this.setErrorNotification(error.message);
        }
        return false;
      }
    },
    async socialite(provider) {
      await this.signInByProvider(provider);
    }
  }
};

</script>

<style lang="scss" scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
.google {
  background: linear-gradient(to left, var(--purple-600) 50%, var(--purple-700) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  border-color: var(--purple-700);
  display: flex;
  align-items: stretch;
  padding: 0;

  &:enabled:hover {
    background: linear-gradient(to left, var(--purple-600) 50%, var(--purple-700) 50%);
    background-size: 200% 100%;
    background-position: left bottom;
    border-color: var(--purple-700);
  }

  &:focus {
    box-shadow: 0 0 0 1px var(--purple-400);
  }
}

.facebook {
  background: linear-gradient(to left, var(--blue-400) 50%, var(--blue-500) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  border-color: var(--blue-500);
  padding: 0;
  display: flex;
  align-items: stretch;

  &:enabled:hover {
    background: linear-gradient(to left, var(--blue-400) 50%, var(--blue-500) 50%);
    background-size: 200% 100%;
    background-position: left bottom;
    border-color: var(--blue-500);
  }

  &:focus {
    box-shadow: 0 0 0 1px var(--blue-200);
  }
}

.discord {
  background: linear-gradient(to left, var(--bluegray-700) 50%, var(--bluegray-800) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  border-color: var(--bluegray-800);
  padding: 0;
  display: flex;
  align-items: stretch;

  &:enabled:hover {
    background: linear-gradient(to left, var(--bluegray-700) 50%, var(--bluegray-800) 50%);
    background-size: 200% 100%;
    background-position: left bottom;
    border-color: var(--bluegray-800);
  }

  &:focus {
    box-shadow: 0 0 0 1px var(--purple-500);
  }
}

.template-button .p-button.twitter {
  background: linear-gradient(to left, var(--blue-400) 50%, var(--blue-500) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  color: #fff;
  border-color: var(--blue-500);
}

.template-button .p-button.twitter:hover {
  background-position: left bottom;
}

.template-button .p-button.twitter i {
  background-color: var(--blue-500);
}

.template-button .p-button.twitter:focus {
  box-shadow: 0 0 0 1px var(--blue-200);
}

.template-button .p-button.slack {
  background: linear-gradient(to left, var(--orange-400) 50%, var(--orange-500) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  color: #fff;
  border-color: var(--orange-500);
}

.template-button .p-button.slack:hover {
  background-position: left bottom;
}

.template-button .p-button.slack i {
  background-color: var(--orange-500);
}

.template-button .p-button.slack:focus {
  box-shadow: 0 0 0 1px var(--orange-200);
}

.template-button .p-button.amazon {
  background: linear-gradient(to left, var(--yellow-400) 50%, var(--yellow-500) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  color: #000;
  border-color: var(--yellow-500);
}

.template-button .p-button.amazon:hover {
  background-position: left bottom;
}

.template-button .p-button.amazon i {
  background-color: var(--yellow-500);
}

.template-button .p-button.amazon:focus {
  box-shadow: 0 0 0 1px var(--yellow-200);
}

.template-button .p-button.discord {
  background: linear-gradient(to left, var(--bluegray-700) 50%, var(--bluegray-800) 50%);
  background-size: 200% 100%;
  background-position: right bottom;
  transition: background-position 0.5s ease-out;
  color: #fff;
  border-color: var(--bluegray-800);
}

.template-button .p-button.discord:hover {
  background-position: left bottom;
}

.template-button .p-button.discord i {
  background-color: var(--bluegray-800);
}

.template-button .p-button.discord:focus {
  box-shadow: 0 0 0 1px var(--bluegray-500);
}

@media screen and (max-width: 960px) {
  -button .p-button {
    margin-bottom: 0.5rem;
  }

  -button .p-button:not(.p-button-icon-only) {
    display: flex;
    flex-wrap: wrap;
  }

  -button .p-buttonset .p-button {
    margin-bottom: 0;
  }
}

</style>
