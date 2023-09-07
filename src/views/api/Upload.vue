<template>

    <navbar btnBackground="bg-gradient-success" />
    <div class="page-header align-items-start min-vh-100 bg-dark" style="
                      background-image: url(#);
                    ">
        <span class="mask"></span>

        <div class="container px-md-0">

                <div class="vimage-container px-0">
                    <div><VideoUpload></VideoUpload></div>
            </div>
        </div>
        <footer class="footer position-absolute bottom-0 p-2 w-100">
            <div class="container">
                <div class="row align-items-center justify-content-lg-between">
                    <div class="col-12 my-auto">
                        <div class="copyright text-center text-sm text-white">
                            © {{ new Date().getFullYear() }}, made with
                            <i class="fa fa-heart" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script>
import VideoUpload from "@/components/VideoUpload.vue";
import showSwal from "@/mixins/showSwal";
import { mapMutations } from "vuex";
//import * as Yup from 'yup';

export default {
    name: "Upload",
    components: {
        VideoUpload
    },
    data() {
        return {
      /*      user: { email: "admin@jsonapi.com", password: "secret" },
            schema: Yup.object().shape({
                email: Yup.string().email("Email has to be a valid email address").required("Email is a required input"),
                password: Yup.string().required("Password is a required input")
            }),
            */
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
        previewVideo(){
            let video = document.getElementById('video-preview');
            let reader = new FileReader();

            reader.readAsDataURL( this.file );
            reader.addEventListener('load', function(){
                video.src = reader.result;
            });

        },
    },
};
</script>
