<template>
    <div class="action-item-main">
        <ActionItemHead content="🎥 操作摄像机" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content" v-show="!actionItem.isToggle">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                摄像机运动模式：
                <Tooltip position="left">
                    <div style="text-align: left;">
                        <div class="mode-description">
                            <div class="mode-item fixed-mode">
                                <strong>固定模式:</strong>
                                <p>摄像机<span>直接跳转</span>到指定位置</p>
                            </div>
                            <div class="mode-item tween-mode">
                                <strong>补间模式:</strong>
                                <p>摄像机<span>平滑过渡</span>到指定位置</p>
                            </div>
                        </div>
                    </div>
                </Tooltip>
            </div>

            <Dropdown v-model="selectedOption" @update:modelValue="onSelectModel" :options="CameraOperaMode"
                :disabled="false" />

            <ActionBottomLine></ActionBottomLine>

            <template v-if="currentCameraOperationMode === 'tween'">

                <div>
                    <DynamicInputs v-model="timeDuration" :columns="timeDuration.length">
                    </DynamicInputs>
                </div>

                <div class="action-title">
                    自定义缓动曲线
                    <ToggleSwitch v-model="customCurve"></ToggleSwitch>
                </div>
                <div v-if="customCurve">
                    <CustomEaseRender v-model="points" @update:callback="handleCallback"></CustomEaseRender>
                </div>

                <template v-else>
                    <div class="action-title">
                        缓动曲线
                        <Tooltip position="left">
                            <div class="mode-description">
                                指定参数随时间的变化率。
                            </div>
                        </Tooltip>
                    </div>

                    <Dropdown v-model="selectedEaseOption" @update:modelValue="onSelectModel"
                        :options="(easingFunctionOptions as any)" :disabled="false" />
                </template>
            </template>

            <template v-else>
                <div style="display: flex;justify-content: center;align-items: center;">
                    无内容
                </div>
            </template>

            <ActionBottomLine></ActionBottomLine>

            <!-- 结构问题 暂时不适用v-show -->
            <template v-if="currentCameraOperationMode === 'fixed'">
                <div class="action-title">
                    设置摄像机位置
                    <div @click="setCamera('fixed')" title="点击操控摄像机 开关">
                        🖐️
                    </div>
                </div>
                <div>
                    <DynamicInputs v-model="targetFixedCameraValues" :columns="targetFixedCameraValues.length">
                    </DynamicInputs>
                </div>
            </template>
            <template v-if="currentCameraOperationMode === 'tween'">
                <div class="action-title">
                    自定义起点位置
                    <ToggleSwitch v-model="isCustomOpen"></ToggleSwitch>
                </div>
                <div class="action-title" v-show="isCustomOpen">
                    设置摄像机自定义起点位置
                    <div @click="setCamera('tween-start')" title="点击操控摄像机 开关">
                        🖐️
                    </div>
                </div>
                <div v-show="isCustomOpen">
                    <DynamicInputs v-model="customSourceTweenCameraValues"
                        :columns="customSourceTweenCameraValues.length">
                    </DynamicInputs>
                </div>

                <div class="action-title">
                    设置摄像机结束位置
                    <div @click="setCamera('tween-end')" title="点击操控摄像机 开关">
                        🖐️
                    </div>
                </div>
                <div>
                    <DynamicInputs v-model="targetTweenCameraValues" :columns="targetTweenCameraValues.length">
                    </DynamicInputs>
                </div>
            </template>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect, onUnmounted } from 'vue';
import { handleSceneState, updateCameraView, useCommonState, updateCameraViewOnlyPos } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import CanvasManager from '../../../script/render/canvas-manager';
import Dropdown from '../../common/Dropdown.vue';
import { ActionItems, ControlPoint, DropdownOption, GameMode, InputOption } from '../../../types/app';
import Tooltip from '../../common/Tooltip.vue';
import DynamicInputs from '../../common/DynamicInputs.vue';
import massage from '../../../script/common/massage';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import CustomEaseRender from '../../common/render/CustomEaseRender.vue';
import { Point } from 'pixi.js';
import { setModification } from '../../../script/util/common';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import { EasingFunction, getEasingFunctionOptions } from '../../../script/camera-stand';
import { delay } from 'lodash';
import { useActionStore } from '../../../stores/action-store';
import { cloneControlPoints, DEFAULT_CUBIC_BEZIER_POINTS } from '../../../utils/cubic-bezier';
type modelCameraType = 'fixed' | 'tween-end' | 'tween-start' | 'none';

