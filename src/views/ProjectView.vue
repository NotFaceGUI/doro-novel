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
                        <Dropdown 
                            v-model="selectedAnimationIndex"
                            @update:modelValue="handleAnimationChange"
                            :options="animationOptions" 
                            :disabled="false"
                        />
                    </div>
                    <!-- 皮肤选择下拉框 -->
                    <div class="skin-selector" v-if="showCanvas && skinOptions.length > 0">
                        <label>选择皮肤:</label>
                        <Dropdown 
                            v-model="selectedSkinIndex"
                            @update:modelValue="handleSkinChange"
                            :options="skinOptions" 
                            :disabled="false"
                        />
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
                <SlotControl 
                    v-if="showCanvas && slotOptions.length > 0"
                    :slots="slotOptions"
                    @toggle-slot="handleSlotToggle"
                    @update-alpha="handleSlotAlphaUpdate"
                    @show-all="handleShowAllSlots"
                    @hide-all="handleHideAllSlots"
                />
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
        <ControlHint  v-if=" activeTab === 'preview'" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import LeftBar from '../components/LeftBar.vue';
import ScriptEditor from '../components/edit/ScriptEditor.vue';
import Dropdown from '../components/common/Dropdown.vue';
import ControlHint from '../components/common/ControlHint.vue';
import SlotControl from '../components/common/SlotControl.vue';
import { ResType } from '../script/var';
import { createPixiApp, IApp, load } from '../script/render/preview-canvas';
import { Spine } from 'pixi-spine';
import CanvasManager from '../script/render/canvas-manager';
import { useActionStore } from '../stores/action-store';
import type { DropdownOption } from '../types/app';
import { applyUIAnimationConfig, type UIAnimationConfig, type UIMixConfig } from '../script/render/animation-config';


const imgRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const projectView = ref<HTMLDivElement | null>(null)

const showImage = ref<boolean>(false);
const showVideo = ref<boolean>(false);
const showText = ref<boolean>(false);
const showCanvas = ref<boolean>(false);

const previewAPP = ref<IApp>()

const previewSpine = ref<Spine>();

// 动画选择相关的响应式数据
const animationOptions = ref<DropdownOption[]>([]);
const selectedAnimationIndex = ref<number>(0);

// 皮肤选择相关的响应式数据
const skinOptions = ref<DropdownOption[]>([]);
const selectedSkinIndex = ref<number>(0);

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

let _last_url = '';

// 当前激活的 Tab ('canvas' | 'preview' | 'script')
const activeTab = ref<'canvas' | 'preview' | 'script'>('canvas');
const actionStore = useActionStore();

// Script 相关的响应式数据
const scriptContent = ref<string>('');

const handleRenderType = (data: { url: string, type: ResType }) => {
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
                load(previewAPP.value.application, data.url).then((spine) => {
                    previewSpine.value = spine;
                    // 获取动画列表并设置下拉框选项
                    updateAnimationOptions(spine);
                    // 获取皮肤列表并设置下拉框选项
                    updateSkinOptions(spine);
                    // 获取插槽列表并设置选项
                    updateSlotOptions(spine);
                    // 应用初始混合配置
                    applyCurrentMixConfig();
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
        }
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
                    const slotData = skeleton.data.findSlot(slotName);
                    if (slotData && slotData.attachmentName) {
                        skeleton.setAttachment(slotName, slotData.attachmentName);
                    }
                } else {
                    // 隐藏插槽 - 使用slot.setAttachment(null)方法
                    const attachment = slot.getAttachment();
                    attachment
                    if (attachment) {
                        // 保存当前attachment名称以便恢复
                        (slot as any).originalAttachment = attachment;
                        // 使用正确的Spine API方法隐藏插槽
                        (slot as any).setAttachment(null);
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
        slot.alpha = 1.0;
        
        if (previewSpine.value && previewSpine.value.skeleton) {
            const skeleton = previewSpine.value.skeleton;
            const spineSlot = skeleton.findSlot(slot.name);
            if (spineSlot) {
                // 恢复插槽的attachment
                const slotData = skeleton.data.findSlot(slot.name);
                if (slotData && slotData.attachmentName) {
                    skeleton.setAttachment(slot.name, slotData.attachmentName);
                }
                spineSlot.color.a = 1.0;
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
                // 隐藏插槽 - 使用slot.setAttachment(null)方法
                const attachment = spineSlot.getAttachment();
                if (attachment) {
                    // 保存当前attachment以便恢复
                    (spineSlot as any).originalAttachment = attachment;
                    // 使用正确的Spine API方法隐藏插槽
                    (spineSlot as any).setAttachment(null);
                }
            }
        }
    });
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
</style>