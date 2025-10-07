<template>
    <div class="action-item-main">
        <ActionItemHead content="⏱️ 阻塞执行" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div>
                <DynamicInputs v-model="blockSettings" :columns="blockSettings.length">
                </DynamicInputs>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useCommonState } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import DynamicInputs from '../../common/DynamicInputs.vue';
import { ActionItems, ASIType, InputOption } from '../../../types/app';

const props = defineProps<{
    title: string,
    id: number,
}>();

const { actionItem } = useCommonState(props.title, props.id);

// 阻塞时间设置
const blockSettings = ref<InputOption[]>([
    {
        label: '阻塞时间 (ms)',
        value: 100,
        type: 'number',
        disabled: actionItem.type !== ASIType.WAIT
    }
]);

// 预览状态
const isBlocking = ref(false);
let blockTimer: number | null = null;

// 主要的action执行函数
const targetAction = async () => {
    const blockTime = blockSettings.value[0].value as number;
    if (blockTime <= 0) return;
    
    // 如果已经在阻塞中，先清除之前的定时器
    if (blockTimer !== null) {
        window.clearTimeout(blockTimer);
        blockTimer = null;
    }
    
    isBlocking.value = true;
    
    // 使用Promise来处理阻塞，避免定时器冲突
    await new Promise<void>(resolve => {
        blockTimer = window.setTimeout(() => {
            isBlocking.value = false;
            blockTimer = null;
            resolve();
        }, blockTime);
    });
};

// 序列化方法
const serialization = () => {
    return {
        block: {
            blockTime: blockSettings.value[0].value,
            blockSettings: blockSettings.value.map(setting => ({
                label: setting.label,
                value: setting.value,
                type: setting.type,
                disabled: setting.disabled
            }))
        }
    };
};

// 反序列化方法
const deserialization = (actionItem: ActionItems) => {
    const actionData = actionItem.actionData;
    if (!actionData || !actionData.block) {
        return;
    }

    const blockData = actionData.block;

    // 恢复阻塞时间
    if (blockData.blockTime !== undefined) {
        blockSettings.value[0].value = blockData.blockTime;
    }

    // 恢复阻塞设置
    if (blockData.blockSettings && Array.isArray(blockData.blockSettings)) {
        blockData.blockSettings.forEach((setting: any, index: number) => {
            if (blockSettings.value[index]) {
                blockSettings.value[index].value = setting.value;
                blockSettings.value[index].disabled = setting.disabled;
            }
        });
    }
};

onMounted(() => {
    // 注册action回调和序列化方法
    actionItem.action = targetAction;
    actionItem.serialize = serialization;
    actionItem.wait = true;

    // 反序列化数据
    const { action } = useCommonState(props.title, props.id);
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    const currentActionItem = action.getAction(props.title).as[actionIndex];
    deserialization(currentActionItem);
});

</script>

<style scoped>
.action-item-main {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.action-item-content {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.action-title {
    font-weight: bold;
    margin-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.preview-controls {
    display: flex;
    gap: 5px;
}

.preview-btn {
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
}

.preview-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>