let canvas = CanvasManager.getInstance();
let viewport = canvas.viewport;

const customCurve = ref(false);

const selectedOption = ref(0);
const CameraOperaMode = ref<DropdownOption[]>([
    { label: "固定 (Fixed)", value: "fixed" },
    { label: "补间 (Tween)", value: "tween" }
])

const selectedEaseOption = ref(0)
// 使用类型安全的缓动函数配置
const easingFunctionOptions = ref(getEasingFunctionOptions());

const clampIndex = (index: number, length: number) => {
    if (length <= 0) {
        return 0;
    }

    return Math.min(Math.max(index, 0), length - 1);
};

const currentCameraOperationMode = computed(() => {
    const option = CameraOperaMode.value[clampIndex(selectedOption.value, CameraOperaMode.value.length)];
    return option?.value ?? 'fixed';
});

const selectedEaseValue = computed(() => {
    return easingFunctionOptions.value[clampIndex(selectedEaseOption.value, easingFunctionOptions.value.length)]?.value ?? EasingFunction.Linear
})

const isCustomOpen = ref(false)

const targetFixedCameraValues = ref<InputOption[]>([
    {
        label: 'x',
        value: viewport.center.x,
        type: 'number',
        disabled: true
    },
    {
        label: 'y',
        value: viewport.center.y,
        type: 'number',
        disabled: true
    },
    {
        label: "zoom",
        value: viewport.scale.x,
        type: 'text',
        disabled: true
    }
]);

const timeDuration = ref<InputOption[]>([
    {
        label: '持续时间(ms)',
        value: 400,
        type: 'number',
        disabled: false
    },
]);

const customSourceTweenCameraValues = ref<InputOption[]>([
    {
        label: 'x',
        value: viewport.center.x,
        type: 'number',
        disabled: true
    },
    {
        label: 'y',
        value: viewport.center.y,
        type: 'number',
        disabled: true
    },
    {
        label: 'zoom',
        value: viewport.scale.x,
        type: 'number',
        disabled: true
    }
]);

const targetTweenCameraValues = ref<InputOption[]>([
    {
        label: 'x',
        value: viewport.center.x,
        type: 'number',
        disabled: true
    },
    {
        label: 'y',
        value: viewport.center.y,
        type: 'number',
        disabled: true
    },
    {
        label: 'zoom',
        value: viewport.scale.x,
        type: 'number',
        disabled: true
    }
]);

const props = defineProps<{
    title: string,
    id: number,
}>();

const { action, actionItem } = useCommonState(props.title, props.id);
let modification: Map<PropertyPath, Modification>;

const points = ref<ControlPoint[]>(cloneControlPoints(DEFAULT_CUBIC_BEZIER_POINTS))

const handleCallback = (pointCallback: (t: number, b: number, c: number, d: number) => number) => {
    callback = pointCallback;
};

// const targetAction = async () => {
//     setCamera('none'); // 禁止操控input影响摄像机

//     canvas.initMask.alpha = 0;
//     handleSceneState(canvas, props);

//     if (CameraOperaMode.value[selectedOption.value].value === 'fixed') {
//         // 固定类型的实现
//         console.log("我的值是：", action.previewSnapshot.camera.y);
//         viewport.setZoom(targetFixedCameraValues.value[2].value);
//         viewport.moveCenter(targetFixedCameraValues.value[0].value, targetFixedCameraValues.value[1].value);
//         viewport.emit('moved')

