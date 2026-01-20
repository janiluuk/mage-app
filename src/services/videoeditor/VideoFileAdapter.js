/**
 * VideoFileAdapter - Adapts movie-maker's VideoFile class for web/API usage
 * Replaces Electron file system access with API-based video loading
 */

import EventEmitter from 'events';

export default class VideoFileAdapter extends EventEmitter {
  constructor(videoData, metadata = {}) {
    super();
    
    // Store original video data from API
    this.videoData = videoData;
    
    // Video metadata (can be from API or ffprobe)
    this.metadata = metadata;
    
    // Video element (will be created when loaded)
    this._element = null;
    this._source = null;
    this._gainNode = null;
    this._analyser = null;
    this._dataArray = null;
    
    // Audio context for volume control
    this.audioContext = null;
    
    // Loading state
    this.canPlay = false;
    this.isLoading = false;
    
    // Setup canplay event
    this.on('canplay', () => {
      this.canPlay = true;
    });
  }

  /**
   * Get video URL from video data
   */
  get videoUrl() {
    // Try different possible URL properties
    return this.videoData?.fullPath || 
           this.videoData?.url || 
           this.videoData?.previewUrl ||
           this.videoData?.file?.url ||
           this.videoData?.file?.fullPath ||
           null;
  }

  /**
   * Get video element (creates if needed)
   */
  get element() {
    if (!this._element && this.videoUrl) {
      this._element = document.createElement('video');
      this._element.crossOrigin = 'anonymous';
      this._element.preload = 'auto';
      this._element.src = this.videoUrl;
      
      // Set up audio context when element is ready
      this._element.addEventListener('canplay', () => {
        this.setupAudioContext();
        this.emit('canplay');
      }, { once: true });
    }
    return this._element;
  }

  /**
   * Setup Web Audio API for volume control
   */
  setupAudioContext() {
    if (!this._element || !this.hasAudio) return;
    
    try {
      // Create or reuse audio context
      if (!VideoFileAdapter.audioContext) {
        VideoFileAdapter.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.audioContext = VideoFileAdapter.audioContext;
      
      // Create media element source
      if (!this._source) {
        this._source = this.audioContext.createMediaElementSource(this._element);
      }
      
      // Create gain node for volume control
      if (!this._gainNode) {
        this._gainNode = this.audioContext.createGain();
        this._source.connect(this._gainNode);
      }
      
      // Create analyser for audio visualization (if needed)
      if (this.isAudio) {
        if (!this._analyser) {
          this._analyser = this.audioContext.createAnalyser();
          this._analyser.fftSize = 2048;
          this._dataArray = new Uint8Array(this._analyser.frequencyBinCount);
          this._gainNode.connect(this._analyser);
        }
      }
      
      // Connect to destination
      this._gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Failed to setup audio context:', error);
    }
  }

  get gainNode() {
    return this._gainNode;
  }

  get analyser() {
    return this._analyser;
  }

  get dataArray() {
    return this._dataArray;
  }

  get hasAudio() {
    return this.metadata?.hasAudio !== false && 
           (this.metadata?.audioStream || this.videoData?.hasAudio !== false);
  }

  get isAudio() {
    // Check if this is an audio-only file
    const codec = this.metadata?.videoStream?.codec_name || 
                  this.videoData?.codec;
    return codec === 'png' || codec === 'jpg' || !this.metadata?.videoStream;
  }

  get fileName() {
    return this.videoData?.filename || 
           this.videoData?.name || 
           this.videoData?.file?.original_name ||
           'video';
  }

  get bitrate() {
    return this.metadata?.videoStream?.bit_rate || 
           this.videoData?.bitrate || 
           0;
  }

  get fps() {
    if (this.metadata?.videoStream?.avg_frame_rate) {
      const fps = this.metadata.videoStream.avg_frame_rate.split('/').map(n => +n);
      return Math.round((fps[0] / fps[1]) * 100) / 100;
    }
    return this.videoData?.fps || this.metadata?.fps || 30;
  }

  get width() {
    return this.metadata?.videoStream?.width || 
           this.videoData?.width || 
           this.videoData?.file?.width ||
           1920;
  }

  get height() {
    return this.metadata?.videoStream?.height || 
           this.videoData?.height || 
           this.videoData?.file?.height ||
           1080;
  }

  get aspectRatio() {
    return this.width / this.height;
  }

  get filePath() {
    // For compatibility with movie-maker code
    return this.videoUrl || '';
  }

  get duration() {
    return this.metadata?.format?.duration || 
           this.videoData?.duration || 
           this.videoData?.file?.duration ||
           0;
  }

  get videoStream() {
    return this.metadata?.videoStream || {
      width: this.width,
      height: this.height,
      codec_name: this.videoData?.codec || 'h264',
      bit_rate: this.bitrate,
      avg_frame_rate: `${this.fps}/1`
    };
  }

  get audioStream() {
    return this.metadata?.audioStream || (this.hasAudio ? {} : undefined);
  }

  get streams() {
    return this.metadata?.streams || [this.videoStream, this.audioStream].filter(Boolean);
  }

  get probe() {
    // Return probe-like structure for compatibility
    return {
      format: {
        duration: this.duration,
        filename: this.filePath,
        format_name: this.videoData?.format || 'mp4'
      },
      streams: this.streams
    };
  }

  /**
   * Load video metadata from API if not provided
   */
  async loadMetadata() {
    if (this.metadata && this.metadata.duration) {
      return this.metadata;
    }
    
    // If metadata is not provided, we'll use basic info from videoData
    // In a full implementation, you might want to call an API endpoint
    // to get detailed metadata using ffprobe
    return {
      format: {
        duration: this.duration,
        filename: this.filePath
      },
      streams: this.streams,
      videoStream: this.videoStream,
      audioStream: this.audioStream
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this._element) {
      this._element.pause();
      this._element.src = '';
      this._element = null;
    }
    
    if (this._source) {
      try {
        this._source.disconnect();
      } catch (e) {
        // Ignore
      }
      this._source = null;
    }
    
    if (this._gainNode) {
      try {
        this._gainNode.disconnect();
      } catch (e) {
        // Ignore
      }
      this._gainNode = null;
    }
    
    if (this._analyser) {
      try {
        this._analyser.disconnect();
      } catch (e) {
        // Ignore
      }
      this._analyser = null;
    }
  }

  toJSON() {
    return this.videoUrl;
  }
}

// Static audio context (shared across all video files)
VideoFileAdapter.audioContext = null;


