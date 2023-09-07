import {
  AnimationMode,
  Border,
  PaddingMode,
  Sampler,
  SamplingMode,
  SeedBehavior,
} from "./enums";
import Frame from "./Frame";

export default class Config {
  constructor() {
    this.batch_name = "default";
    this.width = 512;
    this.height = 512;
    this.seed = -1;
    this.seed_behavior = SeedBehavior.Iter;
    this.sampler = Sampler.EulerAncestral;
    this.steps = 100;
    this.scale = 8;
    this.ddim_eta = 0;
    this.frames = [Frame.createFirstFrame()];
    this.diffusion_cadence = 1;
    this.border = Border.Warp;
    this.use_depth_warping = true;
    this.midas_weight = 0.3;
    this.fov = 90;
    this.padding_mode = PaddingMode.Border;
    this.sampling_mode = SamplingMode.Bicubic;
    this.animation_mode = AnimationMode.ThreeD;
    this.resume_from_timestring = false;
    this.resume_timestring = "";
    this.promptStyle = "";
    this.substractXFrames = 0;
    this.fps = 30;
  }
}
