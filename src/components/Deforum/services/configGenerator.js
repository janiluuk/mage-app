import Frame from "@/components/Deforum/types/Frame";
import { baseConfig } from "./baseConfig";

export function generateConfig(config) {
  let newConfig = {};
  Object.assign(newConfig, baseConfig);

  replaceValues(newConfig, config);
  compileAnimationPrompts(
    newConfig,
    config.frames,
    config.promptStyle,
    config.substractXFrames
  );
  compileFrameStrings(newConfig, config.frames, config.substractXFrames);

  return JSON.stringify(newConfig, null, "  ");
}

function replaceValues(configJson, config) {
  configJson.batch_name = config.batch_name;
  configJson.width = config.width;
  configJson.height = config.height;
  configJson.seed = config.seed;
  configJson.seed_behavior = config.seed_behavior;
  configJson.sampler = config.sampler;
  configJson.steps = config.steps;
  configJson.scale = config.scale;
  configJson.ddim_eta = config.ddim_eta;
  configJson.diffusion_cadence = config.diffusion_cadence;
  configJson.border = config.border;
  configJson.use_depth_warping = config.use_depth_warping;
  configJson.midas_weight = config.midas_weight;
  configJson.fov = config.fov;
  configJson.padding_mode = config.padding_mode;
  configJson.sampling_mode = config.sampling_mode;
  configJson.animation_mode = config.animation_mode;
  configJson.resume_from_timestring = config.resume_from_timestring;
  configJson.resume_timestring = config.resume_timestring;
  configJson.max_frames = config.frames[config.frames.length - 1].id - config.substractXFrames;
  configJson.fps = config.fps;
}

function compileAnimationPrompts(configJson, frames, promptStyle, substractXFrames) {
  const prompts = {};
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const prompt = frame.prompt;
    const id = frame.id - substractXFrames;
    if (prompt !== undefined && prompt !== "") {
      prompts[id] = `${prompt} ${promptStyle}`;
    }
  }

  configJson.animation_prompts = prompts;
}

function compileFrameStrings(configJson, frames, substractXFrames) {
  const frameStrings = {
    angle: "",
    zoom: "",
    translation_x: "",
    translation_y: "",
    translation_z: "",
    rotation_3d_x: "",
    rotation_3d_y: "",
    rotation_3d_z: "",
    noise_schedule: "",
    strength_schedule: "",
    contrast_schedule: "",
  };

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const id = frame.id - substractXFrames;

    for (const key in frameStrings) {
      if (frameStrings.hasOwnProperty(key)) {
        if (frame[key] !== undefined && frame[key] !== "") {
          frameStrings[key] += `${id}:(${frame[key]}), `;
        }
      }
    }
  }

  for (const key in frameStrings) {
    if (frameStrings.hasOwnProperty(key)) {
      let element = frameStrings[key];
      if (element.endsWith(", ")) {
        element = element.slice(0, -2);
      }
      if (element === "") {
        element = "0:(0)";
      }
      configJson[key] = element;
    }
  }
}
