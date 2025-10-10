<template>
    <div class="action-item-main">
        <ActionItemHead content="🎬 场景初始化" :is-hover="true" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content" v-show="!actionItem.isToggle">
            <!-- <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div> -->
            <div class="action-title">
                开屏过渡
                <ToggleSwitch v-model="fade"></ToggleSwitch>
            </div>
            <div class="action-title">
                摄像机的初始位置
                <span class="re-load" @click="reLoad" title="恢复初始值"> ↻ </span>
            </div>
            <DynamicInputs :onBlur="handleBlur" :onChange="handleChange" v-model="cameraValues"
                :columns="cameraValues.length" />
            <div class="action-title">
                设置背景
            </div>
            <div class="select-background">
                <img :src="backgroundUrl === '' ? '/img/sprite/CommanderRoom.png' : backgroundUrl" width="50%" alt=""
                    srcset="" />

                <div class="background-tool">
                    {{ currentBackground.name }}
                    <div class="tool-edit">
                        <div @click.stop="selectBackground" title="切换背景">🖌</div>
                    </div>
                </div>
            </div>
            <DynamicInputs :onBlur="handleParallaxFactorBlur" :max="1" :min="0" :step="0.01"
                v-model="backgroundParallaxFactorValues" :columns="backgroundParallaxFactorValues.length" />
            <div class="action-title">
                设置角色初始位置
                <Tooltip position="left">
                    <div>
                        场景刚开始的<span style="color: var(--button-bg);">角色站位</span>
                        <div>按住 <span style="color: var(--button-bg);">Shift</span> 键水平移动</div>
                        <div>按住 <span style="color: var(--button-bg);">Ctrl</span> 键垂直移动</div>
                    </div>
                </Tooltip>
            </div>
            <div class="select-character">
                <!-- <div style="margin-bottom: 5px;">{{ t(item.character.characterName) }}</div>
                <CharacterItem type="x" style="margin-bottom: 5px;" :default-offset="viewport.worldWidth / item.x * 100"
                    :character="item" @position-changed="onChangeX(index, $event)">
                </CharacterItem>
                <CharacterItem type="y" style="margin-bottom: 5px;"
                    :default-offset="viewport.worldHeight / (item.y - 100) * 100" :character="item"
                    @position-changed="onChangeY(index, $event)">
                </CharacterItem> -->
                <div class="character-item-list" v-for="(item, index) in action.maxCharacter" :key="index">
                    <div class="character-header">
                        <div class="character-name">{{ t(item.character.characterName) }}</div>
                        <div class="drag-handle" @mousedown="startDrag($event, index)"
                            title="拖拽调整位置 (Shift: 水平, Ctrl: 垂直)">
                            <span>⋮⋮</span>
                        </div>
                    </div>
                    <!-- 输入数值的方式 -->
                    <div class="position-inputs">
                        <div class="position-input">
                            <label>X:</label>
                            <input style="flex: 1;outline: none;border: 1px solid #ffffff11;" type="number"
                                v-model.number="item.x" @change="updateCharacterPosition(index)" />
                        </div>
                        <div class="position-input">
                            <label>Y:</label>
                            <input style="flex: 1;outline: none;border: 1px solid #ffffff11;" type="number"
                                v-model.number="item.y" @change="updateCharacterPosition(index)" />
                        </div>
                    </div>
                    动画：
                    <Dropdown v-model="item.selectAnimation" :options="item.animationOption"
                        @update:modelValue="onSelectAnimation(index)" :disabled="false"></Dropdown>

                    <div class="character-control char-init">
                        是否初始化显示：

                        <ToggleSwitch v-model="item.isInitShow" @update:modelValue="onInitShowChange(index, $event)">
                        </ToggleSwitch>
                    </div>
                </div>


                <!-- <div  v-for="(item, index) in maxCharacter" :key="index"
                    class="character-item">
                    <div class="character-control">
                        | |
                    </div>
                    {{ item.character.characterName }}
                    <span>[x: {{ item.x }} y: {{ item.y }} scale: {{ item.scale }}]</span>
                </div> -->

                <div class="character-item"
                    style="display: flex;justify-content: center;align-items: center;background-color: transparent;">
                    <div class="character-add" @click="addCharacter">添加角色到场景</div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ActionItemHead from './ActionItemHead.vue';
