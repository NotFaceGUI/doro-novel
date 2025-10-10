<template>
    <div class="action-item-tool">
        <button class="play-btn" @click.stop="play">▶</button>
        <button @click="onDelete">🗑</button>
        <button class="collapse-btn" @click.stop="toggleCollapse" :title="actionItem.isToggle ? '展开' : '折叠'">
            {{ actionItem.isToggle ? '▼' : '▲' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import CanvasManager from '../../../script/render/canvas-manager';
import { useActionStore } from '../../../stores/action-store';
import { GameMode } from '../../../types/app';
import { useCommonState } from '../../../script/common/common-action-item';

const actions = useActionStore();


const props = defineProps<{
    title: string,
    id: number,
}>();

const { actionItem } = useCommonState(props.title, props.id);



// 定义事件发射
const emit = defineEmits<{
    toggleCollapse: [collapsed: boolean]
}>();

// 切换折叠状态
const toggleCollapse = () => {
    actionItem.isToggle = !actionItem.isToggle;
    emit('toggleCollapse', actionItem.isToggle);
};

const onDelete = () => {
    const actionIndex = actions.getAction(props.title).as.findIndex((item) => item.id === props.id);
    if (actionIndex !== -1) {
        actions.getAction(props.title).as.splice(actionIndex, 1);
    }
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

    const actionIndex = actions.getAction(props.title).as.findIndex((item) => item.id === props.id);
    actions.getAction(props.title).as[actionIndex].action?.();
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

button.collapse-btn {
    font-size: 16px;
}

button.collapse-btn:hover {
    background-color: var(--error-color);
    color: white;
}
</style>
