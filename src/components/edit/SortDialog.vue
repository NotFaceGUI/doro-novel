<template>
    <teleport to="body">
        <div class="sort-dialog-overlay" @click="handleClose">
            <div class="sort-dialog" @click.stop>
                <div class="sort-dialog-header">
                    <h3>排序 Action Items</h3>
                    <button class="close-btn" @click="handleClose">×</button>
                </div>

                <div class="sort-dialog-content">
                    <div class="sort-instructions">
                        拖拽下方的 ActionItem 来重新排序, <span style="color: brown;">注意改变顺序快照可能会失去真实性</span>
                    </div>


                    <div class="flex">
                        <VueDraggable ref="el" v-model="sortableItems" :animation="150" ghostClass="ghost" class="sort-list"
                            @start="onStart" @update="onUpdate" @end="onEnd" @move="onMove">
                            <div v-for="(item, index) in sortableItems" :key="item.id" class="sort-item">
                                <div class="drag-handle">⋮⋮</div>
                                <div class="item-info">
                                    <div class="item-id">ID: {{ item.id }}</div>
                                    <div class="item-type">类型: {{ getTypeDisplayName(item.type) }}</div>
                                </div>
                                <div class="item-index">{{ index + 1 }}</div>
                            </div>
                        </VueDraggable>
                    </div>

                    <div class="sort-dialog-footer">
                        <button class="cancel-btn" @click="handleClose">取消</button>
                        <button class="save-btn" @click="handleSave">保存排序</button>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
    VueDraggable,
    type UseDraggableReturn
} from 'vue-draggable-plus';
import { ActionItems, ASIType } from '../../types/app';

const props = defineProps<{
    items: ActionItems[]
}>();




const onStart = (e: any) => {
};


const emit = defineEmits<{
    close: []
    save: [sortedItems: ActionItems[]]
}>();

const moveId = ref(null);
const direction = ref('');

const onMove = (evt: { draggedRect: any; relatedRect: any; related: any; }) => {
    const { draggedRect, relatedRect, related } = evt;
    const { top, bottom } = relatedRect;
    const hoverTargetSortY = bottom - (bottom - top) / 2;
    const draggedRectBottom = draggedRect.bottom;

    moveId.value = related.id;
    if (draggedRectBottom > hoverTargetSortY) {
        direction.value = 'before';
    } else {
        direction.value = 'after';
    }
};

const onEnd = () => {
    moveId.value = null;
};

const sortableItems = ref<ActionItems[]>([]);
const el = ref<UseDraggableReturn>();

// 类型显示名称映射
const getTypeDisplayName = (type: ASIType): string => {
    const typeMap: Record<ASIType, string> = {
        [ASIType.BACKGROUND]: '背景',
        [ASIType.BGM]: '背景音乐',
        [ASIType.AUDIO]: '音效',
        [ASIType.DIALOGUE]: '对话',
        [ASIType.SCENE]: '场景初始化',
        [ASIType.OPERATINGCAMERA]: '摄像机操作',
        [ASIType.TRANSITION]: '过渡效果',
        [ASIType.WAIT]: '等待/阻塞',
        [ASIType.CHECKDIALOGUE]: '分支对话',
        [ASIType.EFFECT]: '特效',
        [ASIType.CHARACTER]: '操作角色'
    };
    return typeMap[type] || '未知类型';
};


const onUpdate = () => {
    console.log('拖拽更新');
};


const handleClose = () => {
    emit('close');
};

const handleSave = () => {
    emit('save', sortableItems.value);
};

onMounted(() => {
    // 创建items的深拷贝以避免直接修改原数据
    sortableItems.value = [...props.items];
});
</script>

<style scoped>
.sort-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.sort-dialog {
    background: var(--primary-bg);
    border-radius: var(--border-radius);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--main-border-color);
}

.sort-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--padding) 20px;
    border-bottom: 1px solid var(--main-border-color);
}

.sort-dialog-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--sec-text-color);
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    transition: background-color 0.2s;
}

.close-btn:hover {
    background-color: var(--high-hover-bg);
    color: var(--text-color);
}

.sort-dialog-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.sort-instructions {
    margin-bottom: var(--margin);
    color: var(--sec-text-color);
    font-size: 14px;
    line-height: 1.4;
}

.sort-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sort-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--secondary-bg);
    border: 1px solid var(--main-border-color);
    border-radius: var(--border-radius);

    will-change: transform;
}

.sort-item:hover {
    background: var(--high-bg);
    border-color: var(--high-hover-bg);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.sort-item.ghost {
    opacity: 0.5;
    background: var(--info-color);
}

.sort-item.chosen {
    background: var(--high-bg);
    border-color: var(--button-bg);
    box-shadow: 0 4px 16px rgba(255, 153, 0, 0.3);
    transform: scale(1.02);
    z-index: 1000;
}

.sort-item.drag {
    opacity: 0.9;
    transform: rotate(3deg) scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 1001;
}

.drag-handle {
    color: var(--sec-text-color);
    font-size: 16px;
    margin-right: 12px;
    cursor: grab;
    user-select: none;
    line-height: 1;
    transition: all 0.2s ease;
    padding: 4px;
    border-radius: var(--border-radius);
}

.drag-handle:hover {
    color: var(--text-color);
    background: var(--high-hover-bg);
    transform: scale(1.1);
}

.drag-handle:active {
    cursor: grabbing;
    transform: scale(0.95);
}

.item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.item-id {
    font-weight: 600;
    color: var(--text-color);
    font-size: 14px;
}

.item-type {
    color: var(--sec-text-color);
    font-size: 13px;
}

.item-index {
    background: var(--button-bg);
    color: var(--text-color);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    margin-left: 12px;
}

.sort-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
    padding-top: 5px;
    /* padding: var(--padding) 20px; */
    border-top: 1px solid var(--main-border-color);
    /* background: var(--secondary-bg); */
    border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.cancel-btn,
.save-btn {
    padding: 8px 16px;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.cancel-btn {
    background: var(--high-bg);
    color: var(--text-color);
    border: 1px solid var(--main-border-color);
}

.cancel-btn:hover {
    background: var(--high-hover-bg);
}

.save-btn {
    background: var(--button-bg);
    color: var(--text-color);
}

.save-btn:hover {
    background: var(--button-hover-bg);
}
</style>