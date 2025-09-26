<template>
    <div class="action-item-main">
        <ActionItemHead content="💬 设置对话" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>
            <div class="action-title">
                对话结束后隐藏UI
                <ToggleSwitch v-model="hideUIAfterDialogue"></ToggleSwitch>
            </div>
            <div class="action-title" style="align-items: center;" v-if="hideUIAfterDialogue">
                延迟消失时间(ms)
                <div style="display: flex;">
                    <input type="number" v-model.number="hideUIDelay" min="0" step="10" class="delay-input"
                        placeholder="0" />
                    <Tooltip position="left">
                        <div>
                            可以指定对话UI<span style="color: var(--button-bg);">延迟消失</span>的时间
                        </div>
                    </Tooltip>
                </div>
            </div>
        </div>
        <VueDraggable v-model="messages" :animation="200" ghostClass="ghost-item" chosenClass="chosen-item"
            dragClass="drag-item" handle=".drag-handle" @start="onDragStart" @end="onDragEnd">
            <div class="action-item-content" v-for="(message, messageIndex) in messages" :key="message.id || messageIndex">
                <!-- 拖拽手柄 -->
                <div class="drag-handle" title="拖拽排序">⋮⋮</div>

                <div class="left-content">

                    <!-- 只有普通对话才显示头像 -->
                    <img v-if="message.mode === DialogueType.NORMAL" class="character-image"
                        @click="bindCharacter(messageIndex)" src="../../../assets/Icon.jpg"
                        style="width: 25px;height: 25px;" alt="" srcset="">
                    <!-- 颜色选择器 -->
                    <div class="color-picker-container" v-if="message.mode === DialogueType.NORMAL">
                        <!-- <label class="color-picker-label">🎨角色颜色</label> -->
                        <ColorPicker v-model="message.speakerColor"
                            @update:modelValue="updateSpeakerColor(messageIndex, $event)" />
                    </div>
                    <div class="character-name" v-if="!editing[messageIndex]" @click="editName(messageIndex)">
                        {{ t(message.speaker) }}
                        <span class="dialogue-type-tag" :class="getDialogueTypeClass(message.mode)">
                            {{ getDialogueTypeLabel(message.mode) }}
                        </span>
                    </div>
                    <input v-if="editing[messageIndex]" v-model="message.speaker"
                        @blur="saveName(message.speaker, messageIndex)"
                        @keydown.enter="saveName(message.speaker, messageIndex)" type="text" class="name-input" />

                    <div class="name-edit" title="点击设置别名" @click="editName(messageIndex)">🖍</div>

                    <!-- 高级模式开关 -->
                    <div class="advanced-mode-toggle">
                        <label @click="message.advancedMode = !message.advancedMode"
                            class="advanced-label">🔧高级模式</label>
                    </div>
                    <!-- 对话操作按钮 -->
                    <div class="message-controls">
                        <!-- <button class="control-btn move-up-btn" 
                        @click="moveMessage(messageIndex, 'up')" 
                        :disabled="messageIndex === 0"
                        title="上移">
                    ↑
                </button>
                <button class="control-btn move-down-btn" 
                        @click="moveMessage(messageIndex, 'down')" 
                        :disabled="messageIndex === messages.length - 1"
                        title="下移">
                    ↓
                </button> -->
                        <button class="control-btn delete-btn" @click="deleteMessage(messageIndex)" title="删除">
                            ✕
                        </button>
                    </div>
                    <div class="character-tip"
                        v-if="message.speaker === '请选择角色' && message.mode === DialogueType.NORMAL">
                        点击头像绑定角色</div>
                </div>
                <div class="right-content">
                    <div class="text-input" v-for="(text, textIndex) in message.texts" :key="message.id || (text + textIndex.toString())">
                        <div class="editable-div" contenteditable="true" @input="updateTextContent($event, text)"
                            @paste="handlePaste($event)" :data-placeholder="'请输入文本……'"></div>
                        <div class="text-controls" v-if="message.advancedMode">
                            <label class="text-control-label">摄像机代理：</label>
                            <ToggleSwitch v-model="(text.isCameraProxy as boolean)"></ToggleSwitch>
                        </div>
                        <div class="action-item-content">
                            <!-- 使用Dropdown组件的摄像机控制选项，只在高级模式开启且为最后一个文本条目时显示 -->
                            <div class="camera-controls"
                                v-if="message.parms && message.advancedMode && textIndex === message.texts.length - 1">
                                <div class="camera-control-row">
                                    <label class="control-label">机位选择：</label>
                                    <Dropdown v-model="message.parms.cameraStandTypeIndex!" @update:modelValue="(value) => {
                                        if (messages[messageIndex].parms) {
                                            messages[messageIndex].parms.cameraStandTypeIndex = value;
                                            messages[messageIndex].parms.cameraStandType = cameraStandOptions[value].value as CameraStandType;
                                        }
                                    }" :options="cameraStandOptions" :disabled="false" />
                                </div>

                                <div class="camera-control-row">
                                    <label class="control-label">启用移动：</label>
                                    <ToggleSwitch v-model="message.parms.isMove"></ToggleSwitch>
                                </div>

                                <div class="camera-control-row" v-if="message.parms.isMove">
                                    <label class="control-label">缓动函数：</label>
                                    <Dropdown v-model="message.parms.easeIndex!" @update:modelValue="(value) => {
                                        if (messages[messageIndex].parms) {
                                            messages[messageIndex].parms.easeIndex = value;
                                            messages[messageIndex].parms.ease = easingOptions[value].value as EasingFunction;
                                        }
                                    }" :options="easingOptions" :disabled="false" />
                                </div>

                                <div class="camera-control-row" v-if="message.parms.isMove">
                                    <label class="control-label">动画时长：</label>
                                    <input type="number" v-model.number="message.parms.duration" min="100" max="5000"
                                        step="100" class="camera-input">
                                    <span class="unit-label">ms</span>
                                </div>

                                <div class="camera-control-row">
                                    <label class="control-label">选择名称：</label>
                                    <Dropdown v-model="message.parms.animationIndex!" @update:modelValue="(value) => {
                                        if (messages[messageIndex].parms) {
                                            messages[messageIndex].parms.animationIndex = value;
                                            messages[messageIndex].parms.animation = messages[messageIndex].parms?.amintionOption![value].value as string;
                                        }
                                    }" :options="messages[messageIndex].parms?.amintionOption!" :disabled="false" />
                                </div>

                                <div class="camera-control-row">
                                    <label class="control-label">动画循环：</label>
                                    <ToggleSwitch v-model="message.parms.isLoop"></ToggleSwitch>
                                </div>

                                <div class="camera-control-row">
                                    <label class="control-label">机位偏移X：</label>
                                    <input type="number" v-model.number="message.parms.xOffSet" class="camera-input"
                                        step="10">
                                    <span class="unit-label">px</span>
                                </div>

                                <div class="camera-control-row">
                                    <label class="control-label">机位偏移Y：</label>
                                    <input type="number" v-model.number="message.parms.yOffSet" class="camera-input"
                                        step="10">
                                    <span class="unit-label">px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VueDraggable>
        <div>
            <div class="pre-bind-section">
                <button v-if="!preSelectedCharacter" @click.stop="preBindCharacter" class="pre-bind-btn">
                    👤 预选角色
                </button>
                <div v-else class="pre-selected-character">
                    <button @click.stop="preBindCharacter" class="pre-bind-btn">
                        👤 {{ t(preSelectedCharacter.characterName) }}
                    </button>
                    <button @click.stop="clearPreSelectedCharacter" class="clear-btn" title="清除预选角色">
                        ✕
                    </button>
                </div>
            </div>
        </div>
        <div class="action-dialogue-tool">
            <div style="display: flex;flex-direction: column;align-items: center;justify-content: center;flex: 1;">
                <button class="action-dialogue-tool-button " style="width: 100%;"
                    @click.stop="showDialogueTypeSelector">✨&emsp;新增</button>
                <div style="width: 100%;display: flex;">
                    <button @click.stop="selectDialogueType(DialogueType.NORMAL)"
                        class="quick-button action-dialogue-tool-button ">💬 普通</button>
                    <button @click.stop="selectDialogueType(DialogueType.VOICEOVER)"
                        class="quick-button action-dialogue-tool-button ">📢 旁白</button>
                    <button @click.stop="selectDialogueType(DialogueType.COMMANDER)"
                        class="quick-button action-dialogue-tool-button ">👨‍✈️ 自己</button>
                </div>

            </div>
            <div style="height: 25px; border-left: 1px dashed #88888855;"></div>
            <button @click.stop="readditionMsg">📌&emsp;追加</button>
        </div>

        <!-- 对话类型选择弹窗 -->
        <teleport to="body">
            <div class="dialogue-type-modal" v-if="showTypeSelector" @click.self="showTypeSelector = false">
                <div class="dialogue-type-modal-content">
                    <div class="dialogue-type-modal-header">
                        <h3>选择对话类型</h3>
                        <span class="close-btn" @click="showTypeSelector = false">×</span>
                    </div>
                    <div class="dialogue-type-modal-body">
                        <div v-for="(type, index) in dialogueTypes" :key="index" class="dialogue-type-option"
                            @click="selectDialogueType(type.value)">
                            <div class="dialogue-type-icon">{{ type.icon }}</div>
                            <div class="dialogue-type-info">
                                <div class="dialogue-type-name">{{ type.label }}</div>
                                <div class="dialogue-type-desc">{{ type.description }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
// 在 script setup 部分添加
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { DialogTextData, DialogueType } from '../../../types/app';
import ActionItemHead from './ActionItemHead.vue';
import massage from '../../../script/common/massage';
import { selectCharacterType, selectSceneCharacterType } from '../../../script/common/search-action';
import { handleSceneState, useCommonState } from '../../../script/common/common-action-item';
import CanvasManager from '../../../script/render/canvas-manager';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import { useI18n } from 'vue-i18n';
import { useCharacterConfigStore } from '../../../stores/character-config-store';
// 添加机位相关导入
import { CameraStandType, getEasingFunctionOptions, EasingFunction } from '../../../script/camera-stand';
import Dropdown from '../../common/Dropdown.vue';
import ColorPicker from '../../common/ColorPicker.vue';
import { DropdownOption } from '../../../types/app';
import { Modification, PropertyPath } from '../../../script/common/snapshot';
import Tooltip from '../../common/Tooltip.vue';
import { VueDraggable } from 'vue-draggable-plus';

const props = defineProps<{
    title: string,
    id: number
}>();

const { t } = useI18n()

// 使用角色配置store
const characterConfigStore = useCharacterConfigStore()

const { action, actionItem } = useCommonState(props.title, props.id);
const canvasManager = CanvasManager.getInstance();

let viewport = canvasManager.viewport;

// 生成唯一ID的函数
const generateUniqueId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
};