import CanvasManager from '../../../script/render/canvas-manager';
import { setModification } from '../../../script/util/common';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { ASSET_CHARACTER, DEFAULT_SPINE_SCALE, ResType } from '../../../script/var';
import { selectCharacterType, selectImageType } from '../../../script/common/search-action';
import { handleSceneState, useCommonState } from '../../../script/common/common-action-item';
import { ActionItems, GameMode, InputOption, LoadRes } from '../../../types/app';

import { Texture } from 'pixi.js';
import { Action } from 'pixijs-actions';
import ResourceManager from '../../../script/resource-manager';
import Tooltip from '../../common/Tooltip.vue';
import Dropdown from '../../common/Dropdown.vue';
import { useI18n } from 'vue-i18n';
import { useViewportStore } from '../../../stores/viewport-store';

const canvasManager = CanvasManager.getInstance();
let viewport = canvasManager.viewport;
let modification: Map<PropertyPath, Modification>;

const { t } = useI18n();

const props = defineProps<{
    title: string,
    id: number
}>();

// 拿到一些共同的属性
const { action, actionItem } = useCommonState(props.title, props.id);





// 用于控制初始化场景的黑幕显影
const fade = ref<boolean>(true);

// 默认的图片
const currentBackground = ref<LoadRes>({
    name: "CommanderRoom.png",
    path: "resources\\image\\Background\\CommanderRoom.png",
    type: ResType.Image
})

// 去设置默认的图片
action.addLoadResAsync(currentBackground.value).then(() => {
    canvasManager.setBackground(currentBackground.value.path, 0.9)
    targetAction()
})

const backgroundUrl = ref('');

const cameraValues = ref<InputOption[]>([
    {
        label: 'x',
        value: viewport.center.x,
        type: 'number',
        disabled: false
    },
    {
        label: 'y',
        value: viewport.center.y,
        type: 'number',
        disabled: false
    },
    {
        label: "zoom",
        value: viewport.scale.x,
        type: 'text',
        disabled: true
    }
]);

useViewportStore()

const backgroundParallaxFactorValues = ref<InputOption[]>([
    {
        label: '视差因子',
        value: 0.9,
        type: 'number',
        disabled: false
    }
])

const selectBackground = () => {
    selectImageType().then(res => {
        console.log("选择的图片：", res.path);

        if (res.path == currentBackground.value.path) {
            return;
        }

        const texture = ResourceManager.getResource<Texture>(res.path, ResType.Image);

        if (!texture) {
            console.warn("加载的纹理对象不存在");
            return;
        }

        // 其实还可以使用纹理的 id 去拿到url 但是这里 看情况在使用
        console.log("URL:", texture.textureCacheIds[0]);
        currentBackground.value = res;
        backgroundUrl.value = ResourceManager.allResUrl[res.path] || '';

        // 设置变化
        setModification(modification, 'background.image', res.path);
        setModification(modification, 'background.parallax', backgroundParallaxFactorValues.value[0].value);
        canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value)
    });
}

const addCharacter = () => {
    selectCharacterType().then((res) => {
        console.log("添加的角色：", res);
        let obj = {
            character: res,
            x: viewport.worldWidth / 2,
            y: viewport.worldHeight + 200,
            scale: DEFAULT_SPINE_SCALE,
            isInitShow: true,
        }

        setModification(modification, `characters.${res.path?.name}.x`, obj.x, "add");
        setModification(modification, `characters.${res.path?.name}.y`, obj.y, "add");
        setModification(modification, `characters.${res.path?.name}.scale`, obj.scale, "add");
        // 组装key
        const key = ASSET_CHARACTER + res.path?.name + "/" + res.path?.skel;
        // 添加角色
        canvasManager.addCharacterSpine(key, obj);
    })
}

