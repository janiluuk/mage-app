const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Readable } = require('stream');
const { randomUUID } = require('crypto');

const WORKFLOW_PATH = path.join(__dirname, 'audio-workflow.json');
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

async function queuePrompt(prompt, host, clientId) {
  try {
    await axios.post(`http://${host}/prompt`, { prompt, client_id: clientId }, {
      timeout: 10000, // 10 second timeout
    });
  } catch (error) {
    throw new Error(`Failed to queue prompt to ComfyUI at ${host}: ${error.message}`);
  }
}

function waitForResult(host, clientId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Timeout waiting for ComfyUI result (60s)'));
    }, 60000); // 60 second timeout

    const ws = new WebSocket(`ws://${host}/ws?clientId=${clientId}`);
    
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'executed' && data.data?.output?.audio?.length) {
          clearTimeout(timeout);
          ws.close();
          resolve(data.data.output.audio[0]);
        }
      } catch (err) {
        clearTimeout(timeout);
        ws.close();
        reject(new Error(`Failed to parse WebSocket message: ${err.message}`));
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket connection error: ${error.message}`));
    });

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      if (code !== 1000) {
        reject(new Error(`WebSocket closed unexpectedly: ${code} ${reason}`));
      }
    });
  });
}

async function fetchAudio(host, fileInfo) {
  if (!fileInfo || !fileInfo.filename) {
    throw new Error('Invalid file info: missing filename');
  }

  const url = `http://${host}/view?filename=${encodeURIComponent(fileInfo.filename)}&subfolder=${fileInfo.subfolder || ''}&type=${fileInfo.type || 'output'}`;
  
  try {
    const { data } = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });
    return Buffer.from(data);
  } catch (error) {
    throw new Error(`Failed to fetch audio from ComfyUI: ${error.message}`);
  }
}

/**
 * Convert a Buffer to a Readable stream.
 * @param {Buffer} buffer - Buffer to convert
 * @returns {Readable} Readable stream
 */
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

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

  const audioStream = bufferToStream(audioBuffer);

  return new Promise((resolve, reject) => {
    const command = ffmpeg(audioStream)
      .setFfmpegPath(ffmpegPath)
      .inputOptions(['-f wav'])
      .complexFilter([
        'acompressor=threshold=-20dB:ratio=2:attack=5:release=50',
        'highpass=f=120',
        'aecho=0.8:0.9:1000:0.3',
        'alimiter=limit=0.95'
      ])
      .audioChannels(2)
      .audioCodec('aac')
      .audioBitrate('128k')
      .format('adts');

    const outputStream = command.pipe(res);

    command.on('end', resolve);
    command.on('error', reject);
    outputStream.on('error', reject);
    res.on('close', resolve);
  });
}

module.exports = { generateAndStream };