const messages = ref<DialogTextData[]>([]);
const editing = ref<{ [key: number]: boolean }>({});

// 添加隐藏UI相关的响应式变量
const hideUIAfterDialogue = ref<boolean>(false);
const hideUIDelay = ref<number>(0);

// 对话类型选择器状态
const showTypeSelector = ref(false);

// 添加预绑定角色状态
const preSelectedCharacter = ref<{
    characterName: string;
    speakerColor: number;
    parms?: any;
} | null>(null);

// 对话类型定义
const dialogueTypes = [
    {
        label: '普通对话',
        value: DialogueType.NORMAL,
        icon: '💬',
        description: '角色之间的标准对话'
    },
    {
        label: '旁白',
        value: DialogueType.VOICEOVER,
        icon: '📢',
        description: '叙述性文本，没有特定角色'
    },
    {
        label: '指挥官回答',
        value: DialogueType.COMMANDER,
        icon: '👨‍✈️',
        description: '玩家角色的对话内容'
    }
];

// 获取对话类型标签
const getDialogueTypeLabel = (type: DialogueType) => {
    const dialogueType = dialogueTypes.find(t => t.value === type);
    return dialogueType ? dialogueType.label : '普通对话';
};

// 获取对话类型CSS类
const getDialogueTypeClass = (type: DialogueType) => {
    return {
        'normal-type': type === DialogueType.NORMAL,
        'voiceover-type': type === DialogueType.VOICEOVER,
        'commander-type': type === DialogueType.COMMANDER
    };
};

