/**
 * Audio → Deforum Service
 *
 * Decodes an audio file offline, extracts frequency-band energy per frame,
 * and converts band data into Deforum/Parseq keyframe schedules.
 *
 * Frequency bands (default 7):
 *   0  Sub-bass      20 –  60 Hz
 *   1  Bass          60 – 250 Hz
 *   2  Low-mid      250 – 500 Hz
 *   3  Mid          500 – 2 kHz
 *   4  Upper-mid      2 – 4 kHz
 *   5  Presence       4 – 6 kHz
 *   6  Brilliance     6 – 20 kHz
 */

// ── Band definitions ────────────────────────────────────────────────────────
export const BAND_NAMES = [
  'Sub-bass',
  'Bass',
  'Low-mid',
  'Mid',
  'Upper-mid',
  'Presence',
  'Brilliance',
];

export const BAND_RANGES_HZ = [
  [20, 60],
  [60, 250],
  [250, 500],
  [500, 2000],
  [2000, 4000],
  [4000, 6000],
  [6000, 20000],
];

// ── Deforum parameters that can be driven by audio ──────────────────────────
export const DEFORUM_TARGETS = [
  { key: 'translation_x', label: 'Translation X', defaultRange: [-5, 5] },
  { key: 'translation_y', label: 'Translation Y', defaultRange: [-5, 5] },
  { key: 'translation_z', label: 'Translation Z', defaultRange: [-10, 10] },
  { key: 'rotation_3d_x', label: 'Rotation X', defaultRange: [-3, 3] },
  { key: 'rotation_3d_y', label: 'Rotation Y', defaultRange: [-3, 3] },
  { key: 'rotation_3d_z', label: 'Rotation Z', defaultRange: [-3, 3] },
  { key: 'strength_schedule', label: 'Strength', defaultRange: [0.4, 0.8] },
  { key: 'noise_schedule', label: 'Noise', defaultRange: [0.01, 0.08] },
  { key: 'contrast_schedule', label: 'Contrast', defaultRange: [0.95, 1.1] },
  { key: 'zoom', label: 'Zoom', defaultRange: [0.98, 1.04] },
  { key: 'angle', label: 'Angle', defaultRange: [-1, 1] },
];

// ── Mapping model ───────────────────────────────────────────────────────────

/**
 * Create a default band→target mapping.
 * Each band can be mapped to one or more Deforum targets.
 * @returns {Array<BandMapping>}
 */
export function createDefaultMappings() {
  return BAND_NAMES.map((name, idx) => ({
    bandIndex: idx,
    bandName: name,
    enabled: idx <= 2, // enable sub-bass, bass, low-mid by default
    target: DEFORUM_TARGETS[idx % DEFORUM_TARGETS.length].key,
    min: DEFORUM_TARGETS[idx % DEFORUM_TARGETS.length].defaultRange[0],
    max: DEFORUM_TARGETS[idx % DEFORUM_TARGETS.length].defaultRange[1],
    smoothing: 0.3,     // 0..1 — how much to smooth transitions
    threshold: 0.05,    // ignore values below this
    invert: false,
    promptFragment: '', // extra prompt text triggered when band energy > threshold
  }));
}

// ── Offline audio analysis ──────────────────────────────────────────────────

/**
 * Decode an audio ArrayBuffer to an AudioBuffer
 * @param {ArrayBuffer} arrayBuffer – raw file bytes
 * @returns {Promise<AudioBuffer>}
 */
export async function decodeAudio(arrayBuffer) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    ctx.close();
  }
}

/**
 * Analyse an AudioBuffer and extract per-frame band energies.
 *
 * @param {AudioBuffer} audioBuffer – decoded audio
 * @param {number}      fps        – frames per second (e.g. 15, 24, 30)
 * @param {number}      fftSize    – FFT window size (power of 2, default 2048)
 * @returns {{ bandData: Float32Array[], frameCount: number, duration: number }}
 *
 * bandData[frame] is a Float32Array(numBands) with values normalised 0..1
 */
