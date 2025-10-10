<template>
    <teleport to="body" v-if="visible">
        <div id="typeAction" class="type-action">
            <RenderType v-if="fileName != ''" :type="type"></RenderType>
            <input v-show="mode === 'res'" ref="search" type="text" id="search-action"
                :placeholder="fileName == '' ? '请选择添加的操作' : `你想对${fileName}的操作是？`" autocomplete="off" autocorrect="off"
                autocapitalize="off">
            <div class="type-selection" v-if="mode === 'res'">
                <div class="type-action-content" v-for="option in options" :key="option.value">
                    <div v-if="option.value === '分隔符'"
                        style="height: 30px;width: 100%;padding: 5px 0;margin-bottom: 10px;border-bottom: 1px dashed var(--placeholder-color);font-size: 14px;">
                        {{ option.label }}
                    </div>
                    <div v-else class="type-action-item" @click="selectType(option.value as ASIType)">
                        {{ option.icon }}&emsp; {{ option.label }}
                        <div class="type-action-item-desc" v-if="option.desc">
                            {{ option.desc }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="type-selection" v-if="mode === 'character'">
                <div class="type-selection-title">😍 角色管理器</div>
                <template v-if="slelectOptions.length > 0">
                    <div class="type-action-content" v-for="option in slelectOptions" :key="option.path">
                        <div class="type-action-item" @click="selectCharacterType(option)">
                            {{ t(option.name) }}
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div style="color: #ccc; text-shadow: 0 0 10px var(--error-color); text-align: center; opacity: 1;">
                        ❓ 找不到已加载角色资源，请添加角色资源 ❓
                    </div>
                </template>
            </div>

            <div class="type-selection" v-if="mode === 'sceneCharacter'">
                <div class="type-selection-title">🎭 场景角色选择器</div>
                <template v-if="sceneCharacterOptions.length > 0">
                    <div class="type-action-content" v-for="(character, index) in sceneCharacterOptions" :key="index">
                        <div class="type-action-item" @click="selectSceneCharacterType(character)">
                            <div class="scene-character-info">
                                <span class="character-name">{{ t(character.character.characterName) }}</span>
                                <span class="character-position">({{ character.x }}, {{ character.y }})</span>
                                <span class="character-scale">缩放: {{ character.scale }}</span>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div style="color: #ccc; text-shadow: 0 0 10px var(--error-color); text-align: center; opacity: 1;">
                        ❓ 场景中没有角色，请先添加角色到场景 ❓
                    </div>
                </template>
            </div>

            <div class="type-selection" v-if="mode === 'Image'">
                <div class="type-selection-title">😍 图片管理器</div>
                <template v-if="slelectOptions.length > 0">
                    <div class="type-action-content" v-for="option in slelectOptions" :key="option.path">
                        <div class="type-action-item type-image-content" @click="selectResType(option)">
                            <img :src="ResourceManager.allResUrl[option.path]" width="50px">
                            {{ option.name }}
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div style="color: #ccc; text-shadow: 0 0 10px var(--error-color); text-align: center; opacity: 1;">
                        ❓ 找不到已加载图片资源，请添加图片资源 ❓
                    </div>
                </template>
            </div>
        </div>
        <div class="mask" @click="handleClose"></div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { ResType } from '../../script/var';
import RenderType from '../edit/RenderType.vue';
import { ASIType, LoadRes, sceneCharacter } from '../../types/app';
import { useActionStore } from '../../stores/action-store';
import AssetManager from '../../script/asset-manager';
import ResourceManager from '../../script/resource-manager';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const search = ref<HTMLInputElement | null>(null);
const actionStore = useActionStore();

const props = defineProps<{
    mode: "res" | "character" | "Image" | "sceneCharacter",
    type: ResType,
    fileName: string,
    visible: boolean
}>();

const emit = defineEmits(["select", 'selectCharacter', 'close']);

const options = [
    { value: "分隔符", label: "初始化" },
    { value: ASIType.SCENE, label: "初始化 场景", icon: '🎬', desc: "重置场景状态" },
    { value: "分隔符", label: "常用" },
    { value: ASIType.CHARACTER, label: "操作 角色", icon: '👯', desc: "移动/缩放/动作/表情" },
    { value: ASIType.OPERATINGCAMERA, label: "操作 摄像机", icon: '🎥', desc: "调整摄像机视角" },
    { value: ASIType.DIALOGUE, label: "添加 对话", icon: '💬', desc: "添加角色台词" },
    // { value: ASIType.BACKGROUND, label: "添加 分支对话[x]", icon: '💬', desc: "创建多条分支对话" },
    { value: ASIType.CG, label: "添加/删除 CG", icon: '📷', desc: "插入或移除CG画面" },
    { value: ASIType.AUDIO, label: "添加 音效", icon: '🎶', desc: "播放特定音效" },
    { value: ASIType.BGM, label: "设置/取消 背景音乐", icon: '🎶', desc: "更改或关闭BGM" },
    { value: ASIType.BACKGROUND, label: "设置/取消 背景图片", icon: '🎨', desc: "设置或移除背景" },
    { value: ASIType.BACKGROUND, label: "添加/删除 角色[x]", icon: '😍', desc: "加入或移除角色" },
    { value: ASIType.WAIT, label: "添加 阻塞", icon: '⏱️', desc: "阻塞程序执行指定时间" },
    { value: "分隔符", label: "高级" },
    { value: ASIType.TRANSITION, label: "设置 过渡", icon: '⏩', desc: "画面或场景渐变效果" },
    { value: ASIType.BGM, label: "添加 特效[x]", icon: '✨', desc: "在场景中添加特效" },
    { value: ASIType.BGM, label: "添加/删除 CRT效果[x]", icon: '🎫', desc: "模拟老式屏幕效果" },
    { value: ASIType.BGM, label: "添加 巴拉巴拉[x]", icon: '🙂', desc: "额外的自定义效果" },
    { value: "分隔符", label: "模板" },
    { value: ASIType.BGM, label: "咨询模板[x]", icon: '📃', desc: "预设的咨询对话模板" },
    { value: ASIType.BGM, label: "主线模板[x]", icon: '😋', desc: "主线剧情模板" },
];

const slelectOptions = computed(() => {
    const loadRes = actionStore.loadResMap;
    return Object.values(loadRes).filter(option => option.type === props.type);
});

// 新增：场景角色选项
const sceneCharacterOptions = computed(() => {
    return actionStore.maxCharacter;
});

const selectType = (type: ASIType) => {
    emit("select", type);
};

const selectCharacterType = (data: LoadRes) => {
    AssetManager.getInstance().getResConfig().then(res => {
        res.filter(v => v.characterName === data.name).forEach(v => {
            emit("select", v);
        })
    })
};

// 新增：选择场景角色的方法
const selectSceneCharacterType = (character: sceneCharacter) => {
    emit("select", character);
};

const selectResType = (data: LoadRes) => {
    emit("select", data);
};

const handleClose = () => {
    emit('close');
};

// 监听ESC键
const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && props.visible) {
        handleClose();
    }
};

onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
});

onMounted(() => {
    console.log("当前的：", props);
});
</script>

<style scoped>
.mask {
    position: absolute;
    top: 35px;
    width: 100dvw;
    height: calc(100dvh - 35px);
    background-color: rgba(0, 0, 0, 0.2);
    z-index: 100;
}

.type-action {
    z-index: 101;
    position: absolute;
    width: 50%;
    max-width: 380px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background-color: rgba(29, 29, 42, 0.78);
    padding: 20px;
    padding-top: 10px;
    border-radius: 10px;

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.type-selection {
    margin-top: 10px;
    width: 100%;
    min-width: 100px;
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}


.type-selection:hover::-webkit-scrollbar-thumb {
    background-color: transparent;


}


.type-selection::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;

}

.type-selection::-webkit-scrollbar-track {
    background: transparent;
}

.type-selection::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.type-selection::-webkit-scrollbar-thumb:hover {
    background-color: transparent;

}


.type-action-item {
    width: 100%;
    height: 100%;
    padding: 5px 15px;
    border-radius: 0px;
    text-align: left;
    background-color: transparent;
    transition: all .1s ease-in-out;
    display: flex;
    justify-content: space-between;
    /* background-color: var(--high-bg); */
}

.type-action-item-desc {
    font-size: 12px;
    color: var(--placeholder-color);
    margin-top: 3px;
    opacity: 0;
    transition: all .2s ease-in-out;
}

.type-action-item:hover .type-action-item-desc {
    margin-top: 3px;
    opacity: 1;
    display: block;
}

.type-action-content {

    display: flex;
    align-items: center;
    vertical-align: middle;
    gap: 5px;


}

.type-action-item:hover {
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    color: white;
    transform: translateX(2px);

}

input[type="text"] {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
    font-size: 16px;
    transition: border-color 0.3s;
}

input[type="text"]::placeholder {
    color: var(--placeholder-color);
}

input[type="text"]:focus {
    border-color: var(--button-bg);
    outline: none;
}

.type-action {
    animation: popIn 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
}

.fade-out {
    animation: popOut 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
}

@keyframes popIn {
    0% {
        opacity: 0;
        transform: translate(-50%, 15px) scale(0.85);
    }

    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes popOut {
    0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    100% {
        opacity: 0;
        transform: translate(-50%, 50%) scale(0.95);
    }
}

.type-selection-title {
    padding: 2px;
    border-bottom: 1px dashed var(--placeholder-color);
    margin-bottom: 5px;
}

.type-image-content {
    justify-content: left;
    align-items: center;
    gap: 20px;
}

.scene-character-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.character-name {
    font-weight: bold;
    font-size: 14px;
}

.character-position,
.character-scale {
    font-size: 12px;
    color: var(--placeholder-color);
}
</style>
