/**
 * VideoFragmentAdapter - Adapts movie-maker's VideoFragment for web usage
 * Represents a segment of a video with start/end points, volume, and playback rate
 */

export default class VideoFragmentAdapter {
  constructor(videoFile, id) {
    this.video = videoFile;
    this.start = 0; // Start point (0-1, relative to video duration)
    this.end = 1; // End point (0-1, relative to video duration)
    this.playbackRate = 1;
    this.volume = 1;
    
    if (id !== undefined) {
      this.id = id;
      VideoFragmentAdapter.id = id + 1;
    } else {
      this.id = VideoFragmentAdapter.id++;
    }
  }

  /**
   * Get the portion of video (0-1)
   */
  get portion() {
    return this.end - this.start;
  }

  /**
   * Reset video element to start point
   */
  reset() {
    if (!this.video || !this.video.element) {
      return;
    }
    const element = this.video.element;
    element.pause();
    const startTime = this.start * this.video.duration;
    element.currentTime = startTime;
  }

  /**
   * Get current progress within this fragment (0-1)
   */
  get progress() {
    if (!this.video || !this.video.element) {
      return 0;
    }
    const element = this.video.element;
    if (!element.duration || element.duration === 0) {
      return 0;
    }
    
    const videoProgress = element.currentTime / element.duration;
    if (videoProgress < this.start) {
      return 0;
    }
    if (videoProgress > this.end) {
      return 1;
    }
    
    return (videoProgress - this.start) / this.portion;
  }

  /**
   * Get adjusted duration considering playback rate and portion
   */
  get adjustedDuration() {
    if (!this.video || !this.video.duration) {
      return 0;
    }
    
    if (this.playbackRate === 0 || !isFinite(this.playbackRate)) {
      return 0;
    }
    
    const baseDuration = this.video.duration / this.playbackRate;
    const adjusted = baseDuration * this.portion;
    return (isNaN(adjusted) || !isFinite(adjusted)) ? 0 : adjusted;
  }

  /**
   * Create fragment from object (for loading saved projects)
   */
  static fromObject(videoFile, obj) {
    const fragment = new VideoFragmentAdapter(videoFile, obj.id);
    fragment.start = obj.start || 0;
    fragment.end = obj.end || 1;
    fragment.volume = obj.volume !== undefined ? obj.volume : 1;
    fragment.playbackRate = obj.playbackRate !== undefined ? obj.playbackRate : 1;
    return fragment;
  }

  /**
   * Convert to object for serialization
   */
  toObject() {
    return {
      id: this.id,
      start: this.start,
      end: this.end,
      volume: this.volume,
      playbackRate: this.playbackRate,
      videoUrl: this.video?.videoUrl
    };
  }
}

// Static ID counter
VideoFragmentAdapter.id = 0;


