/**
 * SetStartPointCommand - Sets the start point of a fragment
 */
import BaseCommand from './BaseCommand';

export default class SetStartPointCommand extends BaseCommand {
  constructor(fragment, newStart) {
    super('setStartPoint', `Set start point to ${(newStart * 100).toFixed(1)}%`);
    this.fragment = fragment;
    this.newStart = newStart;
    this.oldStart = fragment.start;
  }

  execute(context) {
    if (this.newStart >= this.fragment.end) {
      return;
    }

    this.fragment.start = Math.max(0, Math.min(this.newStart, this.fragment.end - 0.01));
    return this.fragment;
  }

  undo(context) {
    this.fragment.start = this.oldStart;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      oldStart: this.oldStart,
      newStart: this.newStart,
    };
  }
}

