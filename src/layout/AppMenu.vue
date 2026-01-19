<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: 'Video Studio',
        items: [
            { label: 'Library', icon: 'pi pi-fw pi-video', to: '/library' },
            { label: 'Browser', icon: 'pi pi-fw pi-th-large', to: '/browser' },
            { label: 'Upload', icon: 'pi pi-fw pi-upload', to: '/upload' },
            { label: 'Jobs', icon: 'pi pi-fw pi-list', to: '/jobs' }
        ]
    },
    {
        label: 'AI Tools',
        items: [
            { label: 'Story Creator', icon: 'pi pi-fw pi-book', to: '/story' },
            // Vid2Vid and Deforum editors are accessed via direct routes (/edit/vid2vid/:id, /edit/deforum/:id)
            // They are not shown in menu as they require a video ID parameter
            { label: 'Soundscape Creator', icon: 'pi pi-fw pi-volume-up', to: '/soundscape' }
        ]
    },
    {
        label: 'Tools',
        items: [
            { label: 'Mage Helper', icon: 'pi pi-fw pi-bolt', to: '/mage' },
            { label: 'Timeline', icon: 'pi pi-fw pi-clock', to: '/timeline' }
        ]
    },
    {
        label: 'Account',
        items: [
            { label: 'Profile', icon: 'pi pi-fw pi-user', to: '/profile' },
            { label: 'Sign Out', icon: 'pi pi-fw pi-sign-out', to: '/signout' }
        ]
    },
    {
        label: 'Developer Tools',
        items: [
            { 
                label: 'UI Components', 
                icon: 'pi pi-fw pi-box',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/uikit/formlayout' },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/uikit/input' },
                    { label: 'Button', icon: 'pi pi-fw pi-mobile', to: '/uikit/button' },
                    { label: 'Table', icon: 'pi pi-fw pi-table', to: '/uikit/table' },
                    { label: 'Charts', icon: 'pi pi-fw pi-chart-bar', to: '/uikit/charts' }
                ]
            },
            { label: 'Documentation', icon: 'pi pi-fw pi-question', to: '/documentation' },
            { label: 'Dev Board', icon: 'pi pi-fw pi-cog', to: '/dev' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>

    </ul>
</template>

<style lang="scss" scoped></style>
