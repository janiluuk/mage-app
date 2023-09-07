const Sampler = {
  EulerAncestral: "euler_ancestral",
  Euler: "euler",
  Klms: "klms",
  Plms: "plms",
  Ddim: "ddim",
  Dpm2: "dpm2",
  Dpm2Ancestral: "dpm2_ancestral",
  Heun: "heun",
  DpmFast: "dpm_fast",
  DpmAdaptive: "dpm_adaptive",
  Dpmpp2sA: "dpmpp_2s_a",
  Dpmpp2mA: "dpmpp_2m_a"
};

const SeedBehavior = {
  Iter: "iter",
  Fixed: "fixed",
  Random: "random"
};

const AnimationMode = {
  ThreeD: "3D"
};

const PaddingMode = {
  Border: "border",
  Reflection: "reflection",
  Zero: "zero"
};

const SamplingMode = {
  Bicubic: "bicubic",
  Bilinear: "bilinear",
  Nearest: "nearest"
};

const Border = {
  Warp: "warp",
  Replicate: "replicate"
};

const samplerList = [
  Sampler.EulerAncestral,
  Sampler.Euler,
  Sampler.Klms,
  Sampler.Plms,
  Sampler.Ddim,
  Sampler.Dpm2,
  Sampler.Dpm2Ancestral,
  Sampler.Heun,
  Sampler.DpmFast,
  Sampler.DpmAdaptive,
  Sampler.Dpmpp2sA,
  Sampler.Dpmpp2mA
];

const seedBehaviorList = [
  SeedBehavior.Iter,
  SeedBehavior.Fixed,
  SeedBehavior.Random
];

const animationModeList = [AnimationMode.ThreeD];

const paddingModeList = [
  PaddingMode.Border,
  PaddingMode.Reflection,
  PaddingMode.Zero
];

const samplingModeList = [
  SamplingMode.Bicubic,
  SamplingMode.Bilinear,
  SamplingMode.Nearest
];

const borderList = [Border.Warp, Border.Replicate];

export {
  Sampler,
  SeedBehavior,
  AnimationMode,
  PaddingMode,
  SamplingMode,
  Border,
  samplerList,
  seedBehaviorList,
  animationModeList,
  paddingModeList,
  samplingModeList,
  borderList
};