const onSelectAnimation = (index: number) => {
    const char = action.maxCharacter[index];
    const ani = char.animationOption[char.selectAnimation].label;

    console.log("选择的动画：", ani);
    char.spine.state.setAnimation(0, ani, true);
}

const onInitShowChange = (index: number, value: boolean) => {
    const character = action.maxCharacter[index];
    character.isInitShow = value;

    // 确保角色存在且有Spine对象
    if (character && character.spine) {
        // 设置角色是否可见
        character.spine.visible = value;
    }
}


// 更新角色位置的函数（替换原来的 onChangeX 和 onChangeY）
const updateCharacterPosition = (index: number) => {
    const character = action.maxCharacter[index];

    // 确保值为数字并四舍五入到一位小数
    character.x = Math.round(character.x * 10) / 10;
    character.y = Math.round(character.y * 10) / 10;

    // 更新角色的位置
    if (character.spine) {
        character.spine.x = character.x;
        character.spine.y = character.y; // 保持与原来的偏移一致
    }

    // 修改值
    setModification(modification, `characters.${character.character.path?.name}.x`, character.x);
    setModification(modification, `characters.${character.character.path?.name}.y`, character.y);
    setModification(modification, `characters.${character.character.path?.name}.scale`, character.scale);
}

// 拖拽相关变量
let isDragging = false;
let draggedCharacterIndex = -1;
let dragStartX = 0;
let dragStartY = 0;
let isShiftPressed = false;
let isCtrlPressed = false;
let lastDeltaX = 0;
let lastDeltaY = 0;
let dragMode = 'free'; // 'free', 'horizontal', 'vertical'

// 开始拖拽
const startDrag = (event: MouseEvent, index: number) => {
    // 检查当前按键状态
    isShiftPressed = event.shiftKey;
    isCtrlPressed = event.ctrlKey;

    // 设置初始拖拽模式
    if (isShiftPressed && !isCtrlPressed) {
        dragMode = 'horizontal';
    } else if (isCtrlPressed && !isShiftPressed) {
        dragMode = 'vertical';
    } else {
        dragMode = 'free';
    }

    isDragging = true;
    draggedCharacterIndex = index;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastDeltaX = 0;
    lastDeltaY = 0;

    // 添加事件监听
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 防止事件冒泡和默认行为
    event.preventDefault();
    event.stopPropagation();
};

// 键盘按下事件
const onKeyDown = (event: KeyboardEvent) => {
    // 只在拖拽过程中处理键盘事件
    if (!isDragging) return;

    const oldShiftState = isShiftPressed;
    const oldCtrlState = isCtrlPressed;

    if (event.key === 'Shift') {
        isShiftPressed = true;
    } else if (event.key === 'Control') {
        isCtrlPressed = true;
    }

    // 如果修饰键状态改变，更新拖拽模式
    if (oldShiftState !== isShiftPressed || oldCtrlState !== isCtrlPressed) {
        if (isShiftPressed && !isCtrlPressed) {
            dragMode = 'horizontal';
        } else if (isCtrlPressed && !isShiftPressed) {
            dragMode = 'vertical';
        } else {
            dragMode = 'free';
        }

        // 重置累积的增量，避免突然跳变
        lastDeltaX = 0;
        lastDeltaY = 0;
    }
};

// 键盘释放事件
const onKeyUp = (event: KeyboardEvent) => {
    // 只在拖拽过程中处理键盘事件
    if (!isDragging) return;

    const oldShiftState = isShiftPressed;
    const oldCtrlState = isCtrlPressed;

    if (event.key === 'Shift') {
        isShiftPressed = false;
    } else if (event.key === 'Control') {
        isCtrlPressed = false;
    }

    // 如果修饰键状态改变，更新拖拽模式
    if (oldShiftState !== isShiftPressed || oldCtrlState !== isCtrlPressed) {
        if (isShiftPressed && !isCtrlPressed) {
            dragMode = 'horizontal';
        } else if (isCtrlPressed && !isShiftPressed) {
            dragMode = 'vertical';
        } else {
            dragMode = 'free';
        }

        // 重置累积的增量，避免突然跳变
        lastDeltaX = 0;
        lastDeltaY = 0;
    }
};

