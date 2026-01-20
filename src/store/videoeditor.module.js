/**
 * VideoEditor Vuex Module
 * Manages state for the video editor (ported from movie-maker)
 */

import VideoFileAdapter from '@/services/videoeditor/VideoFileAdapter';
import VideoFragmentAdapter from '@/services/videoeditor/VideoFragmentAdapter';
import VideoLoader from '@/services/videoeditor/VideoLoader';

const initialState = {
  timeline: [], // Array of VideoFragmentAdapter instances
  activeFragment: null,
  videoFiles: [], // Array of VideoFileAdapter instances
  videosContainer: null, // DOM container for video elements
  
  // Player state
  player: {
    progress: 0, // 0-1, overall timeline progress
    playing: false,
    volume: 1, // Global player volume
    widthPercent: parseFloat(localStorage.getItem('playerWidth') || '0.5'),
    fullscreen: false,
  },
  
  // Timeline configuration
  configTimeline: {
    minFragmentWidth: 90,
    widthPerSecond: parseFloat(localStorage.getItem('widthPerSecond') || '3.5'),
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
  },
  
  // Export status
  exportStatus: {
    show: false,
    progress: 0,
    done: false,
    error: '',
    command: null,
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
    
    // Reset state
    RESET_STATE(state) {
      // Clean up video files
      state.videoFiles.forEach(v => v.destroy());
      
      // Reset to initial state
      Object.assign(state, {
        ...initialState,
        player: {
          ...initialState.player,
          widthPercent: parseFloat(localStorage.getItem('playerWidth') || '0.5'),
        },
        configTimeline: {
          ...initialState.configTimeline,
          widthPerSecond: parseFloat(localStorage.getItem('widthPerSecond') || '3.5'),
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
  },
  
  actions: {
    /**
     * Load video from API
     */
    async importVideo({ commit, dispatch }, { type, id }) {
      commit('SET_VIDEO_IMPORT_LOADING', true);
      try {
        const videoFile = await VideoLoader.loadVideo(type, id);
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
     * Add fragment to timeline
     */
    addFragment({ commit }, fragment) {
      commit('ADD_TO_TIMELINE', { fragment });
    },
    
    /**
     * Remove fragment from timeline
     */
    removeFragment({ commit }, fragment) {
      commit('REMOVE_FROM_TIMELINE', fragment);
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
      
      if (fragment.video.element) {
        fragment.video.element.pause();
        fragment.video.element.currentTime = videoProgress * fragment.video.duration;
      }
    },
    
    /**
     * Reset editor state
     */
    resetState({ commit }) {
      commit('RESET_STATE');
    },
  },
};

