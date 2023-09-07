<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Vimage Logo" class="mb-5 w-6rem flex-shrink-0" />
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <img src="/demo/images/login/avatar.png" alt="Image" height="50" class="mb-3" />
                        <div class="text-900 text-3xl font-medium mb-3">Oopsy, cant remember password?</div>
                        <span class="text-600 font-medium">Enter your e-mail below and we'll send you a link</span>
                    </div>
                    <Form role="form" @submit.prevent="onForgotPassword">
                        <div>
                            <label for="email" class="block text-900 text-xl font-medium mb-2">Enter your e-mail</label>
                            <div class="error bg-white text-danger mb-3"
                                v-if="!v$.forgotPasswordData.email.required && clickedEmail">
                               Enter valid e-mail!
                            </div>
                            <InputText id="email-input" type="text" name="email" :validateOnBlur="false"
                                @blur="clickEmail"
                                v-model="v$.forgotPasswordData.email.$model" placeholder="E-mail"
                                class="w-full md:w-30rem mb-5" style="padding: 1rem" />

                            <Button type="submit" label="Restore" class="w-full p-3 text-xl"></Button>
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
import useVuelidate from "@vuelidate/core";
const { layoutConfig } = useLayout();
import { email, required } from 'vuelidate/lib/validators';
import { mapActions } from 'vuex';
import * as actions from '@/store/modules/auth/types/actions';
import * as notificationActions from '@/store/modules/notification/types/actions';

export default {
    name: 'ForgotPassword',
    setup() { return { v$: useVuelidate() } },
    data() {
        return {
            clickedEmail: false,
            forgotPasswordData: {
                email: ''
            }
        };
    },
    validations: {
        forgotPasswordData: {
            email: {
                required,
                email
            }
        }
    },
    methods: {
        ...mapActions('AuthService', {
            forgotPassword: actions.FORGOT_PASSWORD
        }),

        ...mapActions('notification', {
            setErrorNotification: notificationActions.SET_ERROR_NOTIFICATION
        }),

        clickEmail() {
            this.clickedEmail = true;
        },

        validationRestorePasswordForm() {
            this.v$.$touch();
            return this.v$.$invalid;
        },

        async onForgotPassword() {
            if (!this.validationRestorePasswordForm()) {
                try {
                    await this.forgotPassword(this.forgotPasswordData);

                    await this.$router.push({ name: 'ResetPassword' });
                } catch (error) {
                    this.setErrorNotification(error);
                }
            }
        }
    },
    computed: {
        logoUrl() {
            return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
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
