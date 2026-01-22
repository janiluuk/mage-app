/**
 * DeleteFragmentCommand - Removes a fragment from the timeline
 */
import BaseCommand from './BaseCommand';

export default class DeleteFragmentCommand extends BaseCommand {
  constructor(fragment) {
    super('deleteFragment', `Delete fragment ${fragment.id}`);
    this.fragment = fragment;
    this.index = null;
  }

  execute(context) {
    const { state, commit } = context;
    
    this.index = state.timeline.indexOf(this.fragment);
    if (this.index === -1) {
      return;
    }

    commit('REMOVE_FROM_TIMELINE', this.fragment);
    return this.fragment;
  }

  undo(context) {
    const { state, commit } = context;
    
    if (this.index !== null && this.index !== -1) {
      commit('ADD_TO_TIMELINE', { fragment: this.fragment, index: this.index });
      if (state.activeFragment === null) {
        commit('SET_ACTIVE_FRAGMENT', this.fragment);
      }
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      index: this.index,
    };
  }
}

