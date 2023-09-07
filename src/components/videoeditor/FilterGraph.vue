<template>
    <perfect-scrollbar class="graph">
        <Card color="primary darken-1" class="node input" v-for="(video, i) in videoFiles">
            <Card-text class="node-input"><b>Input: </b>{{ video.filePath }}</CardText>
            <Card-text class="node-output"><b>Output: </b>[{{ i }}:v]</CardText>
        </Card>
        <Card color="primary darken-4" class="node input" v-for="(video, i) in videoFiles">
            <Card-text class="node-input"><b>Input: </b>{{ video.filePath }}</CardText>
            <Card-text class="node-output"><b>Output: </b>[{{ i }}:a]</CardText>
        </Card>
        <Card :color="`secondary darken-${chain.inputs.includes('a') ? '2' : '0'}`" class="node" v-for="chain in complexFilter">
            <Card-text class="node-input"><b>Input: </b> {{ chain.inputs }}</CardText>
            <Card-title v-for="subFilter in chain.filter.split(',')" class="node-filter">
                {{ subFilter }}
            </CardTitle>
            <Card-text class="node-output"><b>Output: </b> {{ chain.outputs }}</CardText>
        </Card>
        <Card color="success" class="node output">
            <Card-text>
                <Card-title class="node-input">Map <b class="mr-1 ml-1">out</b> to output file</CardTitle>
            </CardText>
        </Card>
    </perfect-scrollbar>
</template>

<script>

import {mapGetters, mapState} from "vuex";

export default {
    name: "FilterGraph",
    data: () => ({
    }),
    beforeDestroy() {

    },
    mounted() {
        console.log(this.complexFilter);
        console.log(this.colors);
    },
    methods: {},
    computed: {
        ...mapGetters(['project', 'complexFilter']),
        ...mapState({
            videoFiles: state => state.videoFiles,
        }),
    }
}
</script>

<style scoped>
.graph {
    display: flex;
    overflow: auto;
    flex-direction: column;
    max-height: calc(100vh - 64px);
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

@media (max-width: 959px) {
    .graph {
        max-height: calc(100vh - 56px);
    }
}

.node.output {
    margin-bottom: 10px;
}

.node {
    margin: 10px;
    margin-bottom: 0;
}
</style>