// 显示对话类型选择器
const showDialogueTypeSelector = () => {
    showTypeSelector.value = true;
};

// 选择对话类型并添加新对话
// 添加预绑定角色的方法
const preBindCharacter = () => {
    selectSceneCharacterType().then((res) => {
        const characterName = res.character.characterName;

        // 从store中获取已保存的角色配置
        const savedConfig = characterConfigStore.getCharacterConfig(characterName);

        console.log("preBindCharacter:", characterName, savedConfig);

        preSelectedCharacter.value = {
            characterName,
            speakerColor: savedConfig?.speakerColor ?? 0xfaaaaa, // 使用保存的颜色或默认颜色
            parms: {
                CharacterName: characterName,
                yOffSet: savedConfig?.yOffSet ?? 0, // 使用保存的偏移或场景偏移
                xOffSet: savedConfig?.xOffSet ?? 0, // 使用保存的偏移或场景偏移
                isMove: true,
                spine: res.spine,
                animationOption: res.spine.state.data.skeletonData.animations.map((item, _index) => {
                    return {
                        value: item.name,
                        label: item.name,
                    };
                })
            }
        };

        // 如果没有保存的配置，保存当前配置到store
        if (!savedConfig) {
            characterConfigStore.saveCharacterConfig({
                characterName,
                speakerColor: preSelectedCharacter.value.speakerColor,
                yOffSet: preSelectedCharacter.value.parms.yOffSet,
                xOffSet: preSelectedCharacter.value.parms.xOffSet
            });
        }

        console.log("object:", preSelectedCharacter.value);
        massage(`已预选角色：${characterName}`, 'success', 2000);
    }).catch((err) => {
        console.log(err);
    });
};