//         modification.set('camera.x', {
//             path: 'camera.x',
//             value: targetFixedCameraValues.value[0].value
//         })
//         modification.set('camera.y', {
//             path: 'camera.y',
//             value: targetFixedCameraValues.value[1].value
//         })
//         modification.set('camera.zoom', {
//             path: 'camera.zoom',
//             value: targetFixedCameraValues.value[2].value
//         })
//     } else {
//         // 补间类型的实现

//         // 设置摄像机到上一个的状态初始状态 或自定义初始状态
//         if (isCustomOpen.value) {
//             viewport.setZoom(customSourceTweenCameraValues.value[2].value);
//             viewport.moveCenter(customSourceTweenCameraValues.value[0].value, customSourceTweenCameraValues.value[1].value);
//             viewport.emit('moved')
//         } else {
//             viewport.setZoom(action.previewSnapshot.camera.zoom);
//             viewport.moveCenter(action.previewSnapshot.camera.x, action.previewSnapshot.camera.y);
//             viewport.emit('moved')
//         }

//         // 用于跟踪动画是否被取消
//         let animationCancelled = false;

//         // 点击事件处理函数
//         const handleClick = () => {
//             if (!animationCancelled) {
//                 animationCancelled = true;
//                 // 移除动画插件，停止当前动画
//                 viewport.plugins.remove('animate');

//                 // 直接跳到目标位置
//                 const targetX = targetTweenCameraValues.value[0].value;
//                 const targetY = targetTweenCameraValues.value[1].value;
//                 const targetZoom = targetTweenCameraValues.value[2].value;

//                 viewport.setZoom(targetZoom);
//                 viewport.moveCenter(targetX, targetY);
//                 viewport.emit('moved');

//                 // 更新值并保存到快照
//                 const newX = Math.round(targetX * 10) / 10;
//                 const newY = Math.round(targetY * 10) / 10;

//                 targetTweenCameraValues.value[0].value = newX;
//                 targetTweenCameraValues.value[1].value = newY;
//                 targetTweenCameraValues.value[2].value = targetZoom;

//                 setModification(modification, 'camera.x', newX);
//                 setModification(modification, 'camera.y', newY);
//                 setModification(modification, 'camera.zoom', targetZoom);

//                 console.log('Camera animation cancelled by click, jumped to target position');

//                 // 移除点击事件监听器
//                 viewport.off('clicked', handleClick);
//             }
//         };

//         // 添加点击事件监听器
//         viewport.on('clicked', handleClick);

//         viewport.animate({
//             time: timeDuration.value[0].value ?? 100,
//             position: new Point(targetTweenCameraValues.value[0].value, targetTweenCameraValues.value[1].value),
//             scale: targetTweenCameraValues.value[2].value,
//             ease: customCurve.value ? callback : selectedEaseValue.value.toString(),
//             removeOnInterrupt: false, // 我们手动控制取消逻辑
//             // ease: "easeInOutBack",
//             callbackOnComplete: () => {
//                 // 只有在动画没有被取消的情况下才执行完成回调
//                 if (!animationCancelled) {
//                     const newX = Math.round(viewport.center.x * 10) / 10;
//                     const newY = Math.round(viewport.center.y * 10) / 10;
//                     viewport.moveCenter(newX, newY);
//                     targetTweenCameraValues.value[0].value = newX;
//                     targetTweenCameraValues.value[1].value = newY;

//                     targetTweenCameraValues.value[0].value = newX;
//                     targetTweenCameraValues.value[1].value = newY;
//                     targetTweenCameraValues.value[2].value = viewport.scale.x;

//                     setModification(modification, 'camera.x', newX);
//                     setModification(modification, 'camera.y', newY);
//                     setModification(modification, 'camera.zoom', viewport.scale.x);

//                     console.log('Camera animation completed normally');
//                 }

//                 // 移除点击事件监听器
//                 viewport.off('clicked', handleClick);
//             }
//         })
//     }
// }

