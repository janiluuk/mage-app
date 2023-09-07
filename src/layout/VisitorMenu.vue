<template>
    <div class="layout-topbar-menu" :class="topbarMenuClasses">
        <button @click="onTopBarActionButton('/login');" :class="{ 'active-route': checkActiveRoute('/login/') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-user"></i>
                <span>Login</span>
        </button>
        <button @click="onTopBarActionButton('/signup/');" :class="{ 'active-route': checkActiveRoute('/signup/') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-images"></i>
                <span>Register</span>
        </button>
    </div>
  </template>
  
  <script>

    import { mapActions, mapGetters } from 'vuex';
    import { useLayout } from '@/layout/composables/layout';
    const { layoutConfig, onMenuToggle } = useLayout();
    import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

    const activeRoute = ref(false);
    const topbarMenuClasses = computed(() => {
        return {
            'layout-topbar-menu-mobile-active': topbarMenuActive.value
        };
    });
    const topbarMenuActive = ref(false);

       export default {
        defaults: {
            activeRoute: false,
            topbarMenuActive: false
        },
        name: 'NotAuthorizedMenu',
        methods: {
            checkActiveRoute(item) {
                return activeRoute.value === item;
            },
            onTopBarActionButton(route) {
                activeRoute.value = route;
                this.$router.push(route);
            }
        },
        computed:  {
            topbarMenuClasses() {
                return {
                'layout-topbar-menu-mobile-active': topbarMenuActive.value
            };
            }
        }
    };
  </script>