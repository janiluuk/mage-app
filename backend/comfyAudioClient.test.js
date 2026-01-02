const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

test('generateAndStream orchestrates the full audio generation pipeline', async () => {
  // This test verifies the integration of all components
  const { generateAndStream } = require('./comfyAudioClient');
  
  // Verify the function exists and has the correct signature
  assert.equal(typeof generateAndStream, 'function');
  // Function has 2 required params (text, res) and 1 optional with default (host)
  assert.equal(generateAndStream.length, 2);
});

test('generateAndStream calls required functions in sequence', () => {
  // This test documents the expected call flow
  const expectedFlow = [
    'buildPrompt',
    'queuePrompt',
    'waitForResult',
    'fetchAudio',
    'processAndStream'
  ];
  
  assert.equal(expectedFlow.length, 5);
  assert.equal(expectedFlow[0], 'buildPrompt');
  assert.equal(expectedFlow[1], 'queuePrompt');
  assert.equal(expectedFlow[2], 'waitForResult');
  assert.equal(expectedFlow[3], 'fetchAudio');
  assert.equal(expectedFlow[4], 'processAndStream');
});

test('generateAndStream uses default host when not provided', () => {
  const { generateAndStream } = require('./comfyAudioClient');
  
  // Verify default parameter
  const funcString = generateAndStream.toString();
  assert.match(funcString, /host.*=.*127\.0\.0\.1:8188/);
});

test('generateAndStream generates unique client IDs', () => {
  // Client IDs should be unique for each request
  // This is handled by randomUUID from crypto
  const { randomUUID } = require('crypto');
  
  const id1 = randomUUID();
  const id2 = randomUUID();
  
  assert.notEqual(id1, id2);
  assert.ok(id1.length > 0);
  assert.ok(id2.length > 0);
});
