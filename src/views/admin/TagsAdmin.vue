<script setup>
/**
 * Tags administration page.
 * Replaces the old 3-file TagManagement/ directory (AddTagPage, EditTagPage, ListTagPage)
 * with a single view using the AdminCrudView component.
 */
import AdminCrudView from '@/components/admin/AdminCrudView.vue';

const tagColumns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'created_at', header: 'Created At', sortable: true },
  { field: 'updated_at', header: 'Updated At', sortable: true },
];

const emptyTag = () => ({
  name: '',
  type: 'tags',
});

const validateTag = (tag) => {
  if (!tag.name || !tag.name.trim()) {
    return 'Tag name is required';
  }
  return true;
};
</script>

<template>
  <AdminCrudView
    store-module="tags"
    resource-name="tag"
    resource-label="Tag"
    :columns="tagColumns"
    :empty-resource="emptyTag"
    :validate="validateTag"
    dialog-width="400px"
  >
    <template #form="{ item, submitted }">
      <div class="field">
        <label for="tag-name">Name</label>
        <InputText
          id="tag-name"
          v-model.trim="item.name"
          required
          autofocus
          :class="{ 'p-invalid': submitted && !item.name }"
        />
        <small v-if="submitted && !item.name" class="p-error">
          Name is required.
        </small>
      </div>
    </template>
  </AdminCrudView>
</template>
