const express = require('express');
const defaultAudioClient = require('./comfyAudioClient');
const defaultQueueManager = require('./queueManager');

function createApp({ audioClient = defaultAudioClient, queueManager = defaultQueueManager } = {}) {
  const app = express();

  app.get('/api/stream', async (req, res) => {
    const { text = '' } = req.query;

    // Validate input
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Text parameter must be a string' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text parameter exceeds maximum length of 1000 characters' });
    }

    const job = queueManager.enqueue({ text });

    res.setHeader('Content-Type', 'audio/aac');
    res.setHeader('X-Job-Id', job.id);

    try {
      queueManager.markProcessing(job.id);
      const comfyHost = process.env.COMFY_HOST || '127.0.0.1:8188';
      
      // Only warn about missing COMFY_HOST in production, not during tests
      if (!process.env.COMFY_HOST && process.env.NODE_ENV === 'production') {
        console.warn('COMFY_HOST environment variable is not set, using default: 127.0.0.1:8188');
      }
      
      await audioClient.generateAndStream(text, res, comfyHost);
      queueManager.markComplete(job.id);
    } catch (err) {
      console.error('Audio generation error:', err.message || err);
      queueManager.markFailed(job.id, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generating audio', details: err.message });
      } else {
        res.end();
      }
    }
  });

  app.get('/api/status', (req, res) => {
    res.json(queueManager.getStatus());
  });

  app.get('/api/queue', (req, res) => {
    res.json(queueManager.getQueue());
  });

  app.get('/api/config', (req, res) => {
    res.json({
      stableUrl: process.env.STABLE_URL || '',
    });
  });

  return app;
}

module.exports = { createApp };
