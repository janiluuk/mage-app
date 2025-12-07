const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createApp } = require('./app');
const { QueueManager } = require('./queueManager');

let server;
let baseUrl;
let queueManager;

const stubAudioClient = {
  async generateAndStream(text, res) {
    res.write(`audio:${text}`);
    res.end();
    return Promise.resolve();
  },
};

async function startServer(audioClient = stubAudioClient) {
  queueManager = new QueueManager();
  const app = createApp({ audioClient, queueManager });
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

beforeEach(async () => {
  await startServer();
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (queueManager) {
    queueManager.reset();
  }
});

test('status endpoint reports empty queue by default', async () => {
  // server started in beforeEach
  const response = await fetch(`${baseUrl}/api/status`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.queued, 0);
  assert.equal(body.processing, null);
});

test('queue endpoint lists history after streaming', async () => {
  const streamResponse = await fetch(`${baseUrl}/api/stream?text=hello`);
  assert.equal(streamResponse.status, 200);
  assert.equal(streamResponse.headers.get('x-job-id')?.length > 0, true);

  const queueResponse = await fetch(`${baseUrl}/api/queue`);
  assert.equal(queueResponse.status, 200);
  const queueBody = await queueResponse.json();

  assert.equal(queueBody.processing.length, 0);
  assert.equal(queueBody.queued.length, 0);
  assert.equal(queueBody.history.length, 1);
  assert.equal(queueBody.history[0].metadata.text, 'hello');
});

test('stream endpoint marks failures and records errors in history', async () => {
  await new Promise((resolve) => server.close(resolve));

  const failingAudioClient = {
    async generateAndStream() {
      throw new Error('synthetic failure');
    },
  };

  await startServer(failingAudioClient);

  const streamResponse = await fetch(`${baseUrl}/api/stream?text=oops`);
  assert.equal(streamResponse.status, 500);

  const queueResponse = await fetch(`${baseUrl}/api/queue`);
  assert.equal(queueResponse.status, 200);
  const queueBody = await queueResponse.json();

  assert.equal(queueBody.processing.length, 0);
  assert.equal(queueBody.queued.length, 0);
  assert.equal(queueBody.history.length, 1);
  assert.equal(queueBody.history[0].status, 'failed');
  assert.equal(queueBody.history[0].metadata.text, 'oops');
  assert.match(queueBody.history[0].error, /synthetic failure/);
});
