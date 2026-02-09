<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '../store';
import AuthMenu from './AuthMenu.vue';
import VisitorMenu from './VisitorMenu.vue';

const { layoutConfig, onMenuToggle } = useLayout();

const loggedInUser = computed(() => store.getters['AuthService/GET_LOGGED_USER']);
const authMenuRef = ref(null);
const visitorMenuRef = ref(null);

const router = useRouter();
onMounted(() => {
    store.dispatch('AuthService/FETCH_LOGGED_USER');
});

const logoUrl = computed(() => {
    return `/public/img/mage-logo.png`;
});

const onTopBarMenuButton = (event) => {
    if (authMenuRef.value) {
        authMenuRef.value.toggleMobileMenu(event);
    } else if (visitorMenuRef.value) {
        visitorMenuRef.value.toggleMobileMenu(event);
    }
};
</script>

<template>
    <div class="layout-topbar">
        <button class="p-link layout-menu-button layout-topbar-button ml-0 mr-2" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>Mage:stable</span>
        </router-link>
        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton($event)">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-logo"></div>
        <AuthMenu
            v-if="loggedInUser"
            ref="authMenuRef"
            :user="loggedInUser"
          ></AuthMenu>
        <VisitorMenu v-else ref="visitorMenuRef"></VisitorMenu>

    </div>
</template>
<style scoped lang="scss">
@import '@/assets/mage.scss';
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
