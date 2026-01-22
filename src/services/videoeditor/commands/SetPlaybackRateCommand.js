/**
 * SetPlaybackRateCommand - Sets the playback rate of a fragment
 */
import BaseCommand from './BaseCommand';

export default class SetPlaybackRateCommand extends BaseCommand {
  constructor(fragment, newPlaybackRate) {
    super('setPlaybackRate', `Set playback rate to ${newPlaybackRate.toFixed(2)}x`);
    this.fragment = fragment;
    this.newPlaybackRate = Math.max(0.25, Math.min(4, newPlaybackRate));
    this.oldPlaybackRate = fragment.playbackRate;
  }

  execute(context) {
    this.fragment.playbackRate = this.newPlaybackRate;
    
    // Update video element if it exists
    if (this.fragment.video?.element) {
      this.fragment.video.element.playbackRate = this.newPlaybackRate;
    }
    
    return this.fragment;
  }

  undo(context) {
    this.fragment.playbackRate = this.oldPlaybackRate;
    
    // Update video element if it exists
    if (this.fragment.video?.element) {
      this.fragment.video.element.playbackRate = this.oldPlaybackRate;
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      oldPlaybackRate: this.oldPlaybackRate,
      newPlaybackRate: this.newPlaybackRate,
    };
  }
}

