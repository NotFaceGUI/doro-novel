<template>
    <div class="action-item-main" @click="onClickActionItem">
        <ActionItemHead :content="t('actionCharacter.head')" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content" v-show="!actionItem.isToggle">
            <div class="action-title">
                {{ t('actionCommon.waitExecution') }}
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <!-- 角色选择部分 -->
            <div class="action-title">
                {{ t('actionCharacter.selectCharacter') }}
                <Tooltip position="left">
                    <div style="text-align: left;">
                        <div class="mode-description">
                            {{ t('actionCharacter.selectCharacterDesc') }}
                        </div>
                        <div style="line-height: 1.6; font-size: 10px;">
                            <p>
                                <span style="color: red; font-weight: bold;">⚠ {{ t('actionCharacter.warningTitle') }}</span>
                                <br>
                                <span>{{ t('actionCharacter.warningPrefix') }}</span>
                                <span style="color: #d9534f; font-weight: bold;">{{ t('actionCharacter.warningLoseState') }}</span>
                            </p>
                            <p>
                                {{ t('actionCharacter.warningClearPrefix') }} <span style="color: #d9534f; font-weight: bold;">{{ t('actionCharacter.warningClearHighlight') }}</span>
                            </p>
                            <p>
                                {{ t('actionCharacter.warningResetPrefix') }} <span style="color: #5cb85c; font-weight: bold;">{{ t('actionCharacter.warningResetHighlight') }}</span>
                            </p>
                        </div>
                    </div>
                </Tooltip>
            </div>

            <Dropdown style="width: 100%;" v-model="selectedCharacterIndex" @update:modelValue="onSelectCharacter"
                :options="characterOptions" :disabled="false" />

            <!-- 角色操作区域 -->
            <div class="action-title">
                {{ t('actionCharacter.operationArea') }}
                <Tooltip position="left">
                    <div class="mode-description">
                        {{ t('actionCharacter.operationAreaDesc') }}
                    </div>
                </Tooltip>
            </div>
            <ActionBottomLine></ActionBottomLine>

            <!-- 操作模式选择 -->
            <div class="action-title">
                {{ t('actionCharacter.operationMode') }}
            </div>
            <Dropdown v-model="selectedOperationMode" @update:modelValue="onSelectOperationMode"
                :options="operationModeOptions" :disabled="false" />

            <!-- 目标状态设置 -->
            <div class="action-title">
                {{ t('actionCharacter.targetState') }}
            </div>
            <DynamicInputs v-model="targetStateOptions" :columns="targetStateOptions.length" />

            <!-- 补间模式的额外设置 -->
            <template v-if="currentOperationMode === 'tween'">
                <div>
                    <DynamicInputs v-model="timeDuration" :columns="timeDuration.length">
                    </DynamicInputs>
                </div>

                <div class="action-title">
                    自定义缓动曲线
                    <ToggleSwitch v-model="customCurve"></ToggleSwitch>
                </div>
                <div v-if="customCurve">
                    <CustomEaseRender v-model="points"></CustomEaseRender>
                </div>

                <div class="action-title" v-else>
                    {{ t('actionCharacter.easeCurve') }}
                    <Tooltip position="left">
                        <div class="mode-description">
                            {{ t('actionCharacter.easeCurveDesc') }}
                        </div>
                    </Tooltip>
                </div>

                <Dropdown v-model="selectedEaseOption" @update:modelValue="onSelectEaseOption"
                    :options="easingFunctionOptions" :disabled="false" />
            </template>

            <!-- 显示/隐藏模式的额外设置 -->
            <template
                v-if="currentOperationMode === 'show' || currentOperationMode === 'hide'">
                <div class="action-title">
                    <div style="display: flex; align-items: center;gap: 5px;">
                        {{ t('actionCharacter.useStippleEffect') }}
                        <ToggleSwitch v-model="useStippleEffect"></ToggleSwitch>
                    </div>

                    <Tooltip position="left">
                        <div class="mode-description">
                            {{ t('actionCharacter.stippleEffectDesc') }}
                            <p>{{ t('actionCharacter.stippleEffectFallback') }}</p>
                        </div>
                    </Tooltip>
                </div>
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
import { DropdownOption, GameMode, InputOption, sceneCharacter } from '../../../types/app';
import Tooltip from '../../common/Tooltip.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { setModification } from '../../../script/util/common';
import { useI18n } from 'vue-i18n';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import { useActionStore } from '../../../stores/action-store';
import { Spine } from 'pixi-spine';
import { TransformGizmo } from '../../../script/render/transform-gizmo';
import { Action, Timing } from 'pixijs-actions';
import { ControlPoint } from '../../../types/app';
import CustomEaseRender from '../../common/render/CustomEaseRender.vue';
import { cloneControlPoints, createProgressBezierEasing, DEFAULT_CUBIC_BEZIER_POINTS } from '../../../utils/cubic-bezier';
import { getCharacterDisplayName } from '../../../utils/character-name';

