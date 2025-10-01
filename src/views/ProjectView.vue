<template>
    <div class="project-content">
        <LeftBar @render-file="handleRenderType"></LeftBar>
        <div ref="projectView" class="project-content-view"
            :class="{ 'active-bg': activeTab === 'canvas', 'project-view-full-screen': isFullScreen }">
            <div class="project-tab-image">
                <img src="/img/sprite/nv_tab.png" v-if="activeTab === 'canvas'" width="100%" alt="">

            </div>

            <div class="project-tab" v-if="!isFullScreen">
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'canvas' }" @click="activeTab = 'canvas'">
                    Canvas</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'preview' }" @click="activeTab = 'preview'">
                    Preview</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'script' }" @click="activeTab = 'script'">
                    Script</div>
            </div>

            <div class="project-canvas"
                :class="{ 'edit-mode': actionStore.isEditMode, 'editing': actionStore.isEditMode }" id="canvas"
                v-show="activeTab == 'canvas'">
                <div id="canvas-info">

                </div>
            </div>

            <div class="project-preview" v-show="activeTab == 'preview'">
                <img ref="imgRef" src="" alt="" srcset="" v-show="showImage">
                <video ref="videoRef" src="" v-show="showVideo" autoplay controls loop muted></video>
                <span v-show="showText">不支持该文件的预览</span>
                <div id="preview-canvas" v-show="showCanvas">
                    <!-- 动画选择下拉框 -->
                    <div class="animation-selector" v-if="showCanvas && animationOptions.length > 0">
                        <label>选择动画:</label>
                        <Dropdown v-model="selectedAnimationIndex" @update:modelValue="handleAnimationChange"
                            :options="animationOptions" :disabled="false" />
                    </div>
                    <!-- 皮肤选择下拉框 -->
                    <div class="skin-selector" v-if="showCanvas && skinOptions.length > 0">
                        <label>选择皮肤:</label>
                        <Dropdown v-model="selectedSkinIndex" @update:modelValue="handleSkinChange"
                            :options="skinOptions" :disabled="false" />
                    </div>

                    <!-- 角色类型选择下拉框 -->
                    <div class="character-type-selector" v-if="showCanvas && hasCharacterAssets">
                        <label>角色类型:</label>
                        <Dropdown v-model="selectedCharacterType" @update:modelValue="handleCharacterTypeChange"
                            :options="characterTypeOptions" :disabled="false" />
                    </div>

                    <!-- 动画混合配置 -->
                    <!-- <div class="animation-mix-config" v-if="showCanvas && animationOptions.length > 0">
                        <div class="mix-duration-control">
                            <label>混合时长:</label>
                            <input 
                                type="range" 
                                v-model="mixDuration" 
                                @input="handleMixDurationChange"
                                min="0" 
                                max="2" 
                                step="0.1"
                            />
                            <span class="mix-value">{{ mixDuration }}s</span>
                        </div>
                        
                        <div class="mix-preset-control">
                            <label>混合预设:</label>
                            <Dropdown 
                                v-model="selectedMixPresetIndex"
                                @update:modelValue="handleMixPresetChange"
                                :options="mixPresetOptions" 
                                :disabled="false"
                            />
                        </div>
                        
                        <div class="custom-mix-control" v-if="selectedMixPresetIndex === mixPresetOptions.length - 1">
                            <div class="mix-pair-config">
                                <label>从动画:</label>
                                <Dropdown 
                                    v-model="customMixFromIndex"
                                    :options="animationOptions" 
                                    :disabled="false"
                                />
                            </div>
                            <div class="mix-pair-config">
                                <label>到动画:</label>
                                <Dropdown 
                                    v-model="customMixToIndex"
                                    :options="animationOptions" 
                                    :disabled="false"
                                />
                            </div>
                            <div class="mix-pair-config">
                                <label>混合时长:</label>
                                <input 
                                    type="range" 
                                    v-model="customMixDuration" 
                                    @input="handleCustomMixChange"
                                    min="0" 
                                    max="2" 
                                    step="0.1"
                                />
                                <span class="mix-value">{{ customMixDuration }}s</span>
                            </div>
                            <button @click="addCustomMix" class="add-mix-btn">添加混合配置</button>
                        </div>
                        
                        <div class="current-mixes" v-if="currentMixConfigs.length > 0">
                            <h4>当前混合配置:</h4>
                            <div v-for="(mix, index) in currentMixConfigs" :key="index" class="mix-item">
                                <span>{{ mix.from }} → {{ mix.to }}: {{ mix.duration }}s</span>
                                <button @click="removeMix(index)" class="remove-mix-btn">×</button>
                            </div>
                        </div>
                    </div> -->
                </div>

                <!-- 插槽控制组件 -->
                <div>
                    <SlotControl v-if="showCanvas && slotOptions.length > 0" :slots="slotOptions"
                        @toggle-slot="handleSlotToggle" @update-alpha="handleSlotAlphaUpdate"
                        @show-all="handleShowAllSlots" @hide-all="handleHideAllSlots" @slot-hover="handleSlotHover"
                        @slot-leave="handleSlotLeave" />
                </div>


                <!-- Shader特效控制 -->
                <!-- <div v-if="showCanvas">
                    <div class="shader-toggle-section">
                        <div @click="toggleShaderEditor" class="shader-btn shader-btn-primary">
                            <span class="btn-icon">{{ showShaderEditor ? '▲' : '▼' }}</span>
                            {{ showShaderEditor ? '隐藏' : '显示' }}
                        </div>

                    </div>
                </div> -->

                <!-- Shader编辑器浮动面板 -->
                <Transition name="shader-overlay">
                    <div v-if="showShaderEditor && showCanvas" class="shader-editor-overlay"
                        @click.self="toggleShaderEditor">
                        <Transition name="shader-panel">
                            <div class="shader-editor-panel" v-if="showShaderEditor">
                                <div class="shader-editor-header">
                                    <h3>Shader 特效编辑器</h3>
                                    <button @click="toggleShaderEditor" class="close-btn">×</button>
                                </div>
                                <ShaderEditor :ref="shaderEditorRef" @apply-shader="handleApplyShader"
                                    @reset-shader="handleResetShader" />
                            </div>
                        </Transition>
                    </div>
                </Transition>
            </div>

            <div class="project-script" v-show="activeTab == 'script'">
                <ScriptEditor v-model="scriptContent" placeholder="在这里编写剧情脚本..." />
            </div>

            <div class="full-screen" v-if="activeTab != 'script'" :style="'opacity:' + (isFullScreen ? 0.2 : 0.8)"
                @click="fullScreen">
                🔲
            </div>
        </div>

        <!-- 操作提示 -->
        <ControlHint v-if="activeTab === 'preview'" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import LeftBar from '../components/LeftBar.vue';
