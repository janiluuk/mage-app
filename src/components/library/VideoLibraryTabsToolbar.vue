<template>
    <div class="md-toolbar md-table-toolbar md-transparent md-theme-default md-elevation-0">
        <div class="md-field md-theme-default md-has-value pull-left"><label for="pages">Per page</label>
            <select v-model="pagination.perPage" name="pages">
                <option v-for="item in pagination.perPageOptions" :key="item" :label="item" :value="item">
                    {{ item }}
                </option>
            </select>
        </div>
        <div class="pe-md-3 d-flex align-items-center ms-md-auto pull-right">
        <div class="input-group input-group-outline">
            <label class="form-label text-dark"></label>
            <input v-model="query" id="searchJobs" type="search" class="form-control form-control-default text-white" style="max-width:200px" clearable="true" :placeholder="query ? query : 'Search ...'" />
        </div>
    </div>

    </div>
</template>
<script>
/* eslint-disable */

export default {
    name: "VideoLibraryTabsToolbar",
    data: () => ({
        pagination: {
            perPage: 5,
            currentPage: 1,
            perPageOptions: [5, 10, 25, 50],
        },
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
