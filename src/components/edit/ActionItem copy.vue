<template>
    <div class="action-item" draggable="false" @dragover.prevent  @dragstart="handleDragStart" @drop="handleDrop">
        <div v-if="type == ActionItemtype.LOAD" class="action-load">
            <div class="name">{{ load?.name }}</div>
            <div class="type">
                <RenderType :type="load!.type"></RenderType>
            </div>
        </div>
        <div v-else  class="action-item-main">
            <div v-if="asiType == ASIType.BACKGROUND">
                <RenderType :type="ResType.Image"></RenderType>
            </div>
            <div v-if="asiType == ASIType.BGM">
                <RenderType :type="ResType.Audio"></RenderType>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ResType } from '../../script/var';
import { ActionItemtype, ASIType, DragType, LoadRes } from '../../types/app';
import RenderType from './RenderType.vue';

defineProps<{
    type: ActionItemtype
    load?: LoadRes
    asiType?: ASIType
}>();

const handleDrop = (event: DragEvent) => {
    if (event.dataTransfer?.getData("type") !== DragType.ASSEST) {
        // event.stopPropagation()
    }
}

const handleDragStart = (event: DragEvent) => {
    event.stopPropagation();
    // 设置拖拽数据
    event.dataTransfer?.setData('type', DragType.ACTION_ITEM);
    // 控制拖拽时的光标显示
}
</script>

<style scoped>
.action-item {
    margin-top: 5px;
    border: 1px solid var(--high-bg);
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    font-size: 14px;
}

.action-load {
    display: flex;
    justify-content: space-between;
    height: 25px;
    padding: 0 10px;
    line-height: 25px;
}

.action-item-main {
    padding: 10px;
    height: 40px;
}

.action-item-main {
    height: 100%;
}
</style>