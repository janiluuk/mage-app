const { randomUUID } = require('crypto');

/**
 * Manages a queue of audio generation jobs with status tracking and history.
 */
class QueueManager {
  /**
   * @param {number} historyLimit - Maximum number of completed jobs to keep in history
   */
  constructor(historyLimit = 25) {
    this.historyLimit = historyLimit;
    this.activeJobs = [];
    this.history = [];
  }

  /**
   * Add a new job to the queue.
   * @param {Object} metadata - Additional metadata for the job
   * @returns {Object} The created job with id, status, createdAt, and metadata
   */
  enqueue(metadata = {}) {
    const job = {
      id: randomUUID(),
      status: 'queued',
      createdAt: new Date().toISOString(),
      metadata,
    };
    this.activeJobs.push(job);
    return job;
  }

  /**
   * Mark a job as processing.
   * @param {string} id - Job ID
   * @returns {Object|null} The updated job or null if not found
   */
  markProcessing(id) {
    const job = this.findJob(id);
    if (!job) return null;
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    return job;
  }

  /**
   * Mark a job as completed and move it to history.
   * @param {string} id - Job ID
   * @returns {Object|null} The completed job or null if not found
   */
  markComplete(id) {
    const job = this.removeJob(id);
    if (!job) return null;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    this.pushToHistory(job);
    return job;
  }

  /**
   * Mark a job as failed and move it to history.
   * @param {string} id - Job ID
   * @param {Error|string} error - Error object or message
   * @returns {Object|null} The failed job or null if not found
   */
  markFailed(id, error) {
    const job = this.removeJob(id);
    if (!job) return null;
    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = error?.message || String(error);
    this.pushToHistory(job);
    return job;
  }

  /**
   * Get the current queue state with queued jobs, processing jobs, and history.
   * @returns {Object} Object containing queued, processing, and history arrays
   */
  getQueue() {
    const queued = this.activeJobs.filter((job) => job.status === 'queued');
    const processing = this.activeJobs.filter((job) => job.status === 'processing');

    return {
      queued,
      processing,
      history: [...this.history],
    };
  }

  /**
   * Get a summary of the current queue status.
   * @returns {Object} Object with current processing job, queue count, and recent history
   */
  getStatus() {
    const { queued, processing } = this.getQueue();
    return {
      processing: processing[0] || null,
      queued: queued.length,
      recent: this.history.slice(0, 5),
    };
  }

  /**
   * Reset the queue manager, clearing all active jobs and history.
   */
  reset() {
    this.activeJobs = [];
    this.history = [];
  }

  pushToHistory(job) {
    this.history.unshift(job);
    if (this.history.length > this.historyLimit) {
      this.history.length = this.historyLimit;
    }
  }

  findJob(id) {
    return this.activeJobs.find((job) => job.id === id) || null;
  }

  removeJob(id) {
    const index = this.activeJobs.findIndex((job) => job.id === id);
    if (index === -1) return null;
    const [job] = this.activeJobs.splice(index, 1);
    return job;
  }
}

const defaultQueueManager = new QueueManager();

module.exports = defaultQueueManager;
module.exports.QueueManager = QueueManager;
