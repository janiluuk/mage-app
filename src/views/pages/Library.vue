<script setup>
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';


const toast = useToast();
const confirmPopup = useConfirm();
const destroy = (id) => {

    try {
        store.dispatch("videojobs/destroy", id).then(() => {
            toast.add({ severity: 'success', summary: 'Success', detail: "Entry deleted", life: 3000 });
            getJobList();
        });
    } catch (e) {
        let errorMessage = 'Oops, something went wrong!';
        if (e.response && e.response.data && e.response.data.errors[0]) {
            errorMessage = e.response.data.errors[0].title;
        }
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }

};
const download = (id) => {

    try {
        var findById = store.getters['videojobs/findById'];
        var item = findById(id);
        if (item && item.status == 'finished') {
            store.dispatch("videojobs/download", item);
            toast.add({ severity: 'info', summary: 'Success', detail: 'Downloading starting..', life: 3000 });

        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Item is not finished!', life: 3000 });
        }
    } catch (e) {
        let errorMessage = 'Oops, something went wrong! ' + e.message;
        if (e.response && e.response?.data && e.response?.data?.errors[0]) {
            errorMessage = e.response.data.errors[0].title;
        }
        toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
    }

};
let intervalId
onMounted(() => {
    getJobList();

    intervalId = setInterval(() => {
        getJobList();
    }, 2000);

})

onUnmounted(() => clearInterval(intervalId))

const lazyOptions = reactive({
    error: 'https://api.dudeisland.eu/images/notfound.jpg',
    lifecycle: {
        loading: (el) => {
            //    console.log('image loading', el)
        },
        error: (el) => {
            //     console.log('image error', el)
        },
        loaded: (el) => {
            //     console.log('image loaded', el)
        }
    }
});

const router = useRouter();

const dataviewValue = ref(null);
const total = ref(null);
const layout = ref('grid');
const query = ref(null);
const sortKey = ref(null);
const store = useStore();
const menuRefs = ref([]);
const sortOrder = ref('-updated_at');
const sortField = ref(null);
const generatorFilterKey = ref('');
const generatorFilter = ref('');
const queryFilterKey = ref('');
const queryFilter = ref('');

const statusFilterKey = ref('');
const statusFilter = ref('');

const sortOptions = ref([
    { label: 'From latest to oldest', value: '-updated_at' },
    { label: 'From oldest to latest', value: 'updated_at' }
]);
const generatorOptions = ref([
    { label: 'All', value: '' },
    { label: 'Text to image', value: 'deforum' }

]);
const statusOptions = ref([
    { label: 'All', value: false },
    { label: 'Finished', value: 'finished' },
    { label: 'In the works', value: 'intheworks'},
    { label: 'Failed', value: 'error'}

]);

sortField.value = '-updated_at';

const getFormattedDuration = (seconds) => {
    if (!seconds) {
        seconds = 1;
    }
    let momentDuration = moment.duration(seconds, 'seconds');
    return moment.utc(momentDuration.as('milliseconds')).format('HH:mm:ss');
};
const getHumanizedDuration = (seconds) => {

    if (!seconds) {
        seconds = 1;
    }
    return moment.duration({ "seconds": seconds }).humanize();
};

const getJobList = () => {
    let params = {
        include: "modelfile,user",
        ...(sortField.value ? { sort: sortField.value } : {}),
    };
    store.dispatch("videojobs/list", params).then(() => {
        if (generatorFilter.value && generatorFilter.value != "" || statusFilter.value != "" || queryFilter.value != "") {
            dataviewValue.value = store.getters["videojobs/filterList"](queryFilter.value, statusFilter.value, generatorFilter.value);

        } else {
        dataviewValue.value = store.getters["videojobs/listWithoutPending"]();
        }
        total.total = store.getters["videojobs/listTotal"];
    });
};

function addInputRef(el, id) {
    var elementId = "menu-" + id;
    menuRefs[elementId] = el;
    return elementId;
}

const toggleMenu = (id, event) => {
    var refitem = "menu-" + id;
    var refmenu = menuRefs[refitem];
    if (refmenu) refmenu.toggle(event);
    event.stopPropagation();
    return false;
};

const mapStates = () => {
    const store = useStore();
    return Object.fromEntries(
        Object.keys(store.state.videojobs).map(
            key => [key, computed(() => store.videojobs.getters[key])]
        )
    )

}
const mapGetters = () => {
    const store = useStore();
    return Object.fromEntries(

        Object.keys(store.getters['videojobs']).map(
            key => [key, computed(() => store.getters.videojobs[key])]
        )
    )
}
const menuClick = (id, type="vid2vid", event) => {
    router.push(`/edit/${type}/${id}`);
}

