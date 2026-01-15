const pickPlayableUrl = (job) => {
  const candidates = [job?.url, job?.preview_url, job?.preview_animation];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const lower = candidate.toLowerCase();
    if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) {
      return candidate;
    }
  }
  return job?.url || job?.preview_url || job?.preview_animation || "";
};

const pickPreviewUrl = (job) => {
  const candidates = [job?.preview_img, job?.preview_animation, job?.preview_url, job?.thumbnail];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    return candidate;
  }
  return "";
};

const parseTimestamp = (value) => {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
};

export const normalizeTags = (raw) => {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    list = raw.split(",");
  }

  const cleaned = list
    .map((tag) => (tag ?? "").toString().trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned));
};

export const normalizeRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(5, Math.round(numeric)));
};

export function normalizeVideoJob(job) {
  const name =
    job?.original_filename ||
    job?.filename ||
    job?.prompt ||
    (job?.id != null ? `video-${job.id}` : "video");
  const createdMs = parseTimestamp(job?.created_at || job?.updated_at);
  const updatedMs = parseTimestamp(job?.updated_at || job?.created_at);
  const width = Number(job?.width) || null;
  const height = Number(job?.height) || null;
  const duration = Number(job?.duration || job?.length) || null;
  const aspectRatio = width && height ? width / height : null;

  return {
    id: job?.id != null ? String(job.id) : name,
    name,
    basename: name,
    dirname: "",
    fullPath: pickPlayableUrl(job),
    previewUrl: pickPreviewUrl(job),
    createdMs,
    dateModified: updatedMs,
    width,
    height,
    dimensions: width && height ? { width, height, aspectRatio } : null,
    aspectRatio,
    status: job?.status || "",
    length: duration,
    generator: job?.generator || "vid2vid",
    prompt: job?.prompt || "",
    tags: normalizeTags(job?.tags),
    rating: normalizeRating(job?.rating),
    isElectronFile: false,
    metadata: {
      createdAt: job?.created_at || null,
      updatedAt: job?.updated_at || null,
    },
    job,
  };
}
