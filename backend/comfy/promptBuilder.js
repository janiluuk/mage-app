const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(__dirname, '..', 'audio-workflow.json');
const WORKFLOW = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));

/**
 * Build a ComfyUI prompt from the audio workflow template with the given text.
 * @param {string} text - Text prompt for audio generation
 * @returns {Object} ComfyUI workflow prompt object
 */
function buildPrompt(text) {
  const prompt = JSON.parse(JSON.stringify(WORKFLOW));
  if (prompt['1'] && prompt['1'].inputs && Object.prototype.hasOwnProperty.call(prompt['1'].inputs, 'text')) {
    prompt['1'].inputs.text = text;
  }
  return prompt;
}

module.exports = { buildPrompt };
