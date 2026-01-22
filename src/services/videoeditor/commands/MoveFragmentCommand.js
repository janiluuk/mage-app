/**
 * MoveFragmentCommand - Moves a fragment to a new position in the timeline
 */
import BaseCommand from './BaseCommand';

export default class MoveFragmentCommand extends BaseCommand {
  constructor(fragment, newIndex) {
    super('moveFragment', `Move fragment to position ${newIndex}`);
    this.fragment = fragment;
    this.newIndex = newIndex;
    this.oldIndex = null;
  }

  execute(context) {
    const { state, commit } = context;
    
    this.oldIndex = state.timeline.indexOf(this.fragment);
    if (this.oldIndex === -1) {
      return;
    }

    if (this.newIndex < 0 || this.newIndex >= state.timeline.length) {
      return;
    }

    commit('MOVE_FRAGMENT', { fragment: this.fragment, newIndex: this.newIndex });
    return this.fragment;
  }

  undo(context) {
    const { commit } = context;
    
    if (this.oldIndex !== null && this.oldIndex !== -1) {
      commit('MOVE_FRAGMENT', { fragment: this.fragment, newIndex: this.oldIndex });
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      oldIndex: this.oldIndex,
      newIndex: this.newIndex,
    };
  }
}

