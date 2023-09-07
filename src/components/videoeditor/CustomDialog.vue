<template>
    <Dialog v-model="$store.state.electron.prompt.show" width="500">
        <Card>
            <Card-title>{{ prompt.title }}</CardTitle>
            <Card-text>{{ prompt.subtitle }}</CardText>
            <Divider></Divider>
            <Card-actions>
                <v-spacer></v-spacer>
                <Button text @click="dialogCancel">
                    {{ prompt.cancelText }}
                </Button>
                <Button color="primary" text @click="dialogConfirm">
                    {{ prompt.confirmText }}
                </Button>
            </CardActions>
        </Card>
    </Dialog>
</template>

<script>
import {mapState} from "vuex";

export default {
    name: "CustomDialog",
    methods: {
        dialogCancel() {
            this.$store.commit('hidePrompt');
        },
        dialogConfirm() {
            this.$store.commit('hidePrompt');
            this.prompt.onConfirm();
        },
    },
    watch: {
        'prompt.show'() {
            if (!this.prompt.show)
                this.prompt.onCancel();
        }
    },
    computed: {
        ...mapState({
            prompt: state => state.electron.prompt,
        }),
    },
}
</script>

<style scoped>

</style>