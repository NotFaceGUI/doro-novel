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
            </template>

            <template v-else-if="AudioOperaMode[selectedOption].value === 'stop'">
                <div style="display: flex;justify-content: center;align-items: center;">
                    停止当前播放的背景音乐
                </div>
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
import { ResType } from '../../../script/var';
import { Sound } from '@pixi/sound';
import { setModification } from '../../../script/util/common';

const selectedOption = ref(0);
const AudioOperaMode = ref<DropdownOption[]>([
    { label: "播放音频 (Play)", value: "play" },
    { label: "停止音频 (Stop)", value: "stop" }
]);

const selectedAudioOption = ref(0);
const isLoop = ref(false);
const isPlaying = ref(false);
const currentSound = ref<Sound | null>(null);
const audioList = ref<Record<string, string>>({});

const volumeSettings = ref<InputOption[]>([
    {
        label: '音量 (0-1)',
        value: 1.0,
        type: 'number',
        disabled: false
    }
]);

// 监听音量和循环设置变化，实时更新播放效果
watchEffect(() => {
    // 只有在当前有音频在播放时才更新设置
    if (currentSound.value && isPlaying.value) {
        // 更新音量
        currentSound.value.volume = volumeSettings.value[0].value;
        // 更新循环设置
        currentSound.value.loop = isLoop.value;
    }
});

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
    console.log("当前操作模式:", mode);
    if (mode === 'play') {
        // 播放音频
        if (selectedAudioKey.value) {
            const sound = ResourceManager.getResource<Sound>(selectedAudioKey.value, ResType.Audio);
            if (sound) {
                // 停止之前的音频
                if (currentSound.value) {
                    currentSound.value.stop();
                }

                // 设置音频属性
                sound.volume = volumeSettings.value[0].value;
                sound.loop = isLoop.value;

                // 播放音频
                sound.play();
                currentSound.value = sound;

                // 保存到快照
                setModification(modification, 'sound.bgm', selectedAudioKey.value);
                // setModification(modification, 'sound.volume', volumeSettings.value[0].value);
                // setModification(modification, 'sound.loop', isLoop.value);
            }
        }
    } else if (mode === 'stop') {
        console.log("停止音频:", currentSound.value);

        // 停止音频
        if (currentSound.value) {
            currentSound.value.stop();
            currentSound.value = null;
        }

        // 清除快照中的音频信息
        setModification(modification, 'sound.bgm', '');
    }
};

// 预览播放
const previewPlay = () => {
    if (!canPreview.value) return;

    if (isPlaying.value) {
        // 暂停
        if (currentSound.value) {
            currentSound.value.pause();
            isPlaying.value = false;
        }
    } else {
        // 播放
        const sound = ResourceManager.getResource<Sound>(selectedAudioKey.value, ResType.Audio);
        if (sound) {
            if (currentSound.value && currentSound.value !== sound) {
                currentSound.value.stop();
            }

            sound.volume = volumeSettings.value[0].value;
            sound.loop = false; // 预览时不循环
            sound.play({
                complete: () => {
                    isPlaying.value = false;
                }
            });
            currentSound.value = sound;
            isPlaying.value = true;
        }
    }
};

// 预览停止
const previewStop = () => {
    if (currentSound.value) {
        currentSound.value.stop();
        currentSound.value = null;
        isPlaying.value = false;
    }
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
