<script setup lang="ts">
import { ref } from "vue";
import Frame from "@/components/Deforum/types/Frame";
import XExpression from "@/components/Deforum/inputs/XExpression.vue";
import XInputNumber from "@/components/Deforum/inputs/XInputNumber.vue";
import XToggleButton from "@/components/Deforum/inputs/XToggleButton.vue";
import XTextArea from "@/components/Deforum/inputs/XTextArea.vue";

import ToolTip from "./ToolTip.vue";

const emit = defineEmits([
  "update:frameList",
  "update:addFrameBetween",
  "user-config:step-increment-change",
  "user-config:expression-mode-change",
  "update:prompt-style",
  "update:substract-x-frames",
]);

const props = defineProps({
  frameList: {
    type: Array,
    required: true,
  },
  stepIncrement: {
    type: Number,
    required: true,
  },
  isExpressionModeEnabled: {
    type: Boolean,
    required: true,
  },
  promptStyle: {
    type: String,
    required: true,
  },
  substractXFrames: {
    type: Number,
    required: true,
  },
});

interface ErrorMessage {
  message: string;
  input: HTMLInputElement;
}

const errors = ref<Map<number, Map<string, ErrorMessage>>>(new Map());

type NumberFrameKeys =
  | keyof Pick<Frame, "id">
  | keyof Pick<Frame, "angle">
  | keyof Pick<Frame, "zoom">
  | keyof Pick<Frame, "translation_x">
  | keyof Pick<Frame, "translation_y">
  | keyof Pick<Frame, "translation_z">
  | keyof Pick<Frame, "rotation_3d_x">
  | keyof Pick<Frame, "rotation_3d_y">
  | keyof Pick<Frame, "rotation_3d_z">
  | keyof Pick<Frame, "noise_schedule">
  | keyof Pick<Frame, "strength_schedule">
  | keyof Pick<Frame, "contrast_schedule">;
const handleNumberChange = (
  value: number,
  index: number,
  key: NumberFrameKeys
) => {
  ((props.frameList[index] as Frame)[key] as number) = value;
  emit("update:frameList", props.frameList);
};

const handlePromptChange = (value: string, index: number) => {
  (props.frameList[index] as Frame).prompt = String(value);
  emit("update:frameList", props.frameList);
};

const handleAddFrameBetween = (index: number) => {
  emit("update:addFrameBetween", index);
};

const handleDelete = (index: number) => {
  if (props.frameList.length === 1) {
    return;
  }
  props.frameList.splice(index, 1);
  emit("update:frameList", props.frameList);
};

const sortFramesById = () => {
  (props.frameList as Frame[]).sort((a, b) => a.id - b.id);
  emit("update:frameList", props.frameList);
};

const reorderFrames = () => {
  (props.frameList as Frame[]).forEach((frame, index) => {
    frame.id = index * props.stepIncrement;
  });
  emit("update:frameList", props.frameList);
};

const handleErrorMessage = (
  message: string | undefined,
  input: HTMLInputElement,
  index: number,
  key: string
) => {
  if (message === undefined) {
    errors.value.get(index)?.delete(key);
    if (errors.value.get(index)?.size === 0) {
      errors.value.delete(index);
    }
  } else {
    if (errors.value.get(index) === undefined) {
      errors.value.set(index, new Map());
    }
    errors.value.get(index)?.set(key, { message, input });
  }
};

const handleIsExpressionModeEnabled = (value: boolean) => {
  emit("user-config:expression-mode-change", value);
};

