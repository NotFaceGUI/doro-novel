<script setup lang="ts">
import ActionItemTool from './ActionItemTool.vue';

defineProps<{
    content: string,
    title: string,
    id: number,
    isCollapsed: boolean | undefined
}>();
</script>

<template>
    <div class="action-item-head" :class="{ 'collapsed': isCollapsed }">
        <span>
            {{ content }}
            <span class="id">id:{{ id }}</span>
        </span>

        <ActionItemTool :title="title" :id="id" ></ActionItemTool>
    </div>
</template>

<style lang="css" scoped>
.action-item-head {
    padding-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px dashed #88888855;
}

.action-item-head.collapsed {
    border-bottom: none;
    padding-bottom: 0 !important;
    margin-bottom: -5px !important;
}

.id {
    font-size: 10px !important;
    color: #888888;
}
</style>