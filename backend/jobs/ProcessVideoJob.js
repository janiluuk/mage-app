const DeforumJob = require('./strategies/DeforumJob');
const Vid2VidJob = require('./strategies/Vid2VidJob');
const VideoJobStrategy = require('./strategies/VideoJobStrategy');

class ProcessVideoJob {
  constructor(strategyMap = {}) {
    this.strategies = {
      vid2vid: new Vid2VidJob(),
      deforum: new DeforumJob(),
      ...strategyMap,
    };
  }

  register(type, strategy) {
    if (!(strategy instanceof VideoJobStrategy)) {
      throw new Error('Strategy must extend VideoJobStrategy');
    }

    this.strategies[type] = strategy;
  }

  async handle(jobPayload) {
    const generator = jobPayload?.generator || jobPayload?.type;

    if (!generator || !this.strategies[generator]) {
      const message = `No strategy registered for generator "${generator}"`;
      throw new Error(message);
    }

    return this.strategies[generator].run(jobPayload);
  }
}

module.exports = { ProcessVideoJob };
