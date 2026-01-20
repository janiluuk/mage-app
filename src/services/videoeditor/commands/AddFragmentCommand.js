/**
 * AddFragmentCommand - Adds a fragment to the timeline
 */
import BaseCommand from './BaseCommand';

export default class AddFragmentCommand extends BaseCommand {
  constructor(fragment, index = null) {
    super('addFragment', `Add fragment ${fragment.id}`);
    this.fragment = fragment;
    this.index = index;
  }

  execute(context) {
    const { commit } = context;
    
    commit('ADD_TO_TIMELINE', { fragment: this.fragment, index: this.index });
    return this.fragment;
  }

  undo(context) {
    const { commit } = context;
    
    commit('REMOVE_FROM_TIMELINE', this.fragment);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      index: this.index,
    };
  }
}