import ScriptEditor from '../components/edit/ScriptEditor.vue';
import Dropdown from '../components/common/Dropdown.vue';
import ControlHint from '../components/common/ControlHint.vue';
import SlotControl from '../components/common/SlotControl.vue';
import ShaderEditor from '../components/common/ShaderEditor.vue';
import { ResType } from '../script/var';
import { createPixiApp, IApp, load, setupSpineInteraction } from '../script/render/preview-canvas';
import { Spine } from 'pixi-spine';
import * as PIXI from 'pixi.js';
import CanvasManager from '../script/render/canvas-manager';
import { useActionStore } from '../stores/action-store';
import type { CharacterUrls, DropdownOption } from '../types/app';
import { applyUIAnimationConfig, type UIAnimationConfig, type UIMixConfig } from '../script/render/animation-config';
import { app } from '@tauri-apps/api';
import { OutlineFilter } from 'pixi-filters';


const imgRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const projectView = ref<HTMLDivElement | null>(null)

const showImage = ref<boolean>(false);
const showVideo = ref<boolean>(false);
const showText = ref<boolean>(false);
const showCanvas = ref<boolean>(false);

const previewAPP = ref<IApp>()

const previewSpine = ref<Spine>();

// 角色资源存储 (使用普通变量避免响应式开销)
let characterAssets: any = null;

// 动画选择相关的响应式数据
const animationOptions = ref<DropdownOption[]>([]);
const selectedAnimationIndex = ref<number>(0);

// 皮肤选择相关的响应式数据
const skinOptions = ref<DropdownOption[]>([]);
const selectedSkinIndex = ref<number>(0);

// 角色类型切换相关的响应式数据
const hasCharacterAssets = ref<boolean>(false);
const selectedCharacterType = ref<number>(0);
const characterTypeOptions = ref<DropdownOption[]>([
    { label: 'Default', value: 'default' },
    { label: 'Aim', value: 'aim' },
    { label: 'Cover', value: 'cover' }
]);

// 动画混合配置相关的响应式数据
const mixDuration = ref<number>(0.3);
const selectedMixPresetIndex = ref<number>(0);
const mixPresetOptions = ref<DropdownOption[]>([
    { label: '默认混合', value: 0 },
    { label: '快速混合', value: 1 },
    { label: '慢速混合', value: 2 },
    { label: '自定义混合', value: 3 }
]);

// 自定义混合配置
const customMixFromIndex = ref<number>(0);
const customMixToIndex = ref<number>(0);
const customMixDuration = ref<number>(0.3);

// 当前混合配置列表
interface MixConfig {
    from: string;
    to: string;
    duration: number;
}
const currentMixConfigs = ref<MixConfig[]>([]);

// 插槽控制相关的响应式数据
interface SlotData {
    name: string;
    visible: boolean;
    alpha: number;
}
const slotOptions = ref<SlotData[]>([]);

// Shader控制相关的响应式数据
const showShaderEditor = ref<boolean>(false);
const hasActiveShaders = ref<boolean>(false);
const currentShaderFilters = ref<any[]>([]);
const shaderEditorRef = ref<any>(null);