const getMenu = (id, type, status) => {
    return [
        {
            label: 'Delete',
            icon: 'pi pi-times',
            command: (target) => {

                confirmPopup.require({
                    message: 'Are you sure you want to bin it?',
                    icon: 'pi pi-exclamation-triangle',
                    target: target.originalEvent.target,
                    accept: () => {

                        destroy(id);
                    },
                    reject: () => {
                        toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Deleting was cancelled', life: 3000 });
                    }
                });
            }
        },

        {
            label: 'Download',
            disabled: status !== 'finished',

            icon: 'pi pi-download',
            command: (target) => {

                download(id);

            }
        }
    ]
};

const onSortChange = (event) => {
    const value = event.value.value;
    const sortValue = event.value;

    if (value.indexOf('!') === 0) {
        sortOrder.value = -1;
        sortField.value = value.substring(1, value.length);
        sortKey.value = sortValue;
    } else {
        sortOrder.value = 1;
        sortField.value = value;
        sortKey.value = sortValue;
    }
};


const onQueryFilterChange = (event) => {
    const value = event.target.value;
    queryFilterKey.value = event.target.value;
    queryFilter.value = value;
    dataviewValue.value = store.getters["videojobs/filterList"](queryFilter.value, statusFilter.value, generatorFilter.value);

};

const onGeneratorFilterChange = (event) => {
    const value = event.value.value;
    generatorFilterKey.value = event.value;
    generatorFilter.value = value;
    dataviewValue.value = store.getters["videojobs/filterList"](queryFilter.value, statusFilter.value, generatorFilter.value);


};

const onStatusFilterChange = (event) => {
    const value = event.value.value;
    statusFilter.value = value;
    statusFilterKey.value = event.value;
    dataviewValue.value = store.getters["videojobs/filterList"](queryFilter.value, statusFilter.value, generatorFilter.value);

};
</script>

<template>
    <div class="floating-button"><a href="/upload/">
            <Button icon="pi pi-plus" label="Create!"
                class="p-button p-component bg-gradient-vibrant p-button-lg p-button-rounded p-button-success"></Button>
        </a>
    </div>
    <div class="library">
        <h3>My Library</h3>
        <DataView :value="dataviewValue" :layout="layout" :paginator="layout =='grid'" :rows="12" :sortOrder="sortOrder"
            :sortField="sortField" :statusFilter="statusFilter" :generatorFilter="generatorFilter">
            <template #header>
                <Menubar :model="menuOptions">
                    <template #start>
                      <div class="menu-list">
                        <div>
                          <Dropdown v-model="sortKey" :options="sortOptions" optionLabel="label"
                            placeholder="Sort By Activity" @change="onSortChange($event)" />
                        </div>
                        <div>
                          <Dropdown v-model="generatorFilterKey" :options="generatorOptions" optionLabel="label"
                            placeholder="Show all generators" @change="onGeneratorFilterChange($event)" />
                        </div>
                        <div>
                          <Dropdown v-model="statusFilterKey" :options="statusOptions" optionLabel="label"
                            placeholder="All states" @change="onStatusFilterChange($event)" />
                        </div>
                      </div>
                    </template>
                    <template #end>
                      <div class="menu-list">
                        <div>
                          <DataViewLayoutOptions v-model="layout" />
                        </div>
                        <span class="p-input-icon-left">
                          <i class="pi pi-search" />
                          <InputText type="text" v-model="queryFilterKey" @change="onQueryFilterChange($event)" :placeholder="queryFilter.value ? queryFilter.value : 'Search ...'" placeholder="Search" />
                        </span>
                      </div>
                    </template>

                </Menubar>

            </template>


            <template #grid="slotProps">
                <div class="grid-item-container col-12 md:col-6 xl:col-3">
                    <div  class="grid-item m-1">
                        <div :class="{ 'has-preview': slotProps.data.preview_animation && (slotProps.data.preview_animation.includes('png') ||  slotProps.data.preview_animation.includes('gif')) }"
                            class="card-thumbnail-container position-relative mb-2">
                            <div class="card-thumbnail-info flex align-items-end justify-content-between m-2">
                                <div class="flex align-items-center">
                                    <i class="pi pi-clock mr-2"></i>
                                    <span class="text-sm">{{
                                        getFormattedDuration(slotProps.data.length) }}</span>
                                </div>
                                <div class="flex align-items-end justify-content-center flex-column flex-fill">
                                    <span :class="'product-badge status-' + slotProps.data.status.toLowerCase()">{{
                                        slotProps.data.status }}</span>
                                </div>
                            </div>

                            <span class="card-thumbnail-image">
                                
                                <Image crossorigin="anonymous" v-if="slotProps.data.id != 1171" class="top"
                                    v-lazy="{ src: slotProps.data.original_url || 'https://api.vimage./images/notfound.jpg', lifecycle: lazyOptions.lifecycle }"
                                    width="100" preview />
                                <img  crossorigin="anonymous" class="top" v-if="slotProps.data.id == 1171" lazy="loading" width="100" />

                                <Image crossorigin="anonymous" class="bottom"
                                        v-if="slotProps.data.id != 1171 && slotProps.data.preview_animation && (slotProps.data.preview_animation.includes('png') ||  slotProps.data.preview_animation.includes('gif'))"
                                    :src="slotProps.data.preview_animation ? slotProps.data.preview_animation : slotProps.data.preview_img" width="100" preview />
                            </span>

                            <span class="card-thumbnail-image-fill">
                                <img  crossorigin="anonymous" v-lazy="{ src: slotProps.data.preview_img ? slotProps.data.preview_img :  slotProps.data.thumbnail || 'https://api.dudeisland.eu/images/notfound.jpg', lifecycle: lazyOptions.lifecycle }"
                                    width="100" preview />
                            </span>

                        </div>
                        <div class="card-body">

                            <ProgressBar style="width: 100%; height: 12px;" v-if="slotProps.data.status == 'processing'"
                                :value="slotProps.data.progress" class="text-xs overlay-progress-bar mb-1"></ProgressBar>
                            <div class="flex align-items-start justify-content-between">
                                <div>
                                    <div class="text-xs text-light mb-1">
                                        <i class="text-xs pi pi-history mr-1"></i>
                                        <span>{{ moment(slotProps.data.updated_at).fromNow()
                                        }}</span>
                                    </div>
                                    <div class="text-xs text-light mb-1">{{ slotProps.data.duration }}</div>
                                </div>
                                <div class="flex align-items-center justify-content-between">

                                    <Menu :popup="true" :model="getMenu(slotProps.data.id,  slotProps.data.generator, slotProps.data.status)"
                                        :ref="(el) => { return addInputRef(el, slotProps.data.id); }" />

                                    <Button icon="pi pi-bars" @click.prevent="toggleMenu(slotProps.data.id, $event,)"
                                        class="p-button-icon-only p-button-rounded p-button-secondary p-button-text p-button-sm"></Button>


                                    <ConfirmPopup></ConfirmPopup>
                                    <Toast />

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </DataView>
        <ListView v-if="layout !='grid'" :jobs="dataviewValue" :queryFilter="queryFilter" :statusFilter="statusFilter" :generatorFilter="generatorFilter"></ListView>
    </div>
