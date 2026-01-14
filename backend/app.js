const express = require('express');
const cors = require('cors');
const defaultAudioClient = require('./comfyAudioClient');
const defaultQueueManager = require('./queueManager');

function createApp({ audioClient = defaultAudioClient, queueManager = defaultQueueManager } = {}) {
  const app = express();

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://localhost:3000'];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // In production, check whitelist
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.get('/api/stream', async (req, res) => {
    const { text = '', mood = '' } = req.query;

    // Validate input
    if (typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Text parameter must be a string' 
      });
    }

    if (text.length === 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Text parameter cannot be empty' 
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Text parameter exceeds maximum length of 1000 characters' 
      });
    }

    // Sanitize input - remove potentially dangerous characters
    const sanitizedText = text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters

    // Validate mood parameter if provided
    const validMoods = ['relaxing', 'energizing', ''];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: 'Invalid mood parameter. Must be "relaxing" or "energizing"'
      });
    }

    const job = queueManager.enqueue({ text: sanitizedText, mood });

    res.setHeader('Content-Type', 'audio/aac');
    res.setHeader('X-Job-Id', job.id);

    try {
      queueManager.markProcessing(job.id);
      const comfyHost = process.env.COMFY_HOST || '127.0.0.1:8188';
      
      // Only warn about missing COMFY_HOST in production, not during tests
      if (!process.env.COMFY_HOST && process.env.NODE_ENV === 'production') {
        console.warn('COMFY_HOST environment variable is not set, using default: 127.0.0.1:8188');
      }
      
      await audioClient.generateAndStream(sanitizedText, res, comfyHost);
      queueManager.markComplete(job.id);
    } catch (err) {
      console.error('Audio generation error:', err.message || err);
      queueManager.markFailed(job.id, err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error generating audio',
          details: process.env.NODE_ENV === 'production' 
            ? 'An error occurred during audio generation' 
            : err.message 
        });
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

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Don't leak error details in production
    const errorResponse = {
      error: 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message, stack: err.stack })
    };
    
    res.status(err.statusCode || 500).json(errorResponse);
  });

  return app;
}

module.exports = { createApp };