// 清除预绑定角色
const clearPreSelectedCharacter = () => {
    preSelectedCharacter.value = null;
    massage('已清除预选角色', 'info', 2000);
};

// 添加机位选项
const cameraStandOptions = ref<DropdownOption[]>([
    { label: '大(全景镜头)', value: 'large' },
    { label: '中(半身镜头)', value: 'medium' },
    { label: '小(特写镜头)', value: 'small' }
]);

// 获取缓动函数选项
const easingOptions = ref<DropdownOption[]>(getEasingFunctionOptions());

// 修改选择对话类型并添加新对话的方法
const selectDialogueType = (type: DialogueType) => {


    // 根据不同对话类型设置不同的默认值
    let newMessage: DialogTextData = {
        id: generateUniqueId(),
        speakerColor: 0xfaaaaa,
        speaker: '请选择角色',
        texts: [{
            text: '',
            isCameraProxy: true,
        }],
        mode: type
    };

    // 如果是普通对话且有预选角色，直接使用预选角色
    if (type === DialogueType.NORMAL && preSelectedCharacter.value) {

        const savedConfig = characterConfigStore.getCharacterConfig(preSelectedCharacter.value?.characterName);

        newMessage.speaker = preSelectedCharacter.value.characterName;
        newMessage.speakerColor = savedConfig?.speakerColor ?? preSelectedCharacter.value.speakerColor;
        newMessage.isBind = true;
        newMessage.parms = {
            ...preSelectedCharacter.value.parms,
            cameraStandTypeIndex: 1, // 默认中机位
            cameraStandType: 'medium',
            easeIndex: 3, // 默认第一个缓动函数
            ease: EasingFunction.EaseInOutSine,
            duration: 300,
            animation: 'idle', // 默认动画
            animationIndex: 0, // 默认第为idel
            amintionOption: preSelectedCharacter.value.parms.animationOption, // 显式设置动画选项
            isLoop: true, // 默认循环播放动画
            // 保持预选角色中已经从store读取的偏移值
            xOffSet: savedConfig?.xOffSet ?? preSelectedCharacter.value.parms.xOffSet,
            yOffSet: savedConfig?.yOffSet ?? preSelectedCharacter.value.parms.yOffSet
        };

        if (newMessage.parms) {
            newMessage.parms.animationIndex = newMessage.parms?.amintionOption?.findIndex((item: any) => item.value === "idle") || 0;
        }
    } else if (type === DialogueType.NORMAL) {
        // // 普通对话但没有预选角色
        // newMessage.parms = {
        //     CharacterName: '',
        //     yOffSet: 0,
        //     xOffSet: 0,
        //     isMove: false,
        //     cameraStandTypeIndex: 0,
        //     cameraStandType: 'large',
        //     easeIndex: 0,
        //     animationIndex: 0,
        //     animation: 'idle',
        //     ease: '',
        //     duration: 300,
        //     isLoop: true, // 默认循环播放动画
        // };
        massage('请先选择角色', 'error', 2000);
        return;
    }
    // 如果是旁白，修改默认值
    else if (type === DialogueType.VOICEOVER) {
        newMessage.speaker = '旁白';
    }
    // 如果是指挥官回答，修改默认值
    else if (type === DialogueType.COMMANDER) {
        newMessage.speaker = '指挥官';
        newMessage.speakerColor = 0x3399ff; // 蓝色
    }

    messages.value.push(newMessage);
    showTypeSelector.value = false;
};

