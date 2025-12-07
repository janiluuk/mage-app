const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { QueueManager } = require('./queueManager');

let manager;

beforeEach(() => {
  manager = new QueueManager();
});

test('enqueue tracks queued jobs and metadata', () => {
  const job = manager.enqueue({ text: 'hello' });
  const { queued } = manager.getQueue();

  assert.equal(queued.length, 1);
  assert.equal(queued[0].id, job.id);
  assert.equal(queued[0].metadata.text, 'hello');
  assert.equal(queued[0].status, 'queued');
});

test('processing and completion moves jobs to history', () => {
  const job = manager.enqueue({ text: 'world' });
  manager.markProcessing(job.id);
  manager.markComplete(job.id);

  const { processing, queued, history } = manager.getQueue();

  assert.equal(processing.length, 0);
  assert.equal(queued.length, 0);
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'completed');
  assert.ok(history[0].completedAt);
});

test('markFailed stores error and keeps history trimmed', () => {
  const job = manager.enqueue({ text: 'error' });
  manager.markFailed(job.id, new Error('boom'));

  const { history } = manager.getQueue();
  assert.equal(history[0].status, 'failed');
  assert.equal(history[0].error, 'boom');
});

test('history length respects the configured limit', () => {
  manager = new QueueManager(2);

  const jobA = manager.enqueue({ text: 'a' });
  manager.markProcessing(jobA.id);
  manager.markComplete(jobA.id);

  const jobB = manager.enqueue({ text: 'b' });
  manager.markProcessing(jobB.id);
  manager.markComplete(jobB.id);

  const jobC = manager.enqueue({ text: 'c' });
  manager.markProcessing(jobC.id);
  manager.markComplete(jobC.id);

  const { history } = manager.getQueue();
  assert.equal(history.length, 2);
  assert.equal(history[0].metadata.text, 'c');
  assert.equal(history[1].metadata.text, 'b');
});

test('status summarizes current work', () => {
  const job = manager.enqueue({ text: 'status' });
  manager.markProcessing(job.id);

  const status = manager.getStatus();

  assert.equal(status.queued, 0);
  assert.equal(status.processing.id, job.id);
  assert.ok(Array.isArray(status.recent));
});
