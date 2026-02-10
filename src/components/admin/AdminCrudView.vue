<script setup>
/**
 * AdminCrudView - Reusable admin CRUD view with DataTable.
 *
 * Provides a standard layout for admin pages:
 * - Toolbar with New/Delete/Export buttons
 * - DataTable with global search, pagination, row selection
 * - Create/Edit dialog (form provided via slot)
 * - Delete confirmation dialog
 * - Batch delete confirmation dialog
 * - Toast notifications
 *
 * Usage:
 *   <AdminCrudView
 *     store-module="tags"
 *     resource-name="tag"
 *     :columns="[{ field: 'name', header: 'Name', sortable: true }]"
 *   >
 *     <template #form="{ item, submitted }">
 *       <div class="field">
 *         <label>Name</label>
 *         <InputText v-model="item.name" :class="{ 'p-invalid': submitted && !item.name }" />
 *       </div>
 *     </template>
 *   </AdminCrudView>
 */

import { useAdminCrud } from '@/composables/useAdminCrud';

const props = defineProps({
  /** Vuex store module name, e.g. 'tags' */
  storeModule: { type: String, required: true },
  /** Singular resource name, e.g. 'tag' */
  resourceName: { type: String, required: true },
  /** Human-friendly label, e.g. 'Tag' */
  resourceLabel: { type: String, default: '' },
  /** Column definitions: [{ field, header, sortable, headerStyle }] */
  columns: { type: Array, default: () => [] },
  /** Extra params to pass to the store list action */
  listParams: { type: Object, default: () => ({}) },
  /** Factory function returning a blank resource for "New" dialog */
  emptyResource: { type: Function, default: () => () => ({}) },
  /** Validation function: receives resource, returns true or error string */
  validate: { type: Function, default: null },
  /** Dialog width */
  dialogWidth: { type: String, default: '500px' },
  /** Dialog header for create */
  createHeader: { type: String, default: '' },
  /** Dialog header for edit */
  editHeader: { type: String, default: '' },
  /** Whether to show the selection column */
  selectable: { type: Boolean, default: true },
  /** Whether to show export button */
  exportable: { type: Boolean, default: false },
  /** Rows per page */
  rows: { type: Number, default: 10 },
  /** Rows per page options */
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
});

const crud = useAdminCrud({
  storeModule: props.storeModule,
  resourceName: props.resourceName,
  resourceLabel: props.resourceLabel || undefined,
  listParams: props.listParams,
  emptyResource: props.emptyResource,
  validate: props.validate,
});

const {
  items,
  loading,
  currentItem,
  selectedItems,
  submitted,
  filters,
  dt,
  itemDialog,
  deleteDialog,
  deleteManyDialog,
  isEditing,
  label,
  openNew,
  editItem,
  closeDialog,
  saveItem,
  confirmDelete,
  deleteItem,
  confirmDeleteMany,
  deleteSelectedItems,
  exportCSV,
  fetchItems,
} = crud;

// Expose the crud handle for parent components
defineExpose({ crud, fetchItems });
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar -->
        <Toolbar class="mb-4">
          <template #start>
            <div class="my-2 flex gap-2">
              <Button
                label="New"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openNew"
              />
              <Button
                v-if="selectable"
                label="Delete"
                icon="pi pi-trash"
                class="p-button-danger"
                :disabled="!selectedItems || !selectedItems.length"
                @click="confirmDeleteMany"
              />
              <slot name="toolbar-start" :items="items" :selected="selectedItems" />
            </div>
          </template>
          <template #end>
            <div class="flex gap-2">
              <slot name="toolbar-end" :items="items" />
              <Button
                v-if="exportable"
                label="Export"
                icon="pi pi-upload"
                class="p-button-help"
                @click="exportCSV"
              />
            </div>
          </template>
        </Toolbar>

        <!-- DataTable -->
        <DataTable
          ref="dt"
          :value="items"
          v-model:selection="selectedItems"
          dataKey="id"
          :paginator="true"
          :rows="rows"
          :rowsPerPageOptions="rowsPerPageOptions"
          :filters="filters"
          :loading="loading"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :currentPageReportTemplate="`Showing {first} to {last} of {totalRecords} ${label.toLowerCase()}s`"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Manage {{ label }}s</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Search..."
                />
              </span>
            </div>
          </template>

          <template #empty>
            <div class="text-center py-4">
              <i class="pi pi-inbox text-4xl text-color-secondary mb-2" style="display: block"></i>
              <p class="text-color-secondary">No {{ label.toLowerCase() }}s found.</p>
            </div>
          </template>

          <!-- Selection column -->
          <Column
            v-if="selectable"
            selectionMode="multiple"
            headerStyle="width: 3rem"
          />

          <!-- Dynamic columns -->
          <Column
            v-for="col in columns"
            :key="col.field"
            :field="col.field"
            :header="col.header"
            :sortable="col.sortable !== false"
            :headerStyle="col.headerStyle"
          >
            <template v-if="$slots[`column-${col.field}`]" #body="slotProps">
              <slot
                :name="`column-${col.field}`"
                :data="slotProps.data"
                :field="col.field"
              />
            </template>
          </Column>

          <!-- Extra columns slot -->
          <slot name="columns" :items="items" />

          <!-- Actions column -->
          <Column headerStyle="min-width: 8rem">
            <template #body="slotProps">
              <slot name="row-actions" :data="slotProps.data" :edit="editItem" :remove="confirmDelete">
                <Button
                  icon="pi pi-pencil"
                  class="p-button-rounded p-button-success mr-2"
                  @click="editItem(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-warning"
                  @click="confirmDelete(slotProps.data)"
                />
              </slot>
            </template>
          </Column>
        </DataTable>

        <!-- Create / Edit Dialog -->
        <Dialog
          v-model:visible="itemDialog"
          :style="{ width: dialogWidth }"
          :header="isEditing
            ? (editHeader || `Edit ${label}`)
            : (createHeader || `New ${label}`)"
          :modal="true"
          class="p-fluid"
        >
          <slot
            name="form"
            :item="currentItem"
            :submitted="submitted"
            :is-editing="isEditing"
          />

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-text"
              @click="closeDialog"
            />
            <Button
              label="Save"
              icon="pi pi-check"
              class="p-button-text"
              @click="saveItem"
            />
          </template>
        </Dialog>

        <!-- Single Delete Confirmation -->
        <Dialog
          v-model:visible="deleteDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>
              Are you sure you want to delete
              <b>{{ currentItem?.name || `this ${label.toLowerCase()}` }}</b>?
            </span>
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              class="p-button-text"
              @click="deleteDialog = false"
            />
            <Button
              label="Yes"
              icon="pi pi-check"
              class="p-button-text"
              @click="deleteItem"
            />
          </template>
        </Dialog>

        <!-- Batch Delete Confirmation -->
        <Dialog
          v-model:visible="deleteManyDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex align-items-center justify-content-center">
            <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
            <span>
              Are you sure you want to delete the selected {{ label.toLowerCase() }}s?
            </span>
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              class="p-button-text"
              @click="deleteManyDialog = false"
            />
            <Button
              label="Yes"
              icon="pi pi-check"
              class="p-button-text"
              @click="deleteSelectedItems"
            />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
