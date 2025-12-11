const axios = require('axios');

// Timeout configuration (in milliseconds)
const TIMEOUT_QUEUE_PROMPT = process.env.COMFY_QUEUE_TIMEOUT || 10000; // 10 seconds
const TIMEOUT_FETCH_AUDIO = process.env.COMFY_FETCH_TIMEOUT || 30000; // 30 seconds

/**
 * Queue a prompt to ComfyUI for processing.
 * @param {Object} prompt - ComfyUI workflow prompt object
 * @param {string} host - ComfyUI host and port (e.g., '127.0.0.1:8188')
 * @param {string} clientId - Unique client ID for tracking
 * @returns {Promise<void>}
 */
async function queuePrompt(prompt, host, clientId) {
  try {
    await axios.post(`http://${host}/prompt`, { prompt, client_id: clientId }, {
      timeout: TIMEOUT_QUEUE_PROMPT,
    });
  } catch (error) {
    throw new Error(`Failed to queue prompt to ComfyUI at ${host}: ${error.message}`);
  }
}

/**
 * Fetch generated audio file from ComfyUI.
 * @param {string} host - ComfyUI host and port
 * @param {Object} fileInfo - File information from ComfyUI result
 * @returns {Promise<Buffer>} Audio file as Buffer
 */
async function fetchAudio(host, fileInfo) {
  if (!fileInfo || !fileInfo.filename) {
    throw new Error('Invalid file info: missing filename');
  }

  const url = `http://${host}/view?filename=${encodeURIComponent(fileInfo.filename)}&subfolder=${fileInfo.subfolder || ''}&type=${fileInfo.type || 'output'}`;
  
  try {
    const { data } = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: TIMEOUT_FETCH_AUDIO,
    });
    return Buffer.from(data);
  } catch (error) {
    throw new Error(`Failed to fetch audio from ComfyUI: ${error.message}`);
  }
}

module.exports = { queuePrompt, fetchAudio };
