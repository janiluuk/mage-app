<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AuthMenu from './AuthMenu.vue';
import VisitorMenu from './VisitorMenu.vue';
import store from '../store';

const menu = ref(null);

const { layoutConfig, onMenuToggle } = useLayout();

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const activeRoute = ref(false);
const loggedInUser = computed(() => store.getters['AuthService/GET_LOGGED_USER']);

const router = useRouter();
onMounted(() => {
    store.dispatch('AuthService/FETCH_LOGGED_USER');

    bindOutsideClickListener();
    activeRoute.value = router.currentRoute.value.path;
    AuthMenu
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme ? 'logo-white' : 'logo-dark'}.svg`;
});

const onTopBarActionButton = (route) => {
    activeRoute.value = route;
    router.push(route);
};
const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const onSettingsClick = () => {
    topbarMenuActive.value = false;
    router.push('/documentation');
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});
const checkActiveRoute = (item) => {
    return activeRoute.value === item;
};

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

const overlayMenuItems = ref([
    {
        label: 'View profile',
        icon: 'pi pi-save',
        to: '/profile'
    },

    {
        label: 'My account',
        icon: 'pi pi-refresh',
        to: '/account'
    },
    {
        label: 'Logout',
        icon: 'pi pi-trash',
        to: '/signout'
    }

]);
</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>VMG</span>
        </router-link>


        <div class="layout-topbar-logo"></div>
        <AuthMenu
            v-if="loggedInUser"
            :user="loggedInUser"
            :topbarMenuActive="topbarMenuActive"
            :topbarMenuClasses="topbarMenuClasses"
          ></AuthMenu>
        <VisitorMenu v-else></VisitorMenu>

    </div>
</template>

