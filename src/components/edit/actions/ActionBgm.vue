<template>
    <div class="action-item-main">
        <ActionItemHead content="🔊 背景音乐" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                音频操作模式：
            </div>

            <Dropdown v-model="selectedOption" @update:modelValue="onSelectModel" :options="AudioOperaMode"
                :disabled="false" />

            <ActionBottomLine></ActionBottomLine>

            <template v-if="AudioOperaMode[selectedOption].value === 'play'">
                <div class="action-title">
                    选择音频文件
                </div>
                <Dropdown style="width: 100%;overflow: hidden;" v-model="selectedAudioOption" @update:modelValue="onSelectAudio" :options="availableAudios"
                    :disabled="false" />

                <div class="action-title">
                    音量设置
                </div>
                <div>
                    <DynamicInputs v-model="volumeSettings" :columns="volumeSettings.length">
                    </DynamicInputs>
                </div>

                <div class="action-title">
                    循环播放
                    <ToggleSwitch v-model="isLoop"></ToggleSwitch>
                </div>

                <!-- 淡入淡出设置 -->
                <div class="action-title">
                    淡入效果
                    <ToggleSwitch v-model="enableFadeIn"></ToggleSwitch>
                </div>
                
                <template v-if="enableFadeIn">
                    <div>
                        <DynamicInputs v-model="fadeInSettings" :columns="fadeInSettings.length">
                        </DynamicInputs>
                    </div>
                </template>

                <div class="action-title">
                    淡出效果
                    <ToggleSwitch v-model="enableFadeOut"></ToggleSwitch>
                </div>
                
                <template v-if="enableFadeOut">
                    <div>
                        <DynamicInputs v-model="fadeOutSettings" :columns="fadeOutSettings.length">
                        </DynamicInputs>
                    </div>
                </template>

                <!-- 音频过滤器设置 -->
                <div class="action-title">
                    音频效果
                    <ToggleSwitch v-model="enableFilters"></ToggleSwitch>
                </div>
                
                <template v-if="enableFilters">
                    <div>
                        <DynamicInputs v-model="filterSettings" :columns="2">
                        </DynamicInputs>
                    </div>
                    
                    <div class="action-title">
                        电话效果
                        <ToggleSwitch v-model="enableTelephone"></ToggleSwitch>
                    </div>
                    
                    <div class="action-title">
                        混响效果
                        <ToggleSwitch v-model="enableReverb"></ToggleSwitch>
                    </div>
                    
                    <template v-if="enableReverb">
                        <div>
                            <DynamicInputs v-model="reverbSettings" :columns="2">
                            </DynamicInputs>
                        </div>
                    </template>
                    
                    <div class="action-title">
                        均衡器
                        <ToggleSwitch v-model="enableEqualizer"></ToggleSwitch>
                    </div>
                    
                    <template v-if="enableEqualizer">
                        <div>
                            <DynamicInputs v-model="equalizerSettings" :columns="5">
                            </DynamicInputs>
                        </div>
                    </template>
                </template>
            </template>

            <template v-else-if="AudioOperaMode[selectedOption].value === 'stop'">
                <div style="display: flex;justify-content: center;align-items: center;">
                    停止当前播放的背景音乐
                </div>
                
                <!-- 停止时的淡出设置 -->
                <div class="action-title">
                    淡出停止
                    <ToggleSwitch v-model="enableStopFadeOut"></ToggleSwitch>
                </div>
                
                <template v-if="enableStopFadeOut">
                    <div>
                        <DynamicInputs v-model="stopFadeOutSettings" :columns="stopFadeOutSettings.length">
                        </DynamicInputs>
                    </div>
                </template>
            </template>

            <template v-else>
                <div style="display: flex;justify-content: center;align-items: center;">
                    无内容
                </div>
            </template>

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
                    <button @click="clearAllFilters" class="preview-btn" title="清除所有音效">
                        🔄
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted, watchEffect } from 'vue';
import { useCommonState } from '../../../script/common/common-action-item';
import ActionItemHead from './ActionItemHead.vue';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import Dropdown from '../../common/Dropdown.vue';
import { DropdownOption, InputOption } from '../../../types/app';
import DynamicInputs from '../../common/DynamicInputs.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import ResourceManager from '../../../script/resource-manager';
import { setModification } from '../../../script/util/common';
import AudioManager, { FadeOptions, FilterOptions } from '../../../script/audio-manager';

const selectedOption = ref(0);
const AudioOperaMode = ref<DropdownOption[]>([
    { label: "播放音频 (Play)", value: "play" },
    { label: "停止音频 (Stop)", value: "stop" }
]);

const selectedAudioOption = ref(0);
const isLoop = ref(false);
const isPlaying = ref(false);
// 不再使用本地音频引用，完全依赖全局音频管理器
const audioList = ref<Record<string, string>>({});

