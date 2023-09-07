<script>
import { ref } from "vue";

export default {
  name: "LoadOrSave",
  components: {
  },
  props: {
    configNames: {
      type: Array,
      required: true
    },
    selectedConfigName: {
      type: String,
      required: true
    }
  },
  emits: [
    "config:load",
    "config:name-changed",
    "config:delete"
  ],
  setup(props, { emit }) {
    const configName = ref("");

    const handleLoad = (newConfigName) => {
      configName.value = newConfigName;
      emit("config:load", newConfigName);
    };

    const handleDelete = () => {
      if (confirm("Are you sure you want to delete this config?")) {
        emit("config:delete");
        configName.value = "";
      }
    };

    const downloadBackup = () => {
      const backup = localStorage.getItem("input-deforum");
      const element = document.createElement("a");
      const file = new Blob([backup], { type: "application/json" });
      element.href = URL.createObjectURL(file);
      element.download = "presets-deforum.json";
      element.click();
    };

    return {
      configName,
      handleLoad,
      handleDelete,
      downloadBackup
    };
  }
};
</script>

<template>
    <div>
      <div class="col-12">
        <h5>Load or save preset</h5>
        <p>
          All changes are automatically saved!
        </p>
        <ul>
          <li>
            To create a new preset file, just change the preset name and then
            change a parameter in the global or frames config.
          </li>
          <li>To load a preset, select it in the dropdown.</li>
          <li>
            To delete a preset, just select it and click on the delete button.
          </li>
        </ul>
        <p class="text-sm">
          You can also download a backup of all your configs. (You will also be
          able to share your configs with others by importing files in a near
          future.)
        </p>
      </div>
      <div class="flex flex-col space-y-4 rounded-md shadow p-2">
        <div class="flex w-full space-x-4">
          <Dropdown
            class="w-full"
            :modelValue="selectedConfigName"
            label="Saved configs"
            :options="configNames"
            :nullable="true"
            @update:modelValue="(newConfigName) => handleLoad(newConfigName)"
          ></Dropdown>
        </div>
        <div class="flex w-full space-x-4">
          <InputText
            class="w-full"
            :modelValue="configName"
            label="Config name"
            @update:modelValue="
              (newConfigName) => $emit('config:name-changed', newConfigName)
            "
          ></InputText>
          <div class="flex items-center ml-5">
            <Button icon="pi pi-trash" @click="handleDelete" title="Delete a saved config" class="p-button-raised p-button-danger mr-2 mb-2" 
              ></Button>
          
          </div>
        </div>
        <div class="flex w-full space-x-4 justify-end ml-2">
          <Button
            class="p-button-raised p-button-warning mr-2 mb-2"
            @click="downloadBackup"
            title="Download a backup json file containing your data (importable in the future)"
            >Download backup</Button
          >
          <!-- <div>or</div>
          <div class="flex">
            <input type="file" name="" id="" />
            <Button>import</Button>
          </div> -->
        </div>
      </div>
    </div>
  </template>