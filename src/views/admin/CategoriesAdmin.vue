<script setup>
/**
 * Categories administration page.
 * Uses the AdminCrudView component for consistent admin UI.
 */
import AdminCrudView from '@/components/admin/AdminCrudView.vue';

const categoryColumns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'description', header: 'Description', sortable: false },
  { field: 'created_at', header: 'Created At', sortable: true },
];

const emptyCategory = () => ({
  name: '',
  description: '',
  type: 'categories',
});

const validateCategory = (category) => {
  if (!category.name || !category.name.trim()) {
    return 'Category name is required';
  }
  return true;
};
</script>

<template>
  <AdminCrudView
    store-module="categories"
    resource-name="category"
    resource-label="Category"
    :columns="categoryColumns"
    :empty-resource="emptyCategory"
    :validate="validateCategory"
    dialog-width="500px"
  >
    <template #form="{ item, submitted }">
      <div class="field">
        <label for="category-name">Name</label>
        <InputText
          id="category-name"
          v-model.trim="item.name"
          required
          autofocus
          :class="{ 'p-invalid': submitted && !item.name }"
        />
        <small v-if="submitted && !item.name" class="p-error">
          Name is required.
        </small>
      </div>
      <div class="field">
        <label for="category-description">Description</label>
        <Textarea
          id="category-description"
          v-model="item.description"
          rows="3"
          cols="20"
        />
      </div>
    </template>
  </AdminCrudView>
</template>
