<template>
    <div class="action-item-main" @click="onClickActionItem">
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

            <Dropdown style="width: 100%;" v-model="selectedCharacterIndex" @update:modelValue="onSelectCharacter"
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
            <DynamicInputs v-model="targetStateOptions" :columns="targetStateOptions.length" />

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
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { handleSceneState, useCommonState } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import CanvasManager from '../../../script/render/canvas-manager';
import Dropdown from '../../common/Dropdown.vue';
import { ASIType, DropdownOption, GameMode, InputOption, sceneCharacter } from '../../../types/app';
import Tooltip from '../../common/Tooltip.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { setModification } from '../../../script/util/common';
import { useI18n } from 'vue-i18n';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import { useActionStore } from '../../../stores/action-store';
import { OutlineFilter } from 'pixi-filters';
import { Spine } from 'pixi-spine';
import { TransformGizmo } from '../../../script/render/transform-gizmo';

const canvas = CanvasManager.getInstance();

const props = defineProps<{
    title: string,
    id: number
}>();

const { t } = useI18n();

const { action, actionItem } = useCommonState(props.title, props.id);
const actionStore = useActionStore();
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
        disabled: true
    },
    {
        label: 'y',
        value: 0,
        type: 'number',
        disabled: true
    },
    {
        label: "scale",
        value: 1,
        type: 'text',
        disabled: true
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
        // 发生变化时更新当前角色 先去除轮廓
        applyOutlineToSpine(currentCharacter.value?.spine, false);
        // 应用轮廓到新角色
        applyOutlineToSpine(action.maxCharacter[selectedCharacterIndex.value].spine, true);
        const newCharacter = action.maxCharacter[selectedCharacterIndex.value];

        // 当角色发生变化时，更新 targetState 为当前角色的位置
        if (newCharacter && newCharacter.spine) {
            targetState.value.x = newCharacter.spine.x;
            targetState.value.y = newCharacter.spine.y;
            targetState.value.scale = newCharacter.spine.scale.x;

            // 同步更新到 targetStateOptions 显示
            targetStateOptions.value[0].value = Math.round(newCharacter.spine.x);
            targetStateOptions.value[1].value = Math.round(newCharacter.spine.y);
            targetStateOptions.value[2].value = parseFloat(newCharacter.spine.scale.x.toFixed(2));
        }

        return newCharacter;
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
    console.log("选择角色索引:", index);

    // 先清理之前的选择状态
    if (currentCharacter.value?.spine) {
        // 移除之前角色的轮廓
        applyOutlineToSpine(currentCharacter.value.spine, false);

        // 隐藏并清理 TransformGizmo
        const transformGizmo = TransformGizmo.getInstance();
        transformGizmo.visible = false;
        transformGizmo.removeOnPositionUpdateCallback();
    }

    // 设置新的选中角色索引
    selectedCharacterIndex.value = index;
    updateCharacterInfo();

    // 为新角色应用轮廓和 TransformGizmo
    if (currentCharacter.value?.spine) {
        applyOutlineToSpine(currentCharacter.value.spine, true);

        // 重新附加并显示 TransformGizmo
        transformGizmo.attachToSpine(currentCharacter.value.spine);
        transformGizmo.visible = true;

        // 设置位置更新回调
        transformGizmo.setOnPositionUpdateCallback((x: number, y: number, scale: number) => {
            targetState.value.x = x;
            targetState.value.y = y;
            targetState.value.scale = scale;

            // 同步更新到 targetStateOptions 显示
            targetStateOptions.value[0].value = Math.round(x);
            targetStateOptions.value[1].value = Math.round(y);
            targetStateOptions.value[2].value = parseFloat(scale.toFixed(2));
        });
    }
}

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