// 淡入淡出设置
const enableFadeIn = ref(false);
const enableFadeOut = ref(false);
const enableStopFadeOut = ref(false);

const fadeInSettings = ref<InputOption[]>([
    {
        label: '淡入时长 (秒)',
        value: 3.0,
        type: 'number',
        disabled: false
    }
]);

const fadeOutSettings = ref<InputOption[]>([
    {
        label: '淡出时长 (秒)',
        value: 3.0,
        type: 'number',
        disabled: false
    }
]);

const stopFadeOutSettings = ref<InputOption[]>([
    {
        label: '停止淡出时长 (秒)',
        value: 2.0,
        type: 'number',
        disabled: false
    }
]);

// 音频过滤器设置
const enableFilters = ref(false);
const enableTelephone = ref(false);
const enableReverb = ref(false);
const enableEqualizer = ref(false);

const filterSettings = ref<InputOption[]>([
    {
        label: '立体声分离 (-1到1)',
        value: 0,
        type: 'number',
        disabled: false
    },
    {
        label: '失真效果 (0到1)',
        value: 0,
        type: 'number',
        disabled: false
    }
]);

const reverbSettings = ref<InputOption[]>([
    {
        label: '混响时间 (秒)',
        value: 3,
        type: 'number',
        disabled: false
    },
    {
        label: '衰减强度',
        value: 2,
        type: 'number',
        disabled: false
    }
]);

const equalizerSettings = ref<InputOption[]>([
    { label: '32Hz', value: 0, type: 'number', disabled: false },
    { label: '64Hz', value: 0, type: 'number', disabled: false },
    { label: '125Hz', value: 0, type: 'number', disabled: false },
    { label: '250Hz', value: 0, type: 'number', disabled: false },
    { label: '500Hz', value: 0, type: 'number', disabled: false },
    { label: '1kHz', value: 0, type: 'number', disabled: false },
    { label: '2kHz', value: 0, type: 'number', disabled: false },
    { label: '4kHz', value: 0, type: 'number', disabled: false },
    { label: '8kHz', value: 0, type: 'number', disabled: false },
    { label: '16kHz', value: 0, type: 'number', disabled: false }
]);


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

