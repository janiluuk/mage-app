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

describe('Export Workflow Integration', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        videoeditor,
      },
    });
  });

  it('exports video with default options', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    ExportService.exportVideo.mockResolvedValue({
      jobId: 'export-123',
      fileUrl: 'https://example.com/exported.mp4',
      success: true,
    });

    await store.dispatch('videoeditor/exportVideo');

    expect(ExportService.exportVideo).toHaveBeenCalled();
    expect(store.state.videoeditor.exportStatus.show).toBe(true);
  });

  it('tracks export progress', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    let progressCallback;
    ExportService.exportVideo.mockImplementation((params, onProgress) => {
      progressCallback = onProgress;
      return Promise.resolve({
        jobId: 'export-123',
        fileUrl: 'https://example.com/exported.mp4',
        success: true,
      });
    });

    const exportPromise = store.dispatch('videoeditor/exportVideo');
    
    // Simulate progress updates
    if (progressCallback) {
      progressCallback({ percent: 0.5, timemark: '00:30' });
    }

    await exportPromise;

    expect(store.state.videoeditor.exportStatus.progress).toBeDefined();
  });

  it('handles export errors', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    const errorMessage = 'Export failed';
    ExportService.exportVideo.mockRejectedValue(new Error(errorMessage));

    try {
      await store.dispatch('videoeditor/exportVideo');
    } catch (error) {
      expect(error.message).toBe(errorMessage);
    }

    expect(store.state.videoeditor.exportStatus.error).toBe(errorMessage);
  });

  it('cancels export job', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    ExportService.exportVideo.mockResolvedValue({
      jobId: 'export-123',
      fileUrl: 'https://example.com/exported.mp4',
      success: true,
    });

    await store.dispatch('videoeditor/exportVideo');
    store.commit('videoeditor/SET_EXPORT_STATUS_COMMAND', { jobId: 'export-123', type: 'server' });

    ExportService.cancelExportJob.mockResolvedValue({});

    await store.dispatch('videoeditor/cancelExport');

    expect(ExportService.cancelExportJob).toHaveBeenCalledWith('export-123');
  });

  it('uses custom export options', async () => {
    const mockVideoFile = new VideoFileAdapter({
      id: '1',
      url: 'https://example.com/video.mp4',
      duration: 60,
      fps: 30,
    });

    VideoLoader.loadVideo.mockResolvedValue(mockVideoFile);
    await store.dispatch('videoeditor/importVideo', { type: 'file', id: '1' });

    store.commit('videoeditor/SET_EXPORT_FPS', '60');
    store.commit('videoeditor/SET_EXPORT_BITRATE', '5');
    store.dispatch('videoeditor/setExportCustomResolution', { width: 1280, height: 720 });

    ExportService.exportVideo.mockResolvedValue({
      jobId: 'export-123',
      fileUrl: 'https://example.com/exported.mp4',
      success: true,
    });

    await store.dispatch('videoeditor/exportVideo');

    expect(ExportService.exportVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        exportOptions: expect.objectContaining({
          fps: '60',
          bitrate: '5',
          customResolution: true,
          width: 1280,
          height: 720,
        }),
      }),
      expect.any(Function),
      expect.any(Function)
    );
  });
});