// Shader编辑器状态保存
const savedShaderState = ref<{
    selectedPreset: string;
    fragmentShader: string;
    uniforms: any[];
}>({
    selectedPreset: '',
    fragmentShader: '',
    uniforms: []
});

let _last_url = '';

// 当前激活的 Tab ('canvas' | 'preview' | 'script')
const activeTab = ref<'canvas' | 'preview' | 'script'>('canvas');
const actionStore = useActionStore();

// Script 相关的响应式数据
const scriptContent = ref<string>('');

const handleRenderType = (data: { url: string, type: ResType, characterUrls?: CharacterUrls }) => {
    console.log("点击");
    if (_last_url == data.url) {
        console.log("两者的url相同");
        showImage.value = false;
        showVideo.value = false;
        showText.value = false;
        _last_url = '';
        activeTab.value = 'canvas';
        return;
    }

    activeTab.value = 'preview';
    switch (data.type) {
        case ResType.Image:
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = data.url;
                videoRef.value.pause();
                videoRef.value.src = '';
                showCanvas.value = false;
                showImage.value = true;
                showVideo.value = false;
                showText.value = false;
            }
            _last_url = data.url;
            break;
        case ResType.Video:
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = '';
                videoRef.value.src = data.url;
                showCanvas.value = false;
                showImage.value = false;
                showVideo.value = true;
                showText.value = false;
            }
            _last_url = data.url;
            break;
        case ResType.Spine:
            console.log("渲染Spine");
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = '';
                videoRef.value.src = data.url;
                showImage.value = false;
                showVideo.value = false;
                showText.value = false;
                showCanvas.value = true;
            }

            if (previewAPP.value) {
                // 如果有已经有load当再次加载时应当销毁Spine
                if (previewSpine.value) {
                    previewSpine.value.destroy();
                }
                load(previewAPP.value.application, data).then((result) => {
                    // 检查返回的是角色资源还是单个Spine
                    if (data.characterUrls) {
                        // 角色资源模式
                        const assets = result as any;
                        previewSpine.value = assets.main;

                        // 存储角色资源到组件级别
                        characterAssets = assets;

                    } else {
                        // 单个Spine模式
                        const spine = result as any;
                        previewSpine.value = spine;
                    }

                    // 检查是否有角色资源
                    hasCharacterAssets.value = !!(data.characterUrls && (data.characterUrls.aim || data.characterUrls.cover));

                    // 获取动画列表并设置下拉框选项
                    updateAnimationOptions(previewSpine.value);
                    // 获取皮肤列表并设置下拉框选项
                    updateSkinOptions(previewSpine.value);
                    // 获取插槽列表并设置选项
                    updateSlotOptions(previewSpine.value);
                    // 应用初始混合配置
                    applyCurrentMixConfig();

                    if (previewSpine.value && previewAPP.value) {
                        cleanup = setupSpineInteraction(previewSpine.value, previewAPP.value?.application);
                    }
                });
            }
            break;
        case ResType.Audio:
        case ResType.Package:
        case ResType.Document:
        default:
            console.log("不支持预览这种类型的文件");
            _last_url = data.url;
            showImage.value = false;
            showVideo.value = false;
            showText.value = true;
            break;
    }
}

const isFullScreen = ref(false);

// Canvas 全屏预览
const fullScreen = () => {
    if (projectView.value) {
        isFullScreen.value = !isFullScreen.value
    }
    nextTick(() => {
        window.dispatchEvent(new Event('resize'));
    })
}

