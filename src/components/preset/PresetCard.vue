<template>
  <Card class="preset-card" :class="{ 'compact': compact }">
    <template #header v-if="!compact && preset.thumbnail">
      <img :src="preset.thumbnail" :alt="preset.name" class="preset-thumbnail" />
    </template>
    <template #title>
      <div class="flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <div class="preset-name">{{ preset.name }}</div>
          <div v-if="preset.isSystem" class="mt-1">
            <Tag value="SYSTEM" severity="info" class="text-xs" />
          </div>
        </div>
        <Button
          icon="pi pi-ellipsis-v"
          class="p-button-rounded p-button-text p-button-sm"
          @click="toggleMenu"
          aria-haspopup="true"
          :aria-controls="`preset-menu-${preset.id}`"
        />
      </div>
    </template>
    <template #subtitle v-if="preset.category">
      <Tag :value="formatCategory(preset.category)" class="mt-1" />
    </template>
    <template #content>
      <div v-if="!compact && preset.description" class="preset-description mb-3">
        {{ preset.description }}
      </div>
      
      <div class="flex flex-wrap gap-1 mb-3" v-if="preset.tags && preset.tags.length > 0">
        <Chip v-for="tag in preset.tags" :key="tag" :label="tag" class="text-xs" />
      </div>

      <div class="preset-meta text-sm text-muted">
        <div v-if="preset.lastUsed" class="mb-1">
          <i class="pi pi-clock mr-1"></i>
          Last used: {{ formatDate(preset.lastUsed) }}
        </div>
        <div v-if="preset.useCount > 0">
          <i class="pi pi-chart-bar mr-1"></i>
          Used {{ preset.useCount }} time(s)
        </div>
      </div>

      <div class="mt-3">
        <Button
          label="Use Preset"
          icon="pi pi-check"
          class="w-full p-button-sm"
          @click="$emit('select', preset)"
        />
      </div>
    </template>
  </Card>

  <Menu
    :ref="`menu-${preset.id}`"
    :id="`preset-menu-${preset.id}`"
    :model="menuItems"
    :popup="true"
  />
</template>

<script>
import { ref, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Chip from 'primevue/chip';
import Menu from 'primevue/menu';

export default {
  name: 'PresetCard',
  components: {
    Card,
    Button,
    Tag,
    Chip,
    Menu
  },
  props: {
    preset: {
      type: Object,
      required: true
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select', 'edit', 'duplicate', 'delete'],
  setup(props, { emit }) {
    const confirm = useConfirm();
    const menuRef = ref();

    const menuItems = computed(() => {
      const items = [
        {
          label: 'Use Preset',
          icon: 'pi pi-check',
          command: () => emit('select', props.preset)
        },
        {
          label: 'Duplicate',
          icon: 'pi pi-copy',
          command: () => emit('duplicate', props.preset)
        }
      ];

      if (!props.preset.isSystem) {
        items.push(
          {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => emit('edit', props.preset)
          },
          {
            separator: true
          },
          {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => confirmDelete()
          }
        );
      }

      return items;
    });

    const toggleMenu = (event) => {
      const menu = menuRef.value || event.currentTarget.parentElement.querySelector(`#preset-menu-${props.preset.id}`);
      if (menu && menu.$el) {
        menu.toggle(event);
      }
    };

    const formatCategory = (category) => {
      return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour(s) ago`;
      if (diffDays < 7) return `${diffDays} day(s) ago`;
      return date.toLocaleDateString();
    };

    const confirmDelete = () => {
      confirm.require({
        message: `Delete preset "${props.preset.name}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: () => {
          emit('delete', props.preset);
        }
      });
    };

    return {
      menuRef,
      menuItems,
      toggleMenu,
      formatCategory,
      formatDate
    };
  }
};
</script>

<style scoped>
.preset-card {
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preset-card.compact {
  margin-bottom: 0;
}

.preset-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.preset-name {
  font-size: 1.1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-description {
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.preset-meta {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.75rem;
}
</style>