const bindCharacter = (index: number) => {
    // 只有普通对话才能绑定角色
    if (messages.value[index].mode !== DialogueType.NORMAL) {
        return;
    }

    selectCharacterType().then((res) => {
        const characterName = res.characterName;

        // 从store中获取已保存的角色配置
        const savedConfig = characterConfigStore.getCharacterConfig(characterName);

        messages.value[index].speaker = characterName;
        messages.value[index].isBind = true;

        // 使用保存的配置或默认值
        messages.value[index].speakerColor = savedConfig?.speakerColor ?? 0xfaaaaa;
        messages.value[index].parms = {
            CharacterName: characterName,
            yOffSet: savedConfig?.yOffSet ?? 0,
            xOffSet: savedConfig?.xOffSet ?? 0,
            isMove: true,
            isLoop: true, // 默认循环播放动画

            cameraStandTypeIndex: 1, // 默认中机位
            cameraStandType: 'medium',
            easeIndex: 3,
            animationIndex: 0,
            animation: 'idle',
            ease: EasingFunction.EaseInOutSine,
            duration: 300
        }

        // 如果没有保存的配置，保存当前配置到store
        if (!savedConfig) {
            characterConfigStore.saveCharacterConfig({
                characterName,
                speakerColor: messages.value[index].speakerColor!,
                yOffSet: messages.value[index].parms!.yOffSet,
                xOffSet: messages.value[index].parms!.xOffSet
            });
        }
    }).catch((err) => {
        console.log(err);
    });
};

// 旧的addMsg方法，现在不直接使用
// @ts-ignore
const addMsg = () => {
    messages.value.push({
        id: generateUniqueId(),
        speakerColor: 0xfaaaaa,
        speaker: '请选择角色',
        texts: [{
            text: '',
        }],
        mode: DialogueType.NORMAL
    });
};

// 删除对话
const deleteMessage = (index: number) => {
    // if (messages.value.length <= 1) {
    //     massage('至少需要保留一个对话', 'warning', 2000);
    //     return;
    // }

    messages.value.splice(index, 1);
    massage('已删除对话', 'success', 1500);
};

// 移动对话位置
// @ts-ignore
const moveMessage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // 检查边界
    if (newIndex < 0 || newIndex >= messages.value.length) {
        return;
    }

    // 使用splice方法来移动元素，这样能确保Vue正确检测到变化
    const [movedItem] = messages.value.splice(index, 1);
    messages.value.splice(newIndex, 0, movedItem);

    massage(`已${direction === 'up' ? '上移' : '下移'}对话`, 'success', 1500);
};

// 拖拽开始事件
const onDragStart = (evt: any) => {
    console.log('拖拽开始', evt);
};

// 拖拽结束事件
const onDragEnd = (evt: any) => {
    console.log('拖拽结束', evt);
    massage('对话顺序已更新', 'success', 1500);
};

const readditionMsg = () => {
    if (messages.value.length === 0) {
        massage('请先添加对话', 'error', 2000);
        return;
    }
    messages.value[messages.value.length - 1].texts.push({
        text: '',
        isCameraProxy: false
    });
};

const editName = (index: number) => {
    editing.value[index] = true;
};