const handlePromptStyleChange = (value: string) => {
  emit("update:prompt-style", value);
};
</script>
<template>
  <div>
    <div class="flex flex-col space-y-2 mb-5">
      <h2 class="text-2xl font-bold mb-2">Frames config</h2>
      <p class="text-gray-600 text-sm">
        Configure the frames of your animation. You can add, delete and reorder
        them.
      </p>
      <p class="text-gray-600 text-sm">
        Reindexing will change the id of each frame to a multiple of the step
        increment parameter.
      </p>
      <p class="text-gray-600 text-sm">
        If the math expression mode is enabled, you can type expressions like
        "-0.35*(cos(3.141*t/25)**100)+0.8". The "t" magic variable will be
        replaced by the currently rendered frame id at execution. See Deforum
        documentation for further information.
      </p>
    </div>

    <div v-show="errors.size > 0" class="rounded-md shadow">
      <ul class="flex flex-col">
        <li
          v-for="frame in errors.keys()"
          class="even:bg-red-100 odd:bg-red-50 p-2 flex flex-col space-y-2"
        >
          <div
            class="flex justify-between items-center"
            v-for="error in errors.get(frame)?.keys()"
          >
            <div class="text-red-500 text-sm flex space-x-2">
              <ExclamationTriangleIcon class="h-5 w-5" />
              <div>
                {{ errors.get(frame)?.get(error)?.message }}
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="text-xs text-red-500">#{{ frame }}:{{ error }}</div>
              <button
                @click="errors.get(frame)?.get(error)?.input.focus()"
                colors="bg-red-300 hover:bg-red-400 text-white"
              >
                Focus
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="flex flex-col space-y-4">
      <div
        class="flex space-x-2 sticky top-0 z-20 backdrop-blur-md py-4 mx-4 shadow-md"
      >
        <div class="frames-header ml-3 grid grid-cols-12 gap-2 items-end w-full">
          <div class="flex items-center space-x-2 row-span-2">
            <span class="uppercase font-bold">ID</span>
            <ToolTip position="right">
              The frame id is used to determine the order of the frames.
              Duplicate ids could cause unexpected behavior.
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2 col-span-3 row-span-2">
            <span class="uppercase font-bold">Prompt</span>
            <ToolTip position="right">
              Prompt that will be use for frame generation. [max 75 clip tokens]
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2 row-span-2">
            <span class="uppercase font-bold">Angle</span>
            <ToolTip position="right">
              Operator to rotate canvas clockwise/anticlockwise in degrees per
              frame [-360 - 360]
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2 row-span-2">
            <span class="uppercase font-bold">Zoom</span>
            <ToolTip position="right">
              Operator that scales the canvas size, multiplicatively [static =
              1.0]
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold"> X </span>
            <ToolTip position="right">
              Operator to move canvas left/right in pixels per frame
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold"> Y </span>
            <ToolTip position="right">
              Operator to move canvas up/down in pixels per frame
            </ToolTip>
          </div>
          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold"> Z </span>
            <ToolTip position="right">
              Operator to move canvas in/out in pixels per frame
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2 row-span-2">
            <span class="uppercase font-bold"> Noise </span>
            <ToolTip position="right">
              Amount of graininess to add per frame for diffusion diversity [0 -
              1]
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2 row-span-2">
            <span class="uppercase font-bold"> Strength </span>
            <ToolTip position="left">
              Amount of presence of previous frame to influence next frame, also
              controls steps in the following formula [steps -
              (strength_schedule * steps)]. [min 0.0, max 1.0]
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2 row-span-2 ml-5">
            <span class="uppercase font-bold"> Contrast </span>
            <ToolTip position="left">
              Adjusts the overall contrast per frame [default neutral at 1.0]
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold">3D X</span>
            <ToolTip position="right">
              Operator to tilt canvas up/down in degrees per frame [-360 - 360]
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold">3D Y</span>
            <ToolTip position="right">
              Operator to pan canvas left/right in degrees per frame [-360 -
              360]
            </ToolTip>
          </div>

          <div class="flex items-center space-x-2">
            <span class="uppercase font-bold">3D Z</span>
            <ToolTip position="right">
              Operator to roll canvas clockwise/anticlockwise [-360 - 360]
            </ToolTip>
          </div>
        </div>
      </div>
      <div class="flex space-x-2">
        <div id="hue" class=" rounded"></div>
        <div class="flex flex-col space-y-4 w-full">
          <div
            class="grid grid-cols-12 odd: rounded-md shadow p-2"
            v-for="(frame, index) in frameList"
          >
            <XInputNumber
              class="row-span-2"
              :modelValue="(frame as Frame).id"
              :min="0"
              :max="100000"
              :step="1"
              @update:modelValue="(newId: number) => (handleNumberChange(newId, index, 'id'))"
            ></XInputNumber>

            <XTextArea
              class="col-span-3 row-span-2"
              :modelValue="(frame as Frame).prompt"
              :maxTokenCount="75"
              :placeHolder="'Enter your prompt here'"
              @update:modelValue="(newPrompt: string) => (handlePromptChange(newPrompt, index))"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'prompt')"
            ></XTextArea>

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              class="row-span-2"
              :modelValue="(frame as Frame).angle"
              :min="-360"
              :max="360"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'angle')"
              @update:modelValue="(newAngle: number) => (handleNumberChange(newAngle, index, 'angle'))"
            ></component>

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              class="row-span-2"
              :modelValue="(frame as Frame).zoom"
              :min="-10000"
              :max="10000"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'zoom')"
              @update:modelValue="(newZoom: number) => (handleNumberChange(newZoom, index, 'zoom'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).translation_x"
              :min="-10000"
              :max="10000"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'translation_x')"
              @update:modelValue="(newTranslationX: number) => (handleNumberChange(newTranslationX, index, 'translation_x'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).translation_y"
              :min="-10000"
              :max="10000"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'translation_y')"
              @update:modelValue="(newTranslationY: number) => (handleNumberChange(newTranslationY, index, 'translation_y'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).translation_z"
              :min="-10000"
              :max="10000"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'translation_z')"
              @update:modelValue="(newTranslationZ: number) => (handleNumberChange(newTranslationZ, index, 'translation_z'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              class=""
              :modelValue="(frame as Frame).noise_schedule"
              :min="0"
              :max="100"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'noise_schedule')"
              @update:modelValue="(newNoiseSchedule: number) => (handleNumberChange(newNoiseSchedule, index, 'noise_schedule'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              class=""
              :modelValue="(frame as Frame).strength_schedule"
              :min="0"
              :max="1"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'strength_schedule')"
              @update:modelValue="(newStrengthSchedule: number) => (handleNumberChange(newStrengthSchedule, index, 'strength_schedule'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              class=""
              :modelValue="(frame as Frame).contrast_schedule"
              :min="-10000"
              :max="10000"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'contrast_schedule')"
              @update:modelValue="(newContrastSchedule: number) => (handleNumberChange(newContrastSchedule, index, 'contrast_schedule'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).rotation_3d_x"
              :min="-360"
              :max="360"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'rotation_3d_x')"
              @update:modelValue="(newRotation3dX: number) => (handleNumberChange(newRotation3dX, index, 'rotation_3d_x'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).rotation_3d_y"
              :min="-360"
              :max="360"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'rotation_3d_y')"
              @update:modelValue="(newRotation3dY: number) => (handleNumberChange(newRotation3dY, index, 'rotation_3d_y'))"
            />

            <component
              :is="isExpressionModeEnabled ? XExpression : XInputNumber"
              :modelValue="(frame as Frame).rotation_3d_z"
              :min="-360"
              :max="360"
              :step="0.001"
              @error:change="(newError: string, input: HTMLInputElement) => handleErrorMessage(newError, input, index, 'rotation_3d_z')"
              @update:modelValue="(newRotation3dZ: number) => (handleNumberChange(newRotation3dZ, index, 'rotation_3d_z'))"
            />
            <div class="flex justify-end items-center col-span-3 space-x-4">
              <!-- add frame -->
              <Button
                icon="pi pi-plus-circle" 
                class="mr-2 mb-2 p-button-primary"
                @click="handleAddFrameBetween(index)"
                title="Add a frame below this one"
              >
              </Button>

              <Button
                class="mr-2 mb-2 p-button-danger"
                icon="pi pi-trash" 
                @click="handleDelete(index)"
                title="Delete this frame"
              >
                
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex col-12  md:col-6 flex-col space-y-4 p-2 mt-5">
      <div class="flex justify-end items-center space-x-4 ">
        <XInputNumber
          class="flex-grow"
          :modelValue="stepIncrement"
          :min="1"
          :max="10000"
          :step="1"
          :required="true"
          tooltip="Increase each ID this amount"
          label="Steps increment"
          @update:modelValue="(newStepIncrement: number) => $emit('user-config:step-increment-change', newStepIncrement)"
        ></XInputNumber>
        <Button @click="sortFramesById" class="p-button-primary" title="Sort frames by ID"
          >Sort</Button>
        <Button
          @click="reorderFrames"
          class="p-button-secondary"
          title="Reindex frames using steps increment"
          >Reindex</Button
        >
      </div>
      <XTextArea
      class=""
        :modelValue="promptStyle"
        label="Prompt style"
        @update:modelValue="handlePromptStyleChange"
        tooltip="Don't repeat your style in every prompt, just put it here"
      />

      <XInputNumber
        :modelValue="substractXFrames"
        :min="-100000000"
        :max="100000000"
        :step="1"
        :required="true"
        label="Substract from IDs"
        tooltip="Substract this number to each frame ID in the config output"
        @update:modelValue="(newSubstractXFrames: number) => $emit('update:substract-x-frames', newSubstractXFrames)"
      />

      <XToggleButton
        :model-value="isExpressionModeEnabled"
        label="Math expressions mode"
        @update:model-value="handleIsExpressionModeEnabled"
      />
    </div>
  </div>
