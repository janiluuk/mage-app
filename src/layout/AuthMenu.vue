<template>
        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <button @click="onTopBarActionButton('/upload/');" :class="{ 'active-route': checkActiveRoute('/upload/') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-upload"></i>
                <span>Upload content</span>
            </button>
            <button @click="onTopBarActionButton('/library/');" :class="{ 'active-route': checkActiveRoute('/library/') }"
                class="p-link layout-topbar-button">
                <i class="pi pi-images"></i>
                <span>My gallery</span>
            </button>




            <Menu ref="menu" :model="getOverlayMenu()" :popup="true" />
            <button icon="pi pi-angle-down" :label="user.email" @click="toggleMenu"
                :class="{ 'active-route': checkActiveRoute('/profile/') }" class="p-link layout-topbar-button">
                <i class="pi pi-user"></i> 
                <span></span>               

            </button>
        </div>
    <Toast/>
</template>

<script>
import { useStore } from 'vuex'
import { mapActions, mapGetters } from 'vuex'
import * as authActions from '@/store/modules/auth/types/actions';
import * as authGetters from '@/store/modules/auth/types/getters';
import * as notificationActions from '@/store/modules/notification/types/actions';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

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
                alert("signed out");
            } catch (error) {
                this.setErrorNotification(error);
            }
        }
    }
};
</script>