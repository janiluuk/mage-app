const VideoJobStrategy = require('./VideoJobStrategy');

class DeforumJob extends VideoJobStrategy {
  constructor() {
    super('deforum');
  }

  async run(jobPayload) {
    const { frames, settings } = jobPayload || {};

    return {
      strategy: this.name,
      status: 'queued',
      steps: [
        'serialize deforum timeline',
        'dispatch deforum workflow',
        'track animation progress',
      ],
      frames,
      settings,
    };
  }
}

module.exports = DeforumJob;
