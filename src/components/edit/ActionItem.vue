<template>
    <div @click.stop="selectActionItem" class="action-item"
        :class="{ 'item-active': action.currentSelectActionItemId == id && action.currentSelectActionTitle === title }"
        draggable="false" @dragover.prevent @dragstart="handleDragStart" @drop="handleDrop">
        <component :is="currentComponent" v-bind="componentProps" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ActionItemtype, ASIType, DragType, GameMode, LoadRes } from "../../types/app";

// 导入子组件
import ActionLoad from "./actions/ActionLoad.vue";
import ActionBackground from "./actions/ActionBackground.vue";
import ActionBgm from "./actions/ActionBgm.vue";
import ActionSfx from "./actions/ActionSfx.vue";
import ActionDialogue from "./actions/ActionDialogue.vue";
import ActionInitScene from "./actions/ActionInitScene.vue";
import ActionOperatingCamera from "./actions/ActionOperatingCamera.vue";
import ActionTransition from "./actions/ActionTransition.vue";
import { useActionStore } from "../../stores/action-store";
import { makeSnapshot } from "../../script/common/snapshot";
import CanvasManager from "../../script/render/canvas-manager";
import ActionBlock from "./actions/ActionBlock.vue";

// 定义 Props
const props = defineProps<{
    // 知道当前是哪个 action
    title: string;
    // 用于唯一标识,判断自己是哪个 ActionItem 不一定需要
    id?: number;
    type: ActionItemtype;
    load?: LoadRes;
    asiType?: ASIType;
}>();

const action = useActionStore();

// 计算当前应该渲染的组件
const currentComponent = computed(() => {
    if (props.type === ActionItemtype.LOAD) return ActionLoad;
    if (props.asiType === ASIType.BACKGROUND) return ActionBackground;
    if (props.asiType === ASIType.BGM) return ActionBgm;
    if (props.asiType === ASIType.AUDIO) return ActionSfx;
    if (props.asiType === ASIType.DIALOGUE) return ActionDialogue;
    if (props.asiType === ASIType.SCENE) return ActionInitScene;
    if (props.asiType === ASIType.OPERATINGCAMERA) return ActionOperatingCamera;
    if (props.asiType === ASIType.TRANSITION) return ActionTransition;
    if (props.asiType === ASIType.WAIT) return ActionBlock;

    // 默认无组件
    return null;
});

onMounted(() => {
    if (props.id != undefined) {
        makeSnapshot(props.title, props.id);
        action.getCurrentModification(props.title, props.id);
    }
})


const componentProps = computed(() => {
    // const actionItem = action.getAction(props.title)?.as[props.id!];
    return {
        title: props.title,
        id: props.id,
        load: props.load,
        asiType: props.asiType,
        // snapshot: actionItem?.snapshot, // 添加 snapshot
    };
});

// watch(
//     () => componentProps.value.snapshot,
//     (newSnapshot) => {
//         if (!newSnapshot) return;
//         // 级联通知后续 ActionItem 更新
//         // console.log(props.id,"：更新！");
//         // action.updateSnapshot(props.title, props.id!, newSnapshot);
//     },
//     { deep: true }
// );

// 选择ActionItem
const selectActionItem = () => {
    // 如果是激活的Action下的Item才可以被选中
    if (props.id != undefined) {
        if (props.title === action.currentSelectActionTitle && action.currentSelectActionItemId != props.id) {
            action.currentSelectActionItemId = props.id;
            const canvas = CanvasManager.getInstance()
            const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
            const type = action.getAction(props.title).as[actionIndex].type;
            // 如果当前的模式是场景就修改
            if (type === ASIType.SCENE ) {
                canvas.setMode(GameMode.SCENE);
            }else {
                canvas.setMode(GameMode.PREVIEW);
            }

            
        }/*  else {
            action.currentSelectActionItemId = -1;
        } */
        
        // 去构造预览Action
        // action.setPreviewSnapshotAll(props.id, props.title);
        // 在预览
        // action.getAction(props.title).as[props.id].action?.();
    } else {
        console.log("非可操作ActionItem的点击事件");
    }

};

// 处理拖拽逻辑
const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer?.getData("type") !== DragType.ASSEST) return;
    // event.stopPropagation(); // 有bug在说
};

const handleDragStart = (event: DragEvent) => {
    event.stopPropagation();
    if (event.dataTransfer) {
        event.dataTransfer.setData("type", DragType.ACTION_ITEM);
    }
};
</script>

<style scoped>
.action-item {
    margin-top: 5px;
    border: 1px solid var(--high-bg);
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    font-size: 14px;
    border: 1px solid transparent;
    transition: all .3s ease-in-out;
}

.action-load {
    display: flex;
    justify-content: space-between;
    height: 25px;
    padding: 0 10px;
    line-height: 25px;
}

.action-item-main {
    padding: 5px 10px;
    padding-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.action-item-main {
    height: 100%;
}

.item-active {
    border: 1px var(--button-hover-bg) dashed;
    box-shadow: 0 0 8px 2px rgba(0, 0, 0, .4);
    transform: translateY(-2px);

}
</style>