const saveName = (speaker: string, index: number) => {
    editing.value[index] = false;
    messages.value[index].speaker = speaker;
};

// 更新角色颜色并保存到store
const updateSpeakerColor = (messageIndex: number, color: number) => {
    const message = messages.value[messageIndex];
    message.speakerColor = color;

    // 如果是绑定了角色的对话，保存颜色到store
    if (message.speaker && message.speaker !== '请选择角色') {
        characterConfigStore.saveCharacterConfig({
            characterName: message.speaker,
            speakerColor: color,
            yOffSet: message.parms?.yOffSet || 0,
            xOffSet: message.parms?.xOffSet || 0
        });
    }
};

// 监听messages变化，自动保存角色配置
watch(messages, (newMessages) => {
    newMessages.forEach(message => {
        if (message.mode === DialogueType.NORMAL && message.isBind && message.speaker !== '请选择角色') {
            // 更新store中的角色配置
            characterConfigStore.updateCharacterConfig(message.speaker, {
                speakerColor: message.speakerColor,
                yOffSet: message.parms?.yOffSet,
                xOffSet: message.parms?.xOffSet
            });
        }
    });
}, { deep: true });

let modification: Map<PropertyPath, Modification>;

const targetAction = async () => {
    handleSceneState(canvasManager, props);

    const ui = canvasManager.uiRender;
    console.log("previewSnapshot", action.previewSnapshot)

    // viewport.setZoom(action.previewSnapshot.camera.zoom);
    // viewport.moveCenter(action.previewSnapshot.camera.x, action.previewSnapshot.camera.y);
    // viewport.emit('moved');

    // 对话结束后，保存当前摄像机状态到快照
    await ui.startDialogue(messages.value, modification, hideUIAfterDialogue.value, hideUIDelay.value);

    // handleSceneState(canvasManager, props); // 结束后因为又更新了快照，所以需要重新设置预览快照
};

// 处理 ESC 键关闭弹窗
const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showTypeSelector.value) {
        showTypeSelector.value = false;
    }
};

// 添加自动调整textarea高度的方法
// @ts-ignore
const autoResize = (textarea: HTMLTextAreaElement) => {
    if (!textarea) return;

    // 重置高度，以便正确计算新的高度
    textarea.style.height = 'auto';

    // 设置新的高度 (scrollHeight是内容的实际高度)
    textarea.style.height = `${textarea.scrollHeight}px`;
};

// 更新文本内容的方法
const updateTextContent = (event: Event, textObj: any) => {
    const target = event.target as HTMLDivElement;
    textObj.text = target.innerText || '';
};

// 处理粘贴事件，只允许纯文本
const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
};

// 在组件挂载后，初始化所有已有的div内容
onMounted(() => {
    // 保留现有的 onMounted 代码
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    action.getAction(props.title).as[actionIndex].action = targetAction;
    modification = action.getCurrentModification(props.title, props.id);

    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 初始化所有可编辑div的内容
    setTimeout(() => {
        document.querySelectorAll('.text-input .editable-div').forEach((el, index) => {
            const messageIndex = Math.floor(index / messages.value.length);
            const textIndex = index % messages.value[messageIndex].texts.length;
            const text = messages.value[messageIndex].texts[textIndex].text;
            el.textContent = text;
        });
    }, 0);
});

onUnmounted(() => {
    // 移除键盘事件监听
    document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style lang="css" scoped>
/* 对话操作按钮样式 */
.message-controls {

    z-index: 10;
}

.control-btn {
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    opacity: 0.7;
}

.control-btn:hover {
    opacity: 1;
    transform: scale(1.1);
}

.control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
}

.move-up-btn,
.move-down-btn {
    background-color: var(--button-bg);
    color: white;
}

.move-up-btn:hover,
.move-down-btn:hover {
    background-color: var(--high-bg);
}

.delete-btn {
    width: 16px;
    height: 16px;
    line-height: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ff4757;
    color: white;
}

.delete-btn:hover {
    background-color: #ff3742;
}

.action-item-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    /* 为绝对定位的按钮提供定位上下文 */
}

.left-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.action-dialogue-tool {
    padding-top: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    border-top: 1px dashed #88888855;
}

