
<script>

import VideoUpload from "@/components/VideoUpload.vue";
export default {
    name: "Upload",
    components: {
        VideoUpload,
    },
    computed: {
        loggedIn() {
            return this.$store.state.auth.loggedIn;
        }
    },

    methods: {

        previewVideo() {
            let video = document.getElementById('video-preview');
            let reader = new FileReader();

            reader.readAsDataURL(this.file);
            reader.addEventListener('load', function () {
                video.src = reader.result;
            });

        },
    },
};
</script>


<template>

            <div class="vimage-container px-0">
                <div>
                    <VideoUpload></VideoUpload>
                </div>
            </div>

</template>
