const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Readable } = require('stream');

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
 * Process audio buffer and stream as AAC to the response.
 * @param {Buffer} audioBuffer - Raw audio buffer from ComfyUI
 * @param {Object} res - Express response object to stream audio to
 * @returns {Promise<void>} Resolves when streaming is complete
 */
function processAndStream(audioBuffer, res) {
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

module.exports = { processAndStream };
