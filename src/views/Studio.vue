<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const onUpload = () => {
    toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
};
</script>

<template>
    <div class="grid">

        <div class="col-12">

            <div class="card">
                <iframe
                style="margin-top:90px;"
              width="100%"
              height="100%"
              src="https://stable.dudeisland.eu"
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