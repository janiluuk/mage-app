/**
 * BaseCommand - Base class for all video editor commands
 * Implements the command pattern for undo/redo functionality
 */
export default class BaseCommand {
  constructor(type, description = '') {
    this.type = type;
    this.description = description;
    this.timestamp = Date.now();
  }

  /**
   * Execute the command
   * @param {Object} context - Command context (store, state, etc.)
   * @returns {Promise|void}
   */
  execute(context) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Undo the command
   * @param {Object} context - Command context
   * @returns {Promise|void}
   */
  undo(context) {
    throw new Error('undo() must be implemented by subclass');
  }

  /**
   * Get command data for serialization
   */
  toJSON() {
    return {
      type: this.type,
      description: this.description,
      timestamp: this.timestamp,
    };
  }
}

