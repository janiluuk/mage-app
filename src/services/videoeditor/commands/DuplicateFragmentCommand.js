/**
 * DuplicateFragmentCommand - Duplicates a fragment
 */
import BaseCommand from './BaseCommand';
import VideoFragmentAdapter from '../VideoFragmentAdapter';

export default class DuplicateFragmentCommand extends BaseCommand {
  constructor(fragment, index = null) {
    super('duplicateFragment', `Duplicate fragment ${fragment.id}`);
    this.originalFragment = fragment;
    this.duplicateFragment = null;
    this.index = index;
  }

  execute(context) {
    const { state, commit } = context;
    
    // Create duplicate fragment
    this.duplicateFragment = new VideoFragmentAdapter(this.originalFragment.video);
    this.duplicateFragment.start = this.originalFragment.start;
    this.duplicateFragment.end = this.originalFragment.end;
    this.duplicateFragment.volume = this.originalFragment.volume;
    this.duplicateFragment.playbackRate = this.originalFragment.playbackRate;

    // Determine insertion index
    if (this.index === null) {
      const currentIndex = state.timeline.indexOf(this.originalFragment);
      this.index = currentIndex !== -1 ? currentIndex + 1 : state.timeline.length;
    }

    commit('ADD_TO_TIMELINE', { fragment: this.duplicateFragment, index: this.index });
    return this.duplicateFragment;
  }

  undo(context) {
    const { commit } = context;
    
    if (this.duplicateFragment) {
      commit('REMOVE_FROM_TIMELINE', this.duplicateFragment);
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalFragmentId: this.originalFragment?.id,
      duplicateFragmentId: this.duplicateFragment?.id,
      index: this.index,
    };
  }
}

