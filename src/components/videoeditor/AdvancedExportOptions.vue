<template>
    <div>
        <InputText prepend-icon="mdi-magnify"
                      dense
                      clearable
                      outlined hide-details="auto"
                      type="search"
                      label="Search filters" v-model="term"></InputText>
        <VirtualScroller
            :bench="1"
            :items="filteredFilters"
            height="300"
            item-height="64">
            <template v-slot:default="{ item: filter }">
                <ListItem :key="filter.name">
                    <ListItem-content>
                        <p>{{ filter.name }}</p>
                        <p>{{ filter.description }}</p>
                    </ListItemContent>
                        <Button
                            :title="`Show information about ${filter.name}`"
                            icon
                            @click="openFile('https://ffmpeg.org/ffmpeg-filters.html#'+filter.name)">
                            <i className="pi pi-information-outline">
                        </Button>
                        <Button
                            title="Add filter"
                            icon
                            @click="selectFilter(filter)">
                            <i className="pi pi-plus">
                        </Button>
                </ListItem>
            </template>
        </VirtualScroller>
    </div>
</template>

<script>
import {mapActions} from "vuex";

export default {
    name: "AdvancedExportOptions",
    data: () => ({
        filters: [],
        term: '',
    }),
    async mounted() {
        this.filters = await this.getFilters();
    },
    methods: {
        async selectFilter(filter) {
            let {confirmed, value} = await this.showTextPrompt({
                title: `Add filter - ${filter.name}`,
                subtitle: `${filter.description}<br>Discover options by clicking the (i) next to the filter.`,
                value: filter.options,
                label: "Options (optional)",
                confirmText: "Add",
            });

            if (confirmed) {
                this.$store.commit('addExportFilter', {...filter, options: value});
            }
        },
        ...mapActions(['getFilters', 'openFile', 'showTextPrompt']),
    },
    computed: {
        filteredFilters() {
            if (this.term === '' || this.term === null)
                return this.filters;
            return this.filters
                .filter(f => f.name.includes(this.term) || f.description.includes(this.term))
                .sort((a, b) => b.name.includes(this.term) - a.name.includes(this.term))
        },
    }
}
</script>

<style scoped>

</style>