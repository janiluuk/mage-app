<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';
import AuthMenu from './AuthMenu.vue';
import VisitorMenu from './VisitorMenu.vue';

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
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `/public/img/vimage-logo.png`;
});

const birdUrl = computed(() => {
    return `/public/img/bird.png`;
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

</script>

<template>
    <div class="layout-topbar">
<!--        <button class="p-link layout-menu-button layout-topbar-button ml-0 mr-2" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button> -->
        <router-link to="/" class="layout-topbar-logo">
            <img :src="birdUrl" alt="logo" style="height:4.0rem"/>
            <img :src="logoUrl" height=180 alt="logo" style="height:2.4rem;margin-top:14px;" />
        </router-link>
        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

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
<style scoped lang="scss">
@import '@/assets/vimage.scss';
.layout-topbar .layout-topbar-logo {
  border-radius: 0;
  img {
    height: 5rem;
  }
  &:focus {
    box-shadow: none;
  }
}
</style>
