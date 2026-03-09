<script setup>
import { computed, watch, ref, onMounted } from 'vue';
import AppTopbar from './AppTopbar.vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppConfig from './AppConfig.vue';
import ApiUnavailable from '@/views/pages/ApiUnavailable.vue';
import { useLayout } from '@/layout/composables/layout';
import NotificationsComponent from '@/components/notification/NotificationsComponent.vue';
import { API_BASE_URL } from '@/utils/api-base-urls';

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

// API health check — null = checking, true = reachable, false = unreachable
const apiStatus = ref(null);

const checkApi = async () => {
    apiStatus.value = null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        // Raw fetch to avoid apiClient interceptors (which remove tokens on 401 etc.)
        // Any HTTP response — even 401/404 — means the server is reachable.
        await fetch(API_BASE_URL || '/api/v1', {
            method: 'HEAD',
            signal: controller.signal,
        });
        apiStatus.value = true;
    } catch (err) {
        // AbortError (timeout) or TypeError (network failure) = API unreachable
        apiStatus.value = false;
    } finally {
        clearTimeout(timeout);
    }
};

onMounted(checkApi);

const outsideClickListener = ref(null);
const visibleFull = ref(false);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-theme-light': layoutConfig.darkTheme.value === 'light',
        'layout-theme-dark': layoutConfig.darkTheme.value === 'dark',
        'layout-overlay': layoutConfig.menuMode.value === 'overlay',
        'layout-static': layoutConfig.menuMode.value === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive.value && layoutConfig.menuMode.value === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive.value,
        'layout-mobile-active': layoutState.staticMenuMobileActive.value,
        'p-input-filled': layoutConfig.inputStyle.value === 'filled',
        'p-ripple-disabled': !layoutConfig.ripple.value
    };
});
const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive.value = false;
                layoutState.staticMenuMobileActive.value = false;
                layoutState.menuHoverActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');

    return !(!sidebarEl || sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
</script>

<template>
    <!-- API unreachable — show full-screen unavailable page -->
    <ApiUnavailable v-if="apiStatus === false" @retry="checkApi" />

    <!-- API reachable — normal layout -->
    <div v-else-if="apiStatus === true" class="layout-wrapper" :class="containerClass">

        <app-topbar></app-topbar>
        
        <div class="layout-sidebar">
            <app-sidebar></app-sidebar>
        </div>
        <div class="layout-main-container">
            <NotificationsComponent></NotificationsComponent>

            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask"></div>

    </div>

    <!-- Checking API — brief loading state -->
    <div v-else class="surface-ground flex align-items-center justify-content-center min-h-screen">
        <i class="pi pi-spin pi-spinner text-4xl text-500"></i>
    </div>
</template>

<style lang="scss">

</style>
