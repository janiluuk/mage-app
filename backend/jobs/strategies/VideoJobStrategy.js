class VideoJobStrategy {
  constructor(name) {
    this.name = name;
  }

  /* eslint-disable class-methods-use-this */
  async run(jobPayload) {
    throw new Error(`Strategy ${this.name} must implement run(jobPayload)`);
  }
}

module.exports = VideoJobStrategy;
