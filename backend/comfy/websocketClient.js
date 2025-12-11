const WebSocket = require('ws');

// Timeout configuration (in milliseconds)
const TIMEOUT_WEBSOCKET_RESULT = process.env.COMFY_WS_TIMEOUT || 60000; // 60 seconds

/**
 * Wait for ComfyUI result via WebSocket connection.
 * @param {string} host - ComfyUI host and port
 * @param {string} clientId - Unique client ID for tracking
 * @returns {Promise<Object>} File information for the generated audio
 */
function waitForResult(host, clientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${host}/ws?clientId=${clientId}`);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error(`Timeout waiting for ComfyUI result (${TIMEOUT_WEBSOCKET_RESULT}ms)`));
    }, TIMEOUT_WEBSOCKET_RESULT);
    
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

module.exports = { waitForResult };
