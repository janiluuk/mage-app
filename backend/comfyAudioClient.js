const { randomUUID } = require('crypto');
const { buildPrompt } = require('./comfy/promptBuilder');
const { queuePrompt, fetchAudio } = require('./comfy/comfyClient');
const { waitForResult } = require('./comfy/websocketClient');
const { processAndStream } = require('./audio/audioProcessor');

/**
 * Generate audio from text using ComfyUI and stream it as AAC to the response.
 * @param {string} text - Text prompt for audio generation
 * @param {Object} res - Express response object to stream audio to
 * @param {string} host - ComfyUI host and port (e.g., '127.0.0.1:8188')
 * @returns {Promise<void>} Resolves when streaming is complete
 */
async function generateAndStream(text, res, host = '127.0.0.1:8188') {
  const clientId = randomUUID();
  const prompt = buildPrompt(text);

  await queuePrompt(prompt, host, clientId);
  const fileInfo = await waitForResult(host, clientId);
  const audioBuffer = await fetchAudio(host, fileInfo);

  return processAndStream(audioBuffer, res);
}

module.exports = { generateAndStream };