import { createStippleTransparencyFilter, createAlphaFilter } from '../../../script/common/effect';


const canvas = CanvasManager.getInstance();

const props = defineProps<{
    title: string,
    id: number
}>();

const { t } = useI18n();

const { action, actionItem } = useCommonState(props.title, props.id);
const actionStore = useActionStore();
let modification: Map<PropertyPath, Modification>;

const isSelected = ref(false)
let transformGizmo: TransformGizmo;

transformGizmo = TransformGizmo.getInstance();
transformGizmo.zIndex = 1000; // 确保在Spine对象之上
transformGizmo.visible = false; // 默认隐藏



// 角色选择相关
const selectedCharacterIndex = ref(0);
const characterOptions = computed(() => {
    return action.maxCharacter.map((character, index) => ({
        label: getCharacterDisplayName(character.character.characterName) || `${t('actionCharacter.roleFallback')} ${index + 1}`,
        value: index
    }));
});

// 操作模式相关
const selectedOperationMode = ref(0);
const operationModeOptions = computed<DropdownOption[]>(() => [
    { label: t('actionCharacter.operationModes.fixed'), value: "fixed" },
    { label: t('actionCharacter.operationModes.tween'), value: "tween" },
    { label: t('actionCharacter.operationModes.show'), value: "show" },
    { label: t('actionCharacter.operationModes.hide'), value: "hide" }
]);

// 缓动相关
const customCurve = ref(false);
const selectedEaseOption = ref(0);
// 将 Timing 对象转换为下拉框选项格式
const createTimingOptions = () => {
    const timingKeys = [
        'linear',
        'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
        'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
        'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
        'easeInSine', 'easeOutSine', 'easeInOutSine',
        'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
        'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
        'easeInBack', 'easeOutBack', 'easeInOutBack',
        'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
        'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
    ] as const;

    return timingKeys.map((key) => ({
        label: key,
        value: key // 使用实际的缓动函数
    }));
};

const easingFunctionOptions = ref(createTimingOptions());
const points = ref<ControlPoint[]>(cloneControlPoints(DEFAULT_CUBIC_BEZIER_POINTS));

const clampIndex = (index: number, length: number) => {
    if (length <= 0) {
        return 0;
    }

    return Math.min(Math.max(index, 0), length - 1);
};

const currentOperationMode = computed(() => {
    const option = operationModeOptions.value[clampIndex(selectedOperationMode.value, operationModeOptions.value.length)];
    return option?.value ?? 'fixed';
});

// 时间设置
const timeDuration = ref<InputOption[]>([
    {
        label: t('actionCharacter.durationMs'),
        value: 1000,
        type: 'number',
        disabled: false
    },
]);

watchEffect(() => {
    timeDuration.value[0].label = t('actionCharacter.durationMs');
});