const runCameraTween = (): Promise<void> => {

    return new Promise((resolve) => {
        let animationCancelled = false;

        const handleClick = () => {
            if (!animationCancelled) {
                animationCancelled = true;
                viewport.plugins.remove('animate');

                const targetX = targetTweenCameraValues.value[0].value;
                const targetY = targetTweenCameraValues.value[1].value;
                const targetZoom = targetTweenCameraValues.value[2].value;

                viewport.setZoom(targetZoom);
                viewport.moveCenter(targetX, targetY);
                viewport.emit('moved');

                setModification(modification, 'camera.x', targetX);
                setModification(modification, 'camera.y', targetY);
                setModification(modification, 'camera.zoom', targetZoom);

                console.log('Camera animation cancelled by click, jumped to target position');

                viewport.off('clicked', handleClick);
                resolve(); // 动画被中断，也算结束
            }
        };

        delay(() => {
            viewport.on('clicked', handleClick);
        }, 100);

        viewport.animate({
            time: timeDuration.value[0].value ?? 100,
            position: new Point(
                targetTweenCameraValues.value[0].value,
                targetTweenCameraValues.value[1].value
            ),
            scale: targetTweenCameraValues.value[2].value,
            ease: customCurve.value ? callback : selectedEaseValue.value.toString(),
            removeOnInterrupt: false,
            callbackOnComplete: () => {
                if (!animationCancelled) {
                    const newX = Math.round(viewport.center.x * 10) / 10;
                    const newY = Math.round(viewport.center.y * 10) / 10;
                    viewport.moveCenter(newX, newY);

                    targetTweenCameraValues.value[0].value = newX;
                    targetTweenCameraValues.value[1].value = newY;
                    targetTweenCameraValues.value[2].value = viewport.scale.x;

                    setModification(modification, 'camera.x', newX);
                    setModification(modification, 'camera.y', newY);
                    setModification(modification, 'camera.zoom', viewport.scale.x);

                    console.log('Camera animation completed normally');
                }

                viewport.off('clicked', handleClick);
                resolve(); // 动画正常完成
            }
        });
    });
};

const targetAction = async () => {
    setCamera('none');
    // 这句话会导致如果第二个是操作摄像机会导致initMask出问题 
    // canvas.initMask.alpha = 0;
    handleSceneState(canvas, props);

    viewport.setZoom(action.previewSnapshot.camera.zoom);
    viewport.moveCenter(
        action.previewSnapshot.camera.x,
        action.previewSnapshot.camera.y
    );
    viewport.emit('moved');
    viewport.emit('zoomed');

    if (currentCameraOperationMode.value === 'fixed') {
        // 固定类型，直接设置值
        viewport.setZoom(targetFixedCameraValues.value[2].value);
        viewport.moveCenter(
            targetFixedCameraValues.value[0].value,
            targetFixedCameraValues.value[1].value
        );
        viewport.emit('moved');
        viewport.emit('zoomed');


        setModification(modification, 'camera.x', targetFixedCameraValues.value[0].value);
        setModification(modification, 'camera.y', targetFixedCameraValues.value[1].value);
        setModification(modification, 'camera.zoom', targetFixedCameraValues.value[2].value);
    } else {
        // 补间类型，await 动画结束
        await runCameraTween();
    }

    console.log("✅ targetAction 执行完毕，可以继续下一步逻辑");
};

const actionStore = useActionStore()
const isSelectedCurrentActionItem = ref(false);



const currentCameraModel = ref<modelCameraType>('none');

const setCamera = (type: modelCameraType) => {
    console.log('setCamera', type);
    // 将摄像机的值设置到当前的值上
    if (type == 'fixed') {
        viewport.setZoom(targetFixedCameraValues.value[2].value);
        viewport.moveCenter(targetFixedCameraValues.value[0].value, targetFixedCameraValues.value[1].value);
        viewport.emit('moved')
    } else if (type == 'tween-end') {
        viewport.setZoom(targetTweenCameraValues.value[2].value);
        viewport.moveCenter(targetTweenCameraValues.value[0].value, targetTweenCameraValues.value[1].value);
        viewport.emit('moved')
    } else if (type == 'tween-start') {
        viewport.setZoom(customSourceTweenCameraValues.value[2].value);
        viewport.moveCenter(customSourceTweenCameraValues.value[0].value, customSourceTweenCameraValues.value[1].value);
        viewport.emit('moved')
    } else {
        if (canvas.getMode() !== GameMode.PLAY) {
            canvas.setMode(GameMode.PREVIEW, false);
        }
        return;
    }

    if (currentCameraModel.value !== type) {
        currentCameraModel.value = type;
        canvas.setMode(GameMode.SCENE, false);
        massage(`场景模式-${type}`, 'info', 3000);
        return;
    }

    currentCameraModel.value = type;

    if (canvas.getMode() == GameMode.SCENE) {
        canvas.setMode(GameMode.PREVIEW, false);
        massage(`预览模式-${type}`, 'info', 3000);
        console.log("设置预览模式");
    } else if (canvas.getMode() == GameMode.PREVIEW) {
        massage(`场景模式-${type}`, 'info', 3000);
        canvas.setMode(GameMode.SCENE, false);
        console.log("设置场景模式");
    }

}

