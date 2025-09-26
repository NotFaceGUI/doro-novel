<template>
    <div class="action-item-main">
        <ActionItemHead content="👤 操作角色" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <!-- 角色选择部分 -->
            <div class="action-title">
                选择角色
                <Tooltip position="left">
                    <div style="text-align: left;">
                        <div class="mode-description">
                            选择场景中已存在的角色进行操作
                        </div>
                    </div>
                </Tooltip>
            </div>

            <Dropdown v-model="selectedCharacterIndex" @update:modelValue="onSelectCharacter"
                :options="characterOptions" :disabled="false" />

            <!-- 角色操作区域 -->
            <div class="action-title">
                角色操作
                <Tooltip position="left">
                    <div class="mode-description">
                        设置角色的目标状态和操作模式
                    </div>
                </Tooltip>
            </div>
            <ActionBottomLine></ActionBottomLine>

            <!-- 操作模式选择 -->
            <div class="action-title">
                操作模式
            </div>
            <Dropdown v-model="selectedOperationMode" @update:modelValue="onSelectOperationMode"
                :options="operationModeOptions" :disabled="false" />

            <!-- 目标状态设置 -->
            <div class="action-title">
                目标状态
            </div>
            <DynamicInputs v-model="targetStateOptions" :columns="targetStateOptions.length"  />

            <!-- 补间模式的额外设置 -->
            <template v-if="operationModeOptions[selectedOperationMode].value === 'tween'">
                <div class="action-title">
                    持续时间
                </div>
                <div class="input-group">
                    <input type="number" v-model="tweenDuration" min="100" step="100" />
                    <span>毫秒</span>
                </div>

                <div class="action-title">
                    缓动类型
                </div>
                <!-- 暂时使用简单的下拉选择，后续可以扩展 -->
                <select v-model="selectedEaseType">
                    <option value="linear">线性</option>
                    <option value="ease-in">缓入</option>
                    <option value="ease-out">缓出</option>
                    <option value="ease-in-out">缓入缓出</option>
                </select>
            </template>

            <!-- 场景控制按钮 -->
            <div class="scene-control-buttons">
                <button class="control-btn primary" @click="applyToScene">
                    应用到场景
                </button>
                <button class="control-btn secondary" @click="resetToOriginal">
                    重置
                </button>
                <button class="control-btn interactive" @click="enableSceneControl">
                    场景拖拽控制
                </button>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { handleSceneState, useCommonState } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import CanvasManager from '../../../script/render/canvas-manager';
import Dropdown from '../../common/Dropdown.vue';
import { DropdownOption, InputOption } from '../../../types/app';
import Tooltip from '../../common/Tooltip.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { setModification } from '../../../script/util/common';
import { useI18n } from 'vue-i18n';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';

const canvas = CanvasManager.getInstance();

const props = defineProps<{
    title: string,
    id: number
}>();

const { t } = useI18n();

const { action, actionItem } = useCommonState(props.title, props.id);
let modification: Map<PropertyPath, Modification>;

// 角色选择相关
const selectedCharacterIndex = ref(0);
const characterOptions = computed(() => {
    return action.maxCharacter.map((character, index) => ({
        label: t(character.character.characterName) || `角色 ${index + 1}`,
        value: index
    }));
});

// 操作模式相关
const selectedOperationMode = ref(0);
const operationModeOptions = ref<DropdownOption[]>([
    { label: "固定 (Fixed)", value: "fixed" },
    { label: "补间 (Tween)", value: "tween" }
]);

// 缓动相关 (暂时保留，可能在后续版本中使用)
// const customCurve = ref(false);
// const selectedEaseOption = ref(0);
// const easingFunctionOptions = ref(getEasingFunctionOptions());
// const points = ref<ControlPoint[]>([]);

// 时间设置 (暂时保留，可能在后续版本中使用)
// const timeDuration = ref<InputOption[]>([
//     {
//         label: '持续时间(ms)',
//         value: 400,
//         type: 'number',
//         disabled: false
//     },
// ]);

