<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';
import AppConfig from '@/layout/AppConfig.vue';

const { layoutConfig } = useLayout();

const smoothScroll = (id) => {
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
};

const logoUrl = computed(() => {
    return `layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});
</script>

<template>
    <div
        class="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static mb-3">
        <a class="flex align-items-center" href="#"> <img :src="logoUrl" alt="VMG" height="50"
                class="mr-0 lg:mr-2" /><span class="text-900 font-medium text-2xl line-height-3 mr-8">VImage</span>
        </a>
        <a class="cursor-pointer block lg:hidden text-700 p-ripple" v-ripple
            v-styleclass="{ selector: '@next', enterClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }">
            <i class="pi pi-bars text-4xl"></i>
        </a>
        <div class="align-items-center surface-0 flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full left-0 px-6 lg:px-0 z-2"
            style="top: 120px">
            <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row cursor-pointer">
                <li>
                    <a @click="$router.push('/upload')"
                        class="flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3 p-ripple" v-ripple>
                        <span>Upload video</span>
                    </a>
                </li>
                <li>
                    <a @click="$router.push('/library')"
                        class="flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3 p-ripple" v-ripple>
                        <span>My Library</span>
                    </a>
                </li>

                <li>
                    <a @click="$router.push('/guide')"
                        class="flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3 p-ripple" v-ripple>
                        <span>Guide</span>
                    </a>
                </li>
                <li>
                    <a @click="$router.push('/profile')"
                        class="flex m-0 md:ml-5 px-0 py-3 text-900 font-medium line-height-3 p-ripple" v-ripple>
                        <span>My profile</span>
                    </a>
                </li>

            </ul>
            <div
                class="flex justify-content-between lg:block border-top-1 lg:border-top-none surface-border py-3 lg:py-0 mt-3 lg:mt-0">
                <Button label="Login"
                    class="p-button-text p-button-rounded border-none font-light line-height-2 text-blue-500"
                    @click="$router.push('/login')" role="link"></Button>
                <Button label="Register"
                    class="p-button-rounded border-none ml-5 font-light text-white line-height-2 bg-blue-500"
                    @click="$router.push('/signup')" role="link"></Button>
            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: "NavHeader",

    computed: {
        getCurrentPage: function() {
            return this.$route.name;
        }
    },
    methods: {
        loggedIn() {
        return this.$store.state.auth.loggedIn;
        },
        logout() {
        this.$store.dispatch('auth/logout'); // replace 'auth/logout' with the correct mutation in your store
        // also clear the token from local storage or cookies if you're storing it there
        this.$router.push('/login'); // redirect the user to the login page
        }
  },
}
</script>