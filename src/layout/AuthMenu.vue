<template>
        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <button @click="onTopBarActionButton('/upload/');" :class="{ 'active-route': checkActiveRoute('/upload/') }"
                class="p-link topbar-button">
                <i class="pi pi-plus mr-2"></i>
                <span>Create!</span>
            </button>
            <button @click="onTopBarActionButton('/library/');" :class="{ 'active-route': checkActiveRoute('/library/') }"
                class="p-link topbar-button">
                <i class="pi pi-images mr-2"></i>
                <span>My library</span>
            </button>
            <Menu ref="menu" :model="getOverlayMenu()" :popup="true" />
            <button icon="pi pi-angle-down" :label="user.email" @click="toggleMenu"
                :class="{ 'active-route': checkActiveRoute('/profile/') }" class="p-link topbar-button">
                <i class="pi pi-user mr-2"></i>
                <span>Account</span>

            </button>
        </div>
    <Toast/>
</template>

<script>
import * as authActions from '@/store/modules/auth/types/actions';
import * as authGetters from '@/store/modules/auth/types/getters';
import * as notificationActions from '@/store/modules/notification/types/actions';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { mapActions, mapGetters } from 'vuex';

const menu = ref(null);
const activeRoute = ref(false);
const router = useRouter();

export default {

    name: 'AuthorizedMenu',
    setup() {
        const menu = ref(null);
        const toast = useToast();
        const topbarMenuActive = ref(false);
        return { menu, toast, topbarMenuActive };
    },
    props: {
        user: {
            login: String,
            email: String,
            profile_picture: String
        },
        topbarMenuClasses: { type: Object, default: {'layout-topbar-menu-mobile-active': false} }

    },
    defaults: {
        topbarMenuActive: { value: null },
    },
    computed: {
    ...mapGetters('AuthService', {
      getLoggedUser: authGetters.GET_LOGGED_USER
    }),
    topBarMenuClasses() {
        return {
            'layout-topbar-menu-mobile-active': this.topbarMenuActive.value
        };
    }
  },
    methods: {
        onTopBarActionButton(route) {
          activeRoute.value = route;
            this.$router.push(route);
        },
        toggleMenu(event) {
            this.$refs.menu.toggle(event);
        },
        getOverlayMenu() {
            return ([
                {
                    label: 'Logout',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        this.exit();
                        this.signOut();
                        toast.add({ severity: 'info', summary: 'CYA!', detail: 'You have been logged out.' });
                    }
                }

            ]);
        },
        checkActiveRoute(item) {
            return activeRoute.value === item;
        },
        ...mapActions('AuthService', {
            signOut: authActions.SIGN_OUT
        }),

        ...mapActions('notification', {
            setErrorNotification: notificationActions.SET_ERROR_NOTIFICATION
        }),

        async exit() {
            try {
                await this.signOut();
                this.$router.push("/login");
            } catch (error) {
                this.setErrorNotification(error);
            }
        }
    }
};
</script>

<style scoped lang="scss">
@import '@/assets/vimage.scss';
button.p-link.topbar-button {
  font-size: 1.2rem;
  display: flex;
  font-weight: 600;
  height: 5rem;
  align-items: center;
  border-radius: 0;
  padding: 0 1rem;

  i.pi {
    font-size: 1.4rem;
  }

  &:focus {
    box-shadow: none;
    background-color: transparent;
  }

  &:hover, &:active {
    background-color: var(--surface-hover);
  }

  &.active-route {
    box-shadow: inset 0 -3px 0 #ffd64e;
    background-color: transparent;
  }
}
</style>