// 应用到场景
const applyToScene = () => {
    if (!currentCharacter.value) return;

    const spine = currentCharacter.value.spine;
    console.log("引用角色:", spine);


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

// 序列化方法
const serialization = () => {
    return {
        character: {
            selectedCharacterIndex: selectedCharacterIndex.value,
            operationMode: operationModeOptions.value[selectedOperationMode.value].value,
            targetState: {
                x: targetState.value.x,
                y: targetState.value.y,
                scale: targetState.value.scale
            },
            tweenSettings: {
                duration: tweenDuration.value,
                easeType: selectedEaseType.value
            },
            targetStateOptions: targetStateOptions.value.map(option => ({
                label: option.label,
                value: option.value,
                type: option.type,
                disabled: option.disabled
            }))
        }
    };
};

// 反序列化方法
const deserialization = (actionItem: any) => {
    const actionData = actionItem.actionData;
    if (!actionData || !actionData.character) {
        return;
    }

    const characterData = actionData.character;

    // 恢复选中的角色索引
    if (characterData.selectedCharacterIndex !== undefined) {
        selectedCharacterIndex.value = characterData.selectedCharacterIndex;
    }

    // 恢复操作模式
    if (characterData.operationMode) {
        const modeIndex = operationModeOptions.value.findIndex(mode => mode.value === characterData.operationMode);
        if (modeIndex !== -1) {
            selectedOperationMode.value = modeIndex;
        }
    }

    // 恢复目标状态
    if (characterData.targetState) {
        targetState.value = {
            x: characterData.targetState.x || 0,
            y: characterData.targetState.y || 0,
            scale: characterData.targetState.scale || 1
        };
    }

    // 恢复补间设置
    if (characterData.tweenSettings) {
        tweenDuration.value = characterData.tweenSettings.duration || 1000;
        selectedEaseType.value = characterData.tweenSettings.easeType || 'linear';
    }

    // 恢复目标状态选项
    if (characterData.targetStateOptions && characterData.targetStateOptions.length === targetStateOptions.value.length) {
        characterData.targetStateOptions.forEach((option: any, index: number) => {
            if (targetStateOptions.value[index]) {
                targetStateOptions.value[index].value = option.value;
                targetStateOptions.value[index].disabled = option.disabled;
            }
        });
    }

    // 更新角色信息
    updateCharacterInfo();
};

const isSelected = ref(false)
let transformGizmo: TransformGizmo;

transformGizmo = TransformGizmo.getInstance();
transformGizmo.zIndex = 1000; // 确保在Spine对象之上
transformGizmo.visible = false; // 默认隐藏
// 不再添加到UI层，而是在attachToSpine时添加到Spine对象
// 应用或移除Spine描边效果
const applyOutlineToSpine = (spine: Spine | undefined, apply: boolean) => {
    // 使用 CanvasManager 的全局描边管理
    canvas.applyOutlineToSpine(spine, apply);
};

const onClickActionItem = () => {
    console.log("点击了当前选中的操作项");

    setTimeout(() => {
        CanvasManager.getInstance().setMode(GameMode.SCENE);
    }, 10);


    if (isSelected.value) {
        return;
    }

    console.log("开始添加轮廓")
    applyOutlineToSpine(currentCharacter.value?.spine, true);

    // 显示变换控制工具
    if (currentCharacter.value?.spine) {
        console.log("显示TransformGizmo，附加到Spine:", currentCharacter.value.spine);
        setTimeout(() => {
            applyOutlineToSpine(currentCharacter.value?.spine, true);
            transformGizmo.attachToSpine(currentCharacter.value!.spine);
            transformGizmo.visible = true;
        }, 10);


        // 设置位置更新回调，实时同步到 targetState
        transformGizmo.setOnPositionUpdateCallback((x: number, y: number, scale: number) => {
            targetState.value.x = x;
            targetState.value.y = y;
            targetState.value.scale = scale;

            // 同步更新到 targetStateOptions 显示
            targetStateOptions.value[0].value = Math.round(x);
            targetStateOptions.value[1].value = Math.round(y);
            targetStateOptions.value[2].value = parseFloat(scale.toFixed(2));
        });

        console.log("TransformGizmo visible:", transformGizmo.visible);
        console.log("TransformGizmo parent:", transformGizmo.parent);
        console.log("TransformGizmo position:", transformGizmo.position);
    }

    isSelected.value = true;
}

watchEffect(() => {
    if (actionStore.currentSelectActionTitle === props.title && actionStore.currentSelectActionItemId !== props.id) {

        console.log("点击了其他操作项");

        applyOutlineToSpine(currentCharacter.value?.spine, false);

        // 隐藏变换控制工具
        transformGizmo.visible = false;
        transformGizmo.detachFromSpine();

        isSelected.value = false;
    }
});

onMounted(() => {
    // 注册action回调
    actionItem.action = targetAction;
    actionItem.serialize = serialization;

    // 初始化modification
    modification = action.getCurrentModification(props.title, props.id);

    // 反序列化数据
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    const currentActionItem = action.getAction(props.title).as[actionIndex];
    deserialization(currentActionItem);

    // 初始化角色信息
    updateCharacterInfo();

    // 设置 Spine 点击回调，当点击场景中的 Spine 对象时切换选择
    canvas.setSpineClickCallback(props.id, (spine: Spine, characterInfo: sceneCharacter) => {
        // 只有在当前 ActionCharacter 组件被选中时才响应 Spine 点击
        if (isSelected.value) {
            // 查找被点击的 Spine 对应的角色索引
            const clickedCharacterIndex = action.maxCharacter.findIndex(
                (char) => char.spine === spine
            );

            if (clickedCharacterIndex !== -1 && clickedCharacterIndex !== selectedCharacterIndex.value) {
                console.log('通过点击 Spine 切换角色:', characterInfo.character.characterName);

                // 切换到被点击的角色
                onSelectCharacter(clickedCharacterIndex);
            }
        }
    });
});

onUnmounted(() => {
    // 移除 Spine 点击回调
    canvas.removeSpineClickCallback(props.id);
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