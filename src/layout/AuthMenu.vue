<template>
    <!-- Desktop menu (auto-hidden on mobile ≤991px via _topbar.scss) -->
    <div class="layout-topbar-menu">
        <button @click.stop="onTopBarActionButton('/upload/');" :class="{ 'active-route': checkActiveRoute('/upload/') }"
            class="p-link topbar-button">
            <i class="pi pi-plus mr-2"></i>
            <span>Create!</span>
        </button>
        <button @click="onTopBarActionButton('/library');" :class="{ 'active-route': checkActiveRoute('/library') }"
            class="p-link topbar-button">
            <i class="pi pi-images mr-2"></i>
            <span>My library</span>
        </button>
        <Menu ref="accountMenu" :model="getAccountMenuItems()" :popup="true" />
        <button @click="toggleAccountMenu" :class="{ 'active-route': checkActiveRoute('/profile') }"
            class="p-link topbar-button">
            <i class="pi pi-user mr-2"></i>
            <span>Account</span>
        </button>
    </div>

    <!-- Mobile dropdown menu (triggered by 3-dot button in AppTopbar) -->
    <Menu ref="mobileMenu" :model="getMobileMenuItems()" :popup="true" class="mobile-topbar-menu" />
    <Toast/>
</template>

<script>
import * as authActions from '@/store/modules/auth/types/actions';
import * as authGetters from '@/store/modules/auth/types/getters';
import * as notificationActions from '@/store/modules/notification/types/actions';
import Menu from 'primevue/menu';
import { ref } from 'vue';
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'AuthorizedMenu',
    components: {
        Menu
    },
    setup() {
        const accountMenu = ref(null);
        const mobileMenu = ref(null);
        return { accountMenu, mobileMenu };
    },
    props: {
        user: {
            login: String,
            email: String,
            profile_picture: String
        }
    },
    computed: {
        ...mapGetters('AuthService', {
            getLoggedUser: authGetters.GET_LOGGED_USER
        })
    },
    methods: {
        onTopBarActionButton(route) {
            this.$router.push(route);
        },
        toggleAccountMenu(event) {
            event.preventDefault();
            event.stopPropagation();
            if (this.accountMenu) {
                this.accountMenu.toggle(event);
            }
        },
        toggleMobileMenu(event) {
            if (this.mobileMenu) {
                this.mobileMenu.toggle(event);
            }
        },
        getAccountMenuItems() {
            return [
                {
                    label: 'Profile',
                    icon: 'pi pi-user',
                    command: () => {
                        this.$router.push('/profile');
                    }
                },
                {
                    separator: true
                },
                {
                    label: 'Logout',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        this.exit();
                        if (this.$toast) {
                            this.$toast.add({ severity: 'info', summary: 'CYA!', detail: 'You have been logged out.', life: 3000 });
                        }
                    }
                }
            ];
        },
        getMobileMenuItems() {
            return [
                {
                    label: 'Create!',
                    icon: 'pi pi-plus',
                    command: () => {
                        this.$router.push('/upload/');
                    }
                },
                {
                    label: 'My Library',
                    icon: 'pi pi-images',
                    command: () => {
                        this.$router.push('/library');
                    }
                },
                {
                    separator: true
                },
                {
                    label: 'Profile',
                    icon: 'pi pi-user',
                    command: () => {
                        this.$router.push('/profile');
                    }
                },
                {
                    label: 'Logout',
                    icon: 'pi pi-sign-out',
                    command: () => {
                        this.exit();
                        if (this.$toast) {
                            this.$toast.add({ severity: 'info', summary: 'CYA!', detail: 'You have been logged out.', life: 3000 });
                        }
                    }
                }
            ];
        },
        checkActiveRoute(item) {
            const currentPath = this.$router.currentRoute.value.path;
            return currentPath === item || currentPath === item + '/' || currentPath + '/' === item;
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
            } catch (error) {
                this.setErrorNotification(error);
            }
        }
    }
};
</script>

<style scoped lang="scss">
@import '@/assets/mage.scss';
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