onMounted(() => {
    // 初始化CanvasManager
    CanvasManager.getInstance();
    if (projectView.value) {
        console.log("proView-width", projectView.value.offsetHeight);
        previewAPP.value = createPixiApp(projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        handelResizeCanvasToPreview();
    }

    // 监听窗口大小变化，动态更新 Pixi 应用大小
    window.addEventListener('resize', handelResizeCanvasToPreview);
})

watch(() => actionStore.isEditMode, () => {
    handelResizeCanvasToPreview();
})

const handelResizeCanvasToPreview = () => {
    if (projectView.value) {
        const app = previewAPP.value?.application;
        previewAPP.value?.application.renderer.resize(projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        if (previewSpine.value && app) {
            previewSpine.value.x = app.view.width / 2;
            const lastSacle = previewSpine.value.scale.x;

            previewSpine.value.y = app.view.height * 0.95;

            // 设置缩放比例
            previewSpine.value.scale.set((app.view.height / (previewSpine.value.height / lastSacle / 0.90)));
            console.log(previewSpine.value.scale);
        }
    }
}

onUnmounted(() => {
    window.removeEventListener('resize', handelResizeCanvasToPreview)
});

// 更新动画选项列表
const updateAnimationOptions = (spine: Spine | undefined) => {
    if (spine && spine.spineData && spine.spineData.animations) {
        const animations = spine.spineData.animations;
        animationOptions.value = animations.map((animation: any, index: number) => ({
            label: animation.name,
            value: index
        }));

        // 动画默认是idle，如果没有就是第一个
        if (animations.length > 0) {
            let selectedIndex = 0;

            // 查找idle动画
            const idleAnimationIndex = animations.findIndex((animation: any) =>
                animation.name.toLowerCase().includes('idle')
            );

            if (idleAnimationIndex !== -1) {
                selectedIndex = idleAnimationIndex;
            }

            selectedAnimationIndex.value = selectedIndex;
            spine.state.setAnimation(0, animations[selectedIndex].name, true);
        }
    }

    // 同时更新皮肤选项列表
    updateSkinOptions(spine);

    // 同时更新插槽选项列表
    updateSlotOptions(spine);
};

// 更新皮肤选项列表
const updateSkinOptions = (spine: Spine | undefined) => {
    if (spine && spine.spineData && spine.spineData.skins) {
        const skins = spine.spineData.skins;
        skinOptions.value = skins.map((skin: any, index: number) => ({
            label: skin.name,
            value: index
        }));

        // 如果有非默认的皮肤就用非默认的，否则使用第一个
        if (skins.length > 0) {
            let selectedIndex = 0;

            // 查找非默认皮肤（通常默认皮肤名为 "default" 或包含 "default"）
            const nonDefaultSkinIndex = skins.findIndex((skin: any, index: number) =>
                index > 0 && // 跳过第一个皮肤（通常是默认的）
                !skin.name.toLowerCase().includes('default') &&
                !skin.name.toLowerCase().includes('默认')
            );

            if (nonDefaultSkinIndex !== -1) {
                selectedIndex = nonDefaultSkinIndex;
            }

            selectedSkinIndex.value = selectedIndex;
            spine.skeleton.setSkinByName(skins[selectedIndex].name);
            spine.skeleton.setSlotsToSetupPose();
        }
    }
};

// 处理动画选择变化
const handleAnimationChange = (animationIndex: number) => {
    selectedAnimationIndex.value = animationIndex;
    if (previewSpine.value && previewSpine.value.spineData && previewSpine.value.spineData.animations) {
        const animations = previewSpine.value.spineData.animations;
        if (animations[animationIndex]) {
            previewSpine.value.state.setAnimation(0, animations[animationIndex].name, true);
            
            // 重新应用用户设置的透明度
            slotOptions.value.forEach(slotData => {
                if (previewSpine.value && previewSpine.value.skeleton) {
                    const slot = previewSpine.value.skeleton.findSlot(slotData.name);
                    if (slot) {
                        slot.color.a = slotData.alpha;
                    }
                }
            });
        }
    }
};

// 处理皮肤选择变化
const handleSkinChange = (skinIndex: number) => {
    selectedSkinIndex.value = skinIndex;
    if (previewSpine.value && previewSpine.value.spineData && previewSpine.value.spineData.skins) {
        const skins = previewSpine.value.spineData.skins;
        if (skins[skinIndex]) {
            previewSpine.value.skeleton.setSkinByName(skins[skinIndex].name);
            previewSpine.value.skeleton.setSlotsToSetupPose();
            
            // 重新应用用户设置的透明度
            slotOptions.value.forEach(slotData => {
                if (previewSpine.value && previewSpine.value.skeleton) {
                    const slot = previewSpine.value.skeleton.findSlot(slotData.name);
                    if (slot) {
                        slot.color.a = slotData.alpha;
                    }
                }
            });
        }
    }
};

let cleanup: () => void;

// 处理角色类型切换
const handleCharacterTypeChange = (typeIndex: number) => {
    selectedCharacterType.value = typeIndex;

    // 根据索引获取对应的类型值
    const characterType = characterTypeOptions.value[typeIndex]?.value;

    if (!previewSpine.value || !previewAPP.value) {
        console.warn('Spine或PIXI应用未初始化');
        return;
    }



    // 获取存储在组件级别的角色资源
    const assets = characterAssets;
    if (!assets) {
        console.warn('未找到角色资源');
        return;
    }


    // 移除当前显示的Spine
    if (previewSpine.value.parent) {
        previewSpine.value.parent.removeChild(previewSpine.value);
    }

    // 根据选择的类型切换到对应的Spine
    let targetSpine: any = null;
    switch (characterType) {
        case 'default':
            targetSpine = assets.main;
            break;
        case 'aim':
            targetSpine = assets.aim || assets.main;
            break;
        case 'cover':
            targetSpine = assets.cover || assets.main;
            break;
        default:
            targetSpine = assets.main;
    }

    if (targetSpine) {
        // 清理之前的交互
        if (cleanup) {
            cleanup();
        }

        // 添加到舞台
        previewAPP.value.application.stage.addChild(targetSpine);

        // 设置位置和缩放
        targetSpine.x = previewAPP.value.application.view.width / 2;
        const lastScale = targetSpine.scale.x;
        targetSpine.y = previewAPP.value.application.view.height * 0.93;
        targetSpine.scale.set((previewAPP.value.application.view.height / (targetSpine.height / lastScale / 0.90)));

        // 更新当前Spine引用
        previewSpine.value = targetSpine;

        if (previewSpine.value) {
            cleanup = setupSpineInteraction(previewSpine.value, previewAPP.value.application);
        }

        // 重新初始化动画、皮肤和插槽选项
        updateAnimationOptions(targetSpine);
        updateSkinOptions(targetSpine);
        updateSlotOptions(targetSpine);

        console.log(`切换到角色类型: ${characterType}`);
    }
};

// 处理混合时长变化
const handleMixDurationChange = () => {
    applyCurrentMixConfig();
};

// 处理混合预设变化
const handleMixPresetChange = (presetIndex: number) => {
    selectedMixPresetIndex.value = presetIndex;

    // 根据预设设置混合时长
    switch (presetIndex) {
        case 0: // 默认混合
            mixDuration.value = 0.3;
            break;
        case 1: // 快速混合
            mixDuration.value = 0.1;
            break;
        case 2: // 慢速混合
            mixDuration.value = 0.8;
            break;
        case 3: // 自定义混合
            // 保持当前设置
            break;
    }

    if (presetIndex !== 3) {
        // 非自定义预设时，清空自定义混合配置
        currentMixConfigs.value = [];
        applyCurrentMixConfig();
    }
};

// 处理自定义混合变化
const handleCustomMixChange = () => {
    // 实时预览自定义混合效果
};

// 添加自定义混合配置
const addCustomMix = () => {
    if (previewSpine.value && previewSpine.value.spineData && previewSpine.value.spineData.animations) {
        const animations = previewSpine.value.spineData.animations;
        const fromAnim = animations[customMixFromIndex.value];
        const toAnim = animations[customMixToIndex.value];

        if (fromAnim && toAnim) {
            const newMix: MixConfig = {
                from: fromAnim.name,
                to: toAnim.name,
                duration: customMixDuration.value
            };

            // 检查是否已存在相同的混合配置
            const existingIndex = currentMixConfigs.value.findIndex(
                mix => mix.from === newMix.from && mix.to === newMix.to
            );

            if (existingIndex !== -1) {
                // 更新现有配置
                currentMixConfigs.value[existingIndex] = newMix;
            } else {
                // 添加新配置
                currentMixConfigs.value.push(newMix);
            }

            applyCurrentMixConfig();
        }
    }
};

// 移除混合配置
const removeMix = (index: number) => {
    currentMixConfigs.value.splice(index, 1);
    applyCurrentMixConfig();
};

// 应用当前混合配置
const applyCurrentMixConfig = () => {
    if (!previewSpine.value || !previewSpine.value.state || !previewSpine.value.state.data) {
        return;
    }

    // 创建UI配置对象
    const uiConfig: UIAnimationConfig = {
        mixDuration: mixDuration.value,
        presetIndex: selectedMixPresetIndex.value,
        customMixConfigs: currentMixConfigs.value
    };

    // 使用新的UI配置函数
    applyUIAnimationConfig(previewSpine.value, uiConfig);
};

// 更新插槽选项列表
const updateSlotOptions = (spine: Spine | undefined) => {
    if (spine && spine.skeleton && spine.skeleton.slots) {
        const slots = spine.skeleton.slots;
        slotOptions.value = slots.map((slot: any) => ({
            name: slot.data.name,
            visible: true,
            alpha: 1.0
        }));
    }
};

// 处理插槽显示/隐藏切换
const handleSlotToggle = (slotName: string, visible: boolean) => {
    const slotData = slotOptions.value.find(slot => slot.name === slotName);
    if (slotData) {
        slotData.visible = visible;

        if (previewSpine.value && previewSpine.value.skeleton) {
            const skeleton = previewSpine.value.skeleton;
            const slot = skeleton.findSlot(slotName);
            if (slot) {
                if (visible) {
                    // 恢复插槽的attachment - 通过skeleton的setAttachment方法
                    const slotDataFromSkeleton = skeleton.data.findSlot(slotName);
                    if (slotDataFromSkeleton && slotDataFromSkeleton.attachmentName) {
                        skeleton.setAttachment(slotName, slotDataFromSkeleton.attachmentName);
                    } else if ((slot as any).originalAttachment) {
                        // 如果有保存的原始attachment，恢复它
                        skeleton.setAttachment(slotName, (slot as any).originalAttachment.name);
                        delete (slot as any).originalAttachment;
                    }
                } else {
                    // 隐藏插槽 - 使用skeleton.setAttachment(null)方法
                    const attachment = slot.getAttachment();
                    if (attachment) {
                        // 保存当前attachment以便恢复
                        (slot as any).originalAttachment = attachment;
                        // 使用正确的Spine API方法隐藏插槽
                        (skeleton as any).setAttachment(slotName, null);
                    }
                }
            }
        }
    }
};

// 处理插槽透明度变化
const handleSlotAlphaUpdate = (slotName: string, alpha: number) => {
    const slotData = slotOptions.value.find(slot => slot.name === slotName);
    if (slotData) {
        slotData.alpha = alpha;

        if (previewSpine.value && previewSpine.value.skeleton) {
            const slot = previewSpine.value.skeleton.findSlot(slotName);
            if (slot) {
                slot.color.a = alpha;
            }
        }
    }
};

// 显示所有插槽
const handleShowAllSlots = () => {
    slotOptions.value.forEach(slot => {
        slot.visible = true;
        // 不要重置透明度，保持用户设置的值

        if (previewSpine.value && previewSpine.value.skeleton) {
            const skeleton = previewSpine.value.skeleton;
            const spineSlot = skeleton.findSlot(slot.name);
            if (spineSlot) {
                // 恢复插槽的attachment
                const slotData = skeleton.data.findSlot(slot.name);
                if (slotData && slotData.attachmentName) {
                    skeleton.setAttachment(slot.name, slotData.attachmentName);
                }
                // 使用用户设置的透明度而不是强制设为1.0
                spineSlot.color.a = slot.alpha;
            }
        }
    });
};

// 隐藏所有插槽
const handleHideAllSlots = () => {
    slotOptions.value.forEach(slot => {
        slot.visible = false;

        if (previewSpine.value && previewSpine.value.skeleton) {
            const skeleton = previewSpine.value.skeleton;
            const spineSlot = skeleton.findSlot(slot.name);
            if (spineSlot) {
                // 隐藏插槽 - 使用skeleton.setAttachment(null)方法
                const attachment = spineSlot.getAttachment();
                if (attachment) {
                    // 保存当前attachment以便恢复
                    (spineSlot as any).originalAttachment = attachment;
                    // 使用正确的Spine API方法隐藏插槽
                    (skeleton as any).setAttachment(slot.name, null);
                }
            }
        }
    });
};

// 悬停时
const handleSlotHover = (slotName: string) => {
    if (!previewSpine.value?.skeleton) return;

    const slot = previewSpine.value.skeleton.findSlot(slotName);
    if (!slot) return;

    // Spine slot 实际渲染的对象，可能是 sprite 或 mesh
    const target = (slot as any).currentSprite || (slot as any).currentMesh;
    if (!target) return;

    // 保存原始状态（只保存一次）
    if (!(slot as any)._originalColor) {
        (slot as any)._originalColor = { 
            r: slot.color.r,
            g: slot.color.g,
            b: slot.color.b,
            a: slot.color.a
        };
    }
    if (!(slot as any)._originalFilters) {
        (slot as any)._originalFilters = target.filters || [];
    }

    // ✅ 高亮（变成亮黄色），但保持用户设置的透明度
    const slotData = slotOptions.value.find(s => s.name === slotName);
    const userAlpha = slotData ? slotData.alpha : slot.color.a;
    
    slot.color.r = 1.0;
    slot.color.g = 1.0;
    slot.color.b = 0.3; // 偏金黄
    slot.color.a = userAlpha; // 保持用户设置的透明度

    // ✅ 添加描边
    const outline = new OutlineFilter(4, 0xffd700, 1); // 4px，金黄色，强度1
    target.filters = [...(slot as any)._originalFilters, outline];
};

// 离开时
const handleSlotLeave = () => {
    if (!previewSpine.value?.skeleton) return;

    previewSpine.value.skeleton.slots.forEach((slot: any) => {
        const target = slot.currentSprite || slot.currentMesh;
        if (!target) return;

        // 恢复颜色，但保持用户设置的透明度
        if (slot._originalColor) {
            // 查找用户设置的透明度值
            const slotData = slotOptions.value.find(s => s.name === slot.data.name);
            const userAlpha = slotData ? slotData.alpha : slot._originalColor.a;
            
            slot.color.r = slot._originalColor.r;
            slot.color.g = slot._originalColor.g;
            slot.color.b = slot._originalColor.b;
            slot.color.a = userAlpha; // 使用用户设置的透明度而不是原始透明度
            delete slot._originalColor;
        }

        // 恢复滤镜
        if (slot._originalFilters) {
            target.filters = slot._originalFilters;
            delete slot._originalFilters;
        }
    });
};
// Shader编辑器相关方法
const toggleShaderEditor = () => {
    if (showShaderEditor.value) {
        // 关闭时保存状态
        if (shaderEditorRef.value) {
            savedShaderState.value = {
                selectedPreset: shaderEditorRef.value.selectedPreset || '',
                fragmentShader: shaderEditorRef.value.fragmentShader || '',
                uniforms: shaderEditorRef.value.uniforms ? JSON.parse(JSON.stringify(shaderEditorRef.value.uniforms)) : []
            };
        }
    } else {
        // 打开时恢复状态
        nextTick(() => {
            if (shaderEditorRef.value && savedShaderState.value.selectedPreset) {
                shaderEditorRef.value.restoreState(savedShaderState.value);
            }
        });
    }
    showShaderEditor.value = !showShaderEditor.value;
};

// 应用Shader到Spine角色
const handleApplyShader = (shaderData: any) => {
    if (!previewSpine.value || !previewAPP.value) {
        console.warn('Spine或PIXI应用未初始化');
        return;
    }

    try {
        // 创建自定义滤镜
        const filter = new PIXI.Filter(undefined, shaderData.fragmentShader, shaderData.uniforms);

        // 清除之前的滤镜
        if (previewSpine.value.filters) {
            previewSpine.value.filters = [];
        }

        // 应用新滤镜
        previewSpine.value.filters = [filter];
        currentShaderFilters.value = [filter];
        hasActiveShaders.value = true;

        // 如果Shader包含时间uniform，启动动画循环
        if (shaderData.uniforms.iTime !== undefined || shaderData.uniforms.uTime !== undefined) {
            startShaderAnimation(filter, shaderData.uniforms);
        }

        console.log('Shader应用成功:', shaderData.name);
    } catch (error) {
        console.error('应用Shader失败:', error);
    }
};

// Shader动画循环
let shaderAnimationId: number | null = null;
const startShaderAnimation = (filter: PIXI.Filter, initialUniforms: any) => {
    if (shaderAnimationId) {
        cancelAnimationFrame(shaderAnimationId);
    }

    const startTime = Date.now();
    const animate = () => {
        const currentTime = (Date.now() - startTime) / 1000; // 转换为秒

        // 更新时间uniform
        if (filter.uniforms.iTime !== undefined) {
            filter.uniforms.iTime = currentTime;
        }
        if (filter.uniforms.uTime !== undefined) {
            filter.uniforms.uTime = currentTime;
        }

        shaderAnimationId = requestAnimationFrame(animate);
    };

    animate();
};

// 重置Shader效果
const handleResetShader = () => {
    if (previewSpine.value) {
        previewSpine.value.filters = [];
        currentShaderFilters.value = [];
        hasActiveShaders.value = false;

        // 停止动画循环
        if (shaderAnimationId) {
            cancelAnimationFrame(shaderAnimationId);
            shaderAnimationId = null;
        }

        console.log('Shader效果已重置');
    }
};

// 清除所有Shader效果
const clearAllShaders = () => {
    handleResetShader();
};
</script>

<style scoped lang="css">
.project-content {
    width: 100%;
    height: calc(100% - 41px);
    background: linear-gradient(135deg, var(--primary-bg), var(--secondary-bg));
    display: flex;
    flex: 1;
}

.project-content-view {
    display: flex;
    width: 100%;
    overflow: hidden;
    position: relative;
    flex: 1;
    flex-direction: column;
}

.active-bg {
    background-color: black;
}

.project-content-view:hover {
    overflow: hidden;
}

.project-content-view img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.project-content-view video {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.project-content-view:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);

}


.project-content-view::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.project-content-view::-webkit-scrollbar-track {
    background: transparent;
}

.project-content-view::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.project-content-view::-webkit-scrollbar-thumb:hover {
    background-color: var(--high-hover-bg);
}


.project-canvas,
.project-preview,
.project-script {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    transition: all .3s ease-in-out;
    border: 0 solid transparent;
}


@keyframes popIn {
    0% {
        opacity: 0;
        transform: translate(-50%, 15px) scale(0.85);
    }

    100% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }
}

