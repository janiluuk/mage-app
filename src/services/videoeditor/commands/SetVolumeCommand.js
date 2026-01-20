/**
 * SetVolumeCommand - Sets the volume of a fragment
 */
import BaseCommand from './BaseCommand';

export default class SetVolumeCommand extends BaseCommand {
  constructor(fragment, newVolume) {
    super('setVolume', `Set volume to ${(newVolume * 100).toFixed(0)}%`);
    this.fragment = fragment;
    this.newVolume = Math.max(0, Math.min(1, newVolume));
    this.oldVolume = fragment.volume;
  }

  execute(context) {
    this.fragment.volume = this.newVolume;
    return this.fragment;
  }

  undo(context) {
    this.fragment.volume = this.oldVolume;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fragmentId: this.fragment?.id,
      oldVolume: this.oldVolume,
      newVolume: this.newVolume,
    };
  }
}