const onSelectModel = () => {
    setCamera('none');
}

// 默认缓动函数 liner
let callback: (t: number, b: number, c: number, d: number) => number = (
    t,
    b,
    c,
    d
) => {
    return b + (c * t) / d;
};

// 序列化方法 - 保存组件数据
const serialization = () => {
    return {
        selectedOption: selectedOption.value,
        selectedEaseOption: selectedEaseOption.value,
        customCurve: customCurve.value,
        isCustomOpen: isCustomOpen.value,
        targetFixedCameraValues: targetFixedCameraValues.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        timeDuration: timeDuration.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        customSourceTweenCameraValues: customSourceTweenCameraValues.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        targetTweenCameraValues: targetTweenCameraValues.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        points: points.value.map(point => ({
            x: point.x,
            y: point.y
        }))
    };
};

// 反序列化方法 - 加载组件数据
const deserialization = (data: ActionItems) => {
    const actionData = data.actionData;
    if (!actionData) {
        return;
    }
    console.log("deserialization", actionData)
    if (actionData) {
        if (typeof actionData.selectedOption === 'number') {
            selectedOption.value = clampIndex(actionData.selectedOption, CameraOperaMode.value.length);
        }

        if (typeof actionData.selectedEaseOption === 'number') {
            selectedEaseOption.value = clampIndex(actionData.selectedEaseOption, easingFunctionOptions.value.length);
        }

        if (typeof actionData.customCurve === 'boolean') {
            customCurve.value = actionData.customCurve;
        }

        if (typeof actionData.isCustomOpen === 'boolean') {
            isCustomOpen.value = actionData.isCustomOpen;
        }

        if (Array.isArray(actionData.targetFixedCameraValues)) {
            // 更新现有数组的属性，而不是重新创建数组
            actionData.targetFixedCameraValues.forEach((setting: any, index: number) => {
                if (targetFixedCameraValues.value[index]) {
                    targetFixedCameraValues.value[index].label = setting.label || '';
                    targetFixedCameraValues.value[index].value = setting.value || 0;
                    targetFixedCameraValues.value[index].type = setting.type || 'number';
                    targetFixedCameraValues.value[index].disabled = setting.disabled || false;
                }
            });
        }

        if (Array.isArray(actionData.timeDuration)) {
            // 更新现有数组的属性，而不是重新创建数组
            actionData.timeDuration.forEach((setting: any, index: number) => {
                if (timeDuration.value[index]) {
                    timeDuration.value[index].label = setting.label || '持续时间(ms)';
                    timeDuration.value[index].value = setting.value || 400;
                    timeDuration.value[index].type = setting.type || 'number';
                    timeDuration.value[index].disabled = setting.disabled || false;
                }
            });
        }

        if (Array.isArray(actionData.customSourceTweenCameraValues)) {
            // 更新现有数组的属性，而不是重新创建数组
            actionData.customSourceTweenCameraValues.forEach((setting: any, index: number) => {
                if (customSourceTweenCameraValues.value[index]) {
                    customSourceTweenCameraValues.value[index].label = setting.label || '';
                    customSourceTweenCameraValues.value[index].value = setting.value || 0;
                    customSourceTweenCameraValues.value[index].type = setting.type || 'number';
                    customSourceTweenCameraValues.value[index].disabled = setting.disabled || false;
                }
            });
        }

        if (Array.isArray(actionData.targetTweenCameraValues)) {
            // 更新现有数组的属性，而不是重新创建数组
            actionData.targetTweenCameraValues.forEach((setting: any, index: number) => {
                if (targetTweenCameraValues.value[index]) {
                    targetTweenCameraValues.value[index].label = setting.label || '';
                    targetTweenCameraValues.value[index].value = setting.value || 0;
                    targetTweenCameraValues.value[index].type = setting.type || 'number';
                    targetTweenCameraValues.value[index].disabled = setting.disabled || false;
                }
            });
        }

        if (Array.isArray(actionData.points)) {
            points.value = cloneControlPoints(actionData.points);
        }
    }
};

