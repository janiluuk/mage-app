<template>
        <DropZone class="drop-area" @files-dropped="addFiles" #default="{ dropZoneActive }">
            <div v-if="dropZoneActive">
                <div>Drop Them</div>
            </div>
            <div v-else>
                <div>Drag Your Files Here</div>
            </div>
        </DropZone>
</template>

<script>
import useFileList from '@/compositions/file-list'
import DropZone from '@/components/DropZone.vue'
import FilePreview from '@/components/FilePreview.vue'

const { files, addFiles, removeFile } = useFileList()


export default {
  name: "VideoUploadComponent",
  components: {
    DropZone,
    FilePreview,
  }
};
</script>