// 点阵剔除效果开关
const useStippleEffect = ref(true);

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

// 是否选中角色
const isCharacterSelected = ref(false);

// 当前选中的角色信息
const currentCharacter = computed(() => {
    if (action.maxCharacter.length > 0 && selectedCharacterIndex.value < action.maxCharacter.length) {
        // 发生变化时更新当前角色 先去除轮廓
        applyOutlineToSpine(currentCharacter.value?.spine, false);
        // 应用轮廓到新角色
        applyOutlineToSpine(action.maxCharacter[selectedCharacterIndex.value].spine, true);
        const newCharacter = action.maxCharacter[selectedCharacterIndex.value];

        console.log("当前角色:", currentCharacter.value?.character.characterName);
        console.log("新角色:", newCharacter.character.characterName);

        // 当角色发生变化时，更新 targetState 为当前角色的位置
        if (newCharacter && newCharacter.spine) {
            if (isCharacterSelected.value) {
                console.log("选择角色索引:", "AAA");

                targetState.value.x = newCharacter.spine.x;
                targetState.value.y = newCharacter.spine.y;
                targetState.value.scale = newCharacter.spine.scale.x;
            }
            // 同步更新到 targetStateOptions 显示
            targetStateOptions.value[0].value = Math.round(targetState.value.x);
            targetStateOptions.value[1].value = Math.round(targetState.value.y);
            targetStateOptions.value[2].value = parseFloat(targetState.value.scale.toFixed(2));
        }

        console.log("选择角色索引:", "cesF");
        isCharacterSelected.value = false;
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

// 角色选择变化处理
const onSelectCharacter = (index: number) => {
    index = clampIndex(index, action.maxCharacter.length);
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
    isCharacterSelected.value = true;

    // 获取新选择的角色
    const newCharacter = action.maxCharacter[index];

    // 为新角色应用轮廓和 TransformGizmo
    if (newCharacter?.spine) {
        applyOutlineToSpine(newCharacter.spine, true);

        // 重新附加并显示 TransformGizmo
        transformGizmo.attachToSpine(newCharacter.spine);
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

    updateCharacterInfo();
}

// 操作模式选择处理
const onSelectOperationMode = (index: number) => {
    selectedOperationMode.value = clampIndex(index, operationModeOptions.value.length);
};

// 缓动函数选择处理
const onSelectEaseOption = (index: number) => {
    selectedEaseOption.value = clampIndex(index, easingFunctionOptions.value.length);
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
const applyToScene = async () => {
    if (!currentCharacter.value) return;

    const spine = currentCharacter.value.spine;
    console.log("引用角色:", spine);


    if (spine) {
        const operationMode = currentOperationMode.value;

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
            await runCharacterTween(spine);
        } else if (operationMode === 'show') {
            // 显示模式：根据开关决定是否使用点阵透明度效果
            spine.visible = true;
            spine.alpha = 1;

            if (useStippleEffect.value) {
                // 使用点阵透明度效果
                spine.run(Action.moveBy(0, -30, 1).easeInOut());

                // 创建点阵透明度滤镜，初始透明度为0，调整点阵大小为3让效果更细腻
                const stippleFilter = createStippleTransparencyFilter(0, 2.32);

                // 应用滤镜（保留现有滤镜）
                const existingFilters = spine.filters || [];
                spine.filters = [...existingFilters, stippleFilter];

                // 使用动画逐渐增加透明度，实现填满效果
                const startTime = Date.now();
                const duration = 1432; // 调整为1200ms

                const animateStipple = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeInOut动画
                    let easedProgress;
                    if (progress < 0.5) {
                        easedProgress = 2 * progress * progress;
                    } else {
                        easedProgress = 1 - 2 * Math.pow(1 - progress, 2);
                    }
                    stippleFilter.uniforms.uTransparency = easedProgress;

                    if (progress < 1) {
                        requestAnimationFrame(animateStipple);
                    } else {
                        // 动画完成后移除stippleFilter，保留其他滤镜
                        const currentFilters = spine.filters || [];
                        spine.filters = currentFilters.filter(filter => filter !== stippleFilter);
                        spine.alpha = 1;
                    }
                };

                requestAnimationFrame(animateStipple);
            } else {
                // 不使用点阵效果，使用透明度shader
                spine.visible = true;
                spine.alpha = 1;


                // 创建透明度滤镜，初始透明度为0
                const alphaFilter = createAlphaFilter(0);

                // 应用滤镜（保留现有滤镜）
                const existingFilters = spine.filters || [];
                spine.filters = [...existingFilters, alphaFilter];

                // 使用动画逐渐增加透明度
                const startTime = Date.now();
                const duration = 1000;

                const animateAlpha = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeInOut动画
                    let easedProgress;
                    if (progress < 0.5) {
                        easedProgress = 2 * progress * progress;
                    } else {
                        easedProgress = 1 - 2 * Math.pow(1 - progress, 2);
                    }
                    alphaFilter.uniforms.uAlpha = easedProgress;

                    if (progress < 1) {
                        requestAnimationFrame(animateAlpha);
                    } else {
                        // 动画完成后移除alphaFilter，保留其他滤镜
                        const currentFilters = spine.filters || [];
                        spine.filters = currentFilters.filter(filter => filter !== alphaFilter);
                        spine.alpha = 1;
                    }
                };

                requestAnimationFrame(animateAlpha);
            }

            // 保存修改
            saveVisibilityModification(true, 1);
        } else if (operationMode === 'hide') {
            // 隐藏模式：根据开关决定是否使用反向点阵透明度效果
            if (useStippleEffect.value) {
                // 使用反向点阵透明度效果
                spine.visible = true;
                spine.alpha = 1; // 保持spine本身完全不透明


                // 创建点阵透明度滤镜，初始透明度为1（完全显示），调整点阵大小
                const stippleFilter = createStippleTransparencyFilter(1, 2.32);

                // 应用滤镜（保留现有滤镜）
                const existingFilters = spine.filters || [];
                spine.filters = [...existingFilters, stippleFilter];

                // 使用动画逐渐减少透明度，实现消失效果
                const startTime = Date.now();
                const duration = 1000; // 与显示模式保持一致的时长

                const animateStipple = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeInOut动画
                    let easedProgress;
                    if (progress < 0.5) {
                        easedProgress = 2 * progress * progress;
                    } else {
                        easedProgress = 1 - 2 * Math.pow(1 - progress, 2);
                    }

                    // 反向：从1逐渐减少到0
                    stippleFilter.uniforms.uTransparency = 1 - easedProgress;

                    if (progress < 1) {
                        requestAnimationFrame(animateStipple);
                    } else {
                        // 动画完成后移除stippleFilter并隐藏角色
                        const currentFilters = spine.filters || [];
                        spine.filters = currentFilters.filter(filter => filter !== stippleFilter);
                        spine.visible = false;
                        spine.alpha = 0;
                    }
                };

                requestAnimationFrame(animateStipple);
            } else {
                // 不使用点阵效果，使用透明度shader
                spine.visible = true;
                spine.alpha = 1;

                spine.run(Action.moveBy(0, 30, 1).easeInOut());

                // 创建透明度滤镜，初始透明度为1（完全显示）
                const alphaFilter = createAlphaFilter(1);

                // 应用滤镜（保留现有滤镜）
                const existingFilters = spine.filters || [];
                spine.filters = [...existingFilters, alphaFilter];

                // 使用动画逐渐减少透明度
                const startTime = Date.now();
                const duration = 1432;

                const animateAlpha = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // 使用easeInOut动画
                    let easedProgress;
                    if (progress < 0.5) {
                        easedProgress = 2 * progress * progress;
                    } else {
                        easedProgress = 1 - 2 * Math.pow(1 - progress, 2);
                    }

                    // 反向：从1逐渐减少到0
                    alphaFilter.uniforms.uAlpha = 1 - easedProgress;

                    if (progress < 1) {
                        requestAnimationFrame(animateAlpha);
                    } else {
                        // 动画完成后移除alphaFilter并隐藏角色
                        const currentFilters = spine.filters || [];
                        spine.filters = currentFilters.filter(filter => filter !== alphaFilter);
                        spine.visible = false;
                        spine.alpha = 0;
                    }
                };

                requestAnimationFrame(animateAlpha);
            }

            // 保存修改
            saveVisibilityModification(false, 0);
        }
    }
};



