import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { FilterMatchMode } from 'primevue/api';

/**
 * Composable that provides standard CRUD state and operations for admin views.
 *
 * Extracts the repeating pattern found in Crud.vue, TagManagement, and other
 * admin views into a single reusable hook.
 *
 * @param {Object} options
 * @param {string} options.storeModule - Vuex store module name, e.g. 'tags', 'categories'
 * @param {string} options.resourceName - Singular resource name, e.g. 'tag', 'category'
 * @param {string} [options.resourceLabel] - Human label, e.g. 'Tag', 'Category' (auto-capitalized from resourceName)
 * @param {Object} [options.listParams] - Extra params passed to store list dispatch
 * @param {Function} [options.emptyResource] - Factory returning a blank resource for "New" dialogs
 * @param {Function} [options.validate] - Optional validation function (receives resource, returns true/string)
 */
export function useAdminCrud(options) {
  const {
    storeModule,
    resourceName,
    resourceLabel,
    listParams = {},
    emptyResource = () => ({}),
    validate,
  } = options;

  const label = resourceLabel || resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

  const store = useStore();
  const toast = useToast();
  const confirm = useConfirm();

  // ─── State ──────────────────────────────────────────────
  const items = ref([]);
  const totalItems = ref(0);
  const loading = ref(false);
  const currentItem = ref({});
  const selectedItems = ref([]);
  const submitted = ref(false);

  // Dialog visibility
  const itemDialog = ref(false);
  const deleteDialog = ref(false);
  const deleteManyDialog = ref(false);

  // Filters
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  // DataTable ref
  const dt = ref(null);

  // ─── Computed ───────────────────────────────────────────
  const isEditing = computed(() => !!currentItem.value?.id);

  // ─── Actions ────────────────────────────────────────────
  async function fetchItems(extraParams = {}) {
    loading.value = true;
    try {
      await store.dispatch(`${storeModule}/list`, { ...listParams, ...extraParams });
      const rawList = store.getters[`${storeModule}/list`];
      items.value = Array.isArray(rawList) ? rawList : [];
      totalItems.value = store.getters[`${storeModule}/listTotal`] || items.value.length;
    } catch (error) {
      console.error(`Failed to fetch ${resourceName} list:`, error);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to load ${label}s`,
        life: 5000,
      });
    } finally {
      loading.value = false;
    }
  }

  function openNew() {
    currentItem.value = emptyResource();
    submitted.value = false;
    itemDialog.value = true;
  }

  function editItem(item) {
    currentItem.value = { ...item };
    submitted.value = false;
    itemDialog.value = true;
  }

  function closeDialog() {
    itemDialog.value = false;
    submitted.value = false;
  }

  async function saveItem() {
    submitted.value = true;

    // Run optional validation
    if (validate) {
      const result = validate(currentItem.value);
      if (result !== true) {
        toast.add({
          severity: 'warn',
          summary: 'Validation',
          detail: typeof result === 'string' ? result : `Please fix validation errors`,
          life: 3000,
        });
        return;
      }
    }

    try {
      if (isEditing.value) {
        await store.dispatch(`${storeModule}/update`, currentItem.value);
        toast.add({
          severity: 'success',
          summary: 'Updated',
          detail: `${label} updated successfully`,
          life: 3000,
        });
      } else {
        await store.dispatch(`${storeModule}/add`, currentItem.value);
        toast.add({
          severity: 'success',
          summary: 'Created',
          detail: `${label} created successfully`,
          life: 3000,
        });
      }

      closeDialog();
      await fetchItems();
    } catch (error) {
      const message =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.message ||
        error?.message ||
        `Failed to save ${label}`;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  }

  function confirmDelete(item) {
    currentItem.value = item;
    deleteDialog.value = true;
  }

  async function deleteItem() {
    try {
      await store.dispatch(`${storeModule}/destroy`, currentItem.value.id);
      deleteDialog.value = false;
      currentItem.value = {};
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `${label} deleted successfully`,
        life: 3000,
      });
      await fetchItems();
    } catch (error) {
      const message =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.message ||
        `Failed to delete ${label}`;
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000,
      });
    }
  }

  function confirmDeleteMany() {
    deleteManyDialog.value = true;
  }

  async function deleteSelectedItems() {
    try {
      await Promise.all(
        selectedItems.value.map((item) =>
          store.dispatch(`${storeModule}/destroy`, item.id)
        )
      );
      deleteManyDialog.value = false;
      selectedItems.value = [];
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `${label}s deleted successfully`,
        life: 3000,
      });
      await fetchItems();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to delete some ${label}s`,
        life: 5000,
      });
    }
  }

  function exportCSV() {
    dt.value?.exportCSV();
  }

  function initFilters() {
    filters.value = {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    };
  }

  // Auto-fetch on mount
  onMounted(() => {
    initFilters();
    fetchItems();
  });

  return {
    // State
    items,
    totalItems,
    loading,
    currentItem,
    selectedItems,
    submitted,
    filters,
    dt,

    // Dialog visibility
    itemDialog,
    deleteDialog,
    deleteManyDialog,

    // Computed
    isEditing,
    label,

    // Actions
    fetchItems,
    openNew,
    editItem,
    closeDialog,
    saveItem,
    confirmDelete,
    deleteItem,
    confirmDeleteMany,
    deleteSelectedItems,
    exportCSV,
    initFilters,
  };
}
