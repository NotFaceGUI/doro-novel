<template>
    <div class="action-item-tool">
        <button class="play-btn" @click.stop="play">▶</button>
        <button @click="onDelete">🗑</button>
    </div>
</template>

<script setup lang="ts">
import CanvasManager from '../../../script/render/canvas-manager';
import { useActionStore } from '../../../stores/action-store';
import { GameMode } from '../../../types/app';

const actions = useActionStore();

const props = defineProps<{
    title: string,
    id: number,
}>();

const onDelete = () => {
    actions.getAction(props.title).as.splice(props.id, 1);
}

const play = () => {
    // 更新数据
    // actions.updateSnapshot(props.title, 0, props.id);
    // console.log("更新数据:", actions.previewSnapshot);

    actions.initAny();

    actions.gameMode = GameMode.PREVIEW;
    CanvasManager.getInstance().setMode(GameMode.PREVIEW);
    
    // 播放前需要选中这个actionItem
    if (actions.currentSelectActionItemId !== props.id) {
        actions.currentSelectActionTitle = props.title;
        actions.currentSelectActionItemId = props.id;
        console.log("已选中 ActionItem:", props.id, "标题:", props.title);
    }

    actions.getAction(props.title).as[props.id].action?.();
}
</script>

<style scoped>
.action-item-tool {
    display: flex;
    gap: 10px;
    align-items: center;
}

button {
    width: 30px;
    height: 30px;
    font-size: 18px;
    color: var(--error-color);
    border: none;
    border-radius: 5px;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

button:hover {
    background-color: var(--error-color);
    color: white;

}

button.play-btn:hover {
    background-color: transparent;
    color: green;
}
</style>