@keyframes popOut {
    0% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }

    100% {
        opacity: 0;
        transform: translate(-50%, 10px) scale(0.95);
    }
}

.project-tab {
    position: absolute;
    z-index: 9999;
    top: 15px;
    left: 50%;
    transform: translate(-50%, 15px) scale(0.85);
    display: flex;
    justify-content: center;
    background-color: var(--deep-border-color);
    border-radius: 20px;
    padding: 5px;
    transition: all 0.3s ease-in-out;
    opacity: 0;
    pointer-events: none;
}

.project-tab-image {
    position: absolute;
    z-index: 9999;
    right: 0;
    width: 325px;
    margin: 20px;
    margin-top: 15px;
}

.project-tab-image img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;

}

.project-content-view:hover .project-tab,
.project-content-view .project-tab.show-during-play {
    animation: popIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    pointer-events: auto;
}

.project-content-view:not(:hover) .project-tab:not(.show-during-play) {
    animation: popOut 0.25s cubic-bezier(0.4, 0.03, 0.7, 0.2) forwards;
}


.project-content-view:hover .full-screen {
    display: block;
}


.tab-active {
    transition: all .3s ease-in-out;
    background-color: var(--high-hover-bg);

}

.tab-card {
    font-size: 14px;
    padding: 6px 10px;
    border-radius: 15px;
    margin: 2px 5px;
    transition: all .3s ease-in-out;
}

