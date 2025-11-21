const VideoJobStrategy = require('./VideoJobStrategy');

class Vid2VidJob extends VideoJobStrategy {
  constructor() {
    super('vid2vid');
  }

  async run(jobPayload) {
    const { source, prompt } = jobPayload || {};

    return {
      strategy: this.name,
      status: 'queued',
      steps: [
        'validate source clip',
        'enqueue vid2vid rendering',
        'notify worker pool',
      ],
      source,
      prompt,
    };
  }
}

module.exports = Vid2VidJob;
