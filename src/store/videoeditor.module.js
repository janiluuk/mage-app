/**
 * VideoEditor Vuex Module
 * Manages state for the video editor (ported from movie-maker)
 */

import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';
import VideoLoader from '@/services/videoeditor/VideoLoader';
import ExportService from '@/services/videoeditor/ExportService';

// Import commands
import SplitFragmentCommand from '@/services/videoeditor/commands/SplitFragmentCommand';
import SetStartPointCommand from '@/services/videoeditor/commands/SetStartPointCommand';
import SetEndPointCommand from '@/services/videoeditor/commands/SetEndPointCommand';
import DeleteFragmentCommand from '@/services/videoeditor/commands/DeleteFragmentCommand';
import AddFragmentCommand from '@/services/videoeditor/commands/AddFragmentCommand';
import SetVolumeCommand from '@/services/videoeditor/commands/SetVolumeCommand';
import SetPlaybackRateCommand from '@/services/videoeditor/commands/SetPlaybackRateCommand';
import MoveFragmentCommand from '@/services/videoeditor/commands/MoveFragmentCommand';
import DuplicateFragmentCommand from '@/services/videoeditor/commands/DuplicateFragmentCommand';

/**
 * Get stored player configuration from localStorage with error handling
 * @returns {Object} Player configuration with safe defaults
 */
function getStoredPlayerConfig() {
  const defaults = {
    playerWidth: 0.75,
    widthPerSecond: 3.5,
  };

  try {
    const playerWidth = localStorage.getItem('playerWidth');
    const widthPerSecond = localStorage.getItem('widthPerSecond');

    return {
      playerWidth: playerWidth ? parseFloat(playerWidth) : defaults.playerWidth,
      widthPerSecond: widthPerSecond ? parseFloat(widthPerSecond) : defaults.widthPerSecond,
    };
  } catch (error) {
    console.error('Error reading player config from localStorage:', error);
    return defaults;
  }
}

// Load stored config once at module initialization
const storedPlayerConfig = getStoredPlayerConfig();

const initialState = {
  timeline: [], // Array of VideoFragmentAdapter instances
  activeFragment: null,
  videoFiles: [], // Array of VideoFileAdapter instances
  videosContainer: null, // DOM container for video elements
  
  // Video metadata for info display
  videoMetadata: null, // Original video data from API
  videoType: null, // 'file' or 'job'
  videoId: null, // Video ID
  storyInfo: null, // Story information if video belongs to a story
  
  // Player state
  player: {
    progress: 0, // 0-1, overall timeline progress
    playing: false,
    volume: 1, // Global player volume
    widthPercent: storedPlayerConfig.playerWidth,
    fullscreen: false,
  },
  
  // Timeline configuration
  configTimeline: {
    minFragmentWidth: 90,
    widthPerSecond: storedPlayerConfig.widthPerSecond,
  },
  
  // Export state
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
  
  // Export status
  exportStatus: {
    show: false,
    progress: 0,
    done: false,
    error: '',
    command: null,
    output: [], // Array of output lines from FFmpeg
  },
  
  // Loading states
  loading: {
    videoImport: false,
    projectImport: false,
  },
  
  // Command history for undo/redo
  commandHistory: {
    undoStack: [],
    redoStack: [],
  },
};

