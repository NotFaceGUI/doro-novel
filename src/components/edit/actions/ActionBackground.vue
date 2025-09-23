<template>
    <div class="action-item-main">
        <ActionItemHead content="🖼️ 设置背景" :is-hover="true" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ResType } from "../../../script/var";
import { selectImageType } from '../../../script/common/search-action';
import { useCommonState } from '../../../script/common/common-action-item';
import { setModification } from '../../../script/util/common';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import { LoadRes, InputOption } from '../../../types/app';
import { Texture } from 'pixi.js';
import ResourceManager from '../../../script/resource-manager';
import CanvasManager from '../../../script/render/canvas-manager';
import ActionItemHead from './ActionItemHead.vue';
import DynamicInputs from '../../common/DynamicInputs.vue';

const canvasManager = CanvasManager.getInstance();
let modification: Map<PropertyPath, Modification>;

const props = defineProps<{
    title: string,
    id: number
}>();

// 拿到一些共同的属性
const { action, actionItem } = useCommonState(props.title, props.id);

// 默认的图片
const currentBackground = ref<LoadRes>({
    name: "CommanderRoom.png",
    path: "resources\\image\\Background\\CommanderRoom.png",
    type: ResType.Image
});

const backgroundUrl = ref('');

const backgroundParallaxFactorValues = ref<InputOption[]>([
    {
        label: '视差因子',
        value: 0.9,
        type: 'number',
        disabled: false
    }
]);

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
        canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value);
    });
};

const handleParallaxFactorBlur = () => {
    console.log("视差因子发生变化：");

    setModification(modification, 'background.parallax', backgroundParallaxFactorValues.value[0].value);
    canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value);
};

// 这个方法是用于将原状态过渡到目标状态的操作，用于播放模式或预览模式
const targetAction = async () => {
    // 设置背景
    canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value);
};

onMounted(() => {
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    // 向action中注册回调
    action.getAction(props.title).as[actionIndex].action = targetAction;

    modification = action.getCurrentModification(props.title, props.id);

    // 设置默认背景
    setModification(modification, 'background.image', currentBackground.value.path);
    setModification(modification, 'background.parallax', backgroundParallaxFactorValues.value[0].value);

    // 加载默认背景资源
    action.addLoadResAsync(currentBackground.value).then(() => {
        canvasManager.setBackground(currentBackground.value.path, backgroundParallaxFactorValues.value[0].value);
        backgroundUrl.value = ResourceManager.allResUrl[currentBackground.value.path] || '';
    });
});
</script>

<style scoped>
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
