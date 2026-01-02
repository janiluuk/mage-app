const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPrompt } = require('./promptBuilder');

test('buildPrompt returns workflow with text inserted', () => {
  const text = 'test audio prompt';
  const prompt = buildPrompt(text);
  
  assert.ok(typeof prompt === 'object');
  assert.ok(prompt['1']);
  assert.ok(prompt['1'].inputs);
  assert.equal(prompt['1'].inputs.text, text);
});

test('buildPrompt creates independent copies', () => {
  const promptA = buildPrompt('first');
  const promptB = buildPrompt('second');
  
  assert.equal(promptA['1'].inputs.text, 'first');
  assert.equal(promptB['1'].inputs.text, 'second');
  
  // Modifying one should not affect the other
  promptA['1'].inputs.text = 'modified';
  assert.equal(promptB['1'].inputs.text, 'second');
});

test('buildPrompt preserves workflow structure', () => {
  const prompt = buildPrompt('test');
  
  // Should have the workflow structure from audio-workflow.json
  assert.ok(typeof prompt === 'object');
  assert.ok(Object.keys(prompt).length > 0);
});
