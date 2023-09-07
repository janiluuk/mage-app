<script setup lang="ts">
import Config from "@/components/Deforum/types/Config";
import XInputText from "@/components/Deforum/inputs/XInputText.vue";
import XInputNumber from "@/components/Deforum/inputs/XInputNumber.vue";
import XDropdown from "@/components/Deforum/inputs/XDropdown.vue";
import XToggleButton from "@/components/Deforum/inputs/XToggleButton.vue";

import {
  samplerList,
  seedBehaviorList,
  Sampler,
  SeedBehavior,
  borderList,
  Border,
  PaddingMode,
  paddingModeList,
  samplingModeList,
  SamplingMode,
  animationModeList,
  AnimationMode,
} from "@/components/Deforum/types/enums";

const emit = defineEmits(["update:configValue"]);

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
});

type NumberConfigKeys =
  | keyof Pick<Config, "steps">
  | keyof Pick<Config, "width">
  | keyof Pick<Config, "height">
  | keyof Pick<Config, "seed">
  | keyof Pick<Config, "scale">
  | keyof Pick<Config, "ddim_eta">
  | keyof Pick<Config, "diffusion_cadence">
  | keyof Pick<Config, "midas_weight">
  | keyof Pick<Config, "fov">
  | keyof Pick<Config, "fps">;

const handleNumberChange = (value: number, key: NumberConfigKeys) => {
  props.config[key] = Number(value);
  emit("update:configValue", props.config);
};

type StringConfigKeys =
  | keyof Pick<Config, "batch_name">
  | keyof Pick<Config, "resume_timestring">;

const handleStringChange = (value: string, key: StringConfigKeys) => {
  props.config[key] = String(value);
  emit("update:configValue", props.config);
};

type BoolConfigKeys =
  | keyof Pick<Config, "use_depth_warping">
  | keyof Pick<Config, "resume_from_timestring">;

const handleBooleanChange = (value: boolean, key: BoolConfigKeys) => {
  props.config[key] = Boolean(value);
  emit("update:configValue", props.config);
};

type SelectableConfigKeys =
  | keyof Pick<Config, "sampling_mode">
  | keyof Pick<Config, "padding_mode">
  | keyof Pick<Config, "border">
  | keyof Pick<Config, "seed_behavior">
  | keyof Pick<Config, "sampler">
  | keyof Pick<Config, "animation_mode">;

const handleSelectableChange = (
  value:
    | SamplingMode
    | PaddingMode
    | Border
    | SeedBehavior
    | Sampler
    | AnimationMode,
  key: SelectableConfigKeys
) => {
  props.config[key] = value;
  emit("update:configValue", props.config);
};
</script>


