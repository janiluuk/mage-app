const express = require('express');
const { generateAndStream } = require('./comfyAudioClient');

const app = express();

app.get('/api/stream', async (req, res) => {
  const { text = '' } = req.query;
  res.setHeader('Content-Type', 'audio/aac');
  try {
    await generateAndStream(text, res);
  } catch (err) {
    console.error(err);
    res.status(500).end('Error generating audio');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
