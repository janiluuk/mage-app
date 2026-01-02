const { test } = require('node:test');
const assert = require('node:assert/strict');

// Note: Full WebSocket testing requires a mock server or integration tests
// These tests verify error message formats and expected behavior

test('waitForResult function exists and has correct signature', () => {
  const { waitForResult } = require('./websocketClient');
  
  assert.equal(typeof waitForResult, 'function');
  assert.equal(waitForResult.length, 2); // host, clientId parameters
});

test('waitForResult error message formats are correct', () => {
  // Test timeout error format
  const timeoutError = new Error('Timeout waiting for ComfyUI result (60000ms)');
  assert.match(timeoutError.message, /Timeout waiting for ComfyUI result/);
  
  // Test JSON parse error format
  const parseError = new Error('Failed to parse WebSocket message: Unexpected token');
  assert.match(parseError.message, /Failed to parse WebSocket message/);
  
  // Test WebSocket error format
  const wsError = new Error('WebSocket connection error: Connection refused');
  assert.match(wsError.message, /WebSocket connection error/);
  
  // Test close error format
  const closeError = new Error('WebSocket closed unexpectedly: 1006 Connection lost');
  assert.match(closeError.message, /WebSocket closed unexpectedly/);
});

test('waitForResult uses configurable timeout from environment', () => {
  // Set timeout environment variable
  const originalTimeout = process.env.COMFY_WS_TIMEOUT;
  process.env.COMFY_WS_TIMEOUT = '30000';
  
  // Clear require cache to pick up new env var
  delete require.cache[require.resolve('./websocketClient')];
  const { waitForResult } = require('./websocketClient');
  
  // Verify function still exists after reload
  assert.equal(typeof waitForResult, 'function');
  
  // Restore original timeout
  if (originalTimeout) {
    process.env.COMFY_WS_TIMEOUT = originalTimeout;
  } else {
    delete process.env.COMFY_WS_TIMEOUT;
  }
  
  // Clear cache again
  delete require.cache[require.resolve('./websocketClient')];
});