<template>
    <div>    
      <div class="col-12 md:col-3">

        <h5>Global config</h5>
        <p class="text-gray-600 text-sm">
          Only 3D animation mode is supported. Please refer to Deforum
          documentation for further details.
        </p>
      </div>
      <div class="flex items-start justify-content-left align-items-left text-align-left">

      <div class="flex-col col-12 md:col-4 mr-5">
        <XInputText
          label="Batch name"
          tooltip="The name of the batch. This will be used as folder name for the generated images [required]"
          :required="true"
          :modelValue="config.batch_name ?? 'default'"
          @update:modelValue="(newBatchName) => (handleStringChange(newBatchName, 'batch_name'))"
        ></XInputText>
  
        <XInputNumber
          label="Width"
          :modelValue="config.width ?? 512"
          :min="512"
          :max="2048"
          :step="1"
          :required="true"
          @update:modelValue="(newWidth) => (handleNumberChange(newWidth, 'width'))"
          tooltip="The width of the generated images. [512, 2048]"
        ></XInputNumber>
  
        <XInputNumber
          label="Height"
          :modelValue="config.height ?? 512"
          :min="512"
          :max="2048"
          :step="1"
          :required="true"
          @update:modelValue="(newHeight) => (handleNumberChange(newHeight, 'height'))"
          tooltip="The height of the generated images. [512, 2048]"
        ></XInputNumber>
  
        <XInputNumber
          label="Seed"
          :modelValue="config.seed ?? -1"
          :min="-1"
          :max="1000000"
          :step="1"
          :required="true"
          @update:modelValue="(newSeed) => (handleNumberChange(newSeed, 'seed'))"
          tooltip="The seed used for the generation. If set to -1, a random seed will be used. [-1, 1000000]"
        ></XInputNumber>
  
        <XDropdown
          label="Seed behavior"
          :modelValue="config.seed_behavior ?? SeedBehavior.Iter"
          :options="seedBehaviorList"
          @update:modelValue="(newSeedBehavior) => (handleSelectableChange(newSeedBehavior, 'seed_behavior'))"
          tooltip="The behavior of the seed. If set to 'iter', the seed will be incremented for each image"
        ></XDropdown>
  
        <XDropdown
          label="Sampler"
          :modelValue="config.sampler ?? Sampler.EulerAncestral"
          :options="samplerList"
          @update:modelValue="(newSampler) => (handleSelectableChange(newSampler, 'sampler'))"
          tooltip="The sampler used for the generation. Report to the documentation for more information"
        ></XDropdown>
  
        <XInputNumber
          label="Steps"
          :modelValue="config.steps ?? 100"
          :min="0"
          :max="1000"
          :step="1"
          :required="true"
          @update:modelValue="(newSteps) => (handleNumberChange(newSteps, 'steps'))"
          tooltip="The number of steps used for the first generation. [0, 1000]"
        ></XInputNumber>
  
        <XInputNumber
          label="Scale"
          :modelValue="config.scale ?? 8"
          :min="0"
          :max="50"
          :step="1"
          :required="true"
          @update:modelValue="(newScale) => (handleNumberChange(newScale, 'scale'))"
          tooltip="A measurement of how much enforcement to apply to an overall prompt. [0, 50]"
        ></XInputNumber>
  
        <XInputNumber
          label="Ddim eta"
          :modelValue="config.ddim_eta ?? 0"
          :min="-1"
          :max="1"
          :step="0.001"
          @update:modelValue="(newDdimEta) => (handleNumberChange(newDdimEta, 'ddim_eta'))"
          :required="true"
          tooltip="ONLY enabled in ddim sampler mode, will control a ratio of ddim to ddpm sampling methods, with a range of -1 to +1 with 0 being less randomized determinism. [-1, 1]"
        ></XInputNumber>
        </div><div class="col-12 ml-4 md:col-3 flex-col p-fluid" style="margin-top: -10rem">
  
        <XDropdown
          label="Animation mode"
          :modelValue="config.animation_mode ?? AnimationMode.ThreeD"
          :options="animationModeList"
          @update:modelValue="(newAnimationMode) => (handleSelectableChange(newAnimationMode, 'animation_mode'))"
          tooltip="3D mode will attempt to string the images produced in a sequence of coherent outputs. (only 3D mode is supported at this time)"
        ></XDropdown>
  
        <XInputNumber
          label="Diffusion cadence"
          :modelValue="config.diffusion_cadence ?? 1"
          :min="1"
          :max="8"
          :step="1"
          :required="true"
          @update:modelValue="(newDiffusionCadence) => (handleNumberChange(newDiffusionCadence, 'diffusion_cadence'))"
          tooltip="Controls the frequency of frames to be affected by diffusion [1-8]"
        ></XInputNumber>
        <XDropdown
          label="Border"
          :modelValue="config.border ?? Border.Warp"
          :options="borderList"
          @update:modelValue="(newBorder) => (handleSelectableChange(newBorder, 'border'))"
          tooltip="Controls handling method of pixels to be generated when the image is smaller than the frame. “Wrap” pulls pixels from the opposite edge of the image, while “Replicate” repeats the edge of the pixels, and extends them"
        ></XDropdown>
  
        <XToggleButton
          label="Use depth warping"
          :modelValue="config.use_depth_warping ?? true"
          @update:modelValue="(newUseDepthWarping) => (handleBooleanChange(newUseDepthWarping, 'use_depth_warping'))"
          tooltip="Enables instructions to warp an image dynamically in 3D mode only"
        ></XToggleButton>
  
        <XInputNumber
          label="Midas weight"
          :modelValue="config.midas_weight ?? 0.3"
          :min="-1"
          :max="1"
          :step="0.001"
          :required="true"
          @update:modelValue="(newMidasWeight) => (handleNumberChange(newMidasWeight, 'midas_weight'))"
          tooltip="Sets a midpoint at which a depthmap is to be drawn: range [-1 to +1]"
        ></XInputNumber>
  
        <XInputNumber
          label="Fov"
          :modelValue="config.fov ?? 90"
          :min="-180"
          :max="180"
          :step="0.001"
          :required="true"
          @update:modelValue="(newFov) =>
        (handleNumberChange(newFov, 'fov'))"
          tooltip="Adjusts the scale at which a
        canvas is moved in 3D by the translation_z value FOV (field of
        view/vision) in deforum, will give specific instructions as to how the
        translation_z value affects the canvas. Range is [-180 to +180]"
        ></XInputNumber>
  
        <XDropdown
          label="Padding mode"
          :modelValue="config.padding_mode ?? PaddingMode.Border"
          :options="paddingModeList"
          @update:modelValue="(newPaddingMode) => (handleSelectableChange(newPaddingMode, 'padding_mode'))"
          tooltip="Instructs the handling of pixels outside the field of view as they come into the scene. ‘Border” will attempt to use the edges of the canvas as the pixels to be drawn. “Reflection” will attempt to approximate the image and tile/repeat pixels, whereas “Zeros” will not add any new pixel information"
        ></XDropdown>
  
        <XDropdown
          label="Sampling mode"
          :modelValue="config.sampling_mode ?? SamplingMode.Bicubic"
          :options="samplingModeList"
          @update:modelValue="(newSamplingMode) => (handleSelectableChange(newSamplingMode, 'sampling_mode'))"
          tooltip="Controls the sampling method of the image. ‘Nearest’ will use the nearest pixel to the center of the frame, while ‘Bilinear’ will use the average of the four nearest pixels to the center of the frame"
        ></XDropdown>
  
        <hr />
  
        <XToggleButton
          label="Resume from timestring"
          :modelValue="config.resume_from_timestring ?? false"
          @update:modelValue="(newResumeFromTimestring) => (handleBooleanChange(newResumeFromTimestring, 'resume_from_timestring'))"
          tooltip="Instructs the run to start from a specified point"
        ></XToggleButton>
  
        <XInputText
          label="Resume timestring"
          :modelValue="config.resume_timestring ?? ''"
          @update:modelValue="(newResumeTimestring) => (handleStringChange(newResumeTimestring, 'resume_timestring'))"
          tooltip="The required timestamp to reference when resuming"
        ></XInputText>
          <hr/>
        <XInputNumber
          label="FPS"
          :modelValue="config.fps ?? 30"
          :min="1"
          :max="1000000"
          :step="1"
          :required="true"
          @update:modelValue="(newFps) => (handleNumberChange(newFps, 'fps'))"
          tooltip="Frames per second for the video output [1, 1000000]"
        ></XInputNumber>
      </div>
    </div></div>
  </template>
