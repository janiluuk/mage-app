import { onUnmounted, onBeforeUnmount } from 'vue';

/**
 * Composable for managing component cleanup
 * Helps prevent memory leaks by ensuring proper cleanup of event listeners, timers, etc.
 * 
 * @example
 * import { useCleanup } from '@/composables/useCleanup';
 * 
 * setup() {
 *   const { registerCleanup, cleanup } = useCleanup();
 *   
 *   // Register a timer
 *   const timerId = setInterval(() => { ... }, 1000);
 *   registerCleanup(() => clearInterval(timerId));
 *   
 *   // Register an event listener
 *   const handler = () => { ... };
 *   window.addEventListener('resize', handler);
 *   registerCleanup(() => window.removeEventListener('resize', handler));
 * }
 */
export function useCleanup() {
  const cleanupFunctions = [];

  /**
   * Register a cleanup function to be called when component unmounts
   * @param {Function} fn - Cleanup function
   */
  function registerCleanup(fn) {
    if (typeof fn !== 'function') {
      console.warn('registerCleanup expects a function');
      return;
    }
    cleanupFunctions.push(fn);
  }

  /**
   * Execute all registered cleanup functions
   */
  function cleanup() {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctions.length = 0; // Clear array
  }

  // Automatically cleanup on component unmount
  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    registerCleanup,
    cleanup
  };
}

/**
 * Composable for managing polling intervals
 * Automatically cleans up interval on component unmount
 * 
 * @param {Function} callback - Function to call on each interval
 * @param {number} interval - Interval in milliseconds
 * @param {boolean} immediate - Whether to call immediately (default: false)
 * 
 * @example
 * import { usePolling } from '@/composables/useCleanup';
 * 
 * setup() {
 *   const { start, stop, isPolling } = usePolling(
 *     () => fetchStatus(),
 *     5000,  // Poll every 5 seconds
 *     true   // Start immediately
 *   );
 * }
 */
export function usePolling(callback, interval = 1000, immediate = false) {
  const { registerCleanup } = useCleanup();
  let timerId = null;
  let isActive = false;

  function start() {
    if (isActive) return;
    
    isActive = true;
    
    if (immediate) {
      callback();
    }
    
    timerId = setInterval(callback, interval);
    registerCleanup(stop);
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      isActive = false;
    }
  }

  function restart() {
    stop();
    start();
  }

  return {
    start,
    stop,
    restart,
    isPolling: () => isActive
  };
}

/**
 * Composable for managing event listeners
 * Automatically removes event listeners on component unmount
 * 
 * @param {EventTarget} target - Event target (window, document, element, etc.)
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {object} options - Event listener options
 * 
 * @example
 * import { useEventListener } from '@/composables/useCleanup';
 * 
 * setup() {
 *   useEventListener(window, 'resize', () => {
 *     console.log('Window resized');
 *   });
 * }
 */
export function useEventListener(target, event, handler, options) {
  const { registerCleanup } = useCleanup();

  if (!target || !event || !handler) {
    console.warn('useEventListener requires target, event, and handler');
    return;
  }

  target.addEventListener(event, handler, options);
  registerCleanup(() => {
    target.removeEventListener(event, handler, options);
  });
}

/**
 * Composable for managing WebSocket connections
 * Automatically closes connection on component unmount
 * 
 * @param {string} url - WebSocket URL
 * @param {object} options - WebSocket options
 * 
 * @example
 * import { useWebSocket } from '@/composables/useCleanup';
 * 
 * setup() {
 *   const { ws, connect, disconnect, isConnected } = useWebSocket(
 *     'ws://localhost:8080',
 *     {
 *       onMessage: (event) => { ... },
 *       onError: (error) => { ... }
 *     }
 *   );
 * }
 */
export function useWebSocket(url, options = {}) {
  const { registerCleanup } = useCleanup();
  let ws = null;
  let connected = false;

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return ws;
    }

    ws = new WebSocket(url);

    ws.onopen = (event) => {
      connected = true;
      if (options.onOpen) options.onOpen(event);
    };

    ws.onmessage = (event) => {
      if (options.onMessage) options.onMessage(event);
    };

    ws.onerror = (error) => {
      connected = false;
      if (options.onError) options.onError(error);
    };

    ws.onclose = (event) => {
      connected = false;
      if (options.onClose) options.onClose(event);
    };

    registerCleanup(disconnect);

    return ws;
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
      connected = false;
    }
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      return true;
    }
    return false;
  }

  return {
    ws,
    connect,
    disconnect,
    send,
    isConnected: () => connected
  };
}

/**
 * Composable for managing request cancellation
 * Automatically cancels pending requests on component unmount
 * 
 * @example
 * import { useRequestCancellation } from '@/composables/useCleanup';
 * 
 * setup() {
 *   const { getAbortSignal, cancelAll } = useRequestCancellation();
 *   
 *   async function fetchData() {
 *     const signal = getAbortSignal();
 *     const response = await fetch('/api/data', { signal });
 *     return response.json();
 *   }
 * }
 */
export function useRequestCancellation() {
  const { registerCleanup } = useCleanup();
  const controllers = [];

  function getAbortSignal() {
    const controller = new AbortController();
    controllers.push(controller);
    return controller.signal;
  }

  function cancelAll() {
    controllers.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        // Ignore errors from already aborted controllers
      }
    });
    controllers.length = 0;
  }

  registerCleanup(cancelAll);

  return {
    getAbortSignal,
    cancelAll
  };
}

export default {
  useCleanup,
  usePolling,
  useEventListener,
  useWebSocket,
  useRequestCancellation
};
