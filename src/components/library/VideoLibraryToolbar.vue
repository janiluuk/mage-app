<template>
        <div class="grid p-fluid">
        <div class="col-12">

                <Menubar :model="menuOptions">
                    <template #end>

                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText type="text" v-model="query"  :placeholder="query ? query : 'Search ...'" placeholder="Search" />
                        </span>
                    </template>
                </Menubar>
        </div>

    </div>
</template>
<script>
/* eslint-disable */
export default {
    name: "VideoLibraryTabsToolbar",
    data: () => ({

        menuOptions: [
            {
                label: 'All projects',
                to: '/library',
                class: 'p-highlight'
            },
            {
                label: 'Finished projects',
                to: '/library/#finished'
            },
            {
                label: 'Original content',
                to: '/library/#original'
            },
            {
                label: 'Unfinished projects',
                to: '/library/#preview'
            }
        ],
        query: "",
    }),
    watch: {
        query: {
            handler: "getListDebounced",
            immediate: true,
        }
    },

    methods: {
        updateQuery(query) {
            this.$emit.change - query(query);
        },
    }
};
</script>
