<template>
    <teleport to="body" v-if="visible">
        <div id="typeAction" class="type-action">
            <RenderType v-if="fileName != ''" :type="type"></RenderType>
            <input v-show="mode === 'res'" ref="search" type="text" id="search-action"
                :placeholder="fileName == '' ? t('inputActionType.searchPlaceholder') : t('inputActionType.searchPlaceholderWithFile', { fileName })" autocomplete="off" autocorrect="off"
                autocapitalize="off">
            <div class="type-selection" v-if="mode === 'res'">
                <div class="type-action-content" v-for="(option, index) in options" :key="`${option.value}-${option.label}-${index}`">
                    <div v-if="option.value === DIVIDER_VALUE" class="type-divider">
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
                <div class="type-selection-title">😍 {{ t('inputActionType.characterManager') }}</div>
                <template v-if="slelectOptions.length > 0">
                    <div class="type-action-content" v-for="option in slelectOptions" :key="option.path">
                        <div class="type-action-item" @click="selectCharacterType(option)">
                            {{ getCharacterDisplayName(option.name) }}
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="type-empty-state">
                        ❓ {{ t('inputActionType.noCharacterResources') }} ❓
                    </div>
                </template>
            </div>

            <div class="type-selection" v-if="mode === 'sceneCharacter'">
                <div class="type-selection-title">🎭 {{ t('inputActionType.sceneCharacterSelector') }}</div>
                <template v-if="sceneCharacterOptions.length > 0">
                    <div class="type-action-content" v-for="(character, index) in sceneCharacterOptions" :key="index">
                        <div class="type-action-item" @click="selectSceneCharacterType(character)">
                            <div class="scene-character-info">
                                <span class="character-name">{{ getCharacterDisplayName(character.character.characterName) }}</span>
                                <span class="character-position">({{ character.x }}, {{ character.y }})</span>
                                <span class="character-scale">{{ t('inputActionType.scale') }}: {{ character.scale }}</span>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="type-empty-state">
                        ❓ {{ t('inputActionType.noSceneCharacters') }} ❓
                    </div>
                </template>
            </div>

            <div class="type-selection" v-if="mode === 'Image'">
                <div class="type-selection-title">😍 {{ t('inputActionType.imageManager') }}</div>
                <template v-if="slelectOptions.length > 0">
                    <div class="type-action-content" v-for="option in slelectOptions" :key="option.path">
                        <div class="type-action-item type-image-content" @click="selectResType(option)">
                            <img :src="ResourceManager.allResUrl[option.path]" width="50px">
                            {{ option.name }}
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="type-empty-state">
                        ❓ {{ t('inputActionType.noImageResources') }} ❓
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
import { getCharacterDisplayName } from '../../utils/character-name';
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

const DIVIDER_VALUE = "divider";

const options = computed(() => [
    { value: DIVIDER_VALUE, label: t('inputActionType.sections.init') },
    { value: ASIType.SCENE, label: t('inputActionType.items.scene.label'), icon: '🎬', desc: t('inputActionType.items.scene.desc') },
    { value: DIVIDER_VALUE, label: t('inputActionType.sections.common') },
    { value: ASIType.CHARACTER, label: t('inputActionType.items.character.label'), icon: '👯', desc: t('inputActionType.items.character.desc') },
    { value: ASIType.OPERATINGCAMERA, label: t('inputActionType.items.camera.label'), icon: '🎥', desc: t('inputActionType.items.camera.desc') },
    { value: ASIType.DIALOGUE, label: t('inputActionType.items.dialogue.label'), icon: '💬', desc: t('inputActionType.items.dialogue.desc') },
    // { value: ASIType.BACKGROUND, label: "添加 分支对话[x]", icon: '💬', desc: "创建多条分支对话" },
    { value: ASIType.CG, label: t('inputActionType.items.cg.label'), icon: '📷', desc: t('inputActionType.items.cg.desc') },
    { value: ASIType.AUDIO, label: t('inputActionType.items.audio.label'), icon: '🎶', desc: t('inputActionType.items.audio.desc') },
    { value: ASIType.BGM, label: t('inputActionType.items.bgm.label'), icon: '🎶', desc: t('inputActionType.items.bgm.desc') },
    { value: ASIType.BACKGROUND, label: t('inputActionType.items.background.label'), icon: '🎨', desc: t('inputActionType.items.background.desc') },
    { value: ASIType.BACKGROUND, label: t('inputActionType.items.characterToggle.label'), icon: '😍', desc: t('inputActionType.items.characterToggle.desc') },
    { value: ASIType.WAIT, label: t('inputActionType.items.wait.label'), icon: '⏱️', desc: t('inputActionType.items.wait.desc') },
    { value: DIVIDER_VALUE, label: t('inputActionType.sections.advanced') },
    { value: ASIType.TRANSITION, label: t('inputActionType.items.transition.label'), icon: '⏩', desc: t('inputActionType.items.transition.desc') },
    { value: ASIType.EFFECT, label: t('inputActionType.items.effect.label'), icon: '✨', desc: t('inputActionType.items.effect.desc') },
    { value: ASIType.BGM, label: t('inputActionType.items.crt.label'), icon: '🎫', desc: t('inputActionType.items.crt.desc') },
    { value: ASIType.BGM, label: t('inputActionType.items.extra.label'), icon: '🙂', desc: t('inputActionType.items.extra.desc') },
    { value: DIVIDER_VALUE, label: t('inputActionType.sections.template') },
    { value: ASIType.BGM, label: t('inputActionType.items.consultTemplate.label'), icon: '📃', desc: t('inputActionType.items.consultTemplate.desc') },
    { value: ASIType.BGM, label: t('inputActionType.items.mainlineTemplate.label'), icon: '😋', desc: t('inputActionType.items.mainlineTemplate.desc') },
]);

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
        res.filter(v => {
            if (data.characterId) {
                return v.id === data.characterId;
            }

            return v.characterName === data.name;
        }).forEach(v => {
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
    background-color: var(--node-picker-overlay);
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
    background-color: var(--node-picker-bg);
    border: 1px solid var(--node-picker-border);
    box-shadow: var(--node-picker-shadow);
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
    background-color: var(--node-picker-scrollbar-hover);
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
    background-color: var(--node-picker-scrollbar);
}

.type-selection::-webkit-scrollbar-thumb:hover {
    background-color: var(--node-picker-scrollbar-hover);
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
    color: var(--node-picker-text);
    border: 1px solid transparent;
}

.type-action-item-desc {
    font-size: 12px;
    color: var(--node-picker-muted-text);
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
    background-color: var(--node-picker-item-hover-bg);
    color: var(--node-picker-item-hover-text);
    transform: translateX(2px);
}

.type-action-item:hover .character-position,
.type-action-item:hover .character-scale,
.type-action-item:hover .type-action-item-desc {
    color: var(--node-picker-item-hover-text);
    opacity: 0.78;
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
    border-bottom: 1px dashed var(--node-picker-muted-text);
    margin-bottom: 5px;
    color: var(--node-picker-text);
}

.type-divider {
    height: 30px;
    width: 100%;
    padding: 5px 0;
    margin-bottom: 10px;
    border-bottom: 1px dashed var(--node-picker-muted-text);
    font-size: 14px;
    color: var(--node-picker-muted-text);
}

.type-empty-state {
    color: var(--node-picker-empty-text);
    text-shadow: 0 0 10px var(--error-color);
    text-align: center;
    opacity: 1;
    padding: 12px 8px;
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
    color: inherit;
}

.character-position,
.character-scale {
    font-size: 12px;
    color: var(--node-picker-muted-text);
}
</style>
