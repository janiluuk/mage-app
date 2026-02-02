import requestService from '@/services/request-service/ApiRequestService';

const CONFIG_KEY = 'mage_cloud_storage_config';
const INDEX_KEY = 'mage_cloud_storage_index';

const DEFAULT_CONFIG = {
  provider: 's3',
  mode: 'local', // local | api
  bucket: '',
  region: '',
  endpoint: '',
  accessKeyId: '',
  secretAccessKey: ''
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : null;
  } catch (error) {
    console.error('Failed to load cloud storage config:', error);
    return null;
  }
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

function loadIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load cloud storage index:', error);
    return [];
  }
}

function saveIndex(entries) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

function normalizeEntry(entry) {
  return {
    path: entry.path || '',
    size: Number(entry.size || 0),
    updatedAt: entry.updatedAt || new Date().toISOString()
  };
}

function validateConfig(config) {
  if (!config?.provider) {
    return { valid: false, error: 'Provider is required' };
  }
  if (!config?.bucket) {
    return { valid: false, error: 'Bucket is required' };
  }
  if (config.mode === 'api') {
    if (!config.accessKeyId || !config.secretAccessKey) {
      return { valid: false, error: 'Access key and secret are required for API mode' };
    }
  }
  return { valid: true, error: null };
}

async function listFiles(prefix = '') {
  const config = loadConfig();
  if (!config) {
    throw new Error('Cloud storage is not connected');
  }

  if (config.mode === 'api') {
    try {
      const response = await requestService.get('/v1/cloud/files', {
        params: { prefix }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn('Cloud storage API unavailable, falling back to local index.', error);
    }
  }

  const entries = loadIndex();
  if (!prefix) return entries;
  return entries.filter((entry) => entry.path.startsWith(prefix));
}

async function syncFiles(files = []) {
  const config = loadConfig();
  if (!config) {
    throw new Error('Cloud storage is not connected');
  }

  if (config.mode === 'api') {
    try {
      const response = await requestService.post('/v1/cloud/sync', {
        files
      });
      return response.data;
    } catch (error) {
      console.warn('Cloud storage API unavailable, falling back to local index.', error);
    }
  }

  const existing = loadIndex();
  const merged = new Map(existing.map((entry) => [entry.path, entry]));
  files.map(normalizeEntry).forEach((entry) => {
    merged.set(entry.path, entry);
  });
  const entries = Array.from(merged.values());
  saveIndex(entries);
  return entries;
}

function addLocalFile(entry) {
  const normalized = normalizeEntry(entry);
  const existing = loadIndex();
  const merged = new Map(existing.map((item) => [item.path, item]));
  merged.set(normalized.path, normalized);
  const entries = Array.from(merged.values());
  saveIndex(entries);
  return normalized;
}

const cloudStorageService = {
  getConfig() {
    return loadConfig();
  },
  connect(config) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const validation = validateConfig(finalConfig);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    saveConfig(finalConfig);
    return finalConfig;
  },
  disconnect() {
    clearConfig();
  },
  isConnected() {
    return Boolean(loadConfig());
  },
  listFiles,
  syncFiles,
  addLocalFile
};

export default cloudStorageService;

