<template>
    <DataTable :value="jobs" :rows="5" :paginator="true" responsiveLayout="scroll">
        <Column style="width: 15%">
            <template #header> Image </template>
            <template #body="slotProps">
                <img crossorigin="anonymous" :src="slotProps.data.preview_img" :alt="slotProps.preview_img" width="50"
                    class="shadow-2" />
            </template>
        </Column>
        <Column field="generator" header="Type" :sortable="true" style="width: 35%">
            <template #body="slotProps">
                {{ slotProps.data.generator }}
            </template>

        </Column>
        <Column field="updated_at" header="Type" :sortable="true" style="width: 35%">
            <template #body="slotProps">
                {{ getUpdated(slotProps.data.updated_at) }}
            </template>
        </Column>

        <Column field="status" header="Type" :sortable="true" style="width: 15%">
            <template #body="slotProps">
                {{ slotProps.data.status }}
            </template>

        </Column>


        <Column field="prompt" header="Name" :sortable="true" style="max-width: 25%"></Column>
        <Column field="slotProps.data.progress" header="Progress" :sortable="true" style="width: 35%">

            <template #body="slotProps">
                <ProgressBar style="width: 100%; height: 12px;"
                    v-if="slotProps.data.status == 'finished' || slotProps.data.status == 'processing'"
                    :value="slotProps.data.progress" class="text-xs overlay-progress-bar mb-1"></ProgressBar>
            </template>
        </Column>
        <Column style="width: 15%">
            <template #header> View </template>
            <template #body="slotProps">
                <Button icon="pi pi-search" type="button" class="p-button-text"
                    @click="goToEdit(slotProps.data.id, slotProps.data.generator)"></Button>
            </template>
        </Column>
    </DataTable>
</template>
<script>
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';
export default {
    name: 'ListView',
    props: {
        queryFilter: { type: Object, default: false },
        generatorFilter: { type: Object, default: false },
        statusFilter: { type: Object, default: false },
        jobs: { type: Object, default: [] },

    },

    beforeUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = false;
        }
    },
    getters: {


    },
    methods: {
        ...mapActions({
            listJobs: 'videojobs/list',
            cancel: 'videojobs/cancel',
        }),
        getUpdated(item) {
            return moment(item).fromNow();
        },
        // Normalize generator type to ensure it matches router routes
        normalizeGeneratorType(generator) {
            if (!generator) return 'vid2vid';
            const normalized = generator.toLowerCase();
            // Map common generator types to router routes
            if (normalized === 'deforum' || normalized.includes('deforum')) {
                return 'deforum';
            }
            // Default to vid2vid for any other type or if it contains vid2vid
            return 'vid2vid';
        },
        goToEdit(id, generator) {
            const normalizedType = this.normalizeGeneratorType(generator);
            this.$router.push(`/edit/${normalizedType}/${id}`);
        }
    }
}

</script>