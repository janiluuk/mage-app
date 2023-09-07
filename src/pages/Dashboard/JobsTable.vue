<template>
<div class="card">
                <h5>Recent Projects</h5>
                <DataTable :value="jobs" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column style="width: 15%">
                        <template #header> Image </template>
                        <template #body="slotProps">
                            <img  crossorigin="anonymous" :src="slotProps.data.preview_img" :alt="slotProps.preview_img" width="50" class="shadow-2" />
                        </template>
                    </Column>
                    <Column field="generator" header="Type" :sortable="true" style="width: 35%">
                        <template #body="slotProps">
                            Img2Img
                        </template>

                    </Column>

                    <Column field="original_filename" header="Name" :sortable="true" style="width: 35%"></Column>
                    <Column field="slotProps.data.progress" header="Progress" :sortable="true" style="width: 35%">
                       
                        <template #body="slotProps">
                            <ProgressBar style="width: 100%; height: 12px;" v-if="slotProps.data.status == 'finished' || slotProps.data.status == 'processing'" :value="slotProps.data.progress" class="text-xs overlay-progress-bar mb-1"></ProgressBar>
                        </template>
                    </Column>
                    <Column style="width: 15%">
                        <template #header> View </template>
                        <template #body ="slotProps">
                            <Button icon="pi pi-search" type="button" class="p-button-text" @click="$router.push('/edit/'+slotProps.data.id);"></Button>
                        </template>
                    </Column>
                </DataTable>
            </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'RecentJobs',
    beforeUnmount() {
        if (this.interval) {
        clearInterval(this.interval);
        this.interval = false;
        }
    },
    async created() {
        const jobs = await this.listJobs();
        this.jobs = this.getJobs();
        

    },
    data() {
        return {
        jobs: []
        }
    },
    computed: {
        ...mapGetters('videojobs', {
        getJobs: 'list',
        fetchStatus: 'progress'
        })
    },
   methods: {
   ...mapActions({
      listJobs: 'videojobs/list',
      cancel: 'videojobs/cancel',
    }),
    }
}

</script>