#canvas-info {
    position: absolute;
    font-size: 14px;
    left: 10px;
    top: 10px;
    opacity: .4;
}

.full-screen {
    position: absolute;
    bottom: 10px;
    left: 10px;

    font-size: 18px;
    display: none;

    opacity: .5;

    transition: all .3s ease-in-out;
}

.full-screen:hover {
    opacity: 1;
    transform: scale(1.1);
}

.project-view-full-screen {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
}

.project-canvas {
    position: relative;
}

.project-canvas::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 3px solid var(--error-color);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity .3s ease-in-out;
}

.project-canvas::after {
    content: '正在编辑';
    position: absolute;
    bottom: 8px;
    right: 12px;
    background: var(--error-color);
    color: #fff;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease-in-out;
}

.edit-mode::after {
    opacity: 1;
    transform: translateY(0);
    animation: blink 1.5s infinite 0.4s;
}

.edit-mode::before {
    opacity: 1;
}

/* 闪烁效果 */
@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

.animation-selector {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.animation-selector label {
    color: white;
    font-size: 14px;
    white-space: nowrap;
}

.skin-selector {
    position: absolute;
    top: 70px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.skin-selector label {
    color: white;
    font-size: 14px;
    white-space: nowrap;
}

.character-type-selector {
    position: absolute;
    top: 130px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.character-type-selector label {
    color: white;
    font-size: 14px;
    white-space: nowrap;
}

.animation-mix-config {
    position: absolute;
    top: 130px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 8px;
    min-width: 280px;
    max-width: 350px;
    max-height: 400px;
    overflow-y: auto;
}

.mix-duration-control,
.mix-preset-control {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.mix-duration-control label,
.mix-preset-control label {
    color: white;
    font-size: 14px;
    white-space: nowrap;
    min-width: 70px;
}

.mix-duration-control input[type="range"] {
    flex: 1;
    margin: 0 10px;
}

.mix-value {
    color: white;
    font-size: 12px;
    min-width: 35px;
}

.custom-mix-control {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 15px;
    margin-top: 15px;
}

.mix-pair-config {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.mix-pair-config label {
    color: white;
    font-size: 12px;
    min-width: 60px;
}

.add-mix-btn {
    background: #007acc;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    width: 100%;
    margin-top: 10px;
}

.add-mix-btn:hover {
    background: #005a9e;
}

.current-mixes {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 15px;
    margin-top: 15px;
}

.current-mixes h4 {
    color: white;
    font-size: 14px;
    margin: 0 0 10px 0;
}

.mix-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 4px;
    margin-bottom: 5px;
}

.mix-item span {
    color: white;
    font-size: 12px;
    flex: 1;
}

.remove-mix-btn {
    background: #dc3545;
    color: white;
    border: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-mix-btn:hover {
    background: #c82333;
}

/* Shader控制样式 */
.shader-controls {
    margin-top: 15px;
    padding: 15px;
    background: var(--secondary-bg);
    border-radius: var(--border-radius);
    border: 1px solid var(--main-border-color);
}

.shader-toggle-section {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.shader-btn {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background: var(--button-bg);
    color: var(--text-color);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
}

.shader-btn:hover {
    background: var(--button-hover-bg);
    border-color: var(--accent-color);
}

.shader-btn-primary {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
    flex: 1;
}

.shader-btn-primary:hover {
    background: var(--accent-hover-color);
    border-color: var(--accent-hover-color);
}

.shader-btn-danger {
    background: var(--danger-color);
    color: white;
    border-color: var(--danger-color);
    flex: 0 0 auto;
}

.shader-btn-danger:hover {
    background: var(--danger-hover-color);
    border-color: var(--danger-hover-color);
}

.btn-icon {
    font-size: 10px;
    font-weight: bold;
}

/* Shader编辑器浮动面板样式 */
.shader-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--overlay-bg);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.shader-editor-panel {
    background: var(--primary-bg);
    border: 1px solid var(--main-border-color);
    border-radius: var(--border-radius);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* 自定义滚动条样式 */
.shader-editor-panel::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.shader-editor-panel::-webkit-scrollbar-track {
    background: transparent;
}

.shader-editor-panel::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
    background-color: var(--deep-border-color);
}

.shader-editor-panel:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);
}

.shader-editor-panel::-webkit-scrollbar-thumb:hover {
    background-color: var(--high-hover-bg);
}

.shader-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid var(--main-border-color);
    background: var(--secondary-bg);
}

.shader-editor-header h3 {
    color: var(--text-color);
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.close-btn:hover {
    background: var(--high-hover-bg);
}

/* Shader 编辑器动画 */
.shader-overlay-enter-active,
.shader-overlay-leave-active {
    transition: all 0.3s ease;
}

.shader-overlay-enter-from,
.shader-overlay-leave-to {
    opacity: 0;
}

.shader-panel-enter-active,
.shader-panel-leave-active {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.shader-panel-enter-from,
.shader-panel-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
}

.shader-panel-enter-to,
.shader-panel-leave-from {
    opacity: 1;
    transform: scale(1) translateY(0);
}
</style>