/* 修改原有的button样式，添加更具体的选择器 */
.action-dialogue-tool>button {
    width: 35%;
    /* 减小宽度 */
    padding: 5px;
    font-size: 16px;
    /* 减小字体 */
    border: none;
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-dialogue-tool-button {
    width: 35%;
    /* 减小宽度 */
    padding: 5px;
    font-size: 16px;
    /* 减小字体 */
    border: none;
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-dialogue-tool>button:hover,
.action-dialogue-tool-button:hover {
    background-color: var(--high-bg);
    color: white;
}

/* 预绑定相关样式 */
.pre-bind-section {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pre-bind-btn {
    padding: 5px;
    font-size: 12px;
    background-color: var(--button-bg);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: auto;
    white-space: nowrap;
    /* 防止文字换行 */
}

.pre-bind-btn:hover {
    background-color: var(--high-bg);
}

.pre-selected-character {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    padding-left: 0;
    /* 减小内边距 */
    background-color: var(--high-hover-bg);
    border-radius: 5px;
    font-size: 12px;
    /* 减小字体 */
}

.character-info {
    color: var(--text-color);
}

.clear-btn {
    background: none;
    border: none;
    color: var(--placeholder-color);
    cursor: pointer;
    font-size: 10px;
    /* 减小字体 */
    padding: 5px;
    border-radius: 3px;
    transition: all 0.2s ease;
    width: auto;
}

.clear-btn:hover {
    background-color: var(--high-bg);
    color: white;
}

/* 删除这个重复的通用button样式，它与上面的.action-dialogue-tool > button冲突 */
/* 
button {
    width: 40%;
    padding: 5px;
    font-size: 18px;
    border: none;
    border-radius: 5px;
    background-color: var(--high-hover-bg);
    cursor: pointer;
    transition: all 0.2s ease;
}

button:hover {
    background-color: var(--high-bg);
    color: white;
}
*/

/* 对话类型标签样式 */
.dialogue-type-tag {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 5px;
    color: white;
}

/* 对话类型标签样式 */
.normal-type {
    background-color: var(--button-bg);
    /* 普通对话使用按钮背景色 */
}

.voiceover-type {
    background-color: var(--high-bg);
    /* 旁白使用高亮背景色 */
}

.commander-type {
    background-color: var(--primary-bg);
    /* 指挥官回答使用主要背景色 */
    color: var(--primary-text);
    border: 1px solid var(--high-hover-bg);
}

/* 对话类型选择弹窗样式 */
.dialogue-type-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    /* 提高 z-index 确保在最上层 */
}

.dialogue-type-modal-content {
    background-color: var(--secondary-bg);
    border-radius: 8px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    max-height: 80vh;
    overflow-y: auto;
    /* 移除 position: absolute 和 transform，因为 teleport 后不再需要 */
}

.dialogue-type-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--high-hover-bg);
    position: sticky;
    /* 标题固定 */
    top: 0;
    background-color: var(--secondary-bg);
    z-index: 1;
}

.dialogue-type-modal-header h3 {
    margin: 0;
    color: var(--text-color);
}

.close-btn {
    font-size: 24px;
    cursor: pointer;
    color: var(--text-color);
    opacity: 0.7;
}

.close-btn:hover {
    opacity: 1;
}

.dialogue-type-modal-body {
    padding: 20px;
}

.dialogue-type-option {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background-color 0.2s;
}

.dialogue-type-option:hover {
    background-color: var(--high-hover-bg);
}

.dialogue-type-icon {
    font-size: 24px;
    margin-right: 15px;
}

.dialogue-type-info {
    flex: 1;
}

.dialogue-type-name {
    font-weight: bold;
    margin-bottom: 4px;
    color: var(--text-color);
}

.dialogue-type-desc {
    font-size: 12px;
    color: var(--placeholder-color);
    opacity: 0.8;
}

textarea {
    overflow: hidden;
    /* 保持隐藏溢出内容 */
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    height: auto;
    min-height: 36px;
    padding: 5px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: var(--input-bg);
    color: var(--text-color);
    font-size: 16px;
    transition: border-color 0.3s, height 0.1s;
    /* 添加高度过渡效果 */
    resize: none;
    /* 防止用户手动调整大小 */
}

