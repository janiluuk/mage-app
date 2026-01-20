/**
 * SetEndPointCommand - Sets the end point of a fragment
 */
import BaseCommand from './BaseCommand';

export default class SetEndPointCommand extends BaseCommand {
  constructor(fragment, newEnd) {
    super('setEndPoint', `Set end point to ${(newEnd * 100).toFixed(1)}%`);
    this.fragment = fragment;
    this.newEnd = newEnd;
    this.oldEnd = fragment.end;
  }

  execute(context) {
    if (this.newEnd <= this.fragment.start) {
      return;
    }

    this.fragment.end = Math.min(1, Math.max(this.newEnd, this.fragment.start + 0.01));
    return this.fragment;
  }

  undo(context) {
    this.fragment.end = this.oldEnd;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      oldEnd: this.oldEnd,
      newEnd: this.newEnd,
    };
  }
}

