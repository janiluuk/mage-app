<template>
    <div class="edit-container">
        <v-sheet class="edit-buttons" color="softBackground">
            <div class="flow-buttons">
                <Button :disabled="!canCut" small rounded text @click="split">
                    <span class="button-caption button-layout">Split</span>
                    <i className="pi pi-arrow-split-vertical">
                </Button>
                <Button :disabled="!canCut" small rounded text @click="setStartPoint">
                    <span class="button-caption button-layout">Set start</span>
                    <i className="pi pi-contain-start">
                </Button>
                <Button :disabled="!canCut" small rounded text @click="setEndPoint">
                    <span class="button-caption button-layout">Set end</span>
                    <i className="pi pi-contain-end">
                </Button>
            </div>
            <div class="sliders">
                <volume-slider></volume-slider>
                <playback-rate-slider></playback-rate-slider>
            </div>
            <div class="flow-buttons fb2">
                <Button small rounded text @click="removeFragment()">
                    <span class="button-caption button-layout">Delete</span>
                    <i className="pi pi-delete">
                </Button>
                <div class="two-way-buttons">
                    <Button :disabled="!canMoveLeft" small icon @click="shiftFragment({shift: -1})">
                        <i className="pi pi-chevron-left">
                    </Button>
                    <span class="button-caption two-way-caption">Move</span>
                    <Button :disabled="!canMoveRight" small icon @click="shiftFragment({shift: 1})">
                        <i className="pi pi-chevron-right">
                    </Button>
                </div>
                <div class="two-way-buttons">
                    <Button :disabled="!canUndo" small icon @click="undo">
                        <i className="pi pi-undo">
                    </Button>
                    <span class="button-caption two-way-caption">Undo</span>
                    <Button :disabled="!canRedo" small icon @click="redo">
                        <i className="pi pi-redo">
                    </Button>
                </div>
            </div>
        </v-sheet>
        <!--        <Divider></Divider>-->
    </div>
</template>

<script>
import VolumeSlider from "@/components/VolumeSlider";
import PlaybackRateSlider from "@/components/PlaybackRateSlider";
import {mapActions, mapGetters} from "vuex";

export default {
    name: "EditButtons",
    components: {PlaybackRateSlider, VolumeSlider},
    methods: {
        ...mapActions(['split', 'setStartPoint', 'setEndPoint', 'removeFragment', 'shiftFragment', 'undo', 'redo']),
    },
    computed: {
        ...mapGetters(['canUndo', 'canRedo', 'canMoveRight', 'canMoveLeft', 'canCut'])
    },
}
</script>

<style scoped>
.edit-container {
    display: flex;
    flex-direction: column;
}

.edit-buttons {
    height: 100%;
    width: 100%;
    display: flex;
    padding: 0 25px;
    justify-content: space-evenly;
}

.flow-buttons {
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
}

.flow-buttons > * {
    margin: 2px 0;
}

.button-layout {
    margin-right: 10px;
    width: 70px;
}

.button-caption {
    text-transform: uppercase;
    font-size: 12px;
    opacity: 0.7;
    text-align: right;
    display: inline-block;
}

.fb2 .button-layout {
    width: 50px;
}

.two-way-caption {
    margin: 0 10px;
}

.sliders {
    display: flex;
}

.move-buttons {
    height: 100%;
    display: flex;
    place-items: center;
}
</style>