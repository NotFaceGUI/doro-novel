<template>
    <div class="action-item-main">
        <ActionItemHead :content="t('actionSfx.head')" :title="title" :id="id" :is-collapsed="actionItem.isToggle"></ActionItemHead>
        <div class="action-item-content" v-show="!actionItem.isToggle">
            <div class="action-title">
                {{ t('actionCommon.waitExecution') }}
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                {{ t('actionSfx.selectAudioFile') }}
            </div>
            <Dropdown style="width: 100%;overflow: hidden;" v-model="selectedAudioOption" @update:modelValue="onSelectAudio" :options="availableSfxAudios"
                :disabled="false" />

            <div class="action-title">
                {{ t('actionSfx.volume') }}
            </div>
            <div>
                <DynamicInputs v-model="volumeSettings" :columns="volumeSettings.length">
                </DynamicInputs>
            </div>

            <ActionBottomLine></ActionBottomLine>

            <!-- 预览控制 -->
            <div class="action-title">
                {{ t('actionSfx.previewControls') }}
                <div class="preview-controls">
                    <button @click="previewPlay" class="preview-btn" :disabled="!canPreview">
                        {{ isPlaying ? '⏸️' : '▶️' }}
                    </button>
                    <button @click="previewStop" class="preview-btn">
                        ⏹️
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCommonState } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import Dropdown from '../../common/Dropdown.vue';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import ResourceManager from '../../../script/resource-manager';
import { setModification } from '../../../script/util/common';
import { Sound } from '@pixi/sound';
import { ActionItems, InputOption } from '../../../types/app';

const selectedAudioOption = ref(0);
const isPlaying = ref(false);
const audioList = ref<Record<string, string>>({});
let currentSfxSound: Sound | null = null;
const { t, locale } = useI18n();

const volumeSettings = ref<InputOption[]>([
    {
        label: '',
        value: 1.0,
        type: 'number',
        disabled: false
    }
]);

const props = defineProps<{
    title: string,
    id: number,
}>();

const { action, actionItem } = useCommonState(props.title, props.id);
let modification: Map<PropertyPath, Modification>;

