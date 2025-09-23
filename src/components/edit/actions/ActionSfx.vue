<template>
    <div class="action-item-main">
        <ActionItemHead content="🎶 音效播放" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                选择音效文件
            </div>
            <Dropdown style="width: 100%;overflow: hidden;" v-model="selectedAudioOption" @update:modelValue="onSelectAudio" :options="availableSfxAudios"
                :disabled="false" />

            <div class="action-title">
                音量设置
            </div>
            <div>
                <DynamicInputs v-model="volumeSettings" :columns="volumeSettings.length">
                </DynamicInputs>
            </div>

            <ActionBottomLine></ActionBottomLine>

            <!-- 预览控制 -->
            <div class="action-title">
                预览控制
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
import { computed, onMounted, ref, onUnmounted } from 'vue';
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
import { InputOption } from '../../../types/app';

const selectedAudioOption = ref(0);
const isPlaying = ref(false);
const audioList = ref<Record<string, string>>({});
let currentSfxSound: Sound | null = null;

const volumeSettings = ref<InputOption[]>([
    {
        label: '音量 (0-1)',
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
        return [{ label: '无可用音效文件', value: '' }];
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

// 定时器引用
let audioListTimer: number | null = null;

onMounted(() => {
    // 注册action回调
    actionItem.action = targetAction;
    modification = action.getCurrentModification(props.title, props.id);

    // 确保selectedAudioOption在有效范围内
    if (selectedAudioOption.value >= availableSfxAudios.value.length) {
        selectedAudioOption.value = 0;
    }
    
    // 初始化音频列表
    updateAudioList();
    
    // 设置定时器，每秒检查一次资源变化
    audioListTimer = window.setInterval(() => {
        updateAudioList();
    }, 1000);
});

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