export function analyseAudio(audioBuffer, fps = 15, fftSize = 2048) {
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;
  const frameCount = Math.ceil(duration * fps);
  const samplesPerFrame = Math.round(sampleRate / fps);
  const numBands = BAND_RANGES_HZ.length;

  // Mix to mono
  const mono = new Float32Array(audioBuffer.length);
  const numChannels = audioBuffer.numberOfChannels;
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < channelData.length; i++) {
      mono[i] += channelData[i] / numChannels;
    }
  }

  // Hann window
  const windowSize = Math.min(fftSize, samplesPerFrame);
  const hann = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (windowSize - 1)));
  }

  // Pre-compute bin ranges per band
  const binRanges = BAND_RANGES_HZ.map(([lo, hi]) => {
    const loBin = Math.max(0, Math.round((lo / sampleRate) * fftSize));
    const hiBin = Math.min(fftSize / 2, Math.round((hi / sampleRate) * fftSize));
    return [loBin, hiBin];
  });

  // Simple DFT-magnitude per band (we only compute the bins we need)
  const bandData = new Array(frameCount);

  for (let f = 0; f < frameCount; f++) {
    const center = Math.round((f / fps) * sampleRate);
    const start = Math.max(0, center - Math.floor(windowSize / 2));

    // Extract windowed segment
    const segment = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      const idx = start + i;
      segment[i] = (idx < mono.length ? mono[idx] : 0) * hann[i];
    }

    // Compute power in each band using Goertzel-like sum
    const bands = new Float32Array(numBands);
    for (let b = 0; b < numBands; b++) {
      const [loBin, hiBin] = binRanges[b];
      let power = 0;
      const binCount = Math.max(1, hiBin - loBin);
      for (let k = loBin; k < hiBin; k++) {
        // DFT magnitude at bin k
        let re = 0, im = 0;
        const freq = (2 * Math.PI * k) / fftSize;
        for (let n = 0; n < windowSize; n++) {
          re += segment[n] * Math.cos(freq * n);
          im -= segment[n] * Math.sin(freq * n);
        }
        power += (re * re + im * im) / (windowSize * windowSize);
      }
      bands[b] = Math.sqrt(power / binCount);
    }

    bandData[f] = bands;
  }

  // Normalise each band to 0..1 across all frames
  for (let b = 0; b < numBands; b++) {
    let maxVal = 0;
    for (let f = 0; f < frameCount; f++) {
      if (bandData[f][b] > maxVal) maxVal = bandData[f][b];
    }
    if (maxVal > 0) {
      for (let f = 0; f < frameCount; f++) {
        bandData[f][b] /= maxVal;
      }
    }
  }

  return { bandData, frameCount, duration };
}

// ── Smoothing ───────────────────────────────────────────────────────────────

/**
 * Apply exponential moving average smoothing to a band series.
 * @param {Float32Array[]} bandData – per-frame band energies
 * @param {number}         bandIdx  – which band to smooth
 * @param {number}         alpha    – smoothing factor (0 = no smooth, 1 = max)
 * @returns {Float32Array} smoothed values (one per frame)
 */
export function smoothBand(bandData, bandIdx, alpha = 0.3) {
  const out = new Float32Array(bandData.length);
  out[0] = bandData[0]?.[bandIdx] ?? 0;
  for (let i = 1; i < bandData.length; i++) {
    const raw = bandData[i]?.[bandIdx] ?? 0;
    out[i] = alpha * out[i - 1] + (1 - alpha) * raw;
  }
  return out;
}

// ── Keyframe generation ─────────────────────────────────────────────────────

/**
 * Map band energy (0..1) to a Deforum value using linear interpolation.
 * @param {number} energy    – normalised band energy 0..1
 * @param {number} min       – output minimum
 * @param {number} max       – output maximum
 * @param {number} threshold – ignore energy below this
 * @param {boolean} invert   – flip mapping
 * @returns {number}
 */
export function mapEnergyToValue(energy, min, max, threshold = 0, invert = false) {
  const clamped = Math.max(0, Math.min(1, energy));
  if (clamped < threshold) return invert ? max : min;
  const t = invert ? 1 - clamped : clamped;
  return min + t * (max - min);
}

/**
 * Build Deforum Parseq schedule strings from band data + mappings.
 *
 * @param {Float32Array[]} bandData  – per-frame band energies
 * @param {Array}          mappings  – band→target mapping configs
 * @param {number}         fps       – frames per second
 * @param {object}         options   – { keyframeInterval, decimals }
 * @returns {{
 *   schedules: Record<string, string>,
 *   prompts:   Record<number, string>,
 *   frameCount: number
 * }}
 */
