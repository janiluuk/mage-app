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
    vi.clearAllMocks();
    
    store = createStore({
      modules: {
        videoeditor: {
          ...videoeditor,
          state: () => ({
            timeline: [],
            activeFragment: null,
            videoFiles: [],
            videosContainer: null,
            videoMetadata: null,
            videoType: null,
            videoId: null,
            storyInfo: null,
            player: {
              progress: 0,
              playing: false,
              volume: 1,
              widthPercent: 0.75,
              fullscreen: false,
            },
            configTimeline: {
              minFragmentWidth: 90,
              widthPerSecond: 3.5,
            },
            export: {
              showDialog: false,
              fps: '',
              bitrate: '',
              outputPath: '',
              filters: [],
              customResolution: false,
              width: 1920,
              height: 1080,
              interpolate: false,
            },
            exportStatus: {
              show: false,
              progress: 0,
              done: false,
              error: '',
              command: null,
              output: [],
            },
            loading: {
              videoImport: false,
              projectImport: false,
            },
            commandHistory: {
              undoStack: [],
              redoStack: [],
            },
          }),
          mutations: {
            ...videoeditor.mutations,
            // Add missing mutations that are referenced in actions but not defined
            SET_EXPORT_STATUS_OUTPUT: (state, output) => {
              state.exportStatus.output = output;
            },
            ADD_EXPORT_STATUS_OUTPUT_LINE: (state, line) => {
              state.exportStatus.output.push(line);
            },
          },
        },
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
    await store.dispatch('videoeditor/setExportCustomResolution', { width: 1280, height: 720 });

    ExportService.exportVideo.mockResolvedValue({
      jobId: 'export-123',
      fileUrl: 'https://example.com/exported.mp4',
      success: true,
    });

    await store.dispatch('videoeditor/exportVideo');

    // Verify the exportVideo was called with correct parameters
    expect(ExportService.exportVideo).toHaveBeenCalled();
    const callArgs = ExportService.exportVideo.mock.calls[0];
    const params = callArgs[0];
    
    // Check the export options contain our custom values
    expect(params.exportOptions.fps).toBe('60');
    expect(params.exportOptions.bitrate).toBe('5');
    expect(params.exportOptions.customResolution).toBe(true);
    expect(params.exportOptions.width).toBe(1280);
    expect(params.exportOptions.height).toBe(720);
    
    // Verify timeline and output name are present
    expect(params.timeline).toBeDefined();
    expect(params.outputName).toBeDefined();
  });
});

