<template>
  <div>
    <div class="mb-3">
      <InputText 
        v-model="term"
        placeholder="Search filters"
        class="w-full"
      >
        <template #prefix>
          <i class="pi pi-search" />
        </template>
      </InputText>
    </div>
    
    <div class="filter-list" style="max-height: 300px; overflow-y: auto;">
      <div 
        v-for="filter in filteredFilters" 
        :key="filter.name"
        class="filter-item p-3 mb-2 border-round surface-border border-1 flex align-items-center justify-content-between"
      >
        <div class="flex-1">
          <p class="font-semibold mb-1">{{ filter.name }}</p>
          <p class="text-sm text-color-secondary">{{ filter.description }}</p>
        </div>
        <div class="flex gap-2">
          <Button
            :title="`Show information about ${filter.name}`"
            icon="pi pi-info-circle"
            severity="secondary"
            text
            @click="openFilterInfo(filter)"
          />
          <Button
            title="Add filter"
            icon="pi pi-plus"
            @click="selectFilter(filter)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

export default {
  name: 'AdvancedExportOptions',
  components: {
    InputText,
    Button,
  },
  setup() {
    const store = useStore();
    const filters = ref([]);
    const term = ref('');
    
    const filteredFilters = computed(() => {
      if (!term.value || term.value === '') {
        return filters.value;
      }
      const searchTerm = term.value.toLowerCase();
      return filters.value
        .filter(f => 
          f.name.toLowerCase().includes(searchTerm) || 
          f.description.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => {
          // Prioritize matches in name
          const aNameMatch = a.name.toLowerCase().includes(searchTerm);
          const bNameMatch = b.name.toLowerCase().includes(searchTerm);
          return bNameMatch - aNameMatch;
        });
    });
    
    const getFilters = async () => {
      // TODO: Implement filter fetching from store or API
      // For now, return empty array
      return [];
    };
    
    const openFilterInfo = (filter) => {
      window.open(`https://ffmpeg.org/ffmpeg-filters.html#${filter.name}`, '_blank');
    };
    
    const selectFilter = async (filter) => {
      // TODO: Implement filter selection with prompt
      // For now, just add the filter
      store.dispatch('videoeditor/addExportFilter', {
        ...filter,
        options: filter.options || '',
      });
    };
    
    onMounted(async () => {
      filters.value = await getFilters();
    });
    
    return {
      filters,
      term,
      filteredFilters,
      openFilterInfo,
      selectFilter,
    };
  },
};
</script>

<style scoped>
.filter-list {
  max-height: 300px;
  overflow-y: auto;
}

.filter-item {
  transition: background-color 0.2s;
}

.filter-item:hover {
  background-color: var(--surface-hover);
}
</style>
