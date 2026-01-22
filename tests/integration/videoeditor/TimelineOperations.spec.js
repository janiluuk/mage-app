import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from 'vuex';
import { videoeditor } from '@/store/videoeditor.module';
import VideoLoader from '@/services/videoeditor/VideoLoader';
import ExportService from '@/services/videoeditor/ExportService';
import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';

// Mock services
vi.mock('@/services/videoeditor/VideoLoader', () => ({
  default: {
    loadVideo: vi.fn(),
  },
}));

vi.mock('@/services/videoeditor/ExportService', () => ({
  default: {
    exportVideo: vi.fn(),
    cancelExportJob: vi.fn(),
  },
}));

describe('Timeline Operations Integration', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        videoeditor,
      },
    });
  });

  it('imports video and creates fragment', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);

    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    expect(store.state.videoeditor.timeline.length).toBe(1);
    expect(store.state.videoeditor.activeFragment).toBeInstanceOf(VideoFragmentAdapter);
    expect(store.state.videoeditor.videoFiles.length).toBe(1);
  });

  it('splits fragment correctly', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const initialLength = store.state.videoeditor.timeline.length;
    store.commit('videoeditor/SET_PLAYER_PROGRESS', 0.5);

    await store.dispatch('videoeditor/split');

    expect(store.state.videoeditor.timeline.length).toBe(initialLength + 1);
  });

  it('sets start and end points', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const fragment = store.state.videoeditor.activeFragment;
    const originalStart = fragment.start;

    store.commit('videoeditor/SET_PLAYER_PROGRESS', 0.3);
    await store.dispatch('videoeditor/setStartPoint');

    expect(fragment.start).toBeGreaterThan(originalStart);
    expect(fragment.start).toBeCloseTo(0.3, 2);
  });

  it('deletes fragment correctly', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const fragment = store.state.videoeditor.activeFragment;
    await store.dispatch('videoeditor/removeFragment', fragment);

    expect(store.state.videoeditor.timeline.length).toBe(0);
    expect(store.state.videoeditor.activeFragment).toBeNull();
  });

  it('undoes and redoes operations', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const initialLength = store.state.videoeditor.timeline.length;
    const fragment = store.state.videoeditor.activeFragment;
    
    await store.dispatch('videoeditor/removeFragment', fragment);
    expect(store.state.videoeditor.timeline.length).toBe(0);

    await store.dispatch('videoeditor/undo');
    expect(store.state.videoeditor.timeline.length).toBe(initialLength);

    await store.dispatch('videoeditor/redo');
    expect(store.state.videoeditor.timeline.length).toBe(0);
  });

  it('adjusts volume and playback rate', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const fragment = store.state.videoeditor.activeFragment;
    
    await store.dispatch('videoeditor/setFragmentVolume', { volume: 0.5 });
    expect(fragment.volume).toBe(0.5);

    await store.dispatch('videoeditor/setFragmentPlaybackRate', { playbackRate: 1.5 });
    expect(fragment.playbackRate).toBe(1.5);
  });
});