// 执行角色补间动画
const runCharacterTween = (spine: any): Promise<void> => {
    return new Promise((resolve) => {

        const targetX = targetState.value.x;
        const targetY = targetState.value.y;
        const targetScale = targetState.value.scale;

        const duration = timeDuration.value[0].value || 400;

        // 获取缓动函数
        let easingFunction: (t: number) => number;

        if (customCurve.value) {
            // 角色补间使用 progress easing，保证控制点 x/y 都真正参与计算
            easingFunction = createProgressBezierEasing(points.value);
        } else {
            // 使用预设的缓动函数
            const selectedEasing = easingFunctionOptions.value[clampIndex(selectedEaseOption.value, easingFunctionOptions.value.length)];
            easingFunction = Timing[selectedEasing.value];
        }


        // 使用 pixijs-actions 创建补间动画
        const moveAction = Action.group([
            Action.moveTo(targetX, targetY, duration / 1000).setTiming(easingFunction),
            Action.scaleTo(targetScale, duration / 1000).setTiming(easingFunction)
        ]);

        setTimeout(() => {
            lastCharacter.value = { ...targetState.value };

            // 保存修改
            saveModification();

            resolve();
        }, duration);

        // 运行动画
        spine.run(moveAction);
    });
};
// 执行角色操作的主函数
const targetAction = async () => {
    handleSceneState(canvas, props);

    if (currentCharacter.value) {
        const characterPreview = actionStore.previewSnapshot.characters.get(currentCharacter.value?.character.characterName);
        console.log("characterPreview:", characterPreview);
        currentCharacter.value.spine.x = characterPreview?.x || currentCharacter.value.spine.x;
        currentCharacter.value.spine.y = characterPreview?.y || currentCharacter.value.spine.y;
        currentCharacter.value.spine.scale.set(characterPreview?.scale || currentCharacter.value.spine.scale.x);
    }

    if (action.maxCharacter.length > 0 && selectedCharacterIndex.value < action.maxCharacter.length) {
        // const currentCharacter = action.maxCharacter[selectedCharacterIndex.value];

        // 应用角色操作
        const operationMode = currentOperationMode.value;
        if (operationMode === 'fixed') {
            // 固定模式
            applyToScene();
        } else if (operationMode === 'tween') {
            // 补间模式
            await applyToScene();
        } else if (operationMode === 'show' || operationMode === 'hide') {
            // 显示/隐藏模式
            applyToScene();
        }
    }
};


