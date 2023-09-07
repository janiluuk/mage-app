<template>
    <div class="container px-0 mt-8">
        <div class="text-center text-sm text-uppercase fw-bold opacity-7">{{ title }}</div>

        <div class="md-toolbar md-table-toolbar md-transparent md-theme-default md-elevation-0">

            <video-library-tabs-toolbar @change-query="searchQuery"
                @change-pagination="setPagination"></video-library-tabs-toolbar>
        </div>
        <div class="alignt-items-center d-flex">

        <!-- Generate history header with botto divider -->
        <pagination class="pagination-no-border pagination-success clear-both" v-model="pagination.currentPage"
            :per-page="pagination.perPage" :total="total" />
        </div>
        <div v-for="job in collection" :key="job.id">
            <video-library-entry :job="job" @delete-job="deleteJob" @edit-job="editJob"  @retry-job="retryJob" @finalize-job="finalizeJob"/>
        </div>

    </div>
</template>
<script>
/* eslint-disable */
import VideoLibraryTabsToolbar from "@/components/VideoLibraryTabsToolbar.vue";
import VideoLibraryEntry from "@/components/VideoLibraryEntry.vue";
import Pagination from "./Pagination.vue";
import _ from "lodash";

export default {
    name: "VideoLibraryList",
    components: {
        VideoLibraryEntry,
        pagination: Pagination,
        VideoLibraryTabsToolbar
    },
    props: ['collection', 'statuses', 'title'],

    watch: {
        collection() {
            this.total = this.collection.length;
        },
        statuses() {
            this.statusFilter = this.statuses;
        }
    },
    data: () => ({
        statusFilter: [],
        title: '',
        sortation: {
            field: "updated_at",
            order: "desc",
        },
        query: null,
        pagination: {
            perPage: 25,
            currentPage: 1,
            perPageOptions: [5, 10, 25, 50],
        },

        total: 0,
    }),

    computed: {
        sort() {
            if (this.sortation.order === "desc") {
                return `-${this.sortation.field}`;
            }

            return this.sortation.field;
        },

        from() {
            return this.pagination.perPage * (this.pagination.currentPage - 1);
        },

        to() {
            let highBound = this.from + this.pagination.perPage;
            if (this.total < highBound) {
                highBound = this.total;
            }
            return highBound;
        },
    },

    methods: {
        searchQuery(query) {
            this.query = query;
        },
        setPagination(pagination) {
            this.pagination = pagination;
        },

        deleteJob(id) {
            this.$emit('delete-job', id);
        },
        editJob(id) {
            this.$router.push(`/edit/${id}`);
        },
        retryJob(id) {
            this.$emit('retry-job', id);
        },
        finalizeJob(id) {
            this.$emit('finalize-job', id);
        },

        getJobs() {
            return this.collection;
        },

        goToAdd() {
            this.$router.push({ name: "Add job" });
        },

        goToEdit(id) {
            this.$router.push({ name: "Edit job", params: { id } });
        },

        customSort() {
            return false;
        },
    },
};
</script>
