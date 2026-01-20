<template>
  <div class="video-editor-container">
    <div v-if="isLoading" class="loading-container">
      <ProgressSpinner />
      <p>Loading video...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <Message severity="error" :closable="false">{{ error }}</Message>
      <Button label="Go Back" @click="goBack" class="mt-3" />
    </div>
    
    <div v-else-if="hasProject" class="editor-wrapper">
      <Editor />
    </div>
    
    <div v-else class="empty-state">
      <i class="pi pi-video empty-icon"></i>
      <h2>No video loaded</h2>
      <p>Video could not be loaded. Please try again.</p>
      <Button label="Go Back" @click="goBack" class="mt-3" />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Editor from '@/components/videoeditor/Editor.vue';

export default {
  name: 'VideoEditor',
  components: {
    Editor,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    
    const isLoading = computed(() => store.state.videoeditor.loading.videoImport);
    const hasProject = computed(() => store.getters['videoeditor/hasProject']);
    
    const loadVideo = async () => {
      try {
        const type = route.params.type; // 'file' or 'job'
        const id = route.params.id;
        
        if (!type || !id) {
          throw new Error('Missing video type or ID');
        }
        
        await store.dispatch('videoeditor/importVideo', { type, id });
      } catch (error) {
        console.error('Failed to load video:', error);
        return error.message || 'Failed to load video';
      }
      return null;
    };
    
    const goBack = () => {
      router.push('/browser');
    };
    
    onMounted(async () => {
      const error = await loadVideo();
      if (error) {
        // Handle error - could set error state here
        console.error('Video loading error:', error);
      }
    });
    
    onBeforeUnmount(() => {
      // Clean up when leaving editor
      store.dispatch('videoeditor/resetState');
    });
    
    return {
      isLoading,
      hasProject,
      goBack,
    };
  },
  data() {
    return {
      error: null,
    };
  },
};
</script>

<style scoped>
.video-editor-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