.editable-div {
    width: 100%;
    min-height: 36px;
    padding: 5px;
    margin-bottom: 5px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: var(--input-bg);
    color: var(--text-color);
    font-size: 16px;
    transition: border-color 0.3s;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
}

.editable-div:focus {
    border-color: var(--button-bg);
    outline: none;
}

.editable-div:empty:before {
    content: attr(data-placeholder);
    color: var(--placeholder-color);
    opacity: .5;
}

.text-controls {
    display: flex;
    align-items: center;
    margin-top: 5px;
    margin-bottom: 5px;
    padding-left: 5px;
}

.text-control-label {
    font-size: 14px;
    margin-right: 10px;
    color: var(--text-color);
}

textarea::placeholder {
    color: var(--placeholder-color);
    opacity: .5;
}

textarea:focus {
    border-color: var(--button-bg);
    outline: none;
}

input[type="text"] {
    width: 100%;
    padding: 0px 5px;
    height: 30px;
    border: 1px solid transparent;
    border-radius: 5px;
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

.delay-input {
    width: 80px;
    padding: 5px 10px;
    height: 24px;
    background: var(--input-bg);
    border: 1px solid transparent;
    border-radius: 3px;
    font-size: 14px;
    transition: border-color 0.3s;
    margin-left: 10px;
    margin-right: 10px;
}

.delay-input:focus {
    border-color: var(--button-bg);
    outline: none;
}

.delay-input::placeholder {
    color: var(--placeholder-color);
}

.left-content:hover .character-tip {
    opacity: 1;
    transform: translateX(5px);
}

.character-tip {
    font-size: 14px;
    color: var(--placeholder-color);
    opacity: 0;
    transition: all .3s ease-in-out;
}

.camera-controls {
    margin-bottom: 5px;
    padding: 8px;
    background-color: var(--secondary-bg);
    border-radius: 4px;
}

.camera-control-row {
    display: flex;
    align-items: center;
    margin: 5px 0;
    gap: 8px;
}

.camera-control-row:last-child {
    margin-bottom: 0;
}

.control-label {
    min-width: 80px;
    font-size: 12px;
    white-space: nowrap;
}

.camera-input {
    flex: 1;
    max-width: 80px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--primary-bg);
    color: var(--text-color);
    font-size: 12px;
}

.unit-label {
    font-size: 12px;
    color: var(--placeholder-color);
    margin-left: 4px;
}

.advanced-label:hover {
    cursor: pointer;
    color: var(--button-bg);
}

.advanced-mode-toggle {
    margin-left: auto;
}

.quick-button {
    font-size: 12px !important;
}

/* 颜色选择器样式 */
.color-picker-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.color-picker-label {
    font-size: 12px;
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

.color-picker-label:hover {
    color: var(--high-text-color);
}

.character-tip {
    font-size: 12px;
    color: var(--text-color-secondary);
    font-style: italic;
}

.name-input {
    background-color: var(--bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 8px;
    color: var(--text-color);
    font-size: 12px;
    width: 80px;
}

.name-input:focus {
    outline: none;
    border-color: var(--high-bg);
    background-color: var(--high-hover-bg);
}

.name-edit {
    cursor: pointer;
    font-size: 14px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
}

.name-edit:hover {
    opacity: 1;
}

.advanced-mode-toggle {
    display: flex;
    align-items: center;
}

.advanced-label {
    font-size: 12px;
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
}

.advanced-label:hover {
    color: var(--high-text-color);
}

/* 拖拽相关样式 */
.drag-handle {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: var(--placeholder-color);
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.2s ease;
    user-select: none;
}

.action-item-content:hover .drag-handle {
    opacity: 1;
}

.drag-handle:hover {
    color: var(--text-color);
}

.drag-handle:active {
    cursor: grabbing;
}

/* 拖拽状态样式 */
.ghost-item {
    opacity: 0.5;
    background-color: var(--secondary-bg);
    /* border: 2px dashed var(--border-color); */
}

.chosen-item {
    background-color: var(--high-hover-bg);
    /* border: 1px solid var(--high-bg); */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drag-item {
    transform: rotate(5deg);
    opacity: 0.8;
}
</style>