<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { fetchStableUrl } from '@/utils/domains';

const toast = useToast();
const stableUrl = ref('');
const isLoading = ref(true);

const onUpload = () => {
    toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
};

onMounted(async () => {
    stableUrl.value = await fetchStableUrl();
    isLoading.value = false;
});
</script>

<template>
    <div class="grid">

        <div class="col-12">

            <div class="card">
                <div v-if="isLoading" style="display: flex; justify-content: center; align-items: center; height: 100vh;">
                    <ProgressSpinner />
                </div>
                <iframe
                v-else
                style="margin-top:90px;"
              width="100%"
              height="100%"
              :src="stableUrl"
              frameBorder='0'
              tabIndex='-1'
              />

              <div style="position:absolute; bottom:5px;left:1080px; margin-bottom:10px;">
              <FileUpload name="demo[]" @uploader="onUpload" :multiple="true" accept="image/*" :maxFileSize="1000000" customUpload />
            </div>
            </div>
        </div>
        <Toast />
    </div>
</template>
<style>
iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>