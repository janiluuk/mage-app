<script setup>
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { mapState } from 'vuex';
import VideoLibraryToolbar from '@/components/library/VideoLibraryToolbar.vue';


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
    console.log(store.getters['videojobs/listWithoutPending']());

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
const generatorFilter = ref(null);
const queryFilter = ref('');
const statusFilter = ref('');

const sortOptions = ref([
    { label: 'From latest to oldest', value: '-updated_at' },
    { label: 'From oldest to latest', value: 'updated_at' }
]);
const generatorOptions = ref([
    { label: 'All', value: '' },
    { label: 'Video to video', value: 'vid2vid' },
    { label: 'Text to image', value: 'deforum' }

]);
const statusOptions = ref([
    { label: 'All', value: false },
    { label: 'Finished', value: ['finished'] },
    { label: 'In the works', value: ['preview', 'processing','cancelled', 'approved']  },
    { label: 'Failed', value: ['error'] }

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
        dataviewValue.value = store.getters["videojobs/listWithoutPending"]();
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
const menuClick = (id, event) => {
    router.push(`/edit/vid2vid/${id}`);
}

const getMenu = (id) => {
    return [
        {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: (target) => {
                router.push(`/edit/vid2vid/${id}`);
            }
        },
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
            label: 'Use as template',
            icon: 'pi pi-copy'
        },
        {
            label: 'Download',
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
</script>

<template>
    <div class="floating-button"><a href="/upload/">
            <Button icon="pi pi-upload" label="Video"
                class="p-button p-component bg-gradient-vibrant p-button-lg p-button-rounded p-button-success"></Button>
        </a>
    </div>
    <div class="library">
        <h3>My Library</h3>
        <DataView :value="dataviewValue" :layout="layout" :paginator="true" :rows="12" :sortOrder="sortOrder"
            :sortField="sortField" :statusFilter="statusFilter" :generatorFilter="generatorFilter">
            <template #header>
                <div class="grid grid-nogutter">
                    <div class="col-6 text-left">
                        <Dropdown v-model="sortKey" :options="sortOptions" optionLabel="label"
                            placeholder="Sort By Activity" @change="onSortChange($event)" />
                    </div>
                    <div class="col-6 text-left">
                        <Dropdown v-model="generatorFilter" :options="generatorOptions" optionLabel="label"
                            placeholder="Show all generators" @change="onGeneratorFilterChange($event)" />
                    </div>
                    <div class="col-6 text-left">
                        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label"
                            placeholder="All states" @change="onStatusFilterChange($event)" />
                    </div>
                    <div class="col-6 text-right">
                        <DataViewLayoutOptions v-model="layout" />
                    </div>
                </div>
                <VideoLibraryToolbar></VideoLibraryToolbar>

            </template>
            <template #list="slotProps">
                <div class="col-12">
                    <div class="flex flex-column md:flex-row align-items-center p-2 w-full">
                        <div class="flex mjustify-content-left">

                            <Image :src="slotProps.data.preview_animation" :alt="slotProps.data.preview_animation"
                                class="my-4 md:my-0 shadow-2 mr-5" width="250" preview />
                        </div>
                        <div class="flex-1 text-center md:text-left">
                            <div class="font-bold text-2xl">{{ slotProps.data.prompt }}</div>
                            <div class="mb-3">{{ slotProps.data.modelfile.name }}</div>
                            <div class="flex align-items-right">
                                <span :class="'product-badge status-' + slotProps.data.status.toLowerCase()">{{
                                    slotProps.data.status }}</span>
                                <ProgressBar v-if="slotProps.data.status == 'processing'" :value="slotProps.data.progress"
                                    class="text-xs overlay-progress-bar"></ProgressBar>

                            </div>
                        </div>

                        <div
                            class="flex flex-row md:flex-column justify-content-between w-full md:w-auto align-items-left md:align-items-beginning mt-5 md:mt-0">
                            <span class="text-2xl font-semibold mb-2 align-self-left md:align-left">
                                <i class="pi pi-clock"></i>
                                {{ getFormattedDuration(slotProps.data.length) }}</span>
                            {{ addInputRef(slotProps.data.id) }}
                            <SplitButton v-if="slotProps.data.status == 'finished'"
                                :label="slotProps.data.status == 'finished' ? 'View' : 'Nope'" icon="pi pi-search"
                                :model="getMenu(slotProps.data.id)" @click="menuClick(slotProps.data.id)"
                                class="p-button-primary"></SplitButton>
                            <SplitButton v-if="slotProps.data.status == 'error'" label="Edit" icon="pi pi-sync"
                                :model="getMenu(slotProps.data.id)" @click="menuClick(slotProps.data.id)"
                                class="p-button-danger">
                            </SplitButton>
                            <SplitButton v-if="slotProps.data.status == 'preview'" label="Edit" icon="pi pi-save"
                                :model="getMenu(slotProps.data.id)" @click="menuClick(slotProps.data.id)"
                                class="p-button-warning">
                            </SplitButton>
                            <SplitButton v-if="slotProps.data.status == 'pending'" label="Edit" icon="pi pi-pen"
                                :model="getMenu(slotProps.data.id, this.$router)" @click="menuClick(slotProps.data.id)"
                                class="p-button-info"></SplitButton>
                            <SplitButton v-if="slotProps.data.status == 'processing' || slotProps.data.status == 'approved'"
                                label="Cancel" icon="pi pi-times" :model="getMenu(slotProps.data.id)"
                                @click="menuClick(slotProps.data.id)" class="p-button-danger p-button-sm"></SplitButton>

                            <ConfirmPopup></ConfirmPopup>
                            <Toast />
                        </div>
                    </div>
                </div>
            </template>

            <template #grid="slotProps">
                <div class="grid-item-container col-12 md:col-6 xl:col-3">
                    <div @click="menuClick(slotProps.data.id)" class="grid-item m-1">
                        <div :class="{ 'has-preview': slotProps.data.preview_animation && slotProps.data.preview_animation.includes('png') }"
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
                                <img crossorigin="anonymous" v-if="slotProps.data.id != 1171" class="top"
                                    v-lazy="{ src: slotProps.data.preview_img ? slotProps.data.preview_img : 'https://api.dudeisland.eu/images/notfound.jpg', lifecycle: lazyOptions.lifecycle }"
                                    width="100" preview />
                                <img  crossorigin="anonymous" class="top" v-if="slotProps.data.id == 1171" lazy="loading" width="100" />

                                <img crossorigin="anonymous" class="bottom"
                                        v-if="slotProps.data.id != 1171 && slotProps.data.preview_animation && slotProps.data.preview_animation.includes('png')"
                                    v-lazy="{ src: slotProps.data.preview_animation ? slotProps.data.preview_animation : slotProps.data.preview_img, lifecycle: lazyOptions.lifecycle }"
                                    width="100" />
                            </span>

                            <span class="card-thumbnail-image-fill">
                                <img  crossorigin="anonymous" v-lazy="{ src: slotProps.data.preview_img ? slotProps.data.preview_img : 'https://api.dudeisland.eu/images/notfound.jpg', lifecycle: lazyOptions.lifecycle }"
                                    width="100" preview />
                            </span>

                        </div>
                        <div class="card-body">

                            <ProgressBar style="width: 100%; height: 12px;" v-if="slotProps.data.status == 'processing'"
                                :value="slotProps.data.progress" class="text-xs overlay-progress-bar mb-1"></ProgressBar>
                            <div class="flex align-items-start justify-content-between">
                                <div>
                                    <div class="text-md font-semibold mb-1">{{ slotProps.data.prompt }}</div>
                                    <div class="text-sm text-light mb-1">
                                        <i class="pi pi-history mr-1"></i>
                                        <span>{{ moment(slotProps.data.updated_at).fromNow()
                                        }}</span>
                                    </div>
                                    <div class="text-xs text-light mb-1">{{ slotProps.data.duration }}</div>
                                </div>
                                <div class="flex align-items-center justify-content-between">

                                    <Menu :popup="true" :model="getMenu(slotProps.data.id)"
                                        :ref="(el) => { return addInputRef(el, slotProps.data.id); }" />

                                    <Button icon="pi pi-bars" @click.prevent="toggleMenu(slotProps.data.id, $event)"
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

</style>