// 获取可用的音频文件
const availableAudios = computed(() => {
    const audioKeys = Object.keys(audioList.value).filter(key => {
        // 检查是否是音频文件（通过文件扩展名）
        const url = audioList.value[key];
        return url && (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg'));
    });

    const audioOptions = audioKeys.map((key, _index) => ({
        label: key,
        value: key
    }));

    // 如果没有音频文件，返回一个默认选项
    if (audioOptions.length === 0) {
        return [{ label: '无可用音频文件', value: '' }];
    }

    return audioOptions;
});

// 更新音频列表的函数
const updateAudioList = () => {
    // 将 ResourceManager.allResUrl 复制到响应式的 audioList 中
    audioList.value = {...ResourceManager.allResUrl};
};

const canPreview = computed(() => {
    return AudioOperaMode.value[selectedOption.value].value === 'play' &&
        availableAudios.value.length > 0 &&
        selectedAudioOption.value < availableAudios.value.length &&
        availableAudios.value[selectedAudioOption.value].value !== ''; // 确保不是默认的空选项
});

const selectedAudioKey = computed(() => {
    if (availableAudios.value.length > 0 &&
        selectedAudioOption.value < availableAudios.value.length &&
        availableAudios.value[selectedAudioOption.value].value !== '') {
        return availableAudios.value[selectedAudioOption.value].value;
    }
    return '';
});

// 主要的action执行函数
const targetAction = () => {
    const mode = AudioOperaMode.value[selectedOption.value].value;
    console.log("当前操作模式:", mode, "组件ID:", props.id);
    
    const audioManager = AudioManager.getInstance();
    
    if (mode === 'play') {
        // 播放音频
        if (selectedAudioKey.value) {
            // 准备淡入选项
            let fadeInOptions: FadeOptions | undefined;
            if (enableFadeIn.value) {
                fadeInOptions = {
                    duration: fadeInSettings.value[0].value,
                    from: 0,
                    to: volumeSettings.value[0].value
                };
            }
            
            // 准备过滤器选项
            let filterOptions: FilterOptions | undefined;
            if (enableFilters.value) {
                filterOptions = {
                    stereoSeparation: filterSettings.value[0].value,
                    distortion: filterSettings.value[1].value,
                    telephone: enableTelephone.value,
                    reverb: enableReverb.value ? {
                        seconds: reverbSettings.value[0].value,
                        decay: reverbSettings.value[1].value
                    } : undefined,
                    equalizer: enableEqualizer.value ? 
                        equalizerSettings.value.map(setting => setting.value) : undefined
                };
            }
            
            // 使用全局音频管理器播放（带高级功能）
            audioManager.playBgm(
                selectedAudioKey.value, 
                volumeSettings.value[0].value, 
                isLoop.value,
                fadeInOptions,
                filterOptions
            );
            
            // 只更新当前组件的UI状态
            if (AudioOperaMode.value[selectedOption.value].value === 'play') {
                isPlaying.value = true;
            }
            
            // 保存到快照
            setModification(modification, 'sound.bgm', selectedAudioKey.value);
        }
    } else if (mode === 'stop') {
        console.log("停止播放，组件ID:", props.id);
        // 准备淡出选项
        let fadeOutOptions: FadeOptions | undefined;
        if (enableStopFadeOut.value) {
            fadeOutOptions = {
                duration: stopFadeOutSettings.value[0].value,
                to: 0
            };
        }
        
        // 停止音频（带淡出效果）
        audioManager.stopBgm(fadeOutOptions);
        
        // 清除快照中的音频信息
        setModification(modification, 'sound.bgm', '');
    }
};

// 预览播放
const previewPlay = () => {
    if (!canPreview.value) return;

    const audioManager = AudioManager.getInstance();
    console.log("预览播放，组件ID:", props.id, "音频:", selectedAudioKey.value);
    
    if (isPlaying.value) {
        // 暂停
        audioManager.pauseBgm();
        isPlaying.value = false;
    } else {
        // 准备过滤器选项（预览时也应用过滤器）
        let filterOptions: FilterOptions | undefined;
        if (enableFilters.value) {
            filterOptions = {
                stereoSeparation: filterSettings.value[0].value,
                distortion: filterSettings.value[1].value,
                telephone: enableTelephone.value,
                reverb: enableReverb.value ? {
                    seconds: reverbSettings.value[0].value,
                    decay: reverbSettings.value[1].value
                } : undefined,
                equalizer: enableEqualizer.value ? 
                    equalizerSettings.value.map(setting => setting.value) : undefined
            };
        }
        
        // 播放（预览时不使用淡入效果，但可以使用过滤器）
        audioManager.playBgm(
            selectedAudioKey.value, 
            volumeSettings.value[0].value, 
            false, // 预览时不循环
            undefined, // 预览时不使用淡入
            filterOptions
        );
        
        // 设置播放完成回调
        if (audioManager.currentBgm) {
            audioManager.currentBgm.play({
                complete: () => {
                    // 只有当前组件是播放这个音频的组件时才更新状态
                    if (audioManager.currentBgmKey === selectedAudioKey.value) {
                        isPlaying.value = false;
                    }
                }
            });
        }
        
        // 只有当前组件是播放模式且选择的音频与正在播放的相同时才更新状态
        if (AudioOperaMode.value[selectedOption.value].value === 'play' && 
            audioManager.currentBgmKey === selectedAudioKey.value) {
            isPlaying.value = true;
        }
    }
};

// 预览停止
const previewStop = () => {
    // 直接使用全局音频管理器停止
    const audioManager = AudioManager.getInstance();
    audioManager.stopBgm();
    isPlaying.value = false;
};

// 清除所有过滤器
const clearAllFilters = () => {
    const audioManager = AudioManager.getInstance();
    audioManager.clearFilters();
    console.log("已清除所有音频过滤器");
};

const onSelectModel = () => {
    // 切换模式时停止预览
    previewStop();
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
    if (selectedAudioOption.value >= availableAudios.value.length) {
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

// 监听音量和循环设置变化，实时更新播放效果
watchEffect(() => {
    // 只有在当前有音频在播放时才更新设置
    if (isPlaying.value) {
        const audioManager = AudioManager.getInstance();
        if (audioManager.currentBgm) {
            // 更新音量
            audioManager.currentBgm.volume = volumeSettings.value[0].value;
            // 更新循环设置
            audioManager.currentBgm.loop = isLoop.value;
        }
    }
});

// 监听全局音频管理器状态变化
watchEffect(() => {
    const audioManager = AudioManager.getInstance();
    
    // 根据全局音频管理器状态更新UI
    if (audioManager.currentBgm) {
        // 如果当前模式是播放且全局正在播放的是当前选择的音频
        if (AudioOperaMode.value[selectedOption.value].value === 'play' && 
            audioManager.currentBgmKey === selectedAudioKey.value) {
            isPlaying.value = !audioManager.currentBgm.paused;
        }
        // 不要在这里更新停止模式的状态，让每个实例独立控制
    } else {
        // 如果全局没有音频在播放，且当前组件是播放模式，则更新UI状态
        if (AudioOperaMode.value[selectedOption.value].value === 'play') {
            isPlaying.value = false;
        }
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
</style>
