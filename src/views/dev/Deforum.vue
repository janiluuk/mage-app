<script setup>
import { onBeforeMount, onMounted, ref } from "vue";
import _ from 'lodash';
import FramesConfigComponent from "@/components/Deforum/FramesConfigComponent.vue";
import GlobalConfigComponent from "@/components/Deforum/GlobalConfigComponent.vue";
import JsonConfigGenerator from "@/components/Deforum/JsonConfigGenerator.vue";
import LoadOrSave from "@/components/Deforum/LoadOrSave.vue";
import { LocalStorage } from "@/components/Deforum/services/LocalStorage";
import Config from "@/components/Deforum/types/Config";
import Frame from "@/components/Deforum/types/Frame";
import UserConfig from "@/components/Deforum/types/UserConfig";
import SaveNotification from "@/components/Deforum/SaveNotification.vue";
import MusicPlayer from "@/components/Deforum/MusicPlayer.vue";


const config = ref(new Config());
const userConfig = ref(new UserConfig());
const configNames = ref(LocalStorage.getConfigNames());
const selectedConfigName = ref("");
const isSaveNotificationVisible = ref(false);
const saveNotificationTimeout = ref(null);


const onConfigChange = () => {
    if (selectedConfigName.value !== "") {
        handleConfigSave(selectedConfigName.value);
        showSaveNotification();
    }
};

const showSaveNotification = () => {
    isSaveNotificationVisible.value = true;
    clearSaveNotificationTimeout();
    saveNotificationTimeout.value = setTimeout(() => {
        isSaveNotificationVisible.value = false;
    }, 3000);
};

const closeSaveNotification = () => {
    isSaveNotificationVisible.value = false;
    clearSaveNotificationTimeout();
};

const clearSaveNotificationTimeout = () => {
    if (saveNotificationTimeout.value) {
        clearTimeout(saveNotificationTimeout.value);
    }
};

const handleConfigChange = (newConfig) => {
    config.value = newConfig;
    onConfigChange();
};

const handleConfigLoad = (newSelectedConfigName) => {
    config.value = LocalStorage.getConfig(newSelectedConfigName) ?? new Config();
    selectedConfigName.value = newSelectedConfigName;
};

const handleConfigSave = (newConfigName) => {
    LocalStorage.saveConfig(newConfigName, config.value);
    configNames.value = LocalStorage.getConfigNames();
};

const handleFrameListChange = (newFrameList) => {
    config.value.frames = newFrameList;
    onConfigChange();
};

const handleAddFrameBetween = (index) => {
    const frameId = config.value.frames[index].id;
    const newFrame = _.cloneDeep(config.value.frames[index]);
    newFrame.id = frameId + userConfig.value.stepIncrement;
    config.value.frames.splice(
        index + 1,
        0,
        newFrame
        );
    onConfigChange();
};

const handleUserConfigSave = () => {
    LocalStorage.saveUserConfig(userConfig.value);
    showSaveNotification();
};

const handleConfigDelete = () => {
    LocalStorage.deleteConfig(selectedConfigName.value);
    configNames.value = LocalStorage.getConfigNames();
    if (selectedConfigName.value) {
        config.value = new Config();
        selectedConfigName.value = "";
    }
};

const handleConfigNameChange = (newConfigName) => {
    selectedConfigName.value = newConfigName;
};

const handleStepIncrementChange = (newIncrement) => {
    userConfig.value.stepIncrement = newIncrement;
    handleUserConfigSave();
    showSaveNotification();
};

const handleExpressionModeChange = (newIsExpressionModeEnabled) => {
    userConfig.value.isExpressionModeEnabled = newIsExpressionModeEnabled;
    handleUserConfigSave();
    showSaveNotification();
};

const handleAddFrameAt = (index) => {
    config.value.frames.push(new Frame(index));
    config.value.frames.sort((a, b) => a.id - b.id);
    onConfigChange();
};

const handlePromptStyleChange = (newPromptStyle) => {
    config.value.promptStyle = newPromptStyle;
    onConfigChange();
};

const handleSubstractXFramesChange = (newSubstractXFrames) => {
    config.value.substractXFrames = newSubstractXFrames;
    onConfigChange();
};

onMounted(() => {
    userConfig.value = LocalStorage.getUserConfig() ?? new UserConfig();
});

</script>
<template>
    <div class="grid">
        <div class="col-12 items-left">

            <div class="card col-12 flex">
                <div class="col-6 items-left">
                    <h1 class="text-2xl font-serif mb-4 space-x-2">
                            <span>Deforum config generator</span>
                    </h1>
                    <p class="text-gray-600 text-sm">
                            The official documentation for the Deforum project can be found
                            <a class="text-blue-500 hover:text-blue-700" target="_blank"
                                href="https://docs.google.com/document/d/1RrQv7FntzOuLg4ohjRZPVL7iptIyBhwwbcEYEW2OfcI/edit#">
                                here</a>.
                    </p>
                    <hr/>
                    <LoadOrSave :configNames="configNames" :selectedConfigName="selectedConfigName"
                        @config:load="handleConfigLoad" @config:delete="handleConfigDelete"
                        @config:name-changed="handleConfigNameChange" />
                </div>
                <div class="col-6 items-left">
                    <MusicPlayer :config="config" @update:addFrameAt="handleAddFrameAt" />
            </div>
            </div>
            <div class="card">
                <div class="col-12">

                    <GlobalConfigComponent :config="config" @update:configValue="handleConfigChange" />
                </div>
            </div>

            <div class="card">

                <div class="col-12">
                    <FramesConfigComponent :frameList="config.frames" :stepIncrement="userConfig.stepIncrement ?? 1"
                        :isExpressionModeEnabled="userConfig.isExpressionModeEnabled ?? false"
                        :promptStyle="config.promptStyle ?? ''" :substractXFrames="config.substractXFrames ?? 0"
                        @user-config:step-increment-change="handleStepIncrementChange"
                        @user-config:expression-mode-change="handleExpressionModeChange"
                        @update:frameList="handleFrameListChange" @update:addFrameBetween="handleAddFrameBetween"
                        @update:prompt-style="handlePromptStyleChange"
                        @update:substract-x-frames="handleSubstractXFramesChange" />
                </div>
            </div>
            <div class="card">
                <div class="col-12">

                    <JsonConfigGenerator :config="config" />
                </div>

            </div>
            <SaveNotification :isSaveNotificationVisible="isSaveNotificationVisible"
                @save-notification:close="closeSaveNotification" />
        </div>
    </div>
</template>
