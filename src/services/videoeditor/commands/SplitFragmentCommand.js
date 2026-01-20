/**
 * SplitFragmentCommand - Splits a fragment at a specific position
 */
import BaseCommand from './BaseCommand';
import VideoFragmentAdapter from '../VideoFragmentAdapter';

export default class SplitFragmentCommand extends BaseCommand {
  constructor(fragment, splitPoint) {
    super('split', `Split fragment at ${(splitPoint * 100).toFixed(1)}%`);
    this.fragment = fragment;
    this.splitPoint = splitPoint; // Video progress (0-1)
    this.newFragment = null;
    this.originalEnd = fragment.end;
  }

  execute(context) {
    const { state, commit } = context;
    
    if (!this.fragment || this.splitPoint <= this.fragment.start || this.splitPoint >= this.fragment.end) {
      return;
    }

    // Create new fragment for the second part
    this.newFragment = new VideoFragmentAdapter(this.fragment.video);
    this.newFragment.start = this.splitPoint;
    this.newFragment.end = this.fragment.end;
    this.newFragment.volume = this.fragment.volume;
    this.newFragment.playbackRate = this.fragment.playbackRate;

    // Update original fragment to end at split point
    this.fragment.end = this.splitPoint;

    // Insert new fragment after current one
    const currentIndex = state.timeline.indexOf(this.fragment);
    commit('ADD_TO_TIMELINE', { fragment: this.newFragment, index: currentIndex + 1 });

    return this.newFragment;
  }

  undo(context) {
    const { state, commit } = context;
    
    if (this.newFragment) {
      const splitIndex = state.timeline.indexOf(this.newFragment);
      if (splitIndex !== -1) {
        commit('REMOVE_FROM_TIMELINE', this.newFragment);
        this.fragment.end = this.originalEnd;
      }
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      splitPoint: this.splitPoint,
      newFragmentId: this.newFragment?.id,
    };
  }
}

