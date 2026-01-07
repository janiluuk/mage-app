import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PreviewQuality,
  PreviewStatus,
  debounce,
  generatePreviewId,
  getQualityConfig,
  validatePreviewSettings,
  RealtimePreviewService,
  useRealtimePreviewService
} from './realtimePreviewService';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

global.WebSocket = MockWebSocket;
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

describe('realtimePreviewService', () => {
  describe('PreviewQuality', () => {
    it('defines quality levels', () => {
      expect(PreviewQuality.LOW).toBe('low');
      expect(PreviewQuality.MEDIUM).toBe('medium');
      expect(PreviewQuality.HIGH).toBe('high');
    });
  });

  describe('PreviewStatus', () => {
    it('defines preview statuses', () => {
      expect(PreviewStatus.IDLE).toBe('idle');
      expect(PreviewStatus.PENDING).toBe('pending');
      expect(PreviewStatus.GENERATING).toBe('generating');
      expect(PreviewStatus.READY).toBe('ready');
      expect(PreviewStatus.ERROR).toBe('error');
      expect(PreviewStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('debounce', () => {
    it('debounces function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to debounced function', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('cancels previous timeout on new call', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      await new Promise(resolve => setTimeout(resolve, 50));
      debounced();

      await new Promise(resolve => setTimeout(resolve, 120));
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('generatePreviewId', () => {
    it('generates unique preview IDs', () => {
      const id1 = generatePreviewId();
      const id2 = generatePreviewId();

      expect(id1).toMatch(/^preview_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^preview_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getQualityConfig', () => {
    it('returns config for low quality', () => {
      const config = getQualityConfig(PreviewQuality.LOW);
      expect(config.resolution).toBe(256);
      expect(config.refreshRate).toBe(1000);
      expect(config.debounce).toBe(300);
    });

    it('returns config for medium quality', () => {
      const config = getQualityConfig(PreviewQuality.MEDIUM);
      expect(config.resolution).toBe(512);
      expect(config.refreshRate).toBe(1500);
      expect(config.debounce).toBe(500);
    });

    it('returns config for high quality', () => {
      const config = getQualityConfig(PreviewQuality.HIGH);
      expect(config.resolution).toBe(1024);
      expect(config.refreshRate).toBe(2000);
      expect(config.debounce).toBe(800);
    });

    it('returns default config for invalid quality', () => {
      const config = getQualityConfig('invalid');
      expect(config.resolution).toBe(512);
    });
  });

  describe('validatePreviewSettings', () => {
    it('validates valid settings', () => {
      const result = validatePreviewSettings({
        quality: PreviewQuality.MEDIUM,
        refreshRate: 1500
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects null settings', () => {
      const result = validatePreviewSettings(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid settings object');
    });

    it('rejects invalid quality', () => {
      const result = validatePreviewSettings({ quality: 'invalid' });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid quality level');
    });

    it('rejects refresh rate too low', () => {
      const result = validatePreviewSettings({ refreshRate: 100 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Refresh rate');
    });

    it('rejects refresh rate too high', () => {
      const result = validatePreviewSettings({ refreshRate: 10000 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Refresh rate');
    });
  });

  describe('RealtimePreviewService', () => {
    let service;

    beforeEach(() => {
      service = new RealtimePreviewService();
    });

    afterEach(() => {
      if (service.ws) {
        service.disconnect();
      }
    });

    describe('constructor', () => {
      it('initializes with default values', () => {
        expect(service.ws).toBeNull();
        expect(service.enabled).toBe(false);
        expect(service.quality).toBe(PreviewQuality.MEDIUM);
        expect(service.currentJobId).toBeNull();
      });

      it('initializes empty maps', () => {
        expect(service.previewCache).toBeInstanceOf(Map);
        expect(service.activeRequests).toBeInstanceOf(Map);
        expect(service.listeners).toBeInstanceOf(Map);
      });
    });

    describe('connect', () => {
      it('establishes WebSocket connection', async () => {
        await service.connect('ws://localhost:8080');
        expect(service.ws).toBeTruthy();
        expect(service.ws.url).toBe('ws://localhost:8080');
      });

      it('resolves when already connected', async () => {
        await service.connect('ws://localhost:8080');
        await expect(service.connect('ws://localhost:8080')).resolves.toBeUndefined();
      });

      it('sets up event handlers', async () => {
        await service.connect('ws://localhost:8080');
        expect(service.ws.onopen).toBeTruthy();
        expect(service.ws.onclose).toBeTruthy();
        expect(service.ws.onerror).toBeTruthy();
        expect(service.ws.onmessage).toBeTruthy();
      });
    });

    describe('disconnect', () => {
      it('closes WebSocket connection', async () => {
        await service.connect('ws://localhost:8080');
        service.disconnect();
        expect(service.ws).toBeNull();
      });

      it('cancels all active requests', async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
        service.requestPreview(123, { test: 'settings' });
        
        service.disconnect();
        
        const requests = Array.from(service.activeRequests.values());
        expect(requests.every(r => r.status === PreviewStatus.CANCELLED)).toBe(true);
      });
    });

    describe('handleMessage', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
      });

      it('handles preview_ready message', () => {
        const data = {
          type: 'preview_ready',
          preview_id: 'test_id',
          preview_url: 'data:image/jpeg;base64,...',
          job_id: 123
        };

        service.handleMessage({
          data: JSON.stringify(data)
        });

        const cached = service.getCachedPreview('test_id');
        expect(cached).toBeTruthy();
        expect(cached.url).toBe(data.preview_url);
      });

      it('handles preview_error message', () => {
        const previewId = 'test_id';
        service.activeRequests.set(previewId, {
          id: previewId,
          status: PreviewStatus.PENDING
        });

        const data = {
          type: 'preview_error',
          preview_id: previewId,
          error: 'Test error'
        };

        service.handleMessage({
          data: JSON.stringify(data)
        });

        const request = service.activeRequests.get(previewId);
        expect(request.status).toBe(PreviewStatus.ERROR);
        expect(request.error).toBe('Test error');
      });

      it('handles invalid JSON gracefully', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        service.handleMessage({
          data: 'invalid json'
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('requestPreview', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('returns null when disabled', () => {
        service.enabled = false;
        const result = service.requestPreview(123, {});
        expect(result).toBeNull();
      });

      it('returns null when not connected', () => {
        service.disconnect();
        const result = service.requestPreview(123, {});
        expect(result).toBeNull();
      });

      it('generates and sends preview request', () => {
        const sendSpy = vi.spyOn(service.ws, 'send');
        const previewId = service.requestPreview(123, { test: 'settings' });

        expect(previewId).toBeTruthy();
        expect(sendSpy).toHaveBeenCalled();
        expect(service.activeRequests.has(previewId)).toBe(true);
      });

      it('stores request with correct data', () => {
        const previewId = service.requestPreview(123, { test: 'settings' });
        const request = service.activeRequests.get(previewId);

        expect(request.jobId).toBe(123);
        expect(request.status).toBe(PreviewStatus.PENDING);
        expect(request.timestamp).toBeTruthy();
      });
    });

    describe('requestPreviewDebounced', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('debounces multiple requests', async () => {
        const spy = vi.spyOn(service, 'requestPreview');

        service.requestPreviewDebounced(123, { test: '1' });
        service.requestPreviewDebounced(123, { test: '2' });
        service.requestPreviewDebounced(123, { test: '3' });

        expect(spy).not.toHaveBeenCalled();

        await new Promise(resolve => setTimeout(resolve, 600));
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('cancels previous requests for same job', async () => {
        const spy = vi.spyOn(service, 'cancelRequestsForJob');

        service.requestPreviewDebounced(123, {});

        expect(spy).toHaveBeenCalledWith(123);
      });
    });

    describe('cancelRequest', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('cancels pending request', () => {
        const previewId = service.requestPreview(123, {});
        service.cancelRequest(previewId);

        const request = service.activeRequests.get(previewId);
        expect(request.status).toBe(PreviewStatus.CANCELLED);
      });

      it('sends cancellation to server', () => {
        const sendSpy = vi.spyOn(service.ws, 'send');
        const previewId = service.requestPreview(123, {});
        
        service.cancelRequest(previewId);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('cancel_preview')
        );
      });

      it('does not cancel already completed request', () => {
        const previewId = 'test_id';
        service.activeRequests.set(previewId, {
          id: previewId,
          status: PreviewStatus.READY
        });

        service.cancelRequest(previewId);

        const request = service.activeRequests.get(previewId);
        expect(request.status).toBe(PreviewStatus.READY);
      });
    });

    describe('cancelRequestsForJob', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('cancels all requests for specific job', () => {
        const id1 = service.requestPreview(123, {});
        const id2 = service.requestPreview(123, {});
        const id3 = service.requestPreview(456, {});

        service.cancelRequestsForJob(123);

        expect(service.activeRequests.get(id1).status).toBe(PreviewStatus.CANCELLED);
        expect(service.activeRequests.get(id2).status).toBe(PreviewStatus.CANCELLED);
        expect(service.activeRequests.get(id3).status).toBe(PreviewStatus.PENDING);
      });
    });

    describe('cancelAllRequests', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('cancels all active requests', () => {
        const id1 = service.requestPreview(123, {});
        const id2 = service.requestPreview(456, {});
        const id3 = service.requestPreview(789, {});

        service.cancelAllRequests();

        expect(service.activeRequests.get(id1).status).toBe(PreviewStatus.CANCELLED);
        expect(service.activeRequests.get(id2).status).toBe(PreviewStatus.CANCELLED);
        expect(service.activeRequests.get(id3).status).toBe(PreviewStatus.CANCELLED);
      });
    });

    describe('cache management', () => {
      it('caches preview', () => {
        service.previewCache.set('test_id', {
          url: 'data:image/jpeg;base64,...',
          timestamp: Date.now(),
          jobId: 123
        });

        const cached = service.getCachedPreview('test_id');
        expect(cached).toBeTruthy();
        expect(cached.url).toBeTruthy();
      });

      it('returns null for missing cache', () => {
        const cached = service.getCachedPreview('nonexistent');
        expect(cached).toBeNull();
      });

      it('clears cache', () => {
        service.previewCache.set('test_id', { url: 'test' });
        service.clearCache();
        expect(service.previewCache.size).toBe(0);
      });
    });

    describe('quality management', () => {
      it('sets quality', () => {
        service.setQuality(PreviewQuality.HIGH);
        expect(service.quality).toBe(PreviewQuality.HIGH);
      });

      it('ignores invalid quality', () => {
        service.quality = PreviewQuality.MEDIUM;
        service.setQuality('invalid');
        expect(service.quality).toBe(PreviewQuality.MEDIUM);
      });

      it('recreates debounced function on quality change', () => {
        const oldDebounced = service.debouncedRequest;
        service.setQuality(PreviewQuality.HIGH);
        expect(service.debouncedRequest).not.toBe(oldDebounced);
      });
    });

    describe('enable/disable', () => {
      it('enables preview', () => {
        service.enable();
        expect(service.isEnabled()).toBe(true);
      });

      it('disables preview', () => {
        service.enabled = true;
        service.disable();
        expect(service.isEnabled()).toBe(false);
      });

      it('cancels requests on disable', async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
        service.requestPreview(123, {});

        service.disable();

        const requests = Array.from(service.activeRequests.values());
        expect(requests.every(r => r.status === PreviewStatus.CANCELLED)).toBe(true);
      });
    });

    describe('event listeners', () => {
      it('adds event listener', () => {
        const callback = vi.fn();
        service.addEventListener('preview_ready', callback);

        expect(service.listeners.has('preview_ready')).toBe(true);
      });

      it('removes event listener', () => {
        const callback = vi.fn();
        service.addEventListener('preview_ready', callback);
        service.removeEventListener('preview_ready', callback);

        const listeners = service.listeners.get('preview_ready');
        expect(listeners).toHaveLength(0);
      });

      it('notifies listeners', () => {
        const callback = vi.fn();
        service.addEventListener('preview_ready', callback);

        service.notifyListeners('preview_ready', { test: 'data' });

        expect(callback).toHaveBeenCalledWith({ test: 'data' });
      });

      it('handles errors in listeners gracefully', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const callback = vi.fn(() => {
          throw new Error('Test error');
        });
        service.addEventListener('preview_ready', callback);

        service.notifyListeners('preview_ready', {});

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('getActiveRequestsCount', () => {
      beforeEach(async () => {
        await service.connect('ws://localhost:8080');
        service.enabled = true;
      });

      it('counts pending requests', () => {
        service.requestPreview(123, {});
        service.requestPreview(456, {});

        expect(service.getActiveRequestsCount()).toBe(2);
      });

      it('excludes cancelled requests', () => {
        const id1 = service.requestPreview(123, {});
        service.requestPreview(456, {});
        service.cancelRequest(id1);

        expect(service.getActiveRequestsCount()).toBe(1);
      });
    });

    describe('getConnectionStatus', () => {
      it('returns disconnected when no connection', () => {
        expect(service.getConnectionStatus()).toBe('disconnected');
      });

      it('returns connected when connection is open', async () => {
        await service.connect('ws://localhost:8080');
        expect(service.getConnectionStatus()).toBe('connected');
      });

      it('returns closed after disconnection', async () => {
        await service.connect('ws://localhost:8080');
        service.disconnect();
        expect(service.getConnectionStatus()).toBe('disconnected');
      });
    });
  });

  describe('useRealtimePreviewService', () => {
    it('creates service instance', () => {
      const service = useRealtimePreviewService();
      expect(service).toBeInstanceOf(RealtimePreviewService);
    });
  });
});
