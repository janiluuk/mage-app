<script setup>
/**
 * Roles administration page.
 * Replaces the misnamed ProductDataTables.vue which was actually a roles management view.
 * Uses the AdminCrudView component for consistent admin UI.
 */
import AdminCrudView from '@/components/admin/AdminCrudView.vue';

const roleColumns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'guard_name', header: 'Guard', sortable: true },
  { field: 'created_at', header: 'Created At', sortable: true },
  { field: 'updated_at', header: 'Updated At', sortable: true },
];

const emptyRole = () => ({
  name: '',
  guard_name: 'api',
  type: 'roles',
});

const validateRole = (role) => {
  if (!role.name || !role.name.trim()) {
    return 'Role name is required';
  }
  return true;
};
</script>

<template>
  <AdminCrudView
    store-module="roles"
    resource-name="role"
    resource-label="Role"
    :columns="roleColumns"
    :empty-resource="emptyRole"
    :validate="validateRole"
    dialog-width="450px"
  >
    <template #form="{ item, submitted }">
      <div class="field">
        <label for="role-name">Name</label>
        <InputText
          id="role-name"
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
        <label for="role-guard">Guard Name</label>
        <Dropdown
          id="role-guard"
          v-model="item.guard_name"
          :options="[
            { label: 'API', value: 'api' },
            { label: 'Web', value: 'web' },
          ]"
          option-label="label"
          option-value="value"
          placeholder="Select a guard"
        />
      </div>
    </template>
  </AdminCrudView>
</template>
