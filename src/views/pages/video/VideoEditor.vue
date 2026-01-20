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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Editor from '@/components/videoeditor/Editor.vue';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Button from 'primevue/button';

export default {
  name: 'VideoEditor',
  components: {
    Editor,
    ProgressSpinner,
    Message,
    Button,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    
    const isLoading = ref(true);
    const error = ref(null);
    
    const hasProject = computed(() => store.getters['videoeditor/hasProject']);
    
    const loadVideo = async () => {
      isLoading.value = true;
      error.value = null;
      
      try {
        const type = route.params.type; // 'file' or 'job'
        const id = route.params.id;
        
        if (!type || !id) {
          throw new Error('Missing video type or ID');
        }
        
        await store.dispatch('videoeditor/importVideo', { type, id });
      } catch (err) {
        console.error('Failed to load video:', err);
        
        // In development mode, load a test video if the API call fails
        if (import.meta.env.DEV && err.message?.includes('not found')) {
          console.log('Loading test video for development...');
          try {
            // Use a public test video URL
            const testVideoData = {
              id: 'test-1',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              duration: 596.48,
              fps: 24,
              width: 1280,
              height: 720,
              hasAudio: true,
            };
            
            const testMetadata = {
              format: {
                duration: 596.48,
                filename: 'BigBuckBunny.mp4',
                format_name: 'mp4',
              },
              videoStream: {
                width: 1280,
                height: 720,
                codec_name: 'h264',
                bit_rate: 1000000,
                avg_frame_rate: '24/1',
              },
              audioStream: {},
              hasAudio: true,
              fps: 24,
              duration: 596.48,
            };
            
            // Import the test video directly
            const VideoFileAdapter = (await import('@/services/videoeditor/VideoFileAdapter')).default;
            const VideoFragmentAdapter = (await import('@/services/videoeditor/VideoFragmentAdapter')).default;
            
            const videoFile = new VideoFileAdapter(testVideoData, testMetadata);
            const fragment = new VideoFragmentAdapter(videoFile);
            await store.dispatch('videoeditor/addFragment', fragment);
            
            console.log('Test video loaded successfully');
          } catch (testErr) {
            console.error('Failed to load test video:', testErr);
            error.value = err.message || 'Failed to load video';
          }
        } else {
          error.value = err.message || 'Failed to load video';
        }
      } finally {
        isLoading.value = false;
      }
    };
    
    const goBack = () => {
      router.push('/browser');
    };
    
    onMounted(async () => {
      await loadVideo();
    });
    
    onBeforeUnmount(() => {
      // Clean up when leaving editor
      store.dispatch('videoeditor/resetState');
    });
    
    return {
      isLoading,
      error,
      hasProject,
      goBack,
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
