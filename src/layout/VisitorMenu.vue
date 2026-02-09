<template>
    <!-- Desktop menu (auto-hidden on mobile ≤991px via _topbar.scss) -->
    <div class="layout-topbar-menu">
        <button @click="onTopBarActionButton('/login');" :class="{ 'active-route': checkActiveRoute('/login') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-user"></i>
                <span>Login</span>
        </button>
        <button @click="onTopBarActionButton('/signup/');" :class="{ 'active-route': checkActiveRoute('/signup/') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-user-plus"></i>
                <span>Register</span>
        </button>
    </div>

    <!-- Mobile dropdown menu (triggered by 3-dot button in AppTopbar) -->
    <Menu ref="mobileMenu" :model="getMobileMenuItems()" :popup="true" />
</template>

<script>
import Menu from 'primevue/menu';
import { ref } from 'vue';

export default {
    name: 'NotAuthorizedMenu',
    components: { Menu },
    setup() {
        const mobileMenu = ref(null);
        return { mobileMenu };
    },
    methods: {
        checkActiveRoute(item) {
            const currentPath = this.$router.currentRoute.value.path;
            return currentPath === item || currentPath === item + '/' || currentPath + '/' === item;
        },
        onTopBarActionButton(route) {
            this.$router.push(route);
        },
        toggleMobileMenu(event) {
            if (this.mobileMenu) {
                this.mobileMenu.toggle(event);
            }
        },
        getMobileMenuItems() {
            return [
                {
                    label: 'Login',
                    icon: 'pi pi-user',
                    command: () => {
                        this.$router.push('/login');
                    }
                },
                {
                    label: 'Register',
                    icon: 'pi pi-user-plus',
                    command: () => {
                        this.$router.push('/signup/');
                    }
                }
            ];
        }
    }
};
</script>
