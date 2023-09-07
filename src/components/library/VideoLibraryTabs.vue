<template>

      <div class="vimage-container px-0">
        <div>
          <div class="main-container w-100 position-relative">
            <div class="row">

              <video-library-tabs-nav @change-tab="changeTab" />
            </div>
            <div class="row align-items-center">
              <div class="tab-content col-mt-6" id="myLibraryContent">
                <div v-if="this.collection.length > 0">
                  <div class="tab-pane fade show active" id="readyJobs" role="tabpanel" aria-labelledby="ready-tab">
                    <video-library-list v-if="activeTab == 0" @delete-job="destroy" @finalize-job="finalizeJob" @retry-job="retryJob"
                      :title="'Finished jobs (' + getCollection(['finished']).length + ')'"
                      :collection="getCollection(['finished'])"></video-library-list>
                  </div>
                  <div class="tab-pane fade" id="underworkJobs" role="tabpanel" aria-labelledby="underwork-tab">
                    <video-library-list v-if="activeTab == 1" @delete-job="destroy" @finalize-job="finalizeJob" @retry-job="retryJob"
                      :title="'My content on works (' + getCollection(['pending', 'preview']).length + ')'"
                      :collection="getCollection(['preview', 'pending'])"></video-library-list>
                  </div>
                  <div class="tab-pane fade" id="inProgressJobs" role="tabpanel" aria-labelledby="inProgress-tab">
                    <video-library-list v-if="activeTab == 2" @delete-job="destroy" @finalize-job="finalizeJob" @retry-job="retryJob"
                      :title="'Jobs processing (' + getCollection(['processing', 'approved']).length + ')'"
                      :collection="getCollection(['processing', 'approved'])"></video-library-list>
                  </div>
                  <div class="tab-pane fade" id="failedJobs" role="tabpanel" aria-labelledby="failed-tab">
                    <video-library-list v-if="activeTab == 3" @delete-job="destroy" @finalize-job="finalizeJob" @retry-job="retryJob"
                      :title="'Failed jobs (' + getCollection(['error', 'cancelled']).length + ')'"
                      :collection="getCollection(['error', 'cancelled'])"></video-library-list>
                  </div>
                  <div class="tab-pane fade" id="uploads" role="tabpanel" aria-labelledby="uploads-tab">
                    <video-library-list v-if="activeTab == 4" @delete-job="destroy" @finalize-job="finalizeJob" @retry-job="retryJob"
                      :title="'My uploads (' + getCollection().length + ')'"
                      :collection="getCollection()"></video-library-list>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>
<script>
/* eslint-disable */

import VideoLibraryTabsNav from "./VideoLibraryTabsNav.vue";
import VideoLibraryList from "./VideoLibraryList.vue";
import Swal from "sweetalert2";


import { mapMutations } from "vuex";
import _ from "lodash";

export default {
  name: "VideoLibraryTabs",

  data: () => ({
    cachedList: [],
    cachedTotal: [],
    collection: {},
    library: [],
    query: null,
    total: 0,
    activeTab: 0,
  }),
  mount() {
    this.getListDebounced();
  },
  beforeMount() {
    console.log("toggling display");

  },
  beforeUnmount() {

  },

  watch: {
    query: {
      handler: "getListDebounced",
      immediate: true,
    },
    sortation: {
      handler: "getList",
      immediate: false,
      deep: true,
    }
  },
  components: {
    VideoLibraryTabsNav,
    VideoLibraryList,
  },

  methods: {
    ...mapMutations(["toggleEveryDisplay", "toggleHideConfig"]),

    getCollection(statuses) {
      return _.filter(this.collection, function (item) { return _.includes(statuses, item.status) || !statuses ? item : false });
    },
    changeTab(tabIndex) {
      this.activeTab = tabIndex;
    },
    getListDebounced: _.debounce(function () {
      this.getList();
    }, 300),
    getList() {
      let params = {
        include: "modelfile,user",
        ...(this.sort ? { sort: this.sort } : {}),
        filter: {
          ...(this.query ? { name: this.query } : {}),
          ...(this.query ? { modelfile: this.query } : {}),
          ...(this.query ? { status: this.query } : {}),
        }
      };

      this.$store.dispatch("videojobs/list", params).then(() => {
        this.collection = this.$store.getters["videojobs/list"];
        this.total = this.$store.getters["videojobs/listTotal"];
      });
    },
    async destroy(id) {
      const confirmation = await Swal.fire({
        title: "Delete this item?",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, keep it",
        confirmButtonClass: "md-button md-success",
        cancelButtonClass: "md-button md-danger",
      });

      if (confirmation.value === true) {
        try {
          await this.$store.dispatch("videojobs/destroy", id);
          this.$notify({ // Call $notify directly here
            timeout: 2500,
            message: 'Item deleted successfully.',
            horizontalAlign: 'right',
            verticalAlign: 'top',
            icon: 'add_alert',
            type: 'success'
          });
          await this.getList();
        } catch (e) {
          let errorMessage = 'Oops, something went wrong!';

          if (e.response && e.response.data && e.response.data.errors[0]) {
            errorMessage = e.response.data.errors[0].title;
          }

          this.$notify({ // Call $notify directly here
            timeout: 2500,
            message: errorMessage,
            horizontalAlign: 'right',
            verticalAlign: 'top',
            icon: 'add_alert',
            type: 'warning'
          });
        }
      }
    },
   
  
  }
};
</script>