onMounted(() => {
    // 想action中注册回调和序列化方法
    actionItem.action = targetAction;
    actionItem.serialize = serialization;
    modification = action.getCurrentModification(props.title, props.id);

    // 反序列化数据
    deserialization(actionItem);



    viewport.on('drag-end', () => {
        if (canvas.getMode() != GameMode.SCENE) return;

        // 这个事件只会在这里触发
        if (action.eqSelectActionItem(props.title, props.id)) {
            console.log("拖拽事件触发", Date.now());
            if (currentCameraModel.value === 'fixed') {
                updateCameraViewOnlyPos(viewport, targetFixedCameraValues, modification)
            } else if (currentCameraModel.value === 'tween-end') {
                updateCameraViewOnlyPos(viewport, targetTweenCameraValues, modification)
            } else if (currentCameraModel.value === 'tween-start') {
                updateCameraViewOnlyPos(viewport, customSourceTweenCameraValues, modification)
            } else if (currentCameraModel.value === 'none') {

            }
        }
    })

    viewport.on('zoomed-end', (_e) => {
        if (canvas.getMode() != GameMode.SCENE) return;

        if (action.eqSelectActionItem(props.title, props.id)) {
            if (currentCameraModel.value === 'fixed') {
                updateCameraView(viewport, targetFixedCameraValues, modification)
            } else if (currentCameraModel.value === 'tween-end') {
                updateCameraView(viewport, targetTweenCameraValues, modification)
            } else if (currentCameraModel.value === 'tween-start') {
                updateCameraView(viewport, customSourceTweenCameraValues, modification)
            } else if (currentCameraModel.value === 'none') {

            }
        }
    })
})

// 清理事件监听器
onUnmounted(() => {
    // 移除所有相关的事件监听器
    viewport.off('drag-end');
    viewport.off('zoomed-end');
})

// 是否选中了 当前操作项
watchEffect(() => {
    isSelectedCurrentActionItem.value = actionStore.currentSelectActionTitle == props.title && actionStore.currentSelectActionItemId == props.id;

    if (isSelectedCurrentActionItem.value) {
        // handleSceneState(canvas, props);
        // 如果选中了当前项, 则设置摄像机为目标
        if (currentCameraOperationMode.value === 'fixed') {
            viewport.setZoom(targetFixedCameraValues.value[2].value);
            viewport.moveCenter(targetFixedCameraValues.value[0].value, targetFixedCameraValues.value[1].value);
            viewport.emit('moved')
            viewport.emit('zoomed');

        } else {
            viewport.setZoom(targetTweenCameraValues.value[2].value);
            viewport.moveCenter(targetTweenCameraValues.value[0].value, targetTweenCameraValues.value[1].value);
            viewport.emit('moved')
            viewport.emit('zoomed');
        }

        // updateCameraIndicators();
        // currentCameraModel.value = "none"
    }
});

</script>

<style lang="css" scoped>
.mode-item {
    margin-bottom: 5px;
}

.mode-item p {
    text-indent: 1em;
}

.mode-item p span {
    color: var(--button-bg);
    font-style: normal;
}

.mode-item strong {
    font-size: 1.1em;
    font-weight: bold;
}

.mode-item p {
    margin-top: 5px;
}
</style>