// 拖拽中
const onDrag = (event: MouseEvent) => {
    if (!isDragging || draggedCharacterIndex === -1) return;

    // 检查事件中的修饰键状态，确保与我们跟踪的状态同步
    if (isShiftPressed !== event.shiftKey || isCtrlPressed !== event.ctrlKey) {
        isShiftPressed = event.shiftKey;
        isCtrlPressed = event.ctrlKey;

        // 更新拖拽模式
        if (isShiftPressed && !isCtrlPressed) {
            dragMode = 'horizontal';
        } else if (isCtrlPressed && !isShiftPressed) {
            dragMode = 'vertical';
        } else {
            dragMode = 'free';
        }

        // 重置累积的增量
        lastDeltaX = 0;
        lastDeltaY = 0;
    }

    const character = action.maxCharacter[draggedCharacterIndex];
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    // 根据拖拽模式决定移动方向
    switch (dragMode) {
        case 'horizontal':
            // 只水平移动
            character.x += deltaX - lastDeltaX;
            break;
        case 'vertical':
            // 只垂直移动
            character.y += deltaY - lastDeltaY;
            break;
        default:
            // 自由移动
            character.x += deltaX - lastDeltaX;
            character.y += deltaY - lastDeltaY;
            break;
    }

    // 更新累积的增量
    lastDeltaX = deltaX;
    lastDeltaY = deltaY;

    // 更新角色位置
    updateCharacterPosition(draggedCharacterIndex);

    // 防止事件冒泡和默认行为
    event.preventDefault();
    event.stopPropagation();
};

// 停止拖拽
const stopDrag = (event?: MouseEvent) => {
    if (!isDragging) return;

    isDragging = false;
    draggedCharacterIndex = -1;
    lastDeltaX = 0;
    lastDeltaY = 0;
    dragMode = 'free';
    isShiftPressed = false;
    isCtrlPressed = false;

    // 移除事件监听
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // 防止事件冒泡和默认行为
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
};


const reLoad = () => {
    cameraValues.value[2].value = 1;
    cameraValues.value[0].value = canvasManager.worldCenter.x;
    cameraValues.value[1].value = canvasManager.worldCenter.y;

    setModification(modification, 'camera.x', canvasManager.worldCenter.x);
    setModification(modification, 'camera.y', canvasManager.worldCenter.y);
    setModification(modification, 'camera.zoom', 1);

    viewport.setZoom(1);
    viewport.moveCenter(canvasManager.worldCenter.x, canvasManager.worldCenter.y);
    viewport.emit('moved')
}


const handleBlur = (index: number) => {
    console.log(`输入框 ${index} 失去焦点: 更新的值：${cameraValues.value[index].value}`);
    valueChange(index);
};

const handleChange = (index: number) => {
    console.log(`属性：${index} 变化: 更新的值：${cameraValues.value[index].value}`);
    valueChange(index);
}

const handleParallaxFactorBlur = () => {
    console.log("视差因子发生变化：");

    setModification(modification, 'background.parallax', backgroundParallaxFactorValues.value[0].value);
    canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value)

}


const valueChange = (updateIndex: number) => {
    if (updateIndex === 0) {
        viewport.moveCenter(cameraValues.value[updateIndex].value, viewport.center.y);
        setModification(modification, 'camera.x', cameraValues.value[updateIndex].value);

        viewport.emit('moved');
    } else if (updateIndex === 1) {
        viewport.moveCenter(viewport.center.x, cameraValues.value[updateIndex].value);
        setModification(modification, 'camera.y', cameraValues.value[updateIndex].value);

        viewport.emit('moved');
    } else if (updateIndex === 2) {
        // 不允许玩家控制缩放
        viewport.scale.set(cameraValues.value[updateIndex].value);
        setModification(modification, 'camera.zoom', cameraValues.value[updateIndex].value);
    }
}