watchEffect(() => {
    // 监听 targetState 变化，同步更新到 targetStateOptions
    console.log("targetStateOptions.value:", targetStateOptions.value);
});

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

// 保存可见性修改
const saveVisibilityModification = (_visible: boolean, _alpha: number) => {
    if (!currentCharacter.value || !modification) return;
};

// 序列化方法
const serialization = () => {
    return {
        character: {
            selectedCharacterIndex: selectedCharacterIndex.value,
            operationMode: currentOperationMode.value,
            useStippleEffect: useStippleEffect.value,
            targetState: {
                x: targetState.value.x,
                y: targetState.value.y,
                scale: targetState.value.scale
            },
            tweenSettings: {
                duration: timeDuration.value[0].value || 400,
                customCurve: customCurve.value,
                selectedEaseOption: selectedEaseOption.value,
                points: cloneControlPoints(points.value)
            },
            targetStateOptions: targetStateOptions.value.map(option => ({
                label: option.label,
                value: option.value,
                type: option.type,
                disabled: option.disabled
            })),
            timeDuration: timeDuration.value.map(option => ({
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
        selectedCharacterIndex.value = clampIndex(characterData.selectedCharacterIndex, action.maxCharacter.length);
    }

    // 恢复操作模式
    if (characterData.operationMode) {
        const modeIndex = operationModeOptions.value.findIndex(mode => mode.value === characterData.operationMode);
        if (modeIndex !== -1) {
            selectedOperationMode.value = modeIndex;
        }
    }

    // 恢复点阵效果开关
    if (characterData.useStippleEffect !== undefined) {
        useStippleEffect.value = characterData.useStippleEffect;
    }



    // 恢复补间设置
    if (characterData.tweenSettings) {
        // 恢复持续时间
        if (characterData.tweenSettings.duration !== undefined) {
            timeDuration.value[0].value = characterData.tweenSettings.duration;
        }

        // 恢复自定义缓动曲线设置
        if (characterData.tweenSettings.customCurve !== undefined) {
            customCurve.value = characterData.tweenSettings.customCurve;
        }

        // 恢复选中的缓动选项
        if (characterData.tweenSettings.selectedEaseOption !== undefined) {
            selectedEaseOption.value = clampIndex(characterData.tweenSettings.selectedEaseOption, easingFunctionOptions.value.length);
        }

        // 恢复自定义缓动曲线点
        if (characterData.tweenSettings.points) {
            points.value = cloneControlPoints(characterData.tweenSettings.points);
        }
    }

    // // 恢复目标状态选项
    // if (characterData.targetStateOptions && characterData.targetStateOptions.length === targetStateOptions.value.length) {
    //     // 使用响应式方式更新数组
    //     targetStateOptions.value = targetStateOptions.value.map((option, index) => {
    //         const savedOption = characterData.targetStateOptions[index];
    //         if (savedOption) {
    //             return {
    //                 ...option,
    //                 value: savedOption.value,
    //                 disabled: savedOption.disabled
    //             };
    //         }
    //         return option;
    //     });
    // }

    // 恢复时间持续时间选项
    if (characterData.timeDuration && characterData.timeDuration.length === timeDuration.value.length) {
        characterData.timeDuration.forEach((option: any, index: number) => {
            if (timeDuration.value[index]) {
                timeDuration.value[index].value = option.value;
                timeDuration.value[index].disabled = option.disabled;
            }
        });
    }



    // 恢复目标状态
    if (characterData.targetState) {
        targetState.value = {
            x: characterData.targetState.x || 0,
            y: characterData.targetState.y || 0,
            scale: characterData.targetState.scale || 1
        };
        console.log("targetState.value:", targetState.value);

        // 同步更新到 targetStateOptions 显示
        targetStateOptions.value[0].value = Math.round(targetState.value.x);
        targetStateOptions.value[1].value = Math.round(targetState.value.y);
        targetStateOptions.value[2].value = parseFloat(targetState.value.scale.toFixed(2));
    }
};


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
            console.log("TransformGizmo 位置更新:", x, y, scale);
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

    // 初始化角色信息
    updateCharacterInfo();

    deserialization(currentActionItem);


    // 设置 Spine 点击回调，当点击场景中的 Spine 对象时切换选择
    canvas.setSpineClickCallback(props.id, (_spine: Spine, characterInfo: sceneCharacter) => {
        // 只有在当前 ActionCharacter 组件被选中时才响应 Spine 点击
        if (isSelected.value) {
            // 查找被点击的 Spine 对应的角色索引
            const clickedCharacterIndex = action.maxCharacter.findIndex(
                (char) => char.character.characterName === characterInfo.character.characterName
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
