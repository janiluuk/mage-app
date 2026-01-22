import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createRouter, createMemoryHistory } from 'vue-router';
import VideoEditor from '@/views/pages/video/VideoEditor.vue';
import VideoLoader from '@/services/videoeditor/VideoLoader';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

// Mock VideoLoader
vi.mock('@/services/videoeditor/VideoLoader', () => ({
  default: {
    loadVideo: vi.fn(),
  },
}));

describe('VideoEditor Workflow Integration', () => {
  let store;
  let router;
  let wrapper;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create store with videoeditor module
    store = createStore({
      modules: {
        videoeditor: {
          namespaced: true,
          state: {
            timeline: [],
            activeFragment: null,
            videoFiles: [],
            videoMetadata: null,
            videoType: null,
            videoId: null,
            player: {
              progress: 0,
              playing: false,
              volume: 1,
              widthPercent: 0.75,
            },
            configTimeline: {
              widthPerSecond: 3.5,
              minFragmentWidth: 90,
            },
          },
          getters: {
            hasProject: (state) => state.timeline.length > 0,
          },
          mutations: {
            SET_VIDEO_TYPE: (state, type) => { state.videoType = type; },
            SET_VIDEO_ID: (state, id) => { state.videoId = id; },
            SET_VIDEO_METADATA: (state, metadata) => { state.videoMetadata = metadata; },
            SET_VIDEO_IMPORT_LOADING: vi.fn(),
            ADD_TO_TIMELINE: (state, { fragment }) => {
              state.timeline.push(fragment);
            },
          },
          actions: {
            importVideo: vi.fn(async ({ commit }, { type, id }) => {
              // Call VideoLoader to simulate real behavior
              const videoFile = await VideoLoader.loadVideo(type, id);
              commit('SET_VIDEO_TYPE', type);
              commit('SET_VIDEO_ID', id);
              commit('SET_VIDEO_METADATA', videoFile.videoData);
              
              const fragment = new VideoFragmentAdapter(videoFile);
              commit('ADD_TO_TIMELINE', { fragment });
              return fragment;
            }),
            addFragment: vi.fn(),
            resetState: vi.fn(),
            updateVideoInfo: vi.fn(),
          },
        },
      },
    });

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/editor/:type/:id',
          component: VideoEditor,
        },
      ],
    });
  });

  const createWrapper = async (routeParams = { type: 'file', id: '1' }) => {
    await router.push(`/editor/${routeParams.type}/${routeParams.id}`);
    
    const wrapper = mount(VideoEditor, {
      global: {
        plugins: [store, router],
        stubs: {
          Editor: true,
          ProgressSpinner: true,
          Message: true,
          Button: true,
        },
      },
    });
    
    await flushPromises();
    return wrapper;
  };

  it('loads video on mount', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);

    wrapper = await createWrapper();

    expect(VideoLoader.loadVideo).toHaveBeenCalledWith('file', '1');
    expect(store.state.videoeditor.timeline.length).toBeGreaterThan(0);
  });

  it('displays loading state initially', async () => {
    VideoLoader.loadVideo.mockImplementation(() => new Promise(() => {})); // Never resolves

    await router.push('/editor/file/1');
    
    wrapper = mount(VideoEditor, {
      global: {
        plugins: [store, router],
        stubs: {
          Editor: true,
          ProgressSpinner: true,
          Message: true,
          Button: true,
        },
      },
    });
    
    // Check loading state immediately, before promises resolve
    expect(wrapper.vm.isLoading).toBe(true);
  });

  it('displays error message when video load fails', async () => {
    // Use an error message that won't trigger the dev mode test video fallback
    const errorMessage = 'Failed to load video';
    VideoLoader.loadVideo.mockRejectedValue(new Error(errorMessage));

    wrapper = await createWrapper();
    await flushPromises();

    expect(wrapper.vm.error).toBe(errorMessage);
  });

  it('displays editor when video is loaded', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    store.state.videoeditor.timeline = [new VideoFragmentAdapter(mockVideoFile)];

    wrapper = await createWrapper();
    await flushPromises();

    expect(wrapper.vm.hasProject).toBe(true);
  });

  it('handles different video types', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '2',
      url: 'https://example.com/video.mp4',
      duration: 60,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);

    wrapper = await createWrapper({ type: 'job', id: '2' });

    expect(VideoLoader.loadVideo).toHaveBeenCalledWith('job', '2');
  });

  it('resets state on unmount', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);

    wrapper = await createWrapper();
    await flushPromises();

    wrapper.unmount();

    expect(store._modules.root._children.videoeditor._rawModule.actions.resetState).toHaveBeenCalled();
  });
});