// 位置设置相关 (暂时保留，可能在后续版本中使用)
// const isCustomStartPosition = ref(false);

// const targetFixedPositionValues = ref<InputOption[]>([
//     {
//         label: 'x',
//         value: 0,
//         type: 'number',
//         disabled: true
//     },
//     {
//         label: 'y',
//         value: 0,
//         type: 'number',
//         disabled: true
//     },
//     {
//         label: "scale",
//         value: 1,
//         type: 'text',
//         disabled: true
//     }
// ]);

// 目标状态设置
const targetStateOptions = ref<InputOption[]>([
    {
        label: 'x',
        value: 0,
        type: 'number',
        disabled: false
    },
    {
        label: 'y',
        value: 0,
        type: 'number',
        disabled: false
    },
    {
        label: "scale",
        value: 1,
        type: 'text',
        disabled: false
    }
]);

// 自定义起始位置设置 (暂时保留，可能在后续版本中使用)
// const customStartPositionValues = ref<InputOption[]>([
//     {
//         label: 'x',
//         value: 0,
//         type: 'number',
//         disabled: false
//     },
//     {
//         label: 'y',
//         value: 0,
//         type: 'number',
//         disabled: false
//     },
//     {
//         label: "scale",
//         value: 1,
//         type: 'text',
//         disabled: false
//     }
// ]);

// 补间目标位置设置 (暂时保留，可能在后续版本中使用)
// const targetTweenPositionValues = ref<InputOption[]>([
//     {
//         label: 'x',
//         value: 0,
//         type: 'number',
//         disabled: false
//     },
//     {
//         label: 'y',
//         value: 0,
//         type: 'number',
//         disabled: false
//     },
//     {
//         label: "scale",
//         value: 1,
//         type: 'text',
//         disabled: false
//     }
// ]);

// 当前选中的角色



// 当前选中的角色信息
const currentCharacter = computed(() => {
    if (action.maxCharacter.length > 0 && selectedCharacterIndex.value < action.maxCharacter.length) {
        return action.maxCharacter[selectedCharacterIndex.value];
    }
    return null;
});

// 角色的最后状态
const lastCharacter = ref<{
    x: number;
    y: number;
    scale: number;
} | undefined>(undefined);

// 目标状态
const targetState = ref({
    x: 0,
    y: 0,
    scale: 1
});

// 补间持续时间
const tweenDuration = ref(1000);

// 缓动类型选择
const selectedEaseType = ref('linear');

// 场景控制状态
const isSceneControlEnabled = ref(false);

// 角色选择变化处理
const onSelectCharacter = (index: number) => {
    selectedCharacterIndex.value = index;
    updateCharacterInfo();
};

// 操作模式选择处理
const onSelectOperationMode = (index: number) => {
    selectedOperationMode.value = index;
};

// 更新角色信息
const updateCharacterInfo = () => {
    if (currentCharacter.value) {
        const spine = canvas.viewport.children.find(child =>
            child.name === currentCharacter.value?.character.path?.name
        );

        if (spine) {
            lastCharacter.value = {
                x: spine.x,
                y: spine.y,
                scale: spine.scale.x
            };

            // 同步目标状态为当前状态
            targetState.value = {
                x: spine.x,
                y: spine.y,
                scale: spine.scale.x
            };
        }
    } else {
        lastCharacter.value = undefined;
    }
};

// 更新目标状态
const updateTargetState = () => {
    // 这里可以添加实时预览逻辑
    console.log('目标状态更新:', targetState.value);
};

// 应用到场景
const applyToScene = () => {
    if (!currentCharacter.value) return;

    const spine = canvas.viewport.children.find(child =>
        child.name === currentCharacter.value?.character.path?.name
    );

    if (spine) {
        const operationMode = operationModeOptions.value[selectedOperationMode.value].value;

        if (operationMode === 'fixed') {
            // 固定模式：直接设置位置
            spine.x = targetState.value.x;
            spine.y = targetState.value.y;
            spine.scale.set(targetState.value.scale);

            // 更新lastCharacter
            lastCharacter.value = { ...targetState.value };

            // 保存修改
            saveModification();
        } else if (operationMode === 'tween') {
            // 补间模式：执行动画
            runCharacterTween(spine);
        }
    }
};

