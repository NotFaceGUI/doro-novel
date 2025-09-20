<template>
    <div class="time-action" :class="{ 'action-hover-enter': isEnter }" draggable="false" @dragenter="handleDragEnter"
        @dragleave="hanleDragLeave" @dragover="hanleDragOver" @dragstart="handleDragStart" @drop="handleDrop">
        <div class="action-title">
            {{ title }}
            <div @click.stop="toggleExpand" class="toggle-btn">
                <span :class="{ rotated: isExpanded }">▶</span>
            </div>
        </div>

        <transition name="expand">
            <div v-show="isExpanded" class="action-content">
                <slot></slot>
                <template v-if="data != undefined">
                    <ActionItem :title="title" :id="index" :type="ActionItemtype.NORMAL" v-for="(as, index) in data"
                        :key="index" :asi-type="as.type" />
                </template>
                <div @click.stop="openSelect" class="bottom-command" v-if="data != undefined">
                    +
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ActionItems, ActionItemtype, ASIType, DragType } from "../../types/app";
import ActionItem from "./ActionItem.vue";
import { selectResType } from "../../script/common/search-action";
import { ResType } from "../../script/var";
import { useActionStore } from "../../stores/action-store";
import massage from "../../script/common/massage";

const props = defineProps<{
    title: string;
    data?: ActionItems[]
}>();

const emit = defineEmits(['hover'])

const isExpanded = ref(true);

const isEnter = ref(false);

const actionStore = useActionStore();

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

const openSelect = async () => {
    const res = await selectResType(ResType.Document);
   
    if (res === ASIType.SCENE) {
        if (actionStore.getAction(props.title).as.some(item => item.type === ASIType.SCENE)) {
            massage('❗ 一个Action应当只有一个场景初始化! ', 'error', 4000)
        }
    }

    actionStore.getAction(props.title).as.push({
        type: res
    })
}

const handleDragEnter = (event: DragEvent) => {
    event.stopPropagation()
}

const hanleDragLeave = (event: DragEvent) => {
    event.stopPropagation()
    isEnter.value = false;
}

const hanleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isEnter.value = true;
}

const handleDrop = (event: DragEvent) => {
    isEnter.value = false;

    event.preventDefault();
    // event.stopPropagation();
    if (event.dataTransfer?.getData("type") !== DragType.ASSEST) {
        event.stopPropagation()
    } else {
        console.log("object:", props.title);
        //TODO: 如果将资源文件放入Action中将先处理action变成使用这个资源，同时在加载中添加
        emit('hover', props.title);
        console.log("action"); // 交给Time Line处理
        // props.data?.push({
        //     type: ASIType.BACKGROUND
        // })
    }

};

const handleDragStart = (event: DragEvent) => {
    event.stopPropagation();
    // 设置拖拽数据
    event.dataTransfer?.setData("type", DragType.ACTION);
};

onMounted(() => {
    if (props.title === "Init Load Action") {
        isExpanded.value = false;
    }
})
</script>

<style lang="css" scoped>
.action-title {
    border-left: 3px solid rebeccapurple;
    padding-left: 5px;
    position: relative;
    display: flex;
    justify-content: space-between;
}

/* .action-title::before {
    content: "▶";
    position: absolute;
    right: 1px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: green;
}

.action-title:hover::before {
    content: "❚❚";
    color: red;
    cursor: pointer;
} */

.toggle-btn {
    cursor: pointer;
    user-select: none;
    transition: transform 0.3s ease;
    margin-right: 4px;
    font-size: 14px;
}

.toggle-btn span {
    display: inline-block;
    transition: transform 0.3s ease;
}

.toggle-btn .rotated {
    transform: rotate(90deg);
}

.action-content {
    transition: height 0.32s ease, opacity 0.2s ease;
    overflow: hidden;
}

.expand-enter-active,
.expand-leave-active {
    transition: max-height 0.15s, opacity 0.1s ease-out, transform 0.15s;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
    max-height: 500px;
    /* 设置一个较大的高度，确保内容能完全展开 */
    opacity: 1;
    transform: translateY(0);
}

.action-hover-enter {
    border: 2px solid var(--button-hover-bg) !important;
}

.bottom-command {
    padding: 2px;
    margin-top: 5px;
    width: 100%;
    display: flex;
    justify-content: center;
    border: 2px var(--high-hover-bg) dashed;
    border-radius: 5px;
    transition: all .3s ease-in-out;
}

.bottom-command:hover {
    background-color: var(--high-hover-bg);
    border: 2px #61618f dashed;
}
</style>
