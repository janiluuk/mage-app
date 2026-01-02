const { test } = require('node:test');
const assert = require('node:assert/strict');
const Vid2VidJob = require('./Vid2VidJob');
const VideoJobStrategy = require('./VideoJobStrategy');

test('Vid2VidJob extends VideoJobStrategy', () => {
  const job = new Vid2VidJob();
  
  assert.ok(job instanceof VideoJobStrategy);
  assert.equal(job.name, 'vid2vid');
});

test('Vid2VidJob run returns queued job structure', async () => {
  const job = new Vid2VidJob();
  const payload = {
    source: 'input.mp4',
    prompt: 'transform to anime style'
  };
  
  const result = await job.run(payload);
  
  assert.equal(result.strategy, 'vid2vid');
  assert.equal(result.status, 'queued');
  assert.equal(result.source, 'input.mp4');
  assert.equal(result.prompt, 'transform to anime style');
  assert.ok(Array.isArray(result.steps));
});

test('Vid2VidJob run includes expected processing steps', async () => {
  const job = new Vid2VidJob();
  const result = await job.run({ source: 'test.mp4', prompt: 'test' });
  
  assert.ok(result.steps.includes('validate source clip'));
  assert.ok(result.steps.includes('enqueue vid2vid rendering'));
  assert.ok(result.steps.includes('notify worker pool'));
  assert.equal(result.steps.length, 3);
});

test('Vid2VidJob run handles empty payload', async () => {
  const job = new Vid2VidJob();
  const result = await job.run({});
  
  assert.equal(result.strategy, 'vid2vid');
  assert.equal(result.status, 'queued');
  assert.equal(result.source, undefined);
  assert.equal(result.prompt, undefined);
});

test('Vid2VidJob run handles null payload', async () => {
  const job = new Vid2VidJob();
  const result = await job.run(null);
  
  assert.equal(result.strategy, 'vid2vid');
  assert.equal(result.status, 'queued');
});

test('Vid2VidJob run handles payload with only source', async () => {
  const job = new Vid2VidJob();
  const result = await job.run({ source: 'video.mp4' });
  
  assert.equal(result.source, 'video.mp4');
  assert.equal(result.prompt, undefined);
});

test('Vid2VidJob run handles payload with only prompt', async () => {
  const job = new Vid2VidJob();
  const result = await job.run({ prompt: 'style transfer' });
  
  assert.equal(result.source, undefined);
  assert.equal(result.prompt, 'style transfer');
});