export const videoeditor = {
  namespaced: true,
  state: { ...initialState },
  
  mutations: {
    // Timeline mutations
    SET_TIMELINE(state, fragments) {
      state.timeline = fragments;
    },
    
    ADD_TO_TIMELINE(state, { fragment, index }) {
      if (!state.videoFiles.includes(fragment.video)) {
        fragment.video.container = state.videosContainer;
        state.videoFiles.push(fragment.video);
      }
      if (index === undefined) {
        state.timeline.push(fragment);
      } else {
        state.timeline.splice(index, 0, fragment);
      }
      if (state.activeFragment === null) {
        state.activeFragment = fragment;
      }
    },
    
    REMOVE_FROM_TIMELINE(state, fragment) {
      const index = state.timeline.indexOf(fragment);
      if (index === -1) return;
      
      state.timeline.splice(index, 1);
      
      // Check if video is still used
      const keepVideo = state.timeline.some(f => f.video === fragment.video);
      if (!keepVideo) {
        const videoIndex = state.videoFiles.indexOf(fragment.video);
        if (videoIndex !== -1) {
          state.videoFiles.splice(videoIndex, 1);
          fragment.video.destroy();
        }
      }
      
      // Update active fragment
      if (state.activeFragment === fragment) {
        if (state.timeline.length === 0) {
          state.activeFragment = null;
        } else {
          const newIndex = Math.min(state.timeline.length - 1, Math.max(0, index - 1));
          state.activeFragment = state.timeline[newIndex];
          state.activeFragment.reset();
        }
      }
    },
    
    MOVE_FRAGMENT(state, { fragment, newIndex }) {
      const index = state.timeline.indexOf(fragment);
      if (index === -1) return;
      state.timeline.splice(index, 1);
      state.timeline.splice(newIndex, 0, fragment);
    },
    
    SET_ACTIVE_FRAGMENT(state, fragment) {
      state.activeFragment = fragment;
    },
    
    // Video files mutations
    SET_VIDEO_FILES(state, videoFiles) {
      state.videoFiles = videoFiles;
    },
    
    SET_VIDEOS_CONTAINER(state, container) {
      state.videosContainer = container;
      state.videoFiles.forEach(v => {
        v.container = container;
      });
    },
    
    // Player mutations
    SET_PLAYER_PROGRESS(state, progress) {
      state.player.progress = Math.max(0, Math.min(1, progress));
    },
    
    SET_PLAYER_PLAYING(state, playing) {
      state.player.playing = playing;
    },
    
    SET_PLAYER_VOLUME(state, volume) {
      state.player.volume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('playerVolume', state.player.volume);
    },
    
    SET_PLAYER_WIDTH(state, percent) {
      state.player.widthPercent = Math.max(0.1, Math.min(0.9, percent));
      localStorage.setItem('playerWidth', state.player.widthPercent);
    },
    
    SET_PLAYER_FULLSCREEN(state, fullscreen) {
      state.player.fullscreen = fullscreen;
    },
    
    // Timeline config mutations
    SET_WIDTH_PER_SECOND(state, pixels) {
      state.configTimeline.widthPerSecond = pixels;
      localStorage.setItem('widthPerSecond', pixels);
    },
    
    // Export mutations
    SET_EXPORT_DIALOG(state, show) {
      state.export.showDialog = show;
    },
    
    SET_EXPORT_FPS(state, fps) {
      state.export.fps = fps;
    },
    
    SET_EXPORT_BITRATE(state, bitrate) {
      state.export.bitrate = bitrate;
    },
    
    SET_EXPORT_OUTPUT_PATH(state, path) {
      state.export.outputPath = path;
    },
    
    SET_EXPORT_FILTERS(state, filters) {
      state.export.filters = filters;
    },
    
    SET_EXPORT_CUSTOM_RESOLUTION(state, { width, height }) {
      if (width === null && height === null) {
        state.export.customResolution = false;
      } else {
        state.export.customResolution = true;
        if (width !== undefined) state.export.width = width;
        if (height !== undefined) state.export.height = height;
      }
    },
    
    SET_EXPORT_INTERPOLATE(state, interpolate) {
      state.export.interpolate = interpolate;
    },
    
    // Export status mutations
    SET_EXPORT_STATUS_SHOW(state, show) {
      state.exportStatus.show = show;
    },
    
    SET_EXPORT_STATUS_PROGRESS(state, progress) {
      state.exportStatus.progress = progress;
    },
    
    SET_EXPORT_STATUS_DONE(state, done) {
      state.exportStatus.done = done;
    },
    
    SET_EXPORT_STATUS_ERROR(state, error) {
      state.exportStatus.error = error;
    },
    
    SET_EXPORT_STATUS_COMMAND(state, command) {
      state.exportStatus.command = command;
    },
    
    SET_EXPORT_STATUS_OUTPUT(state, output) {
      state.exportStatus.output = output;
    },
    
    ADD_EXPORT_STATUS_OUTPUT_LINE(state, line) {
      state.exportStatus.output.push(line);
    },
    
    // Video metadata mutations
    SET_VIDEO_METADATA(state, metadata) {
      state.videoMetadata = metadata;
    },
    
    SET_VIDEO_TYPE(state, type) {
      state.videoType = type;
    },
    
    SET_VIDEO_ID(state, id) {
      state.videoId = id;
    },
    
    SET_STORY_INFO(state, storyInfo) {
      state.storyInfo = storyInfo;
    },
    
    // Loading mutations
    SET_VIDEO_IMPORT_LOADING(state, loading) {
      state.loading.videoImport = loading;
    },
    
    SET_PROJECT_IMPORT_LOADING(state, loading) {
      state.loading.projectImport = loading;
    },
    
    // Command history mutations
    PUSH_UNDO(state, command) {
      state.commandHistory.undoStack.push(command);
      state.commandHistory.redoStack = []; // Clear redo stack
      // Limit undo stack size to prevent memory issues
      if (state.commandHistory.undoStack.length > 100) {
        state.commandHistory.undoStack.shift();
      }
    },
    
    POP_UNDO(state) {
      if (state.commandHistory.undoStack.length > 0) {
        const command = state.commandHistory.undoStack.pop();
        state.commandHistory.redoStack.push(command);
        return command;
      }
      return null;
    },
    
    POP_REDO(state) {
      if (state.commandHistory.redoStack.length > 0) {
        const command = state.commandHistory.redoStack.pop();
        state.commandHistory.undoStack.push(command);
        return command;
      }
      return null;
    },
    
    CLEAR_COMMAND_HISTORY(state) {
      state.commandHistory.undoStack = [];
      state.commandHistory.redoStack = [];
    },
    
    // Reset state
    RESET_STATE(state) {
      // Clean up video files
      state.videoFiles.forEach(v => v.destroy());
      
      // Reload config from localStorage (user may have changed it in another tab)
      const currentConfig = getStoredPlayerConfig();
      
      // Reset to initial state
      Object.assign(state, {
        ...initialState,
        player: {
          ...initialState.player,
          widthPercent: currentConfig.playerWidth,
        },
        configTimeline: {
          ...initialState.configTimeline,
          widthPerSecond: currentConfig.widthPerSecond,
        },
      });
    },
  },
  
  getters: {
    // Check if has active project
    hasProject: (state) => state.timeline.length > 0,
    
    // Get full duration of timeline
    fullDuration: (state) => {
      const duration = state.timeline.reduce((sum, fragment) => {
        return sum + (fragment.adjustedDuration || 0);
      }, 0);
      return isNaN(duration) ? 0 : duration;
    },
    
    // Get timeline videos (unique)
    timelineVideos: (state) => {
      const videos = new Set();
      state.timeline.forEach(fragment => {
        videos.add(fragment.video);
      });
      return Array.from(videos);
    },
    
    // Format time to H:MM:SS
    toHms: () => (seconds) => {
      if (isNaN(seconds) || seconds < 0) {
        return '00:00.00';
      }
      const hms = new Date(seconds * 1000).toISOString().substr(11, 11);
      if (hms.startsWith('00')) {
        return hms.substr(3);
      }
      return hms;
    },
    
    // Get fragment at progress
    fragmentAtProgress: (state, getters) => (progress) => {
      const fullDuration = getters.fullDuration;
      if (fullDuration === 0) return null;
      
      let beforeParts = 0;
      for (const fragment of state.timeline) {
        const fragmentPart = fragment.adjustedDuration / fullDuration;
        if (beforeParts + fragmentPart >= progress) {
          const fragmentProgress = (progress - beforeParts) / fragmentPart;
          const fragmentCut = fragment.end - fragment.start;
          return {
            fragment,
            videoProgress: Math.max(0, Math.min(1, fragment.start + fragmentProgress * fragmentCut)),
            fragmentProgress: Math.max(0, Math.min(1, fragmentProgress)),
          };
        }
        beforeParts += fragmentPart;
      }
      return null;
    },
    
    // Get progress at fragment progress
    progressAtFragmentProgress: (state, getters) => ({ fragment, progress }) => {
      const fullDuration = getters.fullDuration;
      if (fullDuration === 0) return 0;
      
      const fragmentIndex = state.timeline.indexOf(fragment);
      if (fragmentIndex === -1) return 0;
      
      let timeBefore = 0;
      for (let i = 0; i < fragmentIndex; i++) {
        timeBefore += state.timeline[i].adjustedDuration;
      }
      
      const fragmentPart = fragment.adjustedDuration / fullDuration;
      return Math.max(0, Math.min(1, timeBefore / fullDuration + fragmentPart * progress));
    },
    
    // Can move left/right
    canMoveLeft: (state) => {
      if (!state.activeFragment) return false;
      return state.timeline.indexOf(state.activeFragment) > 0;
    },
    
    canMoveRight: (state) => {
      if (!state.activeFragment) return false;
      return state.timeline.indexOf(state.activeFragment) < state.timeline.length - 1;
    },
    
    // Can skip frames
    canSkipFrameLeft: (state) => state.player.progress > 0,
    canSkipFrameRight: (state) => state.player.progress < 1,
    
    // Can cut at progress
    canCutAt: (state, getters) => (progress) => {
      const result = getters.fragmentAtProgress(progress);
      if (!result) return false;
      return result.fragmentProgress > 0 && result.fragmentProgress < 1;
    },
    
    canCut: (state, getters) => {
      if (!state.activeFragment) return false;
      const result = getters.fragmentAtProgress(state.player.progress);
      if (!result) return false;
      return result.fragmentProgress > 0 && result.fragmentProgress < 1;
    },
    
    // Undo/redo
    canUndo: (state) => state.commandHistory.undoStack.length > 0,
    canRedo: (state) => state.commandHistory.redoStack.length > 0,
    
    // Check if audio
    isAudio: (state) => {
      if (!state.activeFragment) return false;
      return state.activeFragment.video?.isAudio || false;
    },
    
    // Export progress getters
    exportProgress: (state) => {
      if (!state.exportStatus.progress) return 0;
      if (typeof state.exportStatus.progress === 'number') {
        return state.exportStatus.progress;
      }
      if (typeof state.exportStatus.progress === 'object' && state.exportStatus.progress.percent) {
        return state.exportStatus.progress.percent;
      }
      return 0;
    },
    
    isExporting: (state) => {
      return state.exportStatus.show && !state.exportStatus.done && !state.exportStatus.error;
    },
    
    isUploading: (state) => {
      // YouTube upload not implemented yet
      return false;
    },
  },
  
  actions: {
    /**
     * Load video from API
     */
    async importVideo({ commit, dispatch }, { type, id }) {
      commit('SET_VIDEO_IMPORT_LOADING', true);
      try {
        const videoFile = await VideoLoader.loadVideo(type, id);
        
        // Store video metadata
        commit('SET_VIDEO_TYPE', type);
        commit('SET_VIDEO_ID', id);
        commit('SET_VIDEO_METADATA', videoFile.videoData);
        
        // Load story information if available
        // Check multiple possible locations for story_id
        const storyId = videoFile.videoData?.story_id || 
                       videoFile.videoData?.attributes?.story_id ||
                       videoFile.videoData?.story?.id ||
                       videoFile.videoData?.relationships?.story?.data?.id;
        
        if (storyId) {
          await dispatch('loadStoryInfo', storyId);
        }
        
        const fragment = new VideoFragmentAdapter(videoFile);
        await dispatch('addFragment', fragment);
        return fragment;
      } catch (error) {
        console.error('Failed to import video:', error);
        throw error;
      } finally {
        commit('SET_VIDEO_IMPORT_LOADING', false);
      }
    },
    
    /**
     * Load story information
     */
    async loadStoryInfo({ commit }, storyId) {
      try {
        const StoryService = (await import('@/services/story/StoryService')).default;
        const storyService = new StoryService();
        const story = await storyService.getStory(storyId);
        commit('SET_STORY_INFO', story.data || story);
      } catch (error) {
        console.warn('Failed to load story info:', error);
        // Don't throw - story info is optional
      }
    },
    
    /**
     * Add fragment to timeline (using command pattern)
     */
    addFragment({ commit, dispatch }, fragment, index = null) {
      const command = new AddFragmentCommand(fragment, index);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Remove fragment from timeline (using command pattern)
     */
    removeFragment({ state, commit, dispatch }, fragment) {
      const index = state.timeline.indexOf(fragment);
      if (index === -1) return;
      
      const command = new DeleteFragmentCommand(fragment);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Set active fragment
     */
    setActiveFragment({ commit }, fragment) {
      commit('SET_ACTIVE_FRAGMENT', fragment);
    },
    
    /**
     * Seek to progress
     */
    async seek({ state, commit, getters }, progress) {
      const result = getters.fragmentAtProgress(progress);
      if (!result) return;
      
      const { fragment, videoProgress } = result;
      
      // Reset other fragments
      state.timeline.forEach(f => {
        if (f !== fragment) {
          f.reset();
        }
      });
      
      // Set current time on video element
      if (fragment.video.element) {
        fragment.video.element.currentTime = videoProgress * fragment.video.duration;
      }
      
      commit('SET_ACTIVE_FRAGMENT', fragment);
      commit('SET_PLAYER_PROGRESS', progress);
      
      // Auto-play if was playing
      if (state.player.playing && fragment.video.element && fragment.video.element.paused) {
        fragment.video.element.play().catch(console.error);
      }
    },
    
    /**
     * Play video
     */
    async play({ state, commit }) {
      if (!state.activeFragment) return;
      
      if (state.player.progress === 1) {
        // Reset to start
        commit('SET_PLAYER_PROGRESS', 0);
        if (state.timeline.length > 0) {
          commit('SET_ACTIVE_FRAGMENT', state.timeline[0]);
          state.timeline[0].reset();
        }
      }
      
      if (state.activeFragment.video.element) {
        await state.activeFragment.video.element.play();
        commit('SET_PLAYER_PLAYING', true);
      }
    },
    
    /**
     * Pause video
     */
    pause({ state, commit }) {
      if (state.activeFragment?.video?.element) {
        state.activeFragment.video.element.pause();
        commit('SET_PLAYER_PLAYING', false);
      }
    },
    
    /**
     * Skip frames
     */
    skipFrames({ state, commit, getters }, frames) {
      if (!state.activeFragment) return;
      
      const fps = state.activeFragment.video.fps;
      const duration = frames / fps;
      const currentTime = state.player.progress * getters.fullDuration;
      const newProgress = Math.max(0, Math.min(1, (currentTime + duration) / getters.fullDuration));
      
      const result = getters.fragmentAtProgress(newProgress);
      if (!result) return;
      
      const { fragment, videoProgress } = result;
      commit('SET_ACTIVE_FRAGMENT', fragment);
      commit('SET_PLAYER_PROGRESS', newProgress);
      
      if (fragment.video.element) {
        fragment.video.element.pause();
        fragment.video.element.currentTime = videoProgress * fragment.video.duration;
      }
    },
    
    
    /**
     * Play next fragment
     */
    async playNextFragment({ state, commit, dispatch }, play = false) {
      if (!state.activeFragment) return;
      
      const currentIndex = state.timeline.indexOf(state.activeFragment);
      if (currentIndex >= state.timeline.length - 1) {
        if (state.activeFragment.video.element) {
          state.activeFragment.video.element.pause();
        }
        dispatch('skipFrames', 1);
        return;
      }
      
      const nextFragment = state.timeline[currentIndex + 1];
      if (nextFragment.video.element) {
        nextFragment.video.element.currentTime = nextFragment.start * nextFragment.video.duration;
        if (!state.activeFragment.video.element.paused || play) {
          await nextFragment.video.element.play();
        }
      }
      commit('SET_ACTIVE_FRAGMENT', nextFragment);
    },
    
    /**
     * Split fragment at current position (using command pattern)
     */
    split({ state, commit, getters, dispatch }) {
      if (!state.activeFragment) return;
      
      const result = getters.fragmentAtProgress(state.player.progress);
      if (!result || result.fragment !== state.activeFragment) return;
      
      const { fragment, videoProgress } = result;
      if (videoProgress <= fragment.start || videoProgress >= fragment.end) return;
      
      const command = new SplitFragmentCommand(fragment, videoProgress);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Set fragment start point to current position (using command pattern)
     */
    setStartPoint({ state, commit, getters, dispatch }) {
      if (!state.activeFragment) return;
      
      const result = getters.fragmentAtProgress(state.player.progress);
      if (!result || result.fragment !== state.activeFragment) return;
      
      const { fragment, videoProgress } = result;
      if (videoProgress >= fragment.end) return;
      
      const newStart = Math.max(0, Math.min(videoProgress, fragment.end - 0.01));
      const command = new SetStartPointCommand(fragment, newStart);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Set fragment end point to current position (using command pattern)
     */
    setEndPoint({ state, commit, getters, dispatch }) {
      if (!state.activeFragment) return;
      
      const result = getters.fragmentAtProgress(state.player.progress);
      if (!result || result.fragment !== state.activeFragment) return;
      
      const { fragment, videoProgress } = result;
      if (videoProgress <= fragment.start) return;
      
      const newEnd = Math.min(1, Math.max(videoProgress, fragment.start + 0.01));
      const command = new SetEndPointCommand(fragment, newEnd);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Shift fragment left or right in timeline (using command pattern)
     */
    shiftFragment({ state, commit, dispatch }, shift) {
      if (!state.activeFragment) return;
      
      const fragment = state.activeFragment;
      const currentIndex = state.timeline.indexOf(fragment);
      if (currentIndex === -1) return;
      
      const newIndex = currentIndex + shift;
      if (newIndex < 0 || newIndex >= state.timeline.length) return;
      
      const command = new MoveFragmentCommand(fragment, newIndex);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Execute a command (command pattern)
     */
    executeCommand({ state, commit, getters }, command) {
      if (!command || typeof command.execute !== 'function') {
        console.error('Invalid command:', command);
        return;
      }

      const context = { state, commit, getters };
      const result = command.execute(context);
      
      // Push to undo stack
      commit('PUSH_UNDO', command);
      
      return result;
    },

    /**
     * Undo last action (using command pattern)
     */
    undo({ state, commit, getters }) {
      const command = commit('POP_UNDO');
      if (!command || typeof command.undo !== 'function') {
        return;
      }

      const context = { state, commit, getters };
      command.undo(context);
    },
    
    /**
     * Redo last undone action (using command pattern)
     */
    redo({ state, commit, getters }) {
      const command = commit('POP_REDO');
      if (!command || typeof command.execute !== 'function') {
        return;
      }

      const context = { state, commit, getters };
      command.execute(context);
      
      // Move back to undo stack
      commit('PUSH_UNDO', command);
    },
    
    /**
     * Duplicate fragment (using command pattern)
     */
    duplicateFragment({ state, commit, dispatch }, fragment = null) {
      const targetFragment = fragment || state.activeFragment;
      if (!targetFragment) return;
      
      const command = new DuplicateFragmentCommand(targetFragment);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Set fragment volume (using command pattern)
     */
    setFragmentVolume({ state, commit, dispatch }, { fragment = state.activeFragment, volume }) {
      if (!fragment) return;
      
      const command = new SetVolumeCommand(fragment, volume);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Set fragment playback rate (using command pattern)
     */
    setFragmentPlaybackRate({ state, commit, dispatch }, { fragment = state.activeFragment, playbackRate }) {
      if (!fragment) return;
      
      const command = new SetPlaybackRateCommand(fragment, playbackRate);
      return dispatch('executeCommand', command);
    },
    
    /**
     * Show export dialog
     */
    showExportDialog({ commit }, show = true) {
      commit('SET_EXPORT_DIALOG', show);
    },
    
    /**
     * Export video
     */
    async exportVideo({ state, commit, getters }, exportOptions = {}) {
      if (state.timeline.length === 0) {
        throw new Error('No fragments in timeline to export');
      }

      commit('SET_EXPORT_STATUS_SHOW', true);
      commit('SET_EXPORT_STATUS_DONE', false);
      commit('SET_EXPORT_STATUS_ERROR', '');
      commit('SET_EXPORT_STATUS_PROGRESS', 0);
      commit('SET_EXPORT_STATUS_OUTPUT', []); // Clear previous output
      commit('SET_EXPORT_STATUS_COMMAND', null); // Clear command reference

      try {
        const options = {
          ...state.export,
          ...exportOptions,
        };

        // Store export job ID for cancellation
        let exportJobId = null;

        // Check if we should force client-side (for testing or when backend is unavailable)
        const forceClientSide = exportOptions.forceClientSide || false;

        const result = await ExportService.exportVideo(
          {
            timeline: state.timeline,
            videoFiles: state.videoFiles,
            exportOptions: options,
            outputName: options.outputPath || 'exported-video.mp4',
          },
          (progress) => {
            commit('SET_EXPORT_STATUS_PROGRESS', progress);
          },
          (outputLine) => {
            commit('ADD_EXPORT_STATUS_OUTPUT_LINE', outputLine);
          },
          forceClientSide
        );

        // If client-side export returned a blob, handle download
        if (result.blob && result.fileUrl) {
          // Create download link
          const link = document.createElement('a');
          link.href = result.fileUrl;
          link.download = result.fileName || 'exported-video.mp4';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Optionally upload to user's files
          if (exportOptions.uploadToFiles !== false) {
            try {
              await ExportService.uploadExportedVideo(
                result.blob,
                result.fileName || 'exported-video.mp4',
                (uploadProgress) => {
                  commit('SET_EXPORT_STATUS_PROGRESS', {
                    percent: 0.95 + (uploadProgress * 0.05),
                    timemark: getters.fullDuration,
                  });
                }
              );
            } catch (uploadError) {
              console.warn('Failed to upload exported video:', uploadError);
              // Don't fail the export if upload fails
            }
          }
        }

        // Store job ID if available
        if (result.jobId) {
          exportJobId = result.jobId;
          commit('SET_EXPORT_STATUS_COMMAND', { jobId: exportJobId, type: 'export' });
        }

        commit('SET_EXPORT_STATUS_DONE', true);
        commit('SET_EXPORT_STATUS_PROGRESS', { percent: 1, timemark: getters.fullDuration });
        
        return result;
      } catch (error) {
        console.error('Export failed:', error);
        commit('SET_EXPORT_STATUS_ERROR', error.message || 'Export failed');
        throw error;
      }
    },

    /**
     * Cancel export job
     */
    async cancelExport({ state, commit }) {
      const command = state.exportStatus.command;
      if (!command || !command.jobId) {
        console.warn('No active export job to cancel');
        return;
      }

      try {
        await ExportService.cancelExportJob(command.jobId);
        commit('SET_EXPORT_STATUS_SHOW', false);
        commit('SET_EXPORT_STATUS_ERROR', 'Export cancelled by user');
        commit('SET_EXPORT_STATUS_COMMAND', null);
      } catch (error) {
        console.error('Failed to cancel export:', error);
        commit('SET_EXPORT_STATUS_ERROR', `Failed to cancel export: ${error.message || 'Unknown error'}`);
      }
    },
    
    /**
     * Reset export status
     */
    resetExportStatus({ commit }) {
      commit('SET_EXPORT_STATUS_SHOW', false);
      commit('SET_EXPORT_STATUS_DONE', false);
      commit('SET_EXPORT_STATUS_ERROR', '');
      commit('SET_EXPORT_STATUS_PROGRESS', 0);
      commit('SET_EXPORT_STATUS_COMMAND', null);
    },
    
    /**
     * Add export filter
     */
    addExportFilter({ commit, state }, filter) {
      const filters = [...state.export.filters, filter];
      commit('SET_EXPORT_FILTERS', filters);
    },
    
    /**
     * Remove export filter
     */
    removeExportFilter({ commit, state }, filter) {
      const filters = state.export.filters.filter(f => f !== filter);
      commit('SET_EXPORT_FILTERS', filters);
    },
    
    /**
     * Set export FPS
     */
    setExportFPS({ commit }, fps) {
      commit('SET_EXPORT_FPS', fps);
    },
    
    /**
     * Set export bitrate
     */
    setExportBitrate({ commit }, bitrate) {
      commit('SET_EXPORT_BITRATE', bitrate);
    },
    
    /**
     * Set export custom resolution
     */
    setExportCustomResolution({ commit }, { width, height }) {
      commit('SET_EXPORT_CUSTOM_RESOLUTION', { width, height });
    },
    
    /**
     * Reset editor state
     */
    resetState({ commit }) {
      commit('RESET_STATE');
    },

    /**
     * Save current editor state as a project
     */
    async saveProject({ state, commit }, { name, description = '' }) {
      try {
        const ProjectService = (await import('@/services/videoeditor/ProjectService')).default;
        const serializedState = ProjectService.serializeEditorState(state);
        
        const project = await ProjectService.saveProject({
          name,
          description,
          state: serializedState,
          videoType: state.videoType,
          videoId: state.videoId,
        });

        return project;
      } catch (error) {
        console.error('Failed to save project:', error);
        throw error;
      }
    },

    /**
     * Load a saved project
     */
    async loadProject({ commit, dispatch }, projectId) {
      try {
        const ProjectService = (await import('@/services/videoeditor/ProjectService')).default;
        const project = await ProjectService.loadProject(projectId);
        const deserializedState = ProjectService.deserializeProjectState(project);

        // Reset current state
        commit('RESET_STATE');

        // Restore project state
        if (deserializedState.videoType && deserializedState.videoId) {
          // Load the original video first
          await dispatch('importVideo', {
            type: deserializedState.videoType,
            id: deserializedState.videoId,
          });
        }

        // Restore timeline fragments (if available)
        // Note: This requires the video to be loaded first
        if (deserializedState.timeline && deserializedState.timeline.length > 0) {
          // TODO: Reconstruct fragments from serialized state
          // This requires matching video files with saved fragment data
        }

        // Restore other settings
        if (deserializedState.player?.widthPercent) {
          commit('SET_PLAYER_WIDTH', deserializedState.player.widthPercent);
        }
        if (deserializedState.configTimeline?.widthPerSecond) {
          commit('SET_WIDTH_PER_SECOND', deserializedState.configTimeline.widthPerSecond);
        }
        if (deserializedState.export) {
          commit('SET_EXPORT_FPS', deserializedState.export.fps || '');
          commit('SET_EXPORT_BITRATE', deserializedState.export.bitrate || '');
          if (deserializedState.export.customResolution) {
            commit('SET_EXPORT_CUSTOM_RESOLUTION', {
              width: deserializedState.export.width,
              height: deserializedState.export.height,
            });
          }
          commit('SET_EXPORT_INTERPOLATE', deserializedState.export.interpolate || false);
        }

        return project;
      } catch (error) {
        console.error('Failed to load project:', error);
        throw error;
      }
    },

    /**
     * List all projects for the current user
     */
    async listProjects({ commit }, params = {}) {
      try {
        const ProjectService = (await import('@/services/videoeditor/ProjectService')).default;
        const projects = await ProjectService.listProjects(params);
        return projects;
      } catch (error) {
        console.error('Failed to list projects:', error);
        throw error;
      }
    },

    /**
     * Delete a project
     */
    async deleteProject({ commit }, projectId) {
      try {
        const ProjectService = (await import('@/services/videoeditor/ProjectService')).default;
        await ProjectService.deleteProject(projectId);
      } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
      }
    },
  },
};