// 重置到原始状态
const resetToOriginal = () => {
    if (lastCharacter.value) {
        targetState.value = { ...lastCharacter.value };
        applyToScene();
    }
};

// 启用场景拖拽控制
const enableSceneControl = () => {
    isSceneControlEnabled.value = !isSceneControlEnabled.value;

    if (isSceneControlEnabled.value) {
        // 启用拖拽控制逻辑
        console.log('启用场景拖拽控制');
        // 这里可以添加鼠标事件监听器
    } else {
        // 禁用拖拽控制逻辑
        console.log('禁用场景拖拽控制');
        // 这里可以移除鼠标事件监听器
    }
};

// 执行角色补间动画
const runCharacterTween = (spine: any) => {
    const startX = spine.x;
    const startY = spine.y;
    const startScale = spine.scale.x;

    const targetX = targetState.value.x;
    const targetY = targetState.value.y;
    const targetScale = targetState.value.scale;

    const duration = tweenDuration.value;
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 简单的线性插值
        spine.x = startX + (targetX - startX) * progress;
        spine.y = startY + (targetY - startY) * progress;
        spine.scale.set(startScale + (targetScale - startScale) * progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 动画完成，更新lastCharacter
            lastCharacter.value = { ...targetState.value };

            // 保存修改
            saveModification();
        }
    };

    requestAnimationFrame(animate);
};
// 执行角色操作的主函数
const targetAction = async () => {
    handleSceneState(canvas, props);

    if (action.maxCharacter.length > 0 && selectedCharacterIndex.value < action.maxCharacter.length) {
        const currentCharacter = action.maxCharacter[selectedCharacterIndex.value];

        // 应用角色操作
        if (operationModeOptions.value[selectedOperationMode.value].value === 'fixed') {
            // 固定模式
            applyToScene();
        } else if (operationModeOptions.value[selectedOperationMode.value].value === 'tween') {
            // 补间模式
            applyToScene();
        }
    }
};

// 当前角色位置模式 (暂时保留，可能在后续版本中使用)
// const currentCharacterPositionMode = ref<CharacterPositionType>('none');


// 保存修改
const saveModification = () => {
    if (!currentCharacter.value || !modification) return;

    // 保存角色相关的修改到 modification Map
    setModification(modification, `characters.${currentCharacter.value.character.path?.name}.x`, targetState.value.x);
    setModification(modification, `characters.${currentCharacter.value.character.path?.name}.y`, targetState.value.y);
    setModification(modification, `characters.${currentCharacter.value.character.path?.name}.scale`, targetState.value.scale);
};

onMounted(() => {
    // 注册action回调
    actionItem.action = targetAction;

    // 初始化modification
    modification = action.getCurrentModification(props.title, props.id);

    // 初始化角色信息
    updateCharacterInfo();
});
</script>

<style scoped>
.fixed-mode span {
    color: #e74c3c;
}

.tween-mode span {
    color: #27ae60;
}

.character-operation-area {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.target-state-inputs {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.input-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.input-group label {
    min-width: 60px;
    font-weight: 500;
    color: #333;
}

.input-group input {
    flex: 1;
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

.input-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-group span {
    color: #666;
    font-size: 12px;
}

.scene-control-buttons {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
}

.control-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.control-btn.primary {
    background-color: #007bff;
    color: white;
}

.control-btn.primary:hover {
    background-color: #0056b3;
}

.control-btn.secondary {
    background-color: #6c757d;
    color: white;
}

.control-btn.secondary:hover {
    background-color: #545b62;
}

.control-btn.interactive {
    background-color: #28a745;
    color: white;
}

.control-btn.interactive:hover {
    background-color: #1e7e34;
}

.no-character-selected {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 20px;
    display: block;
}
</style>