</template>


<style scoped>
#hue {
  background: linear-gradient(
    180deg,
    hsl(0, 100%, 50%),
    hsl(30, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(90, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(150, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(210, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(270, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(330, 100%, 50%),
    hsl(360, 100%, 50%)
  );
}

.sr-only {
  position:absolute;
  width:1px;
  height:1px;
  padding:0;
  margin:-1px;
  overflow:hidden;
  clip:rect(0,0,0,0);
  white-space:nowrap;
  border-width:0
}
.pointer-events-none {
  pointer-events:none
}
.pointer-events-auto {
  pointer-events:auto
}
.visible {
  visibility:visible
}
.static {
  position:static
}
.fixed {
  position:fixed
}
.absolute {
  position:absolute
}
.relative {
  position:relative
}
.sticky {
  position:sticky
}
.inset-0 {
  top:0px;
  right:0px;
  bottom:0px;
  left:0px
}
.top-0 {
  top:0px
}
.z-20 {
  z-index:20
}
.z-50 {
  z-index:50
}
.col-span-3 {
  grid-column:span 3 / span 3
}
.row-span-2 {
  grid-row:span 2 / span 2
}
.m-2 {
  margin:.5rem
}
.mx-4 {
  margin-left:1rem;
  margin-right:1rem
}
.my-4 {
  margin-top:1rem;
  margin-bottom:1rem
}
.-mx-4 {
  margin-left:-1rem;
  margin-right:-1rem
}
.mb-4 {
  margin-bottom:1rem
}
.mb-5 {
  margin-bottom:1.25rem
}
.mb-2 {
  margin-bottom:.5rem
}
.mt-5 {
  margin-top:1.25rem
}
.ml-6 {
  margin-left:1.5rem
}
.ml-3 {
  margin-left:.75rem
}
.ml-4 {
  margin-left:1rem
}
.flex {
  display:flex
}
.inline-flex {
  display:inline-flex
}
.grid {
  display:grid
}
.hidden {
  display:none
}
.h-20 {
  height:5rem
}
.h-5 {
  height:1.25rem
}
.h-6 {
  height:1.5rem
}
.w-20 {
  width:5rem
}
.w-5 {
  width:1.25rem
}
.w-12 {
  width:3rem
}
.w-full {
  width:100%
}
.w-4 {
  width:1rem
}
.w-1\/5 {
  width:20%
}
.w-6 {
  width:1.5rem
}
.w-0 {
  width:0px
}
.max-w-sm {
  max-width:24rem
}
.flex-1 {
  flex:1 1 0%
}
.flex-shrink-0 {
  flex-shrink:0
}
.flex-grow {
  flex-grow:1
}
.flex-grow-0 {
  flex-grow:0
}
.transform {
  transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
}
.cursor-pointer {
  cursor:pointer
}
.list-disc {
  list-style-type:disc
}
.grid-cols-12 {
  grid-template-columns:repeat(12,minmax(0,1fr))
}
.flex-col {
  flex-direction:column
}
.items-start {
  align-items:flex-start
}
.items-end {
  align-items:flex-end
}
.items-center {
  align-items:center
}
.justify-end {
  justify-content:flex-end
}
.justify-center {
  justify-content:center
}
.justify-between {
  justify-content:space-between
}
.gap-2 {
  gap:.5rem
}
.space-y-8>:not([hidden])~:not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top:calc(2rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom:calc(2rem * var(--tw-space-y-reverse))
}
.space-y-2>:not([hidden])~:not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top:calc(.5rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom:calc(.5rem * var(--tw-space-y-reverse))
}
.space-x-2>:not([hidden])~:not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right:calc(.5rem * var(--tw-space-x-reverse));
  margin-left:calc(.5rem * calc(1 - var(--tw-space-x-reverse)))
}
.space-x-8>:not([hidden])~:not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right:calc(2rem * var(--tw-space-x-reverse));
  margin-left:calc(2rem * calc(1 - var(--tw-space-x-reverse)))
}
.space-y-4>:not([hidden])~:not([hidden]) {
  --tw-space-y-reverse: 0;
  margin-top:calc(1rem * calc(1 - var(--tw-space-y-reverse)));
  margin-bottom:calc(1rem * var(--tw-space-y-reverse))
}
.space-x-4>:not([hidden])~:not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right:calc(1rem * var(--tw-space-x-reverse));
  margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)))
}
.overflow-hidden {
  overflow:hidden
}
.rounded-md {
  border-radius:.375rem
}
.rounded {
  border-radius:.25rem
}
.rounded-lg {
  border-radius:.5rem
}
.border {
  border-width:1px
}
.border-gray-300 {
  --tw-border-opacity: 1;
  border-color:rgb(209 213 219 / var(--tw-border-opacity))
}
.border-red-500 {
  --tw-border-opacity: 1;
}
.bg-red-300 {
  --tw-bg-opacity: 1;
}
.bg-gray-200 {
  --tw-bg-opacity: 1;
}
.bg-gray-50 {
  --tw-bg-opacity: 1;
}
.bg-white {
  --tw-bg-opacity: 1;
}
.bg-blue-500 {
  --tw-bg-opacity: 1;
}
.p-2 {
  padding:.5rem
}
.p-4 {
  padding:1rem
}
.py-4 {
  padding-top:1rem;
  padding-bottom:1rem
}
.px-2 {
  padding-left:.5rem;
  padding-right:.5rem
}
.py-1 {
  padding-top:.25rem;
  padding-bottom:.25rem
}
.px-4 {
  padding-left:1rem;
  padding-right:1rem
}
.py-6 {
  padding-top:1.5rem;
  padding-bottom:1.5rem
}
.pt-0\.5 {
  padding-top:.125rem
}
.pt-0 {
  padding-top:0
}
.text-right {
  text-align:right
}
.font-serif {
  font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif
}
.font-mono {
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace
}
.text-4xl {
  font-size:2.25rem;
  line-height:2.5rem
}
.text-sm {
  font-size:.875rem;
  line-height:1.25rem
}
.text-2xl {
  font-size:1.5rem;
  line-height:2rem
}
.text-xs {
  font-size:.75rem;
  line-height:1rem
}
.font-bold {
  font-weight:700
}
.font-medium {
  font-weight:500
}
.font-normal {
  font-weight:400
}
.uppercase {
  text-transform:uppercase
}
.text-gray-600 {
  --tw-text-opacity: 1;
  color:rgb(75 85 99 / var(--tw-text-opacity))
}
.text-blue-500 {
  --tw-text-opacity: 1;
  color:rgb(59 130 246 / var(--tw-text-opacity))
}
.text-red-500 {
  --tw-text-opacity: 1;
  color:rgb(239 68 68 / var(--tw-text-opacity))
}
.text-white {
  --tw-text-opacity: 1;
  color:rgb(255 255 255 / var(--tw-text-opacity))
}
.text-gray-800 {
  --tw-text-opacity: 1;
  color:rgb(31 41 55 / var(--tw-text-opacity))
}
.text-green-400 {
  --tw-text-opacity: 1;
  color:rgb(74 222 128 / var(--tw-text-opacity))
}
.text-gray-900 {
  --tw-text-opacity: 1;
  color:rgb(17 24 39 / var(--tw-text-opacity))
}
.text-gray-400 {
  --tw-text-opacity: 1;
  color:rgb(156 163 175 / var(--tw-text-opacity))
}
.text-gray-700 {
  --tw-text-opacity: 1;
  color:rgb(55 65 81 / var(--tw-text-opacity))
}
.underline {
  text-decoration-line:underline
}
.opacity-0 {
  opacity:0
}
.opacity-100 {
  opacity:1
}
.shadow {
  --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);
  --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
  box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)
}
.shadow-md {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)
}
.shadow-lg {
  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);
  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);
  box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)
}
.shadow-sm {
  --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);
  --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
  box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)
}
.ring-1 {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)
}
.ring-black {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(0 0 0 / var(--tw-ring-opacity))
}
.ring-blue-300 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(147 197 253 / var(--tw-ring-opacity))
}
.ring-red-300 {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(252 165 165 / var(--tw-ring-opacity))
}
.ring-opacity-5 {
  --tw-ring-opacity: .05
}
.backdrop-blur-md {
  --tw-backdrop-blur: blur(12px);
  -webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);
  backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)
}
.transition {
  transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;
  transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;
  transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;
  transition-timing-function:cubic-bezier(.4,0,.2,1);
  transition-duration:.15s
}
.transition-all {
  transition-property:all;
  transition-timing-function:cubic-bezier(.4,0,.2,1);
  transition-duration:.15s
}
.duration-300 {
  transition-duration:.3s
}
.duration-100 {
  transition-duration:.1s
}
.ease-out {
  transition-timing-function:cubic-bezier(0,0,.2,1)
}
.ease-in {
  transition-timing-function:cubic-bezier(.4,0,1,1)
}
.odd\:bg-red-50:nth-child(odd) {
  --tw-bg-opacity: 1;
}
.odd\:bg-gray-50:nth-child(odd) {
  --tw-bg-opacity: 1;
}
.even\:bg-red-100:nth-child(even) {
  --tw-bg-opacity: 1;
}
.even\:bg-white:nth-child(even) {
  --tw-bg-opacity: 1;
}
.hover\:bg-red-400:hover {
  --tw-bg-opacity: 1;
  background-color:rgb(248 113 113 / var(--tw-bg-opacity))
}
.hover\:bg-gray-300:hover {
  --tw-bg-opacity: 1;
}
.hover\:bg-blue-700:hover {
  --tw-bg-opacity: 1;
  background-color:rgb(29 78 216 / var(--tw-bg-opacity))
}
.hover\:text-blue-700:hover {
  --tw-text-opacity: 1;
  color:rgb(29 78 216 / var(--tw-text-opacity))
}
.hover\:text-gray-500:hover {
  --tw-text-opacity: 1;
  color:rgb(107 114 128 / var(--tw-text-opacity))
}
.hover\:shadow-md:hover {
  --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
  box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)
}
.focus\:outline-none:focus {
  outline:2px solid transparent;
  outline-offset:2px
}
.focus\:ring-2:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)
}
.focus\:ring-gray-200:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(229 231 235 / var(--tw-ring-opacity))
}
.focus\:ring-indigo-500:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(99 102 241 / var(--tw-ring-opacity))
}
.focus\:ring-blue-300:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(147 197 253 / var(--tw-ring-opacity))
}
.focus\:ring-red-300:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(252 165 165 / var(--tw-ring-opacity))
}
.focus\:ring-offset-0:focus {
  --tw-ring-offset-width: 0px
}
.focus\:ring-offset-2:focus {
  --tw-ring-offset-width: 2px
}
@media (min-width: 640px) {
  .sm\:items-start {
    align-items:flex-start
  }
  .sm\:items-end {
    align-items:flex-end
  }
  .sm\:p-6 {
    padding:1.5rem
  }
}
.tooltip[data-v-4747cd9f] {
  position:relative;
  display:inline-block
}
.tooltip:hover .tooltiptext[data-v-4747cd9f] {
  visibility:visible
}
.tooltip .tooltiptext[data-v-4747cd9f] {
  visibility:hidden;
  width:180px;
  background-color:#000;
  color:#fff;
  text-align:left;
  border-radius:6px;
  padding:8px 10px;
  position:absolute;
  z-index:100
}
.tooltip .tooltiptext.left[data-v-4747cd9f] {
  top:-5px;
  right:110%
}
.tooltip .tooltiptext.right[data-v-4747cd9f] {
  top:-5px;
  left:110%
}
.tooltip .tooltiptext.bottom[data-v-4747cd9f] {
  top:100%;
  margin-top:3px;
  margin-left:-75px
}
.tooltip .tooltiptext.top[data-v-4747cd9f] {
  bottom:21px;
  margin-left:-70px
}
.tooltip .tooltiptext[data-v-4747cd9f]:after {
  content:"";
  position:absolute;
  margin-top:-5px;
  border-width:5px;
  border-style:solid;
  z-index:20
}
.tooltip .tooltiptext.right[data-v-4747cd9f]:after {
  top:15px;
  left:-10px;
  border-color:transparent black transparent transparent
}
.tooltip .tooltiptext.left[data-v-4747cd9f]:after {
  top:14%;
  left:100%;
  border-color:transparent transparent transparent black
}
.tooltip .tooltiptext.top[data-v-4747cd9f]:after {
  top:104%;
  left:46%;
  border-color:black transparent transparent transparent
}
.tooltip .tooltiptext.bottom[data-v-4747cd9f]:after {
  bottom:100%;
  left:50%;
  border-color:transparent transparent black transparent
}
</style>