// 这个方法是用于将原状态过渡到目标状态的操作，用于播放模式或预览模式
// e.g 我预览当前节点就需要执行这个方法从状态到这个状态之间要经历什么
const targetAction = async () => {
    // 先初始化角色的一些属性
    action.maxCharacter.forEach(character => {
        character.spine.visible = character.isInitShow;
        character.spine.scale.set(character.scale)
        character.spine.position.set(character.x, character.y);
        character.spine.alpha = 1;
    })

    // 如果当前修改的背景和
    canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value)

    await new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 500)
    })
    // 为了是拿到上一个的状态 永远是上一个的状态
    handleSceneState(canvasManager, props);


    // 设置初始化的背景

    // 设置摄像机到上一个的状态初始状态
    // viewport.moveCenter(action.previewSnapshot.camera.x, action.previewSnapshot.camera.y);
    viewport.setZoom(action.previewSnapshot.camera.zoom);
    viewport.moveCenter(cameraValues.value[0].value, cameraValues.value[1].value);
    console.log("初始化场景", cameraValues.value[0].value, cameraValues.value[1].value, action.previewSnapshot.camera.zoom);

    viewport.emit('moved')

    // viewport.animate({
    //     time: 700,
    //     position: new Point(cameraValues.value[0].value, cameraValues.value[1].value),
    //     scale: cameraValues.value[2].value,
    //     ease: "easeInOutSine",
    //     callbackOnComplete: () => {
    //         const newX = Math.round(viewport.center.x * 10) / 10;
    //         const newY = Math.round(viewport.center.y * 10) / 10;
    //         viewport.moveCenter(newX, newY);
    //         cameraValues.value[0].value = newX;
    //         cameraValues.value[1].value = newY;

    //         cameraValues.value[0].value = newX;
    //         cameraValues.value[1].value = newY;
    //         cameraValues.value[2].value = viewport.scale.x;

    //         setModification(modification, 'camera.x', newX);
    //         setModification(modification, 'camera.y', newY);
    //         setModification(modification, 'camera.zoom', viewport.scale.x);
    //     }
    // })

    console.log("执行");


    if (fade.value) {
        canvasManager.initMask.alpha = 1;
        const fadeIn = Action.fadeOut(1.0).easeInOut();
        canvasManager.initMask.run(fadeIn);
    } else {
        canvasManager.initMask.alpha = 0;
    }


}

// 序列化方法 - 保存组件数据
const serialization = () => {
    return {
        fade: fade.value,
        currentBackground: {
            name: currentBackground.value.name,
            path: currentBackground.value.path,
            type: currentBackground.value.type
        },
        backgroundUrl: backgroundUrl.value,
        cameraValues: cameraValues.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        backgroundParallaxFactorValues: backgroundParallaxFactorValues.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
        })),
        maxCharacter: action.maxCharacter.map(character => ({
            character: character.character,
            x: character.x,
            y: character.y,
            scale: character.scale,
            isInitShow: character.isInitShow,
            selectAnimation: character.selectAnimation,
            animationOption: character.animationOption
        }))
    };
};