// 获取可用的音效文件（只选择路径包含sfx的音频文件）
const availableSfxAudios = computed(() => {
    locale.value;
    const audioKeys = Object.keys(audioList.value).filter(key => {
        const url = audioList.value[key];
        // 检查是否是音频文件且路径包含sfx
        return url && 
               (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg')) &&
               (key.toLowerCase().includes('sfx') || url.toLowerCase().includes('sfx'));
    });

    // console.log('原始audioKeys:', audioKeys);
    // console.log('处理后的文件名:', audioKeys.map(key => {
    //     console.log('处理key:', key);
    //     const parts = key.split(/[/\\]/);
    //     console.log('分割后的parts:', parts);
    //     return parts[parts.length - 1];
    // }));

    const audioOptions = audioKeys.map((key, _index) => {
        const parts = key.split(/[/\\]/);
        const fileName = parts[parts.length - 1];
        return {
            label: fileName,
            value: key
        };
    });

    // 如果没有音效文件，返回一个默认选项
    if (audioOptions.length === 0) {
        return [{ label: t('actionSfx.noAvailableAudioFiles'), value: '' }];
    }

    return audioOptions;
});

// 更新音频列表的函数
const updateAudioList = () => {
    audioList.value = {...ResourceManager.allResUrl};
};

const canPreview = computed(() => {
    return availableSfxAudios.value.length > 0 &&
        selectedAudioOption.value < availableSfxAudios.value.length &&
        availableSfxAudios.value[selectedAudioOption.value].value !== '';
});

const selectedAudioKey = computed(() => {
    if (availableSfxAudios.value.length > 0 &&
        selectedAudioOption.value < availableSfxAudios.value.length &&
        availableSfxAudios.value[selectedAudioOption.value].value !== '') {
        return availableSfxAudios.value[selectedAudioOption.value].value;
    }
    return '';
});

const restoreSelectedAudio = (audioKey?: string, fallbackIndex?: number) => {
    if (audioKey) {
        const audioIndex = availableSfxAudios.value.findIndex(audio => audio.value === audioKey);
        if (audioIndex !== -1) {
            selectedAudioOption.value = audioIndex;
            return;
        }
    }

    if (typeof fallbackIndex === 'number') {
        selectedAudioOption.value = fallbackIndex;
    }
};

// 主要的action执行函数
const targetAction = () => {
    console.log("播放音效，组件ID:", props.id, "音效:", selectedAudioKey.value);
    
    if (selectedAudioKey.value) {
        // 停止之前的音效
        if (currentSfxSound) {
            currentSfxSound.stop();
            currentSfxSound.destroy();
            currentSfxSound = null;
        }
        
        // 创建新的音效实例
        const audioUrl = audioList.value[selectedAudioKey.value];
        if (audioUrl) {
            currentSfxSound = Sound.from(audioUrl);
            currentSfxSound.volume = volumeSettings.value[0].value;
            currentSfxSound.play();
            
            // 保存到快照
            setModification(modification, 'sound.sfx[0]', [selectedAudioKey.value]);
        }
    }
};

// 预览播放
const previewPlay = () => {
    if (!canPreview.value) return;

    console.log("预览播放音效，组件ID:", props.id, "音效:", selectedAudioKey.value);
    
    if (isPlaying.value) {
        // 暂停
        if (currentSfxSound) {
            currentSfxSound.pause();
            isPlaying.value = false;
        }
    } else {
        // 停止之前的音效
        if (currentSfxSound) {
            currentSfxSound.stop();
            currentSfxSound.destroy();
            currentSfxSound = null;
        }
        
        // 播放新音效
        const audioUrl = audioList.value[selectedAudioKey.value];
        if (audioUrl) {
            currentSfxSound = Sound.from(audioUrl);
            currentSfxSound.volume = volumeSettings.value[0].value;
            currentSfxSound.play({
                complete: () => {
                    isPlaying.value = false;
                    if (currentSfxSound) {
                        currentSfxSound.destroy();
                        currentSfxSound = null;
                    }
                }
            });
            isPlaying.value = true;
        }
    }
};

// 预览停止
const previewStop = () => {
    if (currentSfxSound) {
        currentSfxSound.stop();
        currentSfxSound.destroy();
        currentSfxSound = null;
    }
    isPlaying.value = false;
};

const onSelectAudio = () => {
    // 切换音频时停止预览
    previewStop();
};

const syncLabels = () => {
    volumeSettings.value[0].label = t('actionSfx.inputs.volume');
};

// 定时器引用
let audioListTimer: number | null = null;

// 序列化方法 - 保存组件数据
const serialization = () => {
    return {
        selectedAudioOption: selectedAudioOption.value,
        selectedAudioKey: selectedAudioKey.value,
        volumeSettings: volumeSettings.value.map(setting => ({
            label: setting.label,
            value: setting.value,
            type: setting.type,
            disabled: setting.disabled
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
        restoreSelectedAudio(actionData.selectedAudioKey, actionData.selectedAudioOption);
        
        if (Array.isArray(actionData.volumeSettings)) {
            volumeSettings.value = actionData.volumeSettings.map((setting: any) => ({
                label: setting.label || t('actionSfx.inputs.volume'),
                value: setting.value || 1.0,
                type: setting.type || 'number',
                disabled: setting.disabled || false
            }));
        }
    }
};

onMounted(() => {
    // 注册action回调和序列化方法
    actionItem.action = targetAction;
    actionItem.serialize = serialization;
    modification = action.getCurrentModification(props.title, props.id);

    // 先初始化音频列表，再恢复保存的选项
    updateAudioList();

    // 反序列化数据
    deserialization(actionItem);

    // 确保selectedAudioOption在有效范围内
    if (selectedAudioOption.value >= availableSfxAudios.value.length) {
        selectedAudioOption.value = 0;
    }
    // 设置定时器，每秒检查一次资源变化
    audioListTimer = window.setInterval(() => {
        updateAudioList();
    }, 1000);
});

watch(locale, syncLabels, { immediate: true });

onUnmounted(() => {
    // 组件卸载时停止音频
    previewStop();
    
    // 清除定时器
    if (audioListTimer !== null) {
        clearInterval(audioListTimer);
        audioListTimer = null;
    }
});
</script>

<style lang="css" scoped>
button {
    width: 30px;
    height: 30px;
    font-size: 18px;
    color: var(--error-color);
    border: none;
    border-radius: 5px;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
}

button:hover {
    background-color: var(--error-color);
    color: white;
}

button.preview-btn:hover {
    background-color: transparent;
    color: green;
}

.preview-controls {
    display: flex;
    gap: 5px;
    align-items: center;
}
</style>
