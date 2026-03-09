<script setup>
import { ref, onMounted } from 'vue';
import { fetchStableUrl } from '@/utils/domains';

const stableUrl = ref('');
const isLoading = ref(true);
const hasError = ref(false);

onMounted(async () => {
    try {
        const url = await fetchStableUrl();
        if (url) {
            stableUrl.value = url;
        } else {
            hasError.value = true;
        }
    } catch {
        hasError.value = true;
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card studio-card">
                <!-- Loading -->
                <div v-if="isLoading" class="studio-placeholder">
                    <ProgressSpinner />
                    <p class="mt-3 text-500">Connecting to Stable Diffusion...</p>
                </div>

                <!-- No URL configured / unreachable -->
                <div v-else-if="hasError || !stableUrl" class="studio-placeholder">
                    <i class="pi pi-desktop text-5xl text-500 mb-3" style="opacity: 0.4;" />
                    <h3 class="m-0 font-bold">Stable Diffusion UI not available</h3>
                    <p class="text-500 mt-2 mb-0 text-center" style="max-width: 420px;">
                        The external Stable Diffusion interface is not configured or cannot be reached.
                        Set <code>VITE_STABLE_URL</code> in your environment to connect.
                    </p>
                </div>

                <!-- Iframe -->
                <iframe
                    v-else
                    class="studio-iframe"
                    :src="stableUrl"
                    frameborder="0"
                    tabindex="-1"
                    allow="clipboard-write"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.studio-card {
    position: relative;
    min-height: 80vh;
}

.studio-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

.studio-iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
}
</style>
