<template>
    <h5>Webcam preview</h5>

    <div class="grid">
        <div class="col-12 lg:col-5">
            <div class="card">

                <video ref="webcam" id="webcam" width="320" height="180" autoplay></video>
            </div>
        </div>
        <div class="col-12 lg:col-5">

            <div class="card">
                <p>{{ messageText }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineExpose, onMounted } from 'vue';

const webcam = ref(null);
const loading = ref(true);
const messageText = ref('');

onMounted(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        webcam.value.srcObject = stream;
        await webcam.value.play();
        loading.value = false;
    } catch (e) {
        messageText.value = 'An error occurred while accessing the webcam: ' + e.message;
    }
});

defineExpose({
    webcam,
    loading,
    messageText
});

</script>


<style>
.flex {
    display: flex;
    flex-direction: column;
    align-items: center;
}

video {
    /* Default styling for video elements */
    display: block;
    background: black;
}
</style>
  