<template>
    <!-- Desktop menu (auto-hidden on mobile ≤991px via _topbar.scss) -->
    <div class="layout-topbar-menu">
        <button
            @click="onTopBarActionButton('/upload')"
            :class="{ 'active-route': checkActiveRoute('/upload') }"
            class="p-link topbar-button"
        >
            <i class="pi pi-plus mr-2"></i>
            <span>Create!</span>
        </button>
        <button
            @click="onTopBarActionButton('/library')"
            :class="{ 'active-route': checkActiveRoute('/library') }"
            class="p-link topbar-button"
        >
            <i class="pi pi-images mr-2"></i>
            <span>My library</span>
        </button>

        <div class="topbar-separator"></div>

        <!-- User dropdown trigger -->
        <button
            @click="toggleUserMenu"
            class="p-link topbar-user-button"
            :class="{ 'active-route': checkActiveRoute('/profile') }"
            aria-haspopup="true"
            aria-label="User menu"
        >
            <div class="user-avatar">
                <img
                    v-if="user && user.profile_picture"
                    :src="user.profile_picture"
                    alt="avatar"
                    class="user-avatar-img"
                />
                <i v-else class="pi pi-user"></i>
            </div>
            <span class="user-name">{{ displayName }}</span>
            <i class="pi pi-chevron-down user-chevron"></i>
        </button>
        <Menu ref="userMenu" :model="userMenuItems" :popup="true" class="user-dropdown-menu" />
    </div>

    <!-- Mobile dropdown menu (triggered by 3-dot button in AppTopbar) -->
    <Menu ref="mobileMenu" :model="mobileMenuItems" :popup="true" class="mobile-topbar-menu" />
    <Toast />
</template>

<script>
import * as authActions from '@/store/modules/auth/types/actions';
import * as authGetters from '@/store/modules/auth/types/getters';
import * as notificationActions from '@/store/modules/notification/types/actions';
import Menu from 'primevue/menu';
import { ref, computed } from 'vue';
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'AuthorizedMenu',
    components: {
        Menu
    },
    setup() {
        const userMenu = ref(null);
        const mobileMenu = ref(null);
        return { userMenu, mobileMenu };
    },
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    computed: {
        ...mapGetters('AuthService', {
            getLoggedUser: authGetters.GET_LOGGED_USER
        }),
        displayName() {
            if (this.user?.login) return this.user.login;
            if (this.user?.email) return this.user.email.split('@')[0];
            return 'Account';
        },
        userMenuItems() {
            return [
                {
                    label: this.displayName,
                    items: [
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
                            class: 'user-menu-logout',
                            command: () => {
                                this.exit();
                            }
                        }
                    ]
                }
            ];
        },
        mobileMenuItems() {
            return [
                {
                    label: 'Navigation',
                    items: [
                        {
                            label: 'Create!',
                            icon: 'pi pi-plus',
                            command: () => {
                                this.$router.push('/upload');
                            }
                        },
                        {
                            label: 'My Library',
                            icon: 'pi pi-images',
                            command: () => {
                                this.$router.push('/library');
                            }
                        }
                    ]
                },
                {
                    separator: true
                },
                {
                    label: 'Account',
                    items: [
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
                            }
                        }
                    ]
                }
            ];
        }
    },
    methods: {
        onTopBarActionButton(route) {
            this.$router.push(route);
        },
        toggleUserMenu(event) {
            event.preventDefault();
            event.stopPropagation();
            if (this.userMenu) {
                this.userMenu.toggle(event);
            }
        },
        toggleMobileMenu(event) {
            if (this.mobileMenu) {
                this.mobileMenu.toggle(event);
            }
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
                this.$router.push('/login');
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

    &:hover,
    &:active {
        background-color: var(--surface-hover);
    }

    &.active-route {
        box-shadow: inset 0 -3px 0 #ffd64e;
        background-color: transparent;
    }
}

.topbar-separator {
    width: 1px;
    height: 2rem;
    background-color: var(--surface-border);
    margin: 0 0.5rem;
    align-self: center;
}

.topbar-user-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 5rem;
    padding: 0 0.75rem;
    border-radius: 0;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
    background: none;
    color: var(--text-color);

    &:hover {
        background-color: var(--surface-hover);
    }

    &:focus {
        box-shadow: none;
    }

    &.active-route {
        box-shadow: inset 0 -3px 0 #ffd64e;
    }
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color-text);
    font-size: 0.9rem;
    overflow: hidden;
    flex-shrink: 0;
}

.user-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-name {
    font-weight: 600;
    font-size: 0.95rem;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.user-chevron {
    font-size: 0.7rem;
    color: var(--text-color-secondary);
}

@media (max-width: 991px) {
    .topbar-separator {
        display: none;
    }

    .user-name,
    .user-chevron {
        display: none;
    }
}
</style>

<style>
/* Unscoped — targets the PrimeVue popup Menu rendered in a portal */
.user-dropdown-menu {
    min-width: 200px;
}

.user-dropdown-menu .user-menu-logout .p-menuitem-icon,
.user-dropdown-menu .user-menu-logout .p-menuitem-text {
    color: var(--red-400) !important;
}
</style>
