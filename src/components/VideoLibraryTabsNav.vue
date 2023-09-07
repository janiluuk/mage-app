<template>
    <div class="nav-wrapper position-relative end-0">
        <ul class="p-1 nav nav-pills nav-fill" id="libraryList" role="tablist">

            <li class="nav-item">
                <a class="px-0 py-1 mb-0 nav-link" data-bs-toggle="tab" @click="changeTab(0)"  v-bind:class="{active: activeTab == 0 }"
  href="javascript:;" role="tab"
                    data-bs-target="#readyJobs" aria-selected="true">
                    <i class="fa fa-list"></i>
                    <span class="ms-1">Ready content</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="px-0 py-1 mb-0 nav-link" data-bs-toggle="tab" href="javascript:;"  v-bind:class="{active : activeTab == 1 }" @click="changeTab(1)" role="tab"
                    data-bs-target="#underworkJobs" aria-selected="false">
                    <i class="fa fa-list"></i>

                    <span class="ms-1">Jobs under editing</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="px-0 py-1 mb-0 nav-link" data-bs-toggle="tab" href="javascript:;"  v-bind:class="{active : activeTab == 2 }" @click="changeTab(2)" role="tab"
                    data-bs-target="#inProgressJobs" aria-selected="false">
                    <i class="fa fa-list"></i>

                    <span class="ms-1">Jobs processing</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="px-0 py-1 mb-0 nav-link" data-bs-toggle="tab" href="javascript:;"  v-bind:class="{active : activeTab == 3 }" @click="changeTab(3)" role="tab"
                    data-bs-target="#failedJobs" aria-selected="false">
                    <i class="fa fa-list"></i>

                    <span class="ms-1">Failed Jobs</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="px-0 py-1 mb-0 nav-link" v-bind:class="{active : activeTab == 4 }" data-bs-target="#uploads" data-bs-toggle="tab" @click="changeTab(4)" href="javascript:;" role="tab"
                    aria-selected="false">
                    <i class="fa fa-list "></i>
                    <span class="ms-1">My uploads</span>
                </a>
            </li>
        </ul>
    </div>
</template>
<script>
import setNavPills from "@/assets/js/nav-pills.js";

export default {
    name: "VideoLibraryTabsNav",
    data() {
        return {
            activeTab: 0 
        }
    },
    mounted() {
        setNavPills();
    },
    methods: {
        changeTab(index) {
            this.activeTab = index
            this.$emit("change-tab", index);
        },
    }
};
</script>
