<template>
        <div class="grid p-fluid">
        <div class="col-12">
            <div class="card card-w-title">
                <h5>Menubar</h5>
                <Menubar :model="menuOptions">
                    <template #end>
                        <Select v-model="pagination.perPage" name="pages">
                            <option v-for="item in pagination.perPageOptions" :key="item" :label="item" :value="item">
                                {{ item }}
                            </option>
                        </Select>
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText type="text" v-model="query"  :placeholder="query ? query : 'Search ...'" placeholder="Search" />
                        </span>
                    </template>
                </Menubar>
            </div>
        </div>


    </div>
</template>
<script>
/* eslint-disable */
const nestedRouteItems = ref();
export default {
    name: "VideoLibraryTabsToolbar",
    data: () => ({
        pagination: {
            perPage: 5,
            currentPage: 1,
            perPageOptions: [5, 10, 25, 50],
            
        },
        menuOptions: [
            {
                label: 'All projects',
                to: '/library'
            },
            {
                label: 'Finished projects',
                to: '/library/finished'
            },
            {
                label: 'Original content',
                to: '/library/original'
            },
            {
                label: 'Unfinished projects',
                to: '/library/preview'
            }
        ],
        query: "",
        total: 0,
    }),
    watch: {
        query: {
            handler: "getListDebounced",
            immediate: true,
        },
        pagination: {
            handler: "getListDebounced",
            immediate: true,
        }
    },

    methods: {
        updateQuery(query) {
            this.$emit.change - query(query);
        },
        setPagination(pagination) {
            this.$emit.change - pagination(pagination);
        },
    }
};
</script>
