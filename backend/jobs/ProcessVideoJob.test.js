const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ProcessVideoJob } = require('./ProcessVideoJob');
const VideoJobStrategy = require('./strategies/VideoJobStrategy');

test('ProcessVideoJob initializes with default strategies', () => {
  const processor = new ProcessVideoJob();
  
  assert.ok(processor.strategies);
  assert.ok(processor.strategies.vid2vid);
  assert.ok(processor.strategies.deforum);
});

test('ProcessVideoJob accepts custom strategy map', () => {
  class CustomStrategy extends VideoJobStrategy {
    constructor() {
      super('custom');
    }
    async run(jobPayload) {
      return { custom: true };
    }
  }
  
  const customStrategy = new CustomStrategy();
  const processor = new ProcessVideoJob({ custom: customStrategy });
  
  assert.ok(processor.strategies.custom);
  assert.equal(processor.strategies.custom, customStrategy);
});

test('register adds new strategy', () => {
  class NewStrategy extends VideoJobStrategy {
    constructor() {
      super('new');
    }
    async run() {
      return { strategy: 'new' };
    }
  }
  
  const processor = new ProcessVideoJob();
  const newStrategy = new NewStrategy();
  
  processor.register('new', newStrategy);
  
  assert.ok(processor.strategies.new);
  assert.equal(processor.strategies.new, newStrategy);
});

test('register throws error if strategy does not extend VideoJobStrategy', () => {
  const processor = new ProcessVideoJob();
  const invalidStrategy = {
    async run() {
      return {};
    }
  };
  
  assert.throws(
    () => processor.register('invalid', invalidStrategy),
    (err) => {
      assert.match(err.message, /Strategy must extend VideoJobStrategy/);
      return true;
    }
  );
});

test('handle dispatches to correct strategy by generator field', async () => {
  const processor = new ProcessVideoJob();
  
  const result = await processor.handle({
    generator: 'vid2vid',
    source: 'video.mp4',
    prompt: 'test prompt'
  });
  
  assert.equal(result.strategy, 'vid2vid');
  assert.equal(result.status, 'queued');
  assert.equal(result.source, 'video.mp4');
  assert.equal(result.prompt, 'test prompt');
});

test('handle dispatches to correct strategy by type field', async () => {
  const processor = new ProcessVideoJob();
  
  const result = await processor.handle({
    type: 'deforum',
    frames: 100,
    settings: { test: true }
  });
  
  assert.equal(result.strategy, 'deforum');
  assert.equal(result.status, 'queued');
  assert.equal(result.frames, 100);
});

test('handle throws error for unknown strategy', async () => {
  const processor = new ProcessVideoJob();
  
  await assert.rejects(
    async () => processor.handle({ generator: 'unknown' }),
    (err) => {
      assert.match(err.message, /No strategy registered for generator "unknown"/);
      return true;
    }
  );
});

test('handle throws error when no generator or type is provided', async () => {
  const processor = new ProcessVideoJob();
  
  await assert.rejects(
    async () => processor.handle({}),
    (err) => {
      assert.match(err.message, /No strategy registered for generator/);
      return true;
    }
  );
});

test('handle works with custom registered strategies', async () => {
  class CustomStrategy extends VideoJobStrategy {
    constructor() {
      super('custom');
    }
    async run(jobPayload) {
      return {
        strategy: this.name,
        custom: true,
        data: jobPayload.data
      };
    }
  }
  
  const processor = new ProcessVideoJob();
  processor.register('custom', new CustomStrategy());
  
  const result = await processor.handle({
    generator: 'custom',
    data: 'test data'
  });
  
  assert.equal(result.strategy, 'custom');
  assert.equal(result.custom, true);
  assert.equal(result.data, 'test data');
});
