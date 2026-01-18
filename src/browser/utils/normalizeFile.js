const parseTimestamp = (value) => {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
};

export const normalizeTags = (raw) => {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map(t => {
      if (typeof t === 'object' && t?.name) {
        return t.name;
      }
      return t;
    });
  } else if (typeof raw === "string") {
    list = raw.split(",");
  }

  const cleaned = list
    .map((tag) => (tag ?? "").toString().trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

export function normalizeFile(file) {
  if (!file) return null;
  
  const name = file?.original_name || file?.name || (file?.id != null ? `file-${file.id}` : "file");
  const createdMs = parseTimestamp(file?.created_at || file?.updated_at);
  const updatedMs = parseTimestamp(file?.updated_at || file?.created_at);
  
  // Extract dimensions from meta if available
  const meta = typeof file.meta === 'string' ? JSON.parse(file.meta || '{}') : (file.meta || {});
  const width = meta.width || file.width || null;
  const height = meta.height || file.height || null;
  const aspectRatio = width && height ? width / height : 16 / 9;
  
  // Determine file URL/path
  const path = file.path || '';
  const disk = file.disk || 'local';
  const fullPath = path ? `/storage/${disk}/${path}` : null;
  
  // Tags from relationship or direct field
  // Tags can be an array of objects with name/id or an array of strings
  let tags = [];
  if (Array.isArray(file.tags)) {
    tags = file.tags.map(t => {
      if (typeof t === 'object' && t?.name) {
        return t.name;
      }
      return t?.toString() || '';
    }).filter(Boolean);
  } else if (file.tags) {
    tags = normalizeTags(file.tags);
  }
  tags = Array.from(new Set(tags)); // Remove duplicates

  return {
    id: file?.id != null ? String(file.id) : name,
    name,
    original_name: file.original_name || name,
    basename: name,
    dirname: "",
    fullPath,
    previewUrl: fullPath, // Files use their path as preview
    createdMs,
    dateModified: updatedMs,
    width,
    height,
    dimensions: width && height ? { width, height, aspectRatio } : null,
    aspectRatio,
    size: file.size || 0,
    mime_type: file.mime_type || '',
    type: file.type || 'file',
    project_id: file.project_id || null,
    tags,
    isElectronFile: false,
    metadata: {
      createdAt: file.created_at || null,
      updatedAt: file.updated_at || null,
      meta: meta,
    },
    file, // Keep reference to original file object
  };
}

