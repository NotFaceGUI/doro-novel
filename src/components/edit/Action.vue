<template>
    <div class="time-action" :class="{ 'action-hover-enter': isEnter }" draggable="false" @dragenter="handleDragEnter"
        @dragleave="hanleDragLeave" @dragover="hanleDragOver" @dragstart="handleDragStart" @drop="handleDrop">
        <div class="action-title">
            {{ title }}
            <div class="action-controls">
                <div @click.stop="openSortDialog" class="sort-btn" v-if="data && data.length > 1" title="排序">
                    ⇅
                </div>
                <div @click.stop="toggleExpand" class="toggle-btn">
                    <span :class="{ rotated: isExpanded }">▶</span>
                </div>
            </div>
        </div>

        <transition name="expand">
            <div v-show="isExpanded" class="action-content">
                <slot></slot>
                <template v-if="data != undefined">
                    <div 
                        v-for="(as, index) in data" 
                        :key="as.id"
                        :class="{ 
                            'drag-over': draggedItem?.id !== as.id && isDragging,
                            'being-dragged': draggedItem?.id === as.id,
                            'draggable-enabled': isDraggableEnabled(as.id)
                        }"
                        class="action-item-wrapper"
                        :draggable="isDraggableEnabled(as.id)"
                        @mousedown="handleMouseDown($event, as, index)"
                        @dragstart="handleItemDragStart($event, as, index)"
                        @dragover="handleItemDragOver($event, index)"
                        @dragleave="handleItemDragLeave"
                        @drop="handleItemDrop($event, index)"
                        @dragend="handleItemDragEnd"
                    >
                        <ActionItem 
                            :title="title" 
                            :id="as.id" 
                            :type="ActionItemtype.NORMAL" 
                            :asi-type="as.type" 
                        />
                    </div>
                </template>
                <div @click.stop="openSelect" class="bottom-command" v-if="data != undefined">
                    +
                </div>
            </div>
        </transition>
        
        <!-- 排序弹窗 -->
        <SortDialog 
            v-if="showSortDialog" 
            :items="data || []" 
            @close="closeSortDialog"
            @save="handleSortSave"
        />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ActionItems, ActionItemtype, ASIType, DragType } from "../../types/app";
import ActionItem from "./ActionItem.vue";
import SortDialog from "./SortDialog.vue";
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

const showSortDialog = ref(false);

// 拖拽相关状态
const draggedItem = ref<ActionItems | null>(null);
const dragOverIndex = ref<number>(-1);
const isDragging = ref(false);
const enabledDragItems = ref<Set<number>>(new Set());

const actionStore = useActionStore();

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

const openSortDialog = () => {
    showSortDialog.value = true;
};

const closeSortDialog = () => {
    showSortDialog.value = false;
};

const handleSortSave = (sortedItems: ActionItems[]) => {
    // 更新actionStore中的数据
    const action = actionStore.getAction(props.title);
    action.as = sortedItems;
    showSortDialog.value = false;
};

// 拖拽事件处理函数
const handleMouseDown = (event: MouseEvent, item: ActionItems, index: number) => {
    // 只有按住Ctrl键时才启用拖拽
    if (event.ctrlKey) {
        enabledDragItems.value.add(item.id);
    } else {
        enabledDragItems.value.delete(item.id);
    }
};

const isDraggableEnabled = (itemId: number) => {
    return enabledDragItems.value.has(itemId);
};

const handleItemDragStart = (event: DragEvent, item: ActionItems, index: number) => {
    // 只有在启用拖拽的情况下才允许拖拽开始
    if (!isDraggableEnabled(item.id)) {
        event.preventDefault();
        return;
    }
    
    draggedItem.value = item;
    isDragging.value = true;
    event.dataTransfer?.setData("text/plain", "");
    event.dataTransfer!.effectAllowed = "move";
};

const handleItemDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
    dragOverIndex.value = index;
};

const handleItemDragLeave = () => {
    dragOverIndex.value = -1;
};

const handleItemDrop = (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    
    if (!draggedItem.value || !props.data) return;
    
    const draggedIndex = props.data.findIndex(item => item.id === draggedItem.value!.id);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;
    
    // 创建新的数组并重新排序
    const newItems = [...props.data];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemData);
    
    // 更新actionStore中的数据
    const action = actionStore.getAction(props.title);
    action.as = newItems;
    
    // 重置拖拽状态
    draggedItem.value = null;
    dragOverIndex.value = -1;
    isDragging.value = false;
};

const handleItemDragEnd = () => {
    draggedItem.value = null;
    dragOverIndex.value = -1;
    isDragging.value = false;
    // 拖拽结束后清除所有启用的拖拽项
    enabledDragItems.value.clear();
};

const openSelect = async () => {
    const res = await selectResType(ResType.Document);
   
    if (res === ASIType.SCENE) {
        if (actionStore.getAction(props.title).as.some(item => item.type === ASIType.SCENE)) {
            massage('❗ 一个Action应当只有一个场景初始化! ', 'error', 4000)
        }
    }

    actionStore.getAction(props.title).as.push({
        type: res,
        id: new Date().getTime(),
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

.action-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sort-btn {
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
    font-size: 14px;
    padding: 2px 4px;
    border-radius: 3px;
}

.sort-btn:hover {
    background-color: var(--high-hover-bg);
    color: var(--button-bg);
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

/* 拖拽相关样式 */
.action-item-wrapper {
    transition: all 0.2s ease;
    border-radius: 4px;
    margin: 2px 0;
}

.action-item-wrapper:hover {
    background-color: var(--high-hover-bg);
}

.action-item-wrapper.drag-over {
    background-color: var(--button-hover-bg);
    border: 1px dashed var(--button-bg);
    transform: translateY(-2px);
}

.action-item-wrapper.being-dragged {
    opacity: 0.5;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.action-item-wrapper[draggable="true"] {
    cursor: grab;
}

.action-item-wrapper[draggable="true"]:active {
    cursor: grabbing;
}

.action-item-wrapper.draggable-enabled {
    border: 1px dashed var(--button-bg);
    background-color: var(--high-hover-bg);
}

.action-item-wrapper:not(.draggable-enabled) {
    cursor: default;
}
</style>