</template>


<style scoped lang="scss">@import '@/assets/vimage.scss';</style>
<style scoped lang="scss">
  img[lazy=loading] {
  min-width: 100%;
  min-height: 100%;
  background-color: #ededed;
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0) 40%,
    rgba(255, 255, 255, .2) 50%,
    rgba(255, 255, 255, 0) 60%
  ) transparent;
  background-size: 200% 100%;
  background-position-x: 180%;
  animation: 1.5s loading ease-in-out infinite;
  }
  img[lazy=error] {
    opacity:0.4;
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
    transform: scale(1);
    animation: pulse 2s infinite;
  }


span::before>img[lazy=error] {
    font-weight: bold;
    color: navy;
    content: "Reference ";
}

span>img[lazy=error] {
    opacity: 1.0;
    background-image: url(https://api.dudeisland.eu/images/notfound.jpg);
    content: "Error, add cool style to dis";
    color: red;
    min-height: 150px;
    min-width: 300px;
    content: "ERROR";
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
	animation: pulse 0.5s infinite;
  }

  img[lazy=loaded] {
  }
.library {
  :deep .p-dataview-header {
    border-width: 0;
    border-radius: 0;
    padding: 0;
    position: sticky;
    top: 5rem;
    z-index: 2;
    background: rgb(18 18 18 / 20%);
    backdrop-filter: blur(30px);
  }

  :deep .p-dataview-content {
    border: none;
    background: transparent;
    border-radius: 0;
  }

  :deep .p-paginator-bottom {
    margin-bottom: 5rem;
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep .p-menubar {
    background: transparent;
  }
}

.menu-list {
  display: flex;
  flex-flow: row;
  column-gap: 0.5rem;
}

.grid-item {
  border-radius: 6px;
  padding: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.2s linear, border-color 0.2s linear;

  &:hover {
    border-color: var(--surface-border);
    background-color: var(--surface-card);
  }
}
.card-thumbnail-container {
    position: relative;
    height: 100%;
    width: auto;
    margin-left: auto;
    margin-right: auto;
}

.card-thumbnail-container.has-preview .card-thumbnail-image img {
  position:absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  margin: auto;
  width: auto;
  height: 100%;
  -webkit-transition: opacity 1s linear;
  -moz-transition: opacity 1s linear;
  transition: opacity 1s linear;
}

.card-thumbnail-container.has-preview img.bottom {
    opacity: 0.0;
}

.card-thumbnail-container.has-preview img.bottom:hover {
    opacity: 1.0;
}

.card-thumbnail-container.has-preview img.top:hover {
    opacity: 0;
}

@keyframes loading {
  to {
    background-position-x: -20%;
  }
}

@media (max-width: 860px) {
  .library {
    :deep .p-menubar {
      flex-flow: column-reverse;
      row-gap: 0.5rem;
      align-items: flex-start;
    }
  }
}

</style>
