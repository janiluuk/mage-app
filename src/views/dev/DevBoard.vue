<script setup>
import { onMounted, ref } from 'vue';

const nestedRouteItems = ref([
    {
        label: 'FFMPeg',
        to: '/dev'
    },
    {
        label: 'Webcam input',
        to: '/dev/webcam'
    },
    {
        label: 'Video Modal',
        to: '/dev/videomodal'
    },
]);

</script>

<template>
    <div class="grid p-fluid">

        <div class="col-12">
            <div class="card card-w-title">
                <h5>Dev features</h5>
                <p>Add new views by adding page to the pages folder</p>
                <TabMenu :model="nestedRouteItems" />
                <router-view></router-view>
            </div>
        </div>

    </div>
</template>
