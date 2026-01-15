export const RENDER_LIMIT_MIN = 100;
export const RENDER_LIMIT_STEPS = 10;

export function clampRenderLimitStep(step) {
  if (!Number.isFinite(step)) return RENDER_LIMIT_STEPS;
  return Math.max(0, Math.min(RENDER_LIMIT_STEPS, Math.round(step)));
}

export function resolveRenderLimit(step, totalVideos) {
  const clampedStep = clampRenderLimitStep(step);
  const safeTotal = Number.isFinite(totalVideos) && totalVideos > 0 ? totalVideos : 0;

  if (safeTotal === 0) {
    return 0;
  }

  if (clampedStep >= RENDER_LIMIT_STEPS) {
    return safeTotal > 0 ? null : 0;
  }

  const effectiveMax = Math.max(RENDER_LIMIT_MIN, safeTotal);
  const range = Math.max(0, effectiveMax - RENDER_LIMIT_MIN);
  const fraction = clampedStep / RENDER_LIMIT_STEPS;
  const rawValue = Math.round(RENDER_LIMIT_MIN + range * fraction);
  return Math.min(rawValue, safeTotal || rawValue);
}

export function formatRenderLimitLabel(step, totalVideos) {
  const limit = resolveRenderLimit(step, totalVideos);
  if (limit === null) return "Max";
  if (limit <= 0) return "0";
  return String(limit);
}
