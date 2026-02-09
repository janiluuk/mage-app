import { describe, it, expect, beforeEach, vi } from 'vitest';
import cloudStorageService from './cloudStorageService';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

vi.mock('@/services/request-service/ApiRequestService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('cloudStorageService', () => {
  beforeEach(() => {
    global.localStorage = localStorageMock;
    localStorageMock.clear();
  });

  it('rejects invalid config', () => {
    expect(() => cloudStorageService.connect({})).toThrow('Provider is required');
    expect(() => cloudStorageService.connect({ provider: 's3' })).toThrow('Bucket is required');
  });

  it('connects and reports connection state', () => {
    const config = cloudStorageService.connect({
      provider: 's3',
      bucket: 'mage-bucket',
      mode: 'local'
    });

    expect(config.provider).toBe('s3');
    expect(cloudStorageService.isConnected()).toBe(true);
  });

  it('stores local entries and lists them', async () => {
    cloudStorageService.connect({
      provider: 's3',
      bucket: 'mage-bucket',
      mode: 'local'
    });

    cloudStorageService.addLocalFile({
      path: 'users/1/sample.mp4',
      size: 12345
    });

    const files = await cloudStorageService.listFiles('users/1');
    expect(files.length).toBe(1);
    expect(files[0].path).toBe('users/1/sample.mp4');
  });

  it('syncs entries in local mode', async () => {
    cloudStorageService.connect({
      provider: 's3',
      bucket: 'mage-bucket',
      mode: 'local'
    });

    const entries = await cloudStorageService.syncFiles([
      { path: 'users/2/clip.mp4', size: 999 }
    ]);

    expect(entries.length).toBe(1);
    expect(entries[0].path).toBe('users/2/clip.mp4');
  });
});

