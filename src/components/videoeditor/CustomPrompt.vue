<template>
    <Dialog v-model="$store.state.electron.textPrompt.show" width="500">
        <Card>
            <Card-title>{{ prompt.title }}</CardTitle>
            <Card-subtitle v-if="prompt.subtitle !== ''" v-html="prompt.subtitle"></v-card-subtitle>
            <v-form @submit.prevent="dialogConfirm">
                <InputText filled
                              :label="prompt.label"
                              class="mr-2 ml-2"
                              autofocus
                              dense
                              v-model="$store.state.electron.textPrompt.value">
                </InputText>
            </v-form>
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
    name: "CustomPrompt",
    methods: {
        dialogCancel() {
            this.$store.commit('hideTextPrompt');
        },
        dialogConfirm() {
            this.$store.commit('hideTextPrompt');
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
            prompt: state => state.electron.textPrompt,
        }),
    },
}
</script>

<style scoped>

</style>