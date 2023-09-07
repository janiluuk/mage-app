<template>
    
    <navbar btnBackground="bg-gradient-success" />
    <div class="page-header align-items-start min-vh-100 bg-gray-900" style="
                      background-image: url(#);
                    ">
        <span class="mask bg-gradient-dark opacity-6"></span>

        <div class="container mb-6">
            <div class="row">

                <div class="header w-100  d-flex justify-content-center">
                    <div class="container">
                        <div class="header-body text-center mb-7">
                            <div class="row pt-12 justify-content-center">
                                <div class="text-center" style="margin-bottom: 5px;">
                                    <h1 class="text-vibrant">Not found, sorry mate! </h1>
                                    <h4 class="text-white">Try <a href="/">main page</a>?
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <footer class="footer position-absolute bottom-2 py-2 w-100">
            <div class="container">
                <div class="row align-items-center justify-content-lg-between">
                    <div class="col-12 col-md-6 my-auto">
                        <div class="copyright text-center text-sm text-white text-lg-start">
                            © {{ new Date().getFullYear() }}, made with
                            <i class="fa fa-heart" aria-hidden="true"></i>
                        </div>
                    </div>
                    <div class="col-12 col-md-6">
                        <ul class="nav nav-footer justify-content-center justify-content-lg-end">
                           
                            <li class="nav-item">
                                <a href="#" class="nav-link text-white"
                                    target="_blank">About Us</a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link text-white"
                                    target="_blank">Blog</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script>
import Navbar from "@/pages/PageLayout/Navbar.vue";
import showSwal from "@/mixins/showSwal";
import { mapMutations } from "vuex";

export default {
    name: "Upload",
    components: {
        Navbar,
    },
    data() {
        return {
           
        };
    },
    computed: {
        loggedIn() {
            return this.$store.state.auth.loggedIn;
        }
    },
    beforeMount() {
        this.toggleEveryDisplay();
        this.toggleHideConfig();
    },
    beforeUnmount() {
        this.toggleEveryDisplay();
        this.toggleHideConfig();
    },
    methods: {
        ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),
        async handleProcess() {
            try {
                await this.$store.dispatch('auth/login', this.user);
                this.$router.push({ name: 'Dashboard' })
            } catch (error) {
                showSwal.methods.showSwal({
                    type: "error",
                    message: "Invalid credentials!",
                    width: 500
                });
            }
        },

    },
};
</script>
