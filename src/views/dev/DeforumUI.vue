<template>
  <div class="flex justify-content-between flex-row">
    <div class="col-3"></div>
    <div class="col-9">
      <div class="col-12 md:mb-2 mb-3 mt-2">
        <label class="form-label mb-1 ms-0 mt-2"
          >Selected Model: <strong>{{ job.model_name }}</strong></label
        >
        <div class="model-selector-container mt-1 overflow-x-scroll">
          <ModelfileSelector
            :modelId="job.model_id"
            :modelName="job.model_name"
            @update:modelId="updateModelId"
            @update:modelName="updateModelName"
          />
        </div>
      </div>
      <div class="p-fluid formgrid grid">
        <div class="field col-12 md:col-6 md:mb-2 mb-3"></div>
        <div class="field col-12 md:mb-2 mb-3">
          <div class="message p-error p-danger">
            {{ validation.firstError("job.prompt") }}
          </div>
          <label class="mb-1 ms-0">Prompt</label>
          <Textarea
            rows="4"
            autoResize
            placeholder="Type your prompt here"
            v-model="job.prompt"
            :disabled="isVideoProcessing"
            @input="job.prompt"
          ></Textarea>
        </div>
      </div>
      <div class="p-fluid formgrid grid">
        <div class="field col-12 md:col-6 md:mb-2 mb-3"></div>
        <div class="field col-12 md:mb-2 mb-3">
          <div class="message p-error p-danger">
            {{ validation.firstError("job.prompt") }}
          </div>
          <label class="mb-1 ms-0">Negative Prompt</label>
          <Textarea
            rows="4"
            autoResize
            placeholder="Type your negative prompt here"
            v-model="job.negative_prompt"
            :disabled="isVideoProcessing"
            @input="job.negative_prompt"
          ></Textarea>
        </div>
      </div>
      <h3>Camera movement</h3>
      <div class="horizontal-select mt-2 pt-1 pb-1">
        <div
          v-for="(item, itemIndex) in selectableItems"
          :key="itemIndex"
          class="selectable-item"
          :class="{ selected: isSelected(itemIndex) }"
          @click="handleItemSelect(itemIndex)"
        >
          <div class="selectable-item-content">
            {{ item.label }}
          </div>
        </div>
      </div>
      <h3>+ Prompt change in time</h3>
      <button @click="addPrompt">Add new prompt</button>
      <div v-for="(p, index) in job.prompts" :key="index">
        <div class="p-fluid formgrid grid">
          <div class="field col-12 md:col-6 md:mb-2 mb-3"></div>
          <div class="field col-12 md:mb-2 mb-3">
            <div class="message p-error p-danger">
              {{ validation.firstError("job.prompt") }}
            </div>
            <p>{{ p.time }} sec</p>
            <Textarea
              rows="4"
              autoResize
              placeholder="Type your prompt here"
              :disabled="isVideoProcessing"
              @input="updatePrompt($event, index)"
              v-model="job.prompts[index].prompt"
            ></Textarea>
        <button v-if="isLastPrompt(index)" @click="deletePrompt(index)">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ModelfileSelector from "@/components/Modelfile/ModelfileSelector.vue";
import { ref, toRaw } from "vue";

const lastPromptTime = ref(0);
const selectedItems = ref([]);
const selectableItems = [
  {
    label: "None",
  },
  {
    label: "Zoom",
    value: {
      zoom: "0:(1.02)",
    },
  },
  {
    label: "Zoom out",
    value: "0:(0.5)",
  },
  {
    label: "Rotate Clockwise",
    value: "90:1",
  },
  {
    label: "Rotate Counter-Clockwise",
    value: "-90:1",
  },
  {
    label: "Up",
    value: "up:10",
  },
  {
    label: "Down",
    value: "down:10",
  },
  {
    label: "Left",
    value: "left:10",
  },
  {
    label: "Right",
    value: "right:10",
  },
];

const isSelected = (itemIndex) => {
  return selectedItems.value.includes(itemIndex);
};

const handleItemSelect = (itemIndex) => {
  const currentItem = selectableItems[itemIndex].label;
  const conflictingItem = conflictingItems[currentItem];

  if (currentItem === "None") {
    selectedItems.value = [0];
  } else {
    if (isSelectedItemLabel("None")) {
      selectedItems.value = selectedItems.value.filter(
        (index) => selectableItems[index].label !== "None"
      );
    }
    if (conflictingItem && isSelectedItemLabel(conflictingItem)) {
      selectedItems.value = selectedItems.value.filter(
        (index) => selectableItems[index].label !== conflictingItem
      );
    }
    selectedItems.value = isSelectedItemLabel(currentItem)
      ? selectedItems.value.filter((index) => index !== itemIndex)
      : [...selectedItems.value, itemIndex];
  }
};

const isSelectedItemLabel = (label) => {
  return selectedItems.value.some(
    (index) => selectableItems[index].label === label
  );
};

const job = ref({
  prompt: "",
  negative_prompt: "",
  prompts: [],
});

const conflictingItems = {
  Zoom: "Zoom out",
  "Zoom out": "Zoom",
  Up: "Down",
  Down: "Up",
  Left: "Right",
  Right: "Left",
  "Rotate Clockwise": "Rotate Counter-Clockwise",
  "Rotate Counter-Clockwise": "Rotate Clockwise",
};

const addPrompt = () => {
  lastPromptTime.value = lastPromptTime.value + 3;
  const promptTime = {
    prompt: "",
    time: lastPromptTime.value,
  };
  job.value.prompts.push(promptTime);
  console.log(toRaw(job.value))
};

const updatePrompt = (event, index) => {
  job.value.prompts[index].prompt = event.target.value;
    console.log("Event:", event.target.value);
  console.log(
    `Updated prompt at index ${index}:`,
    job.value.prompts[index].prompt
  );
    console.log(toRaw(job.value))
};

const isLastPrompt = (index) => {
  return index === job.value.prompts.length - 1;
};

const deletePrompt = (index) => {
    lastPromptTime.value = lastPromptTime.value - 3;
  job.value.prompts.splice(index, 1);
};

const isVideoProcessing = ref(false);

const validation = {
  firstError: (fieldName) => {
    return "";
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/vimage.scss';
.horizontal-select {
  display: flex;
  overflow-x: auto;
  gap: 8px;
}
</style>
