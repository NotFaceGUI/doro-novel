<script setup lang="ts">
import ActionItemTool from './ActionItemTool.vue';

defineProps<{
    content: string,
    title: string,
    id: number
}>()
</script>

<template>
    <div class="action-item-head">
        <span>
            {{ content }}
        </span>
        <ActionItemTool :title="title" :id="id"></ActionItemTool>
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


</style>