// 反序列化方法 - 加载组件数据
const deserialization = (data: ActionItems) => {
    const actionData = data.actionData;
    if (!actionData) {
        return;
    }
    if (actionData) {
        if (typeof actionData.fade === 'boolean') {
            fade.value = actionData.fade;
        }

        if (actionData.currentBackground) {
            currentBackground.value = {
                name: actionData.currentBackground.name || "CommanderRoom.png",
                path: actionData.currentBackground.path || "resources\\image\\Background\\CommanderRoom.png",
                type: actionData.currentBackground.type || ResType.Image
            };

        }

        if (typeof actionData.backgroundUrl === 'string') {
            backgroundUrl.value = actionData.backgroundUrl;
        }

        if (Array.isArray(actionData.cameraValues)) {
            // 不要重新创建数组，而是更新现有数组中的值以保持响应式绑定
            actionData.cameraValues.forEach((setting: any, index: number) => {
                if (cameraValues.value[index]) {
                    cameraValues.value[index].label = setting.label || cameraValues.value[index].label;
                    cameraValues.value[index].value = setting.value !== undefined ? setting.value : cameraValues.value[index].value;
                    cameraValues.value[index].type = setting.type || cameraValues.value[index].type;
                    cameraValues.value[index].disabled = setting.disabled !== undefined ? setting.disabled : cameraValues.value[index].disabled;
                }
            });
        }

        if (Array.isArray(actionData.backgroundParallaxFactorValues)) {
            // 不要重新创建数组，而是更新现有数组中的值以保持响应式绑定
            actionData.backgroundParallaxFactorValues.forEach((setting: any, index: number) => {
                if (backgroundParallaxFactorValues.value[index]) {
                    backgroundParallaxFactorValues.value[index].label = setting.label || backgroundParallaxFactorValues.value[index].label;
                    backgroundParallaxFactorValues.value[index].value = setting.value !== undefined ? setting.value : backgroundParallaxFactorValues.value[index].value;
                    backgroundParallaxFactorValues.value[index].type = setting.type || backgroundParallaxFactorValues.value[index].type;
                    backgroundParallaxFactorValues.value[index].disabled = setting.disabled !== undefined ? setting.disabled : backgroundParallaxFactorValues.value[index].disabled;
                }
            });
        }

        if (Array.isArray(actionData.maxCharacter)) {
            // 恢复角色数据到action.maxCharacter
            actionData.maxCharacter.forEach((charData: any, index: number) => {
                if (action.maxCharacter[index]) {
                    action.maxCharacter[index].character = charData.character;
                    action.maxCharacter[index].x = charData.x || viewport.worldWidth / 2;
                    action.maxCharacter[index].y = charData.y || viewport.worldHeight + 200;
                    action.maxCharacter[index].scale = charData.scale || 1;
                    action.maxCharacter[index].isInitShow = charData.isInitShow !== undefined ? charData.isInitShow : true;
                    action.maxCharacter[index].selectAnimation = charData.selectAnimation || 0;
                    if (charData.animationOption) {
                        action.maxCharacter[index].animationOption = charData.animationOption;
                    }
                    onSelectAnimation(index);
                    onInitShowChange(index, action.maxCharacter[index].isInitShow);
                }
            });
        }

        // 需要重新设置背景 parallax 因子
        canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value)
    }
};

