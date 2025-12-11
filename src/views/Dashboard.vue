<script setup>
import { onMounted, ref } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import RecentJobs from '@/pages/Dashboard/RecentJobs.vue';
import BalanceAvailable from '@/pages/Dashboard/BalanceAvailable.vue';

const { isDarkTheme } = useLayout();

// Video statistics - to be connected to real API in future
const videoStats = ref({
    totalVideos: 0,
    processingJobs: 0,
    completedToday: 0,
    failedJobs: 0
});

onMounted(() => {
    // TODO: Replace with actual API call to video statistics endpoint
    // Example: videoStatsService.getStats().then((data) => (videoStats.value = data));
    // For now, using placeholder values
    videoStats.value = {
        totalVideos: 0,
        processingJobs: 0,
        completedToday: 0,
        failedJobs: 0
    };
});
</script>

<template>
    <div class="grid">
        <div class="col-12 md:col-6 xl:col-3">
            <div class="card mb-0">
                <div class="flex justify-content-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Total Videos</span>
                        <div class="text-900 font-medium text-xl">{{ videoStats.totalVideos }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
                        <i class="pi pi-video text-blue-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">Ready for processing</span>
            </div>
        </div>
        <div class="col-12 md:col-6 xl:col-3">
            <div class="card mb-0">
                <div class="flex justify-content-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Processing</span>
                        <div class="text-900 font-medium text-xl">{{ videoStats.processingJobs }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem">
                        <i class="pi pi-spin pi-spinner text-orange-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-500 font-medium">Jobs in progress</span>
            </div>
        </div>
        <div class="col-12 md:col-6 xl:col-3">
            <div class="card mb-0">
                <div class="flex justify-content-between mb-3">
                    <div>
                        <span class="block text-500 font-medium mb-3">Completed Today</span>
                        <div class="text-900 font-medium text-xl">{{ videoStats.completedToday }}</div>
                    </div>
                    <div class="flex align-items-center justify-content-center bg-cyan-100 border-round" style="width:2.5rem;height:2.5rem">
                        <i class="pi pi-check-circle text-cyan-500 text-xl"></i>
                    </div>
                </div>
                <span class="text-green-500 font-medium">Successfully processed</span>
            </div>
        </div>
        <div class="col-12 md:col-6 xl:col-3">
            <BalanceAvailable></BalanceAvailable>
        </div>
        <div class="col-12 xl:col-12">
            <div class="card">
                <h5>Recent Video Jobs</h5>
                <RecentJobs></RecentJobs>       
            </div>   
        </div>
    </div>
</template>
