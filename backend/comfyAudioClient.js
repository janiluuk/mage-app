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

function buildPrompt(text) {
  const prompt = JSON.parse(JSON.stringify(WORKFLOW));
  if (prompt['1'] && prompt['1'].inputs && Object.prototype.hasOwnProperty.call(prompt['1'].inputs, 'text')) {
    prompt['1'].inputs.text = text;
  }
  return prompt;
}

async function queuePrompt(prompt, host, clientId) {
  await axios.post(`http://${host}/prompt`, { prompt, client_id: clientId });
}

function waitForResult(host, clientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${host}/ws?clientId=${clientId}`);
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'executed' && data.data?.output?.audio?.length) {
          ws.close();
          resolve(data.data.output.audio[0]);
        }
      } catch (err) {
        reject(err);
      }
    });
    ws.on('error', reject);
  });
}

async function fetchAudio(host, fileInfo) {
  const url = `http://${host}/view?filename=${encodeURIComponent(fileInfo.filename)}&subfolder=${fileInfo.subfolder}&type=${fileInfo.type}`;
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(data);
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function generateAndStream(text, res, host = '127.0.0.1:8188') {
  const clientId = randomUUID();
  const prompt = buildPrompt(text);

  await queuePrompt(prompt, host, clientId);
  const fileInfo = await waitForResult(host, clientId);
  const audioBuffer = await fetchAudio(host, fileInfo);

  const audioStream = bufferToStream(audioBuffer);

  ffmpeg(audioStream)
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
    .format('adts')
    .pipe(res);
}

module.exports = { generateAndStream };
