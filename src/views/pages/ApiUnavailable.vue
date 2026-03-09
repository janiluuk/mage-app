<script setup>
import { ref } from 'vue';

const emit = defineEmits(['retry']);
const checking = ref(false);

const retry = () => {
    checking.value = true;
    emit('retry');
    // Reset after a short delay in case the parent doesn't respond
    setTimeout(() => { checking.value = false; }, 3000);
};
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img src="/demo/images/notfound/logo-blue.svg" alt="Mage logo" class="mb-5 w-6rem flex-shrink-0" />
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, rgba(255, 152, 0, 0.4) 10%, rgba(255, 152, 0, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center"
                    style="border-radius: 53px; max-width: 600px;">
                    <i class="pi pi-server text-orange-500" style="font-size: 3rem;"></i>
                    <h1 class="text-900 font-bold text-3xl lg:text-5xl mb-2 mt-4 text-center">API Unavailable</h1>
                    <p class="text-600 text-center text-lg mb-4">
                        Cannot connect to the backend server. Make sure the API is running and try again.
                    </p>
                    <button
                        @click="retry"
                        :disabled="checking"
                        class="p-button p-component p-button-warning"
                        style="padding: 0.75rem 2rem; font-size: 1.1rem; border-radius: 8px; cursor: pointer; border: none;"
                    >
                        <i v-if="checking" class="pi pi-spin pi-spinner mr-2"></i>
                        <i v-else class="pi pi-refresh mr-2"></i>
                        {{ checking ? 'Checking...' : 'Retry Connection' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
