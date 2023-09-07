<template>
    <h5>Record video from webcam and transcode to mp4 (x264) and play!</h5>

    <div class="grid">
        <div class="col-12 lg:col-5">
            <div class="card">

                <video ref="webcam" id="webcam" width="320" height="180" autoplay></video>
            </div>
        </div>
        <div class="col-12 lg:col-5">

            <div class="card">

                <video id="output" width="320" height="180" controls></video>
                <Button @click="toggleRecording()" label="Success" class="p-button-success mr-2" :disabled="loading">{{
                    recordText }}</Button>

                <p>{{ messageText }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineExpose, onMounted } from 'vue'; // Make sure to import defineExpose
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ worker: 0, log: true });
const webcam = ref(null);
const outputVideo = ref(null);
const loading = ref(true);
const recordText = ref('Start Recording');
const messageText = ref('');
const chunks = [];
let rec = null;

const transcode = async (webcamData) => {
    messageText.value = 'Loading'; // Updated here
    await ffmpeg.load();
    messageText.value = 'Start transcoding';
    const name = 'record.webm';
    ffmpeg.FS('writeFile', name, await fetchFile(webcamData));
    await ffmpeg.run('-i', name, 'output.mp4');
    messageText.value = 'Complete transcoding';
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const video = document.getElementById("output");
    video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
};

const startRecording = () => {
    rec = new MediaRecorder(webcam.value.srcObject);
    recordText.value = 'Stop Recording';

    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
        transcode(new Uint8Array(await (new Blob(chunks)).arrayBuffer()));
    };
    rec.start();
};

const stopRecording = () => {
    rec.stop();
    recordText.value = 'Start Recording';
};

const toggleRecording = () => {
    if (rec) {
        stopRecording();
        rec = null;
    } else {
        startRecording();
    }
};

onMounted(async () => {
    console.log('On mounted webcam ref:', webcam.value);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        webcam.value.srcObject = stream;
        await webcam.value.play(); // Explicitly call play()
        loading.value = false;
    } catch (e) {
        messageText.value = 'An error occurred while accessing the webcam: ' + e.message;
    }
});

defineExpose({
    webcam,
    outputVideo,
    toggleRecording,
    loading,
    recordText,
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
  