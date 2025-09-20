<template>
    <div class="action-item-main">
        <ActionItemHead content="🎭 过渡效果" :is-hover="true" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                过渡类型
            </div>
            <Dropdown style="width: 100%;" v-model="selectedTransitionIndex" :options="transitionTypeOptions"
                @update:modelValue="handleTransitionTypeChange" :disabled="false" />

            <div class="action-title" v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresDuration">
                过渡时间
            </div>
            <div class="tran-row">
                <input  type="number" style="flex: 1;" v-model="duration" :min="100" :max="10000" :step="100"
                    v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresDuration" class="camera-input">
                <span class="unit-label">ms</span>
            </div>



            <div class="action-title" v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresIntensity">
                过渡强度
            </div>
            <input type="number" style="width: 100%;" v-model="intensity" :min="0.1" :max="1.0" :step="0.1"
                v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresIntensity" />

            <div class="action-title" v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresEasing">
                过渡缓动函数
            </div>
            <Dropdown style="width: 100%;" v-model="easingIndex" :options="easingOptions"
                @update:modelValue="handleEasingChange" :disabled="false"
                v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresEasing" />

            <div class="action-title" v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresDelay">
                过渡延迟
            </div>
            <input type="number" style="width: 100%;" v-model="delay" :min="0" :max="10000" :step="100"
                v-if="TRANSITION_OPTIONS[selectedTransitionIndex]?.requiresDelay" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ActionItemHead from './ActionItemHead.vue';
import { TransitionType, TransitionConfig, TRANSITION_OPTIONS } from '../../../types/transition';
import { TransitionManager } from '../../../script/transition/transition-manager';
import { useCommonState } from '../../../script/common/common-action-item';
import Dropdown from '../../common/Dropdown.vue';
import { DropdownOption } from '../../../types/app';
import CanvasManager from '../../../script/render/canvas-manager';
import { EasingFunction, getEasingFunctionOptions } from '../../../script/camera-stand';

interface Props {
    title: string;
    id: number;
}

const props = defineProps<Props>();

// 缓动函数索引
const easingIndex = ref<number>(0);

const easing = computed(() => {
    return easingOptions.value[easingIndex.value].value;
});

// 获取缓动函数选项
const easingOptions = ref<DropdownOption[]>(getEasingFunctionOptions());

// 使用通用状态管理
const { actionItem } = useCommonState(props.title, props.id);

// 状态管理
const canvasManager = CanvasManager.getInstance();

// 过渡参数
const transitionType = ref<TransitionType>(TransitionType.FADE);
const duration = ref(100);
const intensity = ref(1.0);
const delay = ref(0)

// 创建过渡类型选项
const transitionTypeOptions = ref<DropdownOption[]>(
    TRANSITION_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value
    }))
);

// 当前选择的过渡类型索引
const selectedTransitionIndex = ref(0);



// 过渡管理器实例
let transitionManager: TransitionManager | null = null;

// 初始化过渡管理器
const initTransitionManager = () => {
    if (canvasManager && canvasManager.getApp()) {
        // 创建过渡管理器
        transitionManager = new TransitionManager(canvasManager);
    }
};

// 执行过渡效果
const executeTransition = async () => {
    if (!transitionManager) {
        initTransitionManager();
    }

    if (transitionManager) {
        const config: TransitionConfig = {
            type: transitionType.value,
            duration: duration.value,
            intensity: intensity.value,
            easing: easing.value as EasingFunction,
            delay: delay.value
        };

        try {
            await transitionManager.execute(config);
        } catch (error) {
            console.error('过渡执行失败:', error);
        }
    }
};

// 处理过渡类型变化
const handleTransitionTypeChange = (index: number) => {
    selectedTransitionIndex.value = index;
    transitionType.value = TRANSITION_OPTIONS[index].value;
    // TODO: 设置修改项
};

const handleEasingChange = (index: number) => {
    easingIndex.value = index;
}


// 执行过渡效果的核心方法
const targetAction = async () => {
    await executeTransition();
};

// 组件挂载时初始化
onMounted(() => {
    // 注册action回调
    actionItem.action = targetAction;

    // 初始化过渡管理器
    initTransitionManager();
});
</script>

<style lang="css" scoped>
.camera-input {
    flex: 1;
    padding: 5px 10px;
    border-radius: 4px;
    border: 0;
    outline: none;
    background-color: var(--secondary-bg);
    color: var(--text-color);
    font-size: 12px;
    margin-right: 10px;
}

.trans-row {
    width: 100%;
    display: flex;
    align-items: center;
    margin: 5px 0;
    gap: 8px;
}
</style>