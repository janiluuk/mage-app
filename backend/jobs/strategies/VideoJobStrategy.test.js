const { test } = require('node:test');
const assert = require('node:assert/strict');
const VideoJobStrategy = require('./VideoJobStrategy');

test('VideoJobStrategy has name property', () => {
  const strategy = new VideoJobStrategy('test-strategy');
  
  assert.equal(strategy.name, 'test-strategy');
});

test('VideoJobStrategy run method throws error by default', async () => {
  const strategy = new VideoJobStrategy('base');
  
  await assert.rejects(
    async () => strategy.run({}),
    (err) => {
      assert.match(err.message, /Strategy base must implement run\(jobPayload\)/);
      return true;
    }
  );
});

test('VideoJobStrategy can be extended', async () => {
  class CustomStrategy extends VideoJobStrategy {
    constructor() {
      super('custom');
    }
    
    async run(jobPayload) {
      return {
        strategy: this.name,
        data: jobPayload
      };
    }
  }
  
  const strategy = new CustomStrategy();
  assert.equal(strategy.name, 'custom');
  
  const result = await strategy.run({ test: 'data' });
  assert.equal(result.strategy, 'custom');
  assert.deepEqual(result.data, { test: 'data' });
});
