<template>
    <div class="action-item-main">
        <ActionItemHead content="🎬 场景初始化" :is-hover="true" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>
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
                <img src="../../../../public/img/sprite/CommanderRoom.png" width="50%" alt="" srcset="">

                <div class="background-tool">
                    {{ currentBackground.name }}
                    <div class="tool-edit">
                        <div @click.stop="selectBackground" title="切换背景">🖌</div>
                    </div>
                </div>
            </div>
            <div class="action-title">
                设置角色
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ActionItemHead from './ActionItemHead.vue';
import { GameMode, InputOption, LoadRes } from '../../../types/app';
import CanvasManager from '../../../script/render/canvas-manager';
import { setModification } from '../../../script/util/common';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import { Action } from 'pixijs-actions';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { ResType } from '../../../script/var';
import { selectImageType } from '../../../script/common/search-action';
import { useCommonState } from '../../../script/common/common-action-item';

const canvasManager = CanvasManager.getInstance();
let viewport = canvasManager.viewport;
let modification: Map<PropertyPath, Modification>;

const props = defineProps<{
    title: string,
    id: number
}>();


// 拿到一些共同的属性
const { action, actionItem } = useCommonState(props.title, props.id);

actionItem.wait = false;

// 用于控制初始化场景的黑幕显影
const fade = ref<boolean>(true);


// 默认的图片
const currentBackground = ref<LoadRes>({
    name: "CommanderRoom.png",
    path: "resources\\image\\Background\\CommanderRoom.png",
    type: ResType.Image
})

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



const selectBackground = () => {
    selectImageType().then(res => {
        console.log("选择的图片：", res);
    });
}

const reLoad = () => {
    setTimeout(() => {
        cameraValues.value[2].value = 1;
        cameraValues.value[0].value = canvasManager.worldCenter.x;
        cameraValues.value[1].value = canvasManager.worldCenter.y;
        
        
    }, 100)
}


const handleBlur = (index: number) => {
    console.log(`输入框 ${index} 失去焦点: 更新的值：${cameraValues.value[index].value}`);
    valueChange();
};

const handleChange = (index: number) => {
    console.log(`属性：${index} 变化: 更新的值：${cameraValues.value[index].value}`);
    valueChange();
}

let timer: number;

const valueChange = () => {
    requestAnimationFrame(() => {
        // 当且仅当100ms内没有改变数值时进行的一个操作
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (modification) {
                // 修改Modifation
                setModification(modification, 'camera.x', cameraValues.value[0].value);
                setModification(modification, 'camera.y', cameraValues.value[1].value);
                setModification(modification, 'camera.zoom', cameraValues.value[2].value);

                actionItem.action?.();
            }
            // 手动触发 moved 事件
            viewport.emit('moved');
            viewport.emit('zoomed');
        }, 100);
    })
}


// 这个方法是用于将原状态过渡到目标状态的操作，用于播放模式或预览模式
// e.g 我预览当前节点就需要执行这个方法从状态到这个状态之间要经历什么
const targetAction = () => {
    console.log("回调");

    // 这里编写一个简单例子
    // const spin =
    //     Action.group([
    //         Action.moveTo(600, 499, 1).easeInOut(),
    //         Action.scaleBy(2, 1).easeInOut(),
    //     ])
    // viewport.run(spin)

    // viewport.animate({
    //     time: 300,
    //     position: new Point(-1000, 640),
    //     scale: 1,
    //     ease: "easeInOutSine",
    // })

    // 我需要设置先前的状态然后在执行操作, 如果当前的游戏模式为预览模式，那么就需要手动指定上一个节点的场景状态
    if (canvasManager.getMode() == GameMode.PREVIEW || canvasManager.getMode() == GameMode.SCENE) {
        // 应用上一个场景快照，意思就是将之前所执行的场景快照都快速的设置
        action.applyPreviewSnapshot(props.id, props.title);
    } else {
        // 如果是播放模式就增量更新previewSnapshot
    }

    // console.log("上一个的状态：", action.previewSnapshot);
    // 设置上一个状态
    // viewport.moveCenter(action.previewSnapshot.camera.x, action.previewSnapshot.camera.y);
    // viewport.scale.set(action.previewSnapshot.camera.zoom);
    // 能否监听
    // isWatch = false;
    // viewport.animate({
    //     time: 300,
    //     position: new Point(cameraValues.value[0].value, cameraValues.value[1].value),
    //     scale: cameraValues.value[2].value,
    //     ease: "easeInOutSine",
    //     callbackOnComplete: ()=>{
    //         isWatch = true;
    //     }
    // })

    // 从上一个状态转移到 下一个状态
    viewport.moveCenter(cameraValues.value[0].value, cameraValues.value[1].value);
    viewport.scale.set(cameraValues.value[2].value);


    // 手动触发改变
    viewport.emit('moved');
    viewport.emit('zoomed');

    if (fade.value) {
        canvasManager.initMask.alpha = 1;
        const fadeIn = Action.fadeOut(1.0).easeInOut();
        canvasManager.initMask.run(fadeIn);
    }
}

// 在初始化 viewport 后添加事件监听
viewport
    .on('moved', () => {
        if (action.eqSelectActionItem(props.title, props.id)) {
            cameraValues.value[0].value = viewport.center.x;
            cameraValues.value[1].value = viewport.center.y;
            setModification(modification, 'camera.x', cameraValues.value[0].value);
            setModification(modification, 'camera.y', cameraValues.value[1].value);
            
        }
    })
    .on('zoomed', () => {
        if (action.eqSelectActionItem(props.title, props.id)) {
            cameraValues.value[2].value = viewport.scale.x;
            setModification(modification, 'camera.zoom', cameraValues.value[2].value);
        }
    })

// watch(cameraValues, (newValues) => {
//     if (isWatch) {
//         requestAnimationFrame(() => {
//         // 当且仅当100ms内没有改变数值时进行的一个操作
//         clearTimeout(timer);
//         timer = setTimeout(() => {
//             if (modification) {
//                 // 修改Modifation
//                 setModification(modification, 'camera.x', newValues[0].value);
//                 setModification(modification, 'camera.y', newValues[1].value);
//                 setModification(modification, 'camera.zoom', newValues[2].value);

//                 actionItem.action?.();
//             }
//             // 手动触发 moved 事件
//             viewport.emit('moved');
//             viewport.emit('zoomed');
//         }, 100);


//     });
//     }
// }, { deep: true },);


onMounted(() => {
    // 想action中注册回调
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    action.getAction(props.title).as[actionIndex].action = targetAction;

    modification = action.getCurrentModification(props.title, props.id);

    setModification(modification, 'camera.x', cameraValues.value[0].value);
    setModification(modification, 'camera.y', cameraValues.value[1].value);
    setModification(modification, 'camera.zoom', cameraValues.value[2].value);
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
/* 注意：需在模板中为 .re-load 元素添加 tabindex="0" 使其可聚焦 */
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
</style>