onMounted(() => {
    // 向action中注册回调和序列化方法
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    action.getAction(props.title).as[actionIndex].action = targetAction;
    action.getAction(props.title).as[actionIndex].serialize = serialization;

    modification = action.getCurrentModification(props.title, props.id);
    setModification(modification, 'camera.x', cameraValues.value[0].value);
    setModification(modification, 'camera.y', cameraValues.value[1].value);
    setModification(modification, 'camera.zoom', cameraValues.value[2].value);

    setModification(modification, 'background.image', currentBackground.value.path);
    setModification(modification, 'background.parallax', backgroundParallaxFactorValues.value[0].value);

    viewport.on('drag-end', () => {
        if (canvasManager.getMode() != GameMode.SCENE) return;

        // 这个事件只会在这里触发
        if (action.eqSelectActionItem(props.title, props.id)) {
            // console.log(`停止拖动${viewport.center}`);
            // 限制center的小数
            const newX = Math.round(viewport.center.x * 10) / 10;
            const newY = Math.round(viewport.center.y * 10) / 10;
            viewport.moveCenter(newX, newY);
            cameraValues.value[0].value = newX;
            cameraValues.value[1].value = newY;
            setModification(modification, 'camera.x', newX);
            setModification(modification, 'camera.y', newY);

            // actionItem.action?.();
        }
    })

    viewport.on('zoomed-end', (_e) => {
        if (canvasManager.getMode() != GameMode.SCENE) {
            return;
        }
        // console.log(`缩放触发：${viewport.scale}`);
        if (action.eqSelectActionItem(props.title, props.id)) {
            const newX = Math.round(viewport.center.x * 10) / 10;
            const newY = Math.round(viewport.center.y * 10) / 10;
            viewport.moveCenter(newX, newY);
            cameraValues.value[0].value = newX;
            cameraValues.value[1].value = newY;

            console.log(`缩放触发：${viewport.scale}`);
            // 四舍五入缩放只保留1位小数


            cameraValues.value[0].value = newX;
            cameraValues.value[1].value = newY;
            cameraValues.value[2].value = viewport.scale.x;


            setModification(modification, 'camera.x', newX);
            setModification(modification, 'camera.y', newY);
            setModification(modification, 'camera.zoom', viewport.scale.x);
        }
        // actionItem.action?.();
    })

    // 反序列化数据
    deserialization(action.getAction(props.title).as[actionIndex]);
})

// 清理事件监听器
onUnmounted(() => {
    // 移除所有相关的事件监听器
    viewport.off('drag-end');
})


</script>

<style lang="css" scoped>
.action-button button {
    padding: 4px 8px;
    font-size: 14px;
    background-color: #0078d4;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.action-button button:hover {
    background-color: #005a9e;
}

.action-button button:active {
    background-color: #004578;
}



.re-load {
    font-size: 16px;
    margin-right: 2px;
    opacity: .5;
    transition: all .1s ease-in-out;
    display: inline-block;
    cursor: pointer;
}

.re-load:hover {
    opacity: 1;
}

/* 使用 focus 代替 active，保证点击后就触发动画 */
.re-load-active {
    animation: rotate360 0.5s ease-in-out;
    outline: none;
}

@keyframes rotate360 {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.select-background {
    position: relative;
    border-radius: 5px;
    display: flex;

    padding: 5px 0;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: var(--secondary-bg);
}

.select-character {
    position: relative;
    border-radius: 5px;

    padding: 5px 0;
    overflow: hidden;
    background-color: var(--secondary-bg);

}

.select-background:hover .background-tool {
    opacity: 1;
    transform: translateY(0px);
}

.select-background img {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.background-tool {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    opacity: 0;
    position: absolute;
    bottom: 0;
    height: 30px;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(30px);

    backdrop-filter: blur(5px);
    transition: all .1s ease-in-out;
}

.character-item {
    position: relative;
    min-height: 30px;
    background-color: #36364d;
    display: flex;
    align-items: center;
    justify-content: center;
}

.character-add {
    border-radius: 5px;
    padding: 2px 10px;
    background-color: transparent;
    transition: all .2s ease-in-out;
}

.character-add:active {
    transform: scale(.9);
}

.character-add:hover {
    background-color: var(--high-hover-bg);
}

.character-item-list {
    border: 1px solid #534b40cc;
    border-radius: 5px;
    margin: 0 5px;
    margin-bottom: 5px;
    padding: 5px;
}

/* 拖拽相关样式 */
.character-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.character-name {
    font-weight: bold;
    color: var(--text-color);
}

.drag-handle {
    cursor: grab;
    background-color: var(--secondary-bg);
    padding: 2px 8px;
    border-radius: 3px;
    user-select: none;
    transition: all 0.2s ease;
}

.drag-handle:hover {
    background-color: var(--high-hover-bg);
}

.drag-handle:active {
    cursor: grabbing;
}

.position-inputs {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.position-input {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
}

.position-input label {
    min-width: 20px;
}

.position-input input {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    color: var(--text-color);
    padding: 3px 5px;
    width: 60px;
}

.char-init {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
}
</style>