export function generateParseqKeyframes(bandData, mappings, fps = 15, options = {}) {
  const { keyframeInterval = 1, decimals = 3 } = options;
  const frameCount = bandData.length;
  const schedules = {};
  const prompts = {};

  // Initialise target accumulators
  const activeMappings = mappings.filter((m) => m.enabled);

  // Smooth each mapped band
  const smoothedBands = {};
  for (const mapping of activeMappings) {
    if (!smoothedBands[mapping.bandIndex]) {
      smoothedBands[mapping.bandIndex] = smoothBand(bandData, mapping.bandIndex, mapping.smoothing);
    }
  }

  // Group mappings by target
  const byTarget = {};
  for (const mapping of activeMappings) {
    if (!byTarget[mapping.target]) byTarget[mapping.target] = [];
    byTarget[mapping.target].push(mapping);
  }

  // For each target, generate schedule string
  for (const [targetKey, targetMappings] of Object.entries(byTarget)) {
    const entries = [];
    for (let f = 0; f < frameCount; f += keyframeInterval) {
      // Sum contributions from all bands mapped to this target
      let value = 0;
      for (const mapping of targetMappings) {
        const smoothed = smoothedBands[mapping.bandIndex];
        const energy = smoothed[f] ?? 0;
        value += mapEnergyToValue(energy, mapping.min, mapping.max, mapping.threshold, mapping.invert);
      }
      // Average if multiple bands
      if (targetMappings.length > 1) value /= targetMappings.length;
      entries.push(`${f}:(${value.toFixed(decimals)})`);
    }
    schedules[targetKey] = entries.join(', ');
  }

  // Build prompt schedule from band triggers
  for (let f = 0; f < frameCount; f += keyframeInterval) {
    const fragments = [];
    for (const mapping of activeMappings) {
      if (!mapping.promptFragment) continue;
      const smoothed = smoothedBands[mapping.bandIndex];
      const energy = smoothed[f] ?? 0;
      if (energy >= mapping.threshold) {
        fragments.push(mapping.promptFragment);
      }
    }
    if (fragments.length > 0) {
      prompts[f] = fragments.join(', ');
    }
  }

  return { schedules, prompts, frameCount };
}

/**
 * Build a complete Deforum config object ready for generation.
 *
 * @param {object} params
 * @param {string} params.basePrompt       – user's main prompt
 * @param {Record<string, string>} params.schedules – Parseq schedule strings
 * @param {Record<number, string>} params.prompts   – frame→extra prompt
 * @param {number} params.frameCount       – total frames
 * @param {number} params.fps              – frames per second
 * @param {object} params.globalConfig     – overrides for global config
 * @returns {object} Deforum-compatible config
 */
export function buildDeforumConfig({
  basePrompt = '',
  schedules = {},
  prompts = {},
  frameCount = 100,
  fps = 15,
  globalConfig = {},
}) {
  // Animation prompts: merge base prompt with per-frame band-driven additions
  const animationPrompts = {};
  // Always set frame 0
  animationPrompts[0] = basePrompt;
  for (const [frame, extra] of Object.entries(prompts)) {
    const f = parseInt(frame, 10);
    animationPrompts[f] = basePrompt ? `${basePrompt}, ${extra}` : extra;
  }

  return {
    // Global
    batch_name: globalConfig.batch_name || 'audio_reactive',
    width: globalConfig.width || 512,
    height: globalConfig.height || 512,
    seed: globalConfig.seed ?? -1,
    steps: globalConfig.steps || 30,
    scale: globalConfig.scale || 7,
    fps,
    max_frames: frameCount,
    animation_mode: '3D',

    // Schedules from audio
    translation_x: schedules.translation_x || '0:(0)',
    translation_y: schedules.translation_y || '0:(0)',
    translation_z: schedules.translation_z || '0:(0)',
    rotation_3d_x: schedules.rotation_3d_x || '0:(0)',
    rotation_3d_y: schedules.rotation_3d_y || '0:(0)',
    rotation_3d_z: schedules.rotation_3d_z || '0:(0)',
    strength_schedule: schedules.strength_schedule || '0:(0.65)',
    noise_schedule: schedules.noise_schedule || '0:(0.02)',
    contrast_schedule: schedules.contrast_schedule || '0:(1)',
    zoom: schedules.zoom || '0:(1)',
    angle: schedules.angle || '0:(0)',

    animation_prompts: animationPrompts,

    // Spread any extra global config
    ...globalConfig,
  };
}

export default {
  BAND_NAMES,
  BAND_RANGES_HZ,
  DEFORUM_TARGETS,
  createDefaultMappings,
  decodeAudio,
  analyseAudio,
  smoothBand,
  mapEnergyToValue,
  generateParseqKeyframes,
  buildDeforumConfig,
};

