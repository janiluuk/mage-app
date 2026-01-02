const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

// Mock axios before requiring comfyClient
const axios = require('axios');
const { queuePrompt, fetchAudio } = require('./comfyClient');

test('queuePrompt sends prompt to ComfyUI', async () => {
  const mockPost = mock.method(axios, 'post', async () => ({ data: { prompt_id: '123' } }));
  
  const prompt = { '1': { inputs: { text: 'test' } } };
  const host = '127.0.0.1:8188';
  const clientId = 'test-client-id';
  
  await queuePrompt(prompt, host, clientId);
  
  assert.equal(mockPost.mock.calls.length, 1);
  const [url, payload, config] = mockPost.mock.calls[0].arguments;
  assert.equal(url, `http://${host}/prompt`);
  assert.deepEqual(payload.prompt, prompt);
  assert.equal(payload.client_id, clientId);
  assert.ok(config.timeout);
  
  mockPost.mock.restore();
});

test('queuePrompt throws error on failure', async () => {
  const mockPost = mock.method(axios, 'post', async () => {
    throw new Error('Connection refused');
  });
  
  const prompt = { '1': { inputs: { text: 'test' } } };
  
  await assert.rejects(
    async () => queuePrompt(prompt, 'invalid-host:9999', 'client'),
    (err) => {
      assert.match(err.message, /Failed to queue prompt/);
      assert.match(err.message, /Connection refused/);
      return true;
    }
  );
  
  mockPost.mock.restore();
});

test('fetchAudio retrieves audio file from ComfyUI', async () => {
  const audioData = Buffer.from('fake audio data');
  const mockGet = mock.method(axios, 'get', async () => ({ data: audioData }));
  
  const fileInfo = {
    filename: 'audio_00001.wav',
    subfolder: '',
    type: 'output'
  };
  const host = '127.0.0.1:8188';
  
  const result = await fetchAudio(host, fileInfo);
  
  assert.equal(mockGet.mock.calls.length, 1);
  const [url, config] = mockGet.mock.calls[0].arguments;
  assert.match(url, new RegExp(`http://${host}/view`));
  assert.match(url, /filename=audio_00001\.wav/);
  assert.equal(config.responseType, 'arraybuffer');
  assert.ok(config.timeout);
  assert.ok(Buffer.isBuffer(result));
  
  mockGet.mock.restore();
});

test('fetchAudio throws error when file info is invalid', async () => {
  await assert.rejects(
    async () => fetchAudio('127.0.0.1:8188', {}),
    (err) => {
      assert.match(err.message, /Invalid file info/);
      assert.match(err.message, /missing filename/);
      return true;
    }
  );
  
  await assert.rejects(
    async () => fetchAudio('127.0.0.1:8188', null),
    (err) => {
      assert.match(err.message, /Invalid file info/);
      return true;
    }
  );
});

test('fetchAudio throws error on network failure', async () => {
  const mockGet = mock.method(axios, 'get', async () => {
    throw new Error('Network error');
  });
  
  const fileInfo = { filename: 'test.wav' };
  
  await assert.rejects(
    async () => fetchAudio('127.0.0.1:8188', fileInfo),
    (err) => {
      assert.match(err.message, /Failed to fetch audio/);
      assert.match(err.message, /Network error/);
      return true;
    }
  );
  
  mockGet.mock.restore();
});

test('fetchAudio handles subfolder and type parameters', async () => {
  const audioData = Buffer.from('audio');
  const mockGet = mock.method(axios, 'get', async () => ({ data: audioData }));
  
  const fileInfo = {
    filename: 'test.wav',
    subfolder: 'temp',
    type: 'temp'
  };
  
  await fetchAudio('127.0.0.1:8188', fileInfo);
  
  const [url] = mockGet.mock.calls[0].arguments;
  assert.match(url, /subfolder=temp/);
  assert.match(url, /type=temp/);
  
  mockGet.mock.restore();
});
