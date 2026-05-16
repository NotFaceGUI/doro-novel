<template>
    <div class="project-content">
        <LeftBar @render-file="handleRenderType"></LeftBar>
        <div ref="projectView" class="project-content-view"
            :class="{ 'active-bg': activeTab === 'canvas', 'project-view-full-screen': isFullScreen }">
            <div v-if="isFullScreen" class="project-tab-image">
                <img src="/img/sprite/nv_tab.png" v-if="activeTab === 'canvas'" width="100%" alt="">

            </div>
            <!-- 水印覆盖层：平铺模式 -->
            <div v-if="wm.settings.enabled && wm.settings.placement === 'tiled' && isFullScreen"
                :style="{ position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 100, backgroundRepeat: 'repeat', backgroundImage: wm.svgDataUrl }">
            </div>

            <!-- 水印覆盖层：四角模式 -->
            <div v-if="wm.settings.enabled && wm.settings.placement !== 'tiled' && isFullScreen"
                class="watermark-corner" :style="cornerStyle">
                {{ wm.settings.text }}
            </div>

            <div class="project-tab" v-if="!isFullScreen">
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'canvas' }" @click="activeTab = 'canvas'">
                    {{ t('projectView.tabs.canvas') }}</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'preview' }" @click="activeTab = 'preview'">
                    {{ t('projectView.tabs.preview') }}</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'script' }" @click="activeTab = 'script'">
                    {{ t('projectView.tabs.script') }}</div>
            </div>

            <div class="project-canvas"
                :class="{ 'edit-mode': actionStore.isEditMode, 'editing': actionStore.isEditMode }" id="canvas"
                :data-editing-label="t('projectView.editing')"
                v-show="activeTab == 'canvas'">
                <div id="canvas-info">

                </div>
            </div>

            <div class="project-preview" v-show="activeTab == 'preview'">
                <img ref="imgRef" src="" alt="" srcset="" v-show="showImage">
                <video ref="videoRef" src="" v-show="showVideo" autoplay controls loop muted></video>
                <span v-show="showText">{{ t('projectView.unsupportedPreview') }}</span>
                <div id="preview-canvas" v-show="showCanvas">
                    <!-- 动画选择下拉框 -->
                    <div class="animation-selector" v-if="showCanvas && animationOptions.length > 0">
                        <label>{{ t('projectView.selectAnimation') }}</label>
                        <Dropdown v-model="selectedAnimationIndex" @update:modelValue="handleAnimationChange"
                            :options="animationOptions" :disabled="false" />
                    </div>
                    <!-- 皮肤选择下拉框 -->
                    <div class="skin-selector" v-if="showCanvas && skinOptions.length > 0">
                        <label>{{ t('projectView.selectSkin') }}</label>
                        <Dropdown v-model="selectedSkinIndex" @update:modelValue="handleSkinChange"
                            :options="skinOptions" :disabled="false" />
                    </div>

                    <!-- 角色类型选择下拉框 -->
                    <div class="character-type-selector" v-if="showCanvas && hasCharacterAssets">
                        <label>{{ t('projectView.characterType') }}</label>
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
                        :active-hovered-slot="hoveredSlotName"
                        :selected-slots="selectedSlotNames"
                        @toggle-slot="handleSlotToggle" @update-alpha="handleSlotAlphaUpdate"
                        @show-all="handleShowAllSlots" @hide-all="handleHideAllSlots" @slot-hover="handleSlotHover"
                        @slot-leave="handleSlotLeave" @select-slot="handleSlotSelection" />
                </div>

                <div v-if="showCanvas" class="slot-batch-panel">
                    <div class="slot-batch-header">
                        <div>
                            <div class="slot-batch-title">{{ t('projectView.customizer.title') }}</div>
                            <div class="slot-batch-subtitle">
                                {{ selectedSlotNames.length > 0
                                    ? t('projectView.customizer.selectedSummary', { count: selectedSlotNames.length })
                                    : t('projectView.customizer.emptySelection') }}
                            </div>
                        </div>
                        <button class="slot-panel-button slot-panel-button-ghost slot-panel-button-compact" @click="openBulkSelectDialog">
                            {{ t('projectView.customizer.bulkSelect') }}
                        </button>
                    </div>

                    <template v-if="selectedSlotNames.length > 0">
                        <div class="slot-selection-chip-list">
                            <span class="slot-selection-chip" v-for="name in selectedSlotNames" :key="name">{{ name }}</span>
                        </div>

                        <div class="slot-batch-control">
                            <label>{{ t('projectView.customizer.visible') }}</label>
                            <input
                                type="checkbox"
                                :checked="selectedSlotPrimary?.visible ?? true"
                                @change="applySelectedVisibility(($event.target as HTMLInputElement).checked)"
                            />
                        </div>

                        <div class="slot-batch-control">
                            <label>{{ t('projectView.customizer.alpha') }}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                :value="selectedSlotPrimary?.alpha ?? 1"
                                @input="applySelectedAlpha(parseFloat(($event.target as HTMLInputElement).value))"
                            />
                            <span class="slot-batch-value">{{ Math.round((selectedSlotPrimary?.alpha ?? 1) * 100) }}%</span>
                        </div>

                        <div class="slot-batch-control">
                            <label>{{ t('projectView.customizer.tint') }}</label>
                            <ColorPicker trigger-variant="panel"
                                :model-value="selectedSlotPrimary?.tint ?? 0xffffff"
                                @update:modelValue="applySelectedTint" />
                        </div>

                        <div class="slot-batch-actions">
                            <button class="slot-panel-button" @click="toggleShaderEditor">
                                {{ t('projectView.customizer.shader') }}
                            </button>
                            <button class="slot-panel-button slot-panel-button-danger" @click="handleResetShader">
                                {{ t('projectView.customizer.clearShader') }}
                            </button>
                            <button class="slot-panel-button slot-panel-button-ghost" @click="clearSelectedSlots">
                                {{ t('projectView.customizer.clearSelection') }}
                            </button>
                        </div>
                        <div class="slot-save-section">
                            <label>{{ t('projectView.customizer.saveAsCharacter') }}</label>
                            <input
                                v-model="customCharacterName"
                                class="slot-name-input"
                                :placeholder="t('projectView.customizer.characterNamePlaceholder')"
                            />
                            <div class="slot-batch-actions">
                                <button class="slot-panel-button slot-panel-button-primary" @click="saveCustomCharacter">
                                    {{ t('projectView.customizer.save') }}
                                </button>
                                <button
                                    v-if="currentPreviewCharacter?.isCustom"
                                    class="slot-panel-button slot-panel-button-danger"
                                    @click="deleteCustomCharacter(currentPreviewCharacter.id || '')"
                                >
                                    {{ t('projectView.customizer.deleteCurrent') }}
                                </button>
                            </div>
                        </div>
                    </template>

                    <div class="slot-custom-list" v-if="customCharacters.length > 0">
                        <div class="slot-custom-list-title">{{ t('projectView.customizer.customCharacters') }}</div>
                        <div class="slot-custom-item" v-for="item in customCharacters" :key="item.id">
                            <span>{{ item.displayName || item.characterName }}</span>
                            <button class="slot-custom-delete" @click="deleteCustomCharacter(item.id || '')">
                                {{ t('common.delete') }}
                            </button>
                        </div>
                    </div>
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
                <Transition name="shader-floating">
                    <div
                        v-if="showShaderEditor && showCanvas"
                        ref="shaderWindowRef"
                        class="shader-floating-window"
                        :class="{ dragging: shaderWindowDragging }"
                        :style="shaderFloatingStyle"
                    >
                        <div class="shader-floating-header" @mousedown.prevent="startShaderWindowDrag">
                            <div class="shader-floating-title-group">
                                <h3>{{ t('projectView.shaderEditorTitle') }}</h3>
                                <div class="shader-floating-subtitle">
                                    <span class="shader-floating-count">{{ selectedSlotNames.length }}</span>
                                    <span
                                        v-for="slotName in shaderSelectedSlotPreview"
                                        :key="slotName"
                                        class="shader-floating-chip"
                                    >
                                        {{ slotName }}
                                    </span>
                                    <span
                                        v-if="selectedSlotNames.length > shaderSelectedSlotPreview.length"
                                        class="shader-floating-chip"
                                    >
                                        +{{ selectedSlotNames.length - shaderSelectedSlotPreview.length }}
                                    </span>
                                </div>
                            </div>
                            <button @mousedown.stop @click="toggleShaderEditor" class="close-btn">×</button>
                        </div>
                        <div class="shader-floating-body">
                            <ShaderEditor :ref="shaderEditorRef" @apply-shader="handleApplyShader"
                                @reset-shader="handleResetShader" />
                        </div>
                    </div>
                </Transition>

                <Transition name="shader-overlay">
                    <div v-if="showBulkSelectDialog" class="shader-editor-overlay" @click.self="closeBulkSelectDialog">
                        <div class="bulk-select-dialog">
                            <div class="shader-editor-header">
                                <h3>{{ t('projectView.customizer.bulkSelectTitle') }}</h3>
                                <button @click="closeBulkSelectDialog" class="close-btn">×</button>
                            </div>
                            <input
                                ref="bulkSelectInputRef"
                                v-model="bulkSelectKeyword"
                                class="slot-name-input"
                                :placeholder="t('projectView.customizer.bulkSelectPlaceholder')"
                                @keydown.enter.prevent="applyBulkSelect"
                                @keydown.esc.prevent="closeBulkSelectDialog"
                            />
                            <div class="bulk-select-helper">
                                {{ bulkSelectKeyword.trim()
                                    ? (matchedBulkSlotNames.length > 0
                                        ? `${matchedBulkSlotNames.length} / ${slotOptions.length}`
                                        : t('projectView.customizer.messages.noSlotMatched', { keyword: bulkSelectKeyword.trim() }))
                                    : t('projectView.customizer.bulkSelectPlaceholder') }}
                            </div>
                            <div v-if="matchedBulkSlotNames.length > 0" class="bulk-select-results">
                                <button
                                    v-for="slotName in matchedBulkSlotNames.slice(0, 24)"
                                    :key="slotName"
                                    type="button"
                                    class="bulk-select-result"
                                    @click="applyBulkSelect([slotName])"
                                >
                                    {{ slotName }}
                                </button>
                            </div>
                            <div class="slot-batch-actions">
                                <button class="slot-panel-button slot-panel-button-primary" @click="() => applyBulkSelect()">
                                    {{ t('projectView.customizer.bulkSelectApply') }}
                                </button>
                                <button class="slot-panel-button slot-panel-button-ghost" @click="closeBulkSelectDialog">
                                    {{ t('common.cancel') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>

            <div class="project-script" v-show="activeTab == 'script'">
                <ScriptEditor v-model="scriptContent" :placeholder="t('projectView.scriptPlaceholder')" />
            </div>

            <div
                class="dialogue-ui-trigger"
                :class="{ 'panel-open': showDialogueUiPanel }"
                v-if="activeTab === 'canvas'"
                @click="showDialogueUiPanel = !showDialogueUiPanel"
            >
                ⚙️
            </div>

            <div class="full-screen" v-if="activeTab != 'script'" :style="'opacity:' + (isFullScreen ? 0.2 : 0.8)"
                @click="fullScreen">
                🔲
            </div>

            <DialogueUiFloatingPanel
                v-if="activeTab === 'canvas'"
                :show="showDialogueUiPanel"
                @close="showDialogueUiPanel = false"
            />
        </div>

        <!-- 操作提示 -->
        <ControlHint v-if="activeTab === 'preview'" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LeftBar from '../components/LeftBar.vue';
import ScriptEditor from '../components/edit/ScriptEditor.vue';
import Dropdown from '../components/common/Dropdown.vue';
import ControlHint from '../components/common/ControlHint.vue';
import SlotControl from '../components/common/SlotControl.vue';
import ShaderEditor from '../components/common/ShaderEditor.vue';
import ColorPicker from '../components/common/ColorPicker.vue';
import DialogueUiFloatingPanel from '../components/DialogueUiFloatingPanel.vue';
import { ResType } from '../script/var';
import { createPixiApp, IApp, layoutPreviewSpine, load, resizePreviewApp, setupSpineInteraction } from '../script/render/preview-canvas';
import { Spine } from 'pixi-spine';
import * as PIXI from 'pixi.js';
import { OutlineFilter } from 'pixi-filters';
import CanvasManager from '../script/render/canvas-manager';
import AssetManager from '../script/asset-manager';
import { useActionStore } from '../stores/action-store';
import type { CharacterType, CharacterUrls, DropdownOption, SlotCustomization, SpineCharacterCustomization } from '../types/app';
import { applyUIAnimationConfig, type UIAnimationConfig } from '../script/render/animation-config';
import { useWatermarkStore } from '../stores/watermark-store';
import { useDialogueUiStore } from '../stores/dialogue-ui-store';
import { getCurrentWindow } from '@tauri-apps/api/window';
import massage from '../script/common/massage';
import CustomCharacterService from '../script/custom-character-service';
import { applySlotRuntimeColor, applySpineCustomization, cloneCustomization, type ApplySpineCustomizationOptions } from '../script/spine-customization';
import { getCharacterId, getCharacterResourceKey } from '../utils/character';

const { t } = useI18n();

const imgRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const projectView = ref<HTMLDivElement | null>(null)

// 水印设置
const wm = useWatermarkStore();
wm.initialize();
const dialogueUiStore = useDialogueUiStore();
dialogueUiStore.initialize();

// 计算四角水印的样式
const cornerStyle = computed(() => {
    const s = wm.settings;
    const base: Record<string, string> = {
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: '100',
        color: s.color,
        opacity: String(s.opacity),
        fontSize: s.fontSize + 'px',
        transform: `rotate(${s.angle}deg)`,
    };
    // 位置与偏移
    if (s.placement === 'top-left') {
        base.top = s.offsetY + 'px';
        base.left = s.offsetX + 'px';
    } else if (s.placement === 'top-right') {
        base.top = s.offsetY + 'px';
        base.right = s.offsetX + 'px';
        base.textAlign = 'right';
    } else if (s.placement === 'bottom-left') {
        base.bottom = s.offsetY + 'px';
        base.left = s.offsetX + 'px';
    } else if (s.placement === 'bottom-right') {
        base.bottom = s.offsetY + 'px';
        base.right = s.offsetX + 'px';
        base.textAlign = 'right';
    }
    return base;
});

const showImage = ref<boolean>(false);
const showVideo = ref<boolean>(false);
const showText = ref<boolean>(false);
const showCanvas = ref<boolean>(false);
const showDialogueUiPanel = ref(false);

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
const characterTypeOptions = computed<DropdownOption[]>(() => [
    { label: t('projectView.characterTypes.default'), value: 'default' },
    { label: t('projectView.characterTypes.aim'), value: 'aim' },
    { label: t('projectView.characterTypes.cover'), value: 'cover' }
]);

// 插槽控制相关的响应式数据
interface SlotData {
    name: string;
    visible: boolean;
    alpha: number;
    tint: number;
    shader: SlotCustomization['shader'] | null;
}
const slotOptions = ref<SlotData[]>([]);
const hoveredSlotName = ref<string | null>(null);
const selectedSlotNames = ref<string[]>([]);
const customCharacterName = ref('');
const currentPreviewCharacter = ref<CharacterType | null>(null);
const customCharacters = ref<CharacterType[]>([]);
const currentCustomization = ref<SpineCharacterCustomization>({ slots: {} });
const showBulkSelectDialog = ref(false);
const bulkSelectKeyword = ref('');
const bulkSelectInputRef = ref<HTMLInputElement | null>(null);
const matchedBulkSlotNames = computed(() => {
    const keyword = bulkSelectKeyword.value.trim().toLowerCase();
    if (!keyword) {
        return [];
    }

    return slotOptions.value
        .filter((slot) => slot.name.toLowerCase().includes(keyword))
        .map((slot) => slot.name);
});

const selectedSlotPrimary = computed(() => {
    if (selectedSlotNames.value.length === 0) {
        return null;
    }

    return slotOptions.value.find((slot) => slot.name === selectedSlotNames.value[0]) || null;
});
const shaderSelectedSlotPreview = computed(() => selectedSlotNames.value.slice(0, 3));

// Shader控制相关的响应式数据
const showShaderEditor = ref<boolean>(false);
const shaderEditorRef = ref<any>(null);
const shaderWindowRef = ref<HTMLDivElement | null>(null);
const shaderWindowDragging = ref(false);
const shaderWindowPosition = ref({ left: 0, top: 0 });
let slotOutlineContainer: PIXI.Container | null = null;

interface SlotOutlineOverlay {
    container: PIXI.Container;
    texture: PIXI.RenderTexture;
    transform: PIXI.Matrix;
    outerSprite: PIXI.Sprite;
    innerSprite: PIXI.Sprite;
    outerFilter: OutlineFilter;
    innerFilter: OutlineFilter;
}

const slotOutlineOverlays = new Map<string, SlotOutlineOverlay>();

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

let _last_preview_identity = '';

// 当前激活的 Tab ('canvas' | 'preview' | 'script')
const activeTab = ref<'canvas' | 'preview' | 'script'>('canvas');

watch(activeTab, (tab) => {
    if (tab !== 'canvas') {
        showDialogueUiPanel.value = false;
    }
});
const actionStore = useActionStore();
const shaderFloatingStyle = computed(() => ({
    left: `${shaderWindowPosition.value.left}px`,
    top: `${shaderWindowPosition.value.top}px`,
}));

// Script 相关的响应式数据
const scriptContent = ref<string>('');

const resetPreviewInteraction = () => {
    if (cleanup) {
        cleanup();
        cleanup = undefined;
    }

    handleSlotLeave();
    clearSelectedSlots();
};

const loadCustomCharacters = async () => {
    customCharacters.value = await CustomCharacterService.getInstance().list();
};

const getDefaultCustomization = (): SpineCharacterCustomization => ({
    selectedAnimationName: undefined,
    selectedSkinName: undefined,
    slots: {},
});

const refreshCurrentCustomization = () => {
    currentCustomization.value = {
        selectedAnimationName: animationOptions.value[selectedAnimationIndex.value]?.label,
        selectedSkinName: skinOptions.value[selectedSkinIndex.value]?.label,
        slots: slotOptions.value.reduce<Record<string, SlotCustomization>>((acc, slot) => {
            acc[slot.name] = {
                visible: slot.visible,
                alpha: slot.alpha,
                tint: slot.tint,
                shader: slot.shader ?? null,
            };
            return acc;
        }, {}),
    };
};

const mixTintColor = (baseTint: number, overlayTint: number, strength: number) => {
    const baseR = (baseTint >> 16) & 0xff;
    const baseG = (baseTint >> 8) & 0xff;
    const baseB = baseTint & 0xff;
    const overlayR = (overlayTint >> 16) & 0xff;
    const overlayG = (overlayTint >> 8) & 0xff;
    const overlayB = overlayTint & 0xff;

    const mixChannel = (base: number, overlay: number) => {
        return Math.round(base + (overlay - base) * strength);
    };

    return (
        (mixChannel(baseR, overlayR) << 16) |
        (mixChannel(baseG, overlayG) << 8) |
        mixChannel(baseB, overlayB)
    );
};

const getInteractiveSlotTint = (slotName: string) => {
    let tint = currentCustomization.value.slots[slotName]?.tint ?? 0xffffff;

    if (selectedSlotNames.value.includes(slotName)) {
        tint = mixTintColor(tint, 0x4aa3ff, 0.26);
    }

    if (hoveredSlotName.value === slotName) {
        tint = mixTintColor(tint, 0xffd24d, 0.18);
    }

    return tint;
};

const syncSlotInteractiveState = () => {
    if (!previewSpine.value?.skeleton) {
        syncSlotOutlineOverlay();
        return;
    }

    previewSpine.value.skeleton.slots.forEach((slot: any) => {
        applySlotRuntimeColor(
            slot,
            getInteractiveSlotTint(slot.data.name),
            currentCustomization.value.slots[slot.data.name]?.alpha,
        );
    });

    syncSlotOutlineOverlay();
};

const destroySlotOutlineOverlay = (slotName: string) => {
    const overlay = slotOutlineOverlays.get(slotName);
    if (!overlay) {
        return;
    }

    overlay.outerSprite.filters = [];
    overlay.innerSprite.filters = [];
    overlay.container.destroy({ children: true });
    overlay.texture.destroy(true);
    slotOutlineOverlays.delete(slotName);
};

const clearSlotOutlineOverlays = () => {
    [...slotOutlineOverlays.keys()].forEach(destroySlotOutlineOverlay);
};

const ensureSlotOutlineContainer = () => {
    const app = previewAPP.value?.application;
    if (!app) {
        return null;
    }

    let container = slotOutlineContainer;
    if (!container || container.destroyed) {
        container = new PIXI.Container();
        container.visible = false;
        container.eventMode = 'none';
        slotOutlineContainer = container;
        app.stage.addChild(container);
    } else if (container.parent !== app.stage) {
        app.stage.addChild(container);
    }

    if (container.parent === app.stage) {
        app.stage.setChildIndex(container, app.stage.children.length - 1);
    }

    return container;
};

const getOutlineSlotTarget = (slotName: string) => {
    const slot = previewSpine.value?.skeleton?.findSlot(slotName) as any;
    const target = slot?.currentMesh || slot?.currentSprite;
    if (!slot || !target || !target.visible || !target.renderable || (slot.color?.a ?? 1) <= 0) {
        return null;
    }

    return target as PIXI.DisplayObject;
};

const ensureSlotOutlineOverlay = (slotName: string) => {
    const outlineContainer = ensureSlotOutlineContainer();
    const renderer = previewAPP.value?.application.renderer;
    if (!outlineContainer || !renderer) {
        return null;
    }

    let overlay = slotOutlineOverlays.get(slotName);
    if (overlay) {
        if (overlay.container.parent !== outlineContainer) {
            outlineContainer.addChild(overlay.container);
        }
        return overlay;
    }

    const texture = PIXI.RenderTexture.create({
        width: 1,
        height: 1,
        resolution: renderer.resolution,
    });

    const outerFilter = new OutlineFilter(4.5, 0xffffff, 0.1, 0.38, true);
    const innerFilter = new OutlineFilter(2.2, 0x4aa3ff, 0.1, 1, true);
    const outerSprite = new PIXI.Sprite(texture);
    const innerSprite = new PIXI.Sprite(texture);
    outerSprite.filters = [outerFilter];
    innerSprite.filters = [innerFilter];
    outerSprite.eventMode = 'none';
    innerSprite.eventMode = 'none';

    const container = new PIXI.Container();
    container.eventMode = 'none';
    container.addChild(outerSprite);
    container.addChild(innerSprite);
    outlineContainer.addChild(container);

    overlay = {
        container,
        texture,
        transform: new PIXI.Matrix(),
        outerSprite,
        innerSprite,
        outerFilter,
        innerFilter,
    };
    slotOutlineOverlays.set(slotName, overlay);
    return overlay;
};

const updateSlotOutlineTexture = (slotName: string, padding: number) => {
    const overlay = ensureSlotOutlineOverlay(slotName);
    const renderer = previewAPP.value?.application.renderer;
    const target = getOutlineSlotTarget(slotName);
    if (!overlay || !renderer || !target) {
        return null;
    }

    const bounds = target.getBounds();
    if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) {
        overlay.container.visible = false;
        return null;
    }

    const textureWidth = Math.max(1, Math.ceil(bounds.width + padding * 2));
    const textureHeight = Math.max(1, Math.ceil(bounds.height + padding * 2));

    overlay.texture.resize(textureWidth, textureHeight);
    overlay.transform.identity();
    overlay.transform.translate(-bounds.x + padding, -bounds.y + padding);
    renderer.render(target, {
        renderTexture: overlay.texture,
        clear: true,
        transform: overlay.transform,
        skipUpdateTransform: true,
    });

    overlay.outerSprite.position.set(bounds.x - padding, bounds.y - padding);
    overlay.innerSprite.position.copyFrom(overlay.outerSprite.position);
    overlay.outerSprite.texture = overlay.texture;
    overlay.innerSprite.texture = overlay.texture;
    overlay.container.visible = true;

    return overlay;
};

const syncSlotOutlineOverlay = () => {
    const outlineContainer = ensureSlotOutlineContainer();
    if (!outlineContainer) {
        return;
    }

    if (activeTab.value !== 'preview' || !showCanvas.value || !previewSpine.value?.skeleton) {
        clearSlotOutlineOverlays();
        outlineContainer.visible = false;
        return;
    }

    const hasHovered = !!hoveredSlotName.value;
    const hasSelected = selectedSlotNames.value.length > 0;
    if (!hasHovered && !hasSelected) {
        clearSlotOutlineOverlays();
        outlineContainer.visible = false;
        return;
    }

    outlineContainer.visible = true;

    const wantedSlots = new Set<string>(selectedSlotNames.value);
    if (hoveredSlotName.value) {
        wantedSlots.add(hoveredSlotName.value);
    }

    [...slotOutlineOverlays.keys()]
        .filter((slotName) => !wantedSlots.has(slotName))
        .forEach(destroySlotOutlineOverlay);

    selectedSlotNames.value.forEach((slotName) => {
        const overlay = updateSlotOutlineTexture(slotName, 12);
        if (!overlay) {
            return;
        }

        overlay.outerFilter.thickness = hoveredSlotName.value === slotName ? 5.2 : 4.8;
        overlay.outerFilter.color = 0xffffff;
        overlay.outerFilter.alpha = hoveredSlotName.value === slotName ? 0.5 : 0.38;
        overlay.innerFilter.thickness = hoveredSlotName.value === slotName ? 2.6 : 2.2;
        overlay.innerFilter.color = hoveredSlotName.value === slotName ? 0x77d8ff : 0x4aa3ff;
        overlay.innerFilter.alpha = 1;
    });

    if (hoveredSlotName.value && !selectedSlotNames.value.includes(hoveredSlotName.value)) {
        const overlay = updateSlotOutlineTexture(hoveredSlotName.value, 10);
        if (overlay) {
            overlay.outerFilter.thickness = 4.2;
            overlay.outerFilter.color = 0xfff4c2;
            overlay.outerFilter.alpha = 0.32;
            overlay.innerFilter.thickness = 1.9;
            overlay.innerFilter.color = 0xffd24d;
            overlay.innerFilter.alpha = 0.96;
        }
    }
};

const applyCurrentCustomization = (options: ApplySpineCustomizationOptions = {}) => {
    if (!previewSpine.value) {
        return;
    }

    const shaderFilterArea = options.filterArea ?? previewAPP.value?.application.screen?.clone?.() ?? null;
    applySpineCustomization(previewSpine.value, currentCustomization.value, {
        ...options,
        filterArea: shaderFilterArea,
    });
    syncSlotInteractiveState();
};

const setSlotCustomization = (slotName: string, patch: Partial<SlotCustomization>) => {
    currentCustomization.value.slots[slotName] = {
        ...currentCustomization.value.slots[slotName],
        ...patch,
    };
};

const applySlotCustomizationBatch = (slotNames: string[]) => {
    const uniqueSlotNames = [...new Set(slotNames)];
    if (uniqueSlotNames.length === 0) {
        return;
    }

    applyCurrentCustomization({
        includeAnimation: false,
        includeSkin: false,
        slotNames: uniqueSlotNames,
    });
};

const handleRenderType = async (data: { url: string, type: ResType, characterUrls?: CharacterUrls, character?: CharacterType }) => {
    console.log("点击");
    const previewIdentity = data.character?.id || data.url;
    if (_last_preview_identity == previewIdentity) {
        console.log("两者的url相同");
        resetPreviewInteraction();
        showImage.value = false;
        showVideo.value = false;
        showText.value = false;
        _last_preview_identity = '';
        activeTab.value = 'canvas';
        return;
    }

    activeTab.value = 'preview';
    currentPreviewCharacter.value = data.character || null;
    customCharacterName.value = data.character?.displayName || data.character?.characterName || '';
    currentCustomization.value = cloneCustomization(data.character?.customization) || getDefaultCustomization();
    switch (data.type) {
        case ResType.Image:
            resetPreviewInteraction();
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = data.url;
                videoRef.value.pause();
                videoRef.value.src = '';
                showCanvas.value = false;
                showImage.value = true;
                showVideo.value = false;
                showText.value = false;
            }
            _last_preview_identity = previewIdentity;
            break;
        case ResType.Video:
            resetPreviewInteraction();
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = '';
                videoRef.value.src = data.url;
                showCanvas.value = false;
                showImage.value = false;
                showVideo.value = true;
                showText.value = false;
            }
            _last_preview_identity = previewIdentity;
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
                resetPreviewInteraction();

                // 如果有已经有load当再次加载时应当销毁Spine
                if (previewSpine.value) {
                    if (previewSpine.value.parent) {
                        previewSpine.value.parent.removeChild(previewSpine.value);
                    }
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

                        const preferredVariant = currentPreviewCharacter.value?.resourceVariant;
                        if (preferredVariant && preferredVariant !== 'default') {
                            const preferredIndex = characterTypeOptions.value.findIndex((item) => item.value === preferredVariant);
                            if (preferredIndex >= 0) {
                                selectedCharacterType.value = preferredIndex;
                            }

                            if (preferredVariant === 'aim' && assets.aim) {
                                if (previewSpine.value && previewSpine.value.parent) {
                                    previewSpine.value.parent.removeChild(previewSpine.value);
                                }
                                previewSpine.value = assets.aim;
                                if (previewSpine.value) {
                                    previewAPP.value?.application.stage.addChild(previewSpine.value);
                                }
                            }

                            if (preferredVariant === 'cover' && assets.cover) {
                                if (previewSpine.value && previewSpine.value.parent) {
                                    previewSpine.value.parent.removeChild(previewSpine.value);
                                }
                                previewSpine.value = assets.cover;
                                if (previewSpine.value) {
                                    previewAPP.value?.application.stage.addChild(previewSpine.value);
                                }
                            }
                        }

                    } else {
                        // 单个Spine模式
                        const spine = result as any;
                        previewSpine.value = spine;
                    }

                    // 检查是否有角色资源
                    hasCharacterAssets.value = !!(data.characterUrls && (data.characterUrls.aim || data.characterUrls.cover));

                    // 获取动画列表并设置下拉框选项
                    updateAnimationOptions(previewSpine.value);
                    // 应用初始混合配置
                    applyCurrentMixConfig();

                    if (currentCustomization.value.selectedSkinName && previewSpine.value?.skeleton?.data?.findSkin(currentCustomization.value.selectedSkinName)) {
                        previewSpine.value.skeleton.setSkinByName(currentCustomization.value.selectedSkinName);
                        previewSpine.value.skeleton.setSlotsToSetupPose();
                    }

                    if (currentCustomization.value.selectedAnimationName && previewSpine.value?.state?.hasAnimation(currentCustomization.value.selectedAnimationName)) {
                        previewSpine.value.state.setAnimation(0, currentCustomization.value.selectedAnimationName, true);
                        const animationIndex = animationOptions.value.findIndex((option) => option.label === currentCustomization.value.selectedAnimationName);
                        if (animationIndex >= 0) {
                            selectedAnimationIndex.value = animationIndex;
                        }
                    }

                    const skinIndex = skinOptions.value.findIndex((option) => option.label === currentCustomization.value.selectedSkinName);
                    if (skinIndex >= 0) {
                        selectedSkinIndex.value = skinIndex;
                    }

                    applyCurrentCustomization();

                    if (previewSpine.value && previewAPP.value) {
                        cleanup = setupSpineInteraction(previewSpine.value, previewAPP.value.application, {
                            onSlotHover: handleSlotHover,
                            onSlotLeave: handleSlotLeave,
                            onSlotSelect: handleSlotSelection,
                        });
                    }
                });
            }
            break;
        case ResType.Audio:
        case ResType.Package:
        case ResType.Document:
        default:
            console.log("不支持预览这种类型的文件");
            resetPreviewInteraction();
            _last_preview_identity = previewIdentity;
            showImage.value = false;
            showVideo.value = false;
            showText.value = true;
            break;
    }
    _last_preview_identity = previewIdentity;
}

const isFullScreen = ref(false);

const wasMaximized = ref(false)
const isSwitching = ref(false) // 防止快速重复点击

const fullScreen = async () => {
    if (!projectView.value || isSwitching.value) return

    const window = getCurrentWindow()
    isSwitching.value = true // 上锁，防止重复执行

    try {
        if (!isFullScreen.value) {
            // === 进入全屏 ===
            wasMaximized.value = await window.isMaximized()
            if (wasMaximized.value) await window.unmaximize()

            await window.setFullscreen(true)
            isFullScreen.value = true
        } else {
            // === 退出全屏 ===
            await window.setFullscreen(false)

            if (wasMaximized.value) await window.maximize()
            isFullScreen.value = false
        }

        // 触发重新布局
        nextTick(() => {
            dispatchEvent(new Event('resize'))
        })
    } catch (err) {
        console.error('全屏切换失败：', err)
    } finally {
        // 延迟解锁，防止太快重复触发
        setTimeout(() => {
            isSwitching.value = false
        }, 300)
    }
}

const handlePreviewShortcuts = (event: KeyboardEvent) => {
    if (activeTab.value !== 'preview' || !showCanvas.value) {
        return;
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        openBulkSelectDialog();
    }
};

onMounted(() => {
    // 初始化CanvasManager
    CanvasManager.getInstance();
    loadCustomCharacters();
    if (projectView.value) {
        console.log("proView-width", projectView.value.offsetHeight);
        previewAPP.value = createPixiApp(projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        previewAPP.value.application.ticker.add(syncSlotOutlineOverlay);
        handelResizeCanvasToPreview();
    }

    // 监听窗口大小变化，动态更新 Pixi 应用大小
    window.addEventListener('resize', handelResizeCanvasToPreview);
    window.addEventListener('keydown', handlePreviewShortcuts);
})

watch(() => actionStore.isEditMode, () => {
    handelResizeCanvasToPreview();
})

// 监听全屏状态，切换 #app 边框（通过添加类）
watch(isFullScreen, (val) => {
    const appEl = document.getElementById('app');
    if (appEl) {
        appEl.classList.toggle('is-full-screen', val);
    }
});

const handelResizeCanvasToPreview = () => {
    if (projectView.value) {
        const app = previewAPP.value?.application;
        if (app) {
            resizePreviewApp(app, projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        }

        if (previewSpine.value && app) {
            layoutPreviewSpine(previewSpine.value, app);
            const customizedSlots = Object.keys(currentCustomization.value.slots || {});
            if (customizedSlots.length > 0) {
                applyCurrentCustomization({
                    includeAnimation: false,
                    includeSkin: false,
                    slotNames: customizedSlots,
                });
            }
        }
    }

    syncShaderWindowPosition();
}

onUnmounted(() => {
    if (cleanup) {
        cleanup();
    }
    previewAPP.value?.application.ticker.remove(syncSlotOutlineOverlay);
    clearSlotOutlineOverlays();
    slotOutlineContainer?.destroy({ children: true });
    slotOutlineContainer = null;
    stopShaderWindowDrag();
    window.removeEventListener('resize', handelResizeCanvasToPreview)
    window.removeEventListener('keydown', handlePreviewShortcuts)
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
            spine.update(0);
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
            spine.update(0);

            if (previewAPP.value && previewSpine.value === spine) {
                layoutPreviewSpine(spine, previewAPP.value.application);
            }
        }
    }
};

// 处理动画选择变化
const handleAnimationChange = (animationIndex: number) => {
    selectedAnimationIndex.value = animationIndex;
    if (previewSpine.value && previewSpine.value.spineData && previewSpine.value.spineData.animations) {
        const animations = previewSpine.value.spineData.animations;
        if (animations[animationIndex]) {
            currentCustomization.value.selectedAnimationName = animations[animationIndex].name;
            applyCurrentCustomization({
                includeAnimation: true,
                includeSkin: false,
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
            currentCustomization.value.selectedSkinName = skins[skinIndex].name;
            applyCurrentCustomization({
                includeAnimation: false,
                includeSkin: true,
            });
        }
    }
};

let cleanup: (() => void) | undefined;

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
        handleSlotLeave();

        // 添加到舞台
        previewAPP.value.application.stage.addChild(targetSpine);

        // 使用真实渲染边界重新布局
        layoutPreviewSpine(targetSpine, previewAPP.value.application);

        // 更新当前Spine引用
        previewSpine.value = targetSpine;

        if (previewSpine.value) {
            cleanup = setupSpineInteraction(previewSpine.value, previewAPP.value.application, {
                onSlotHover: handleSlotHover,
                onSlotLeave: handleSlotLeave,
                onSlotSelect: handleSlotSelection,
            });
        }

        // 重新初始化动画、皮肤和插槽选项
        updateAnimationOptions(targetSpine);
        applyCurrentCustomization({
            includeAnimation: true,
            includeSkin: true,
        });

        console.log(`切换到角色类型: ${characterType}`);
    }
};

// 应用当前混合配置
const applyCurrentMixConfig = () => {
    if (!previewSpine.value || !previewSpine.value.state || !previewSpine.value.state.data) {
        return;
    }

    // 创建UI配置对象
    const uiConfig: UIAnimationConfig = {
        mixDuration: 0.3,
        presetIndex: 0,
        customMixConfigs: []
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
            visible: currentCustomization.value.slots[slot.data.name]?.visible ?? !!slot.getAttachment?.(),
            alpha: currentCustomization.value.slots[slot.data.name]?.alpha ?? 1.0,
            tint: currentCustomization.value.slots[slot.data.name]?.tint ?? 0xffffff,
            shader: currentCustomization.value.slots[slot.data.name]?.shader ?? null,
        }));

        selectedSlotNames.value = selectedSlotNames.value.filter((slotName) =>
            slotOptions.value.some((item) => item.name === slotName)
        );
    }
};

// 处理插槽显示/隐藏切换
const handleSlotToggle = (slotName: string, visible: boolean) => {
    const slotData = slotOptions.value.find(slot => slot.name === slotName);
    if (slotData) {
        slotData.visible = visible;
        setSlotCustomization(slotName, { visible });
        applySlotCustomizationBatch([slotName]);
    }
};

// 处理插槽透明度变化
const handleSlotAlphaUpdate = (slotName: string, alpha: number) => {
    const slotData = slotOptions.value.find(slot => slot.name === slotName);
    if (slotData) {
        slotData.alpha = alpha;
        setSlotCustomization(slotName, { alpha });
        applySlotCustomizationBatch([slotName]);
    }
};

// 显示所有插槽
const handleShowAllSlots = () => {
    slotOptions.value.forEach(slot => {
        slot.visible = true;
        setSlotCustomization(slot.name, { visible: true });
    });
    applySlotCustomizationBatch(slotOptions.value.map((slot) => slot.name));
};

// 隐藏所有插槽
const handleHideAllSlots = () => {
    slotOptions.value.forEach(slot => {
        slot.visible = false;
        setSlotCustomization(slot.name, { visible: false });
    });
    applySlotCustomizationBatch(slotOptions.value.map((slot) => slot.name));
};

const handleSlotSelection = (slotName: string, append: boolean = false) => {
    if (!append) {
        selectedSlotNames.value = [slotName];
    } else if (selectedSlotNames.value.includes(slotName)) {
        selectedSlotNames.value = selectedSlotNames.value.filter((name) => name !== slotName);
    } else {
        selectedSlotNames.value = [...selectedSlotNames.value, slotName];
    }

    syncSlotInteractiveState();
};

const clearSelectedSlots = () => {
    selectedSlotNames.value = [];
    syncSlotInteractiveState();
};

const applySelectedVisibility = (visible: boolean) => {
    selectedSlotNames.value.forEach((slotName) => {
        const slotData = slotOptions.value.find((slot) => slot.name === slotName);
        if (slotData) {
            slotData.visible = visible;
            setSlotCustomization(slotName, { visible });
        }
    });
    applySlotCustomizationBatch(selectedSlotNames.value);
};

const applySelectedAlpha = (alpha: number) => {
    selectedSlotNames.value.forEach((slotName) => {
        const slotData = slotOptions.value.find((slot) => slot.name === slotName);
        if (slotData) {
            slotData.alpha = alpha;
            setSlotCustomization(slotName, { alpha });
        }
    });
    applySlotCustomizationBatch(selectedSlotNames.value);
};

const applySelectedTint = (tint: number) => {
    selectedSlotNames.value.forEach((slotName) => {
        const slotData = slotOptions.value.find((slot) => slot.name === slotName);
        if (slotData) {
            slotData.tint = tint;
            setSlotCustomization(slotName, { tint });
        }
    });
    applySlotCustomizationBatch(selectedSlotNames.value);
};

const openBulkSelectDialog = () => {
    showBulkSelectDialog.value = true;
    nextTick(() => bulkSelectInputRef.value?.focus());
};

const closeBulkSelectDialog = () => {
    showBulkSelectDialog.value = false;
    bulkSelectKeyword.value = '';
};

const applyBulkSelect = (matchedNames: string[] = matchedBulkSlotNames.value) => {
    if (matchedNames.length === 0) {
        const keyword = bulkSelectKeyword.value.trim();
        if (keyword) {
            massage(t('projectView.customizer.messages.noSlotMatched', { keyword }), 'error', 2000);
        }
        return;
    }

    selectedSlotNames.value = [...matchedNames];
    closeBulkSelectDialog();
    syncSlotInteractiveState();
};

const saveCustomCharacter = async () => {
    if (!currentPreviewCharacter.value) {
        return;
    }

    const name = customCharacterName.value.trim();
    if (!name) {
        massage(t('projectView.customizer.messages.enterCharacterName'), 'error', 2000);
        return;
    }

    refreshCurrentCustomization();

    const baseCharacter = currentPreviewCharacter.value;
    const variant = characterTypeOptions.value[selectedCharacterType.value]?.value as 'default' | 'aim' | 'cover' | undefined;
    const savedCharacter: CharacterType = {
        ...baseCharacter,
        id: `custom:${Date.now()}`,
        isCustom: true,
        baseCharacterId: baseCharacter.baseCharacterId || getCharacterId(baseCharacter),
        characterName: name,
        displayName: name,
        resourceVariant: variant || baseCharacter.resourceVariant,
        resourceKey: getCharacterResourceKey(baseCharacter, variant || 'default'),
        customization: cloneCustomization(currentCustomization.value),
    };

    await CustomCharacterService.getInstance().save(savedCharacter);
    actionStore.addLoadRes({
        name: savedCharacter.characterName,
        path: getCharacterResourceKey(savedCharacter),
        type: ResType.Spine,
        characterId: getCharacterId(savedCharacter),
    });
    await AssetManager.getInstance().reloadResConfig();
    await loadCustomCharacters();
    currentPreviewCharacter.value = savedCharacter;
    window.dispatchEvent(new CustomEvent('custom-characters-updated'));
    massage(t('projectView.customizer.messages.saved', { name }), 'success', 2000);
};

const deleteCustomCharacter = async (characterId: string) => {
    if (!characterId) {
        return;
    }

    await CustomCharacterService.getInstance().remove(characterId);
    delete actionStore.loadResMap[characterId];
    await AssetManager.getInstance().reloadResConfig();
    await loadCustomCharacters();
    if (currentPreviewCharacter.value?.id === characterId) {
        currentPreviewCharacter.value = null;
        customCharacterName.value = '';
    }
    window.dispatchEvent(new CustomEvent('custom-characters-updated'));
    massage(t('projectView.customizer.messages.deleted'), 'success', 2000);
};

// 悬停时
const handleSlotHover = (slotName: string) => {
    if (hoveredSlotName.value === slotName) return;
    hoveredSlotName.value = slotName;
    syncSlotInteractiveState();
};

// 离开时
const handleSlotLeave = () => {
    hoveredSlotName.value = null;
    syncSlotInteractiveState();
};

let shaderDragOffsetX = 0;
let shaderDragOffsetY = 0;

const clampShaderWindowPosition = (left: number, top: number) => {
    const view = projectView.value;
    const windowEl = shaderWindowRef.value;

    if (!view) {
        return { left, top };
    }

    const maxLeft = Math.max(10, view.clientWidth - (windowEl?.offsetWidth || 430) - 10);
    const maxTop = Math.max(10, view.clientHeight - (windowEl?.offsetHeight || 540) - 10);

    return {
        left: Math.min(Math.max(10, left), maxLeft),
        top: Math.min(Math.max(10, top), maxTop),
    };
};

const resetShaderWindowPosition = () => {
    if (!projectView.value) {
        return;
    }

    const nextLeft = projectView.value.clientWidth - 430 - 14;
    shaderWindowPosition.value = clampShaderWindowPosition(nextLeft, 190);
};

const syncShaderWindowPosition = () => {
    shaderWindowPosition.value = clampShaderWindowPosition(
        shaderWindowPosition.value.left,
        shaderWindowPosition.value.top,
    );
};

const handleShaderWindowDrag = (event: MouseEvent) => {
    if (!shaderWindowDragging.value || !projectView.value) {
        return;
    }

    const viewRect = projectView.value.getBoundingClientRect();
    const nextLeft = event.clientX - viewRect.left - shaderDragOffsetX;
    const nextTop = event.clientY - viewRect.top - shaderDragOffsetY;
    shaderWindowPosition.value = clampShaderWindowPosition(nextLeft, nextTop);
};

const stopShaderWindowDrag = () => {
    if (!shaderWindowDragging.value) {
        return;
    }

    shaderWindowDragging.value = false;
    window.removeEventListener('mousemove', handleShaderWindowDrag);
    window.removeEventListener('mouseup', stopShaderWindowDrag);
    document.body.style.userSelect = '';
};

const startShaderWindowDrag = (event: MouseEvent) => {
    if (!shaderWindowRef.value) {
        return;
    }

    const windowRect = shaderWindowRef.value.getBoundingClientRect();
    shaderDragOffsetX = event.clientX - windowRect.left;
    shaderDragOffsetY = event.clientY - windowRect.top;
    shaderWindowDragging.value = true;

    window.addEventListener('mousemove', handleShaderWindowDrag);
    window.addEventListener('mouseup', stopShaderWindowDrag);
    document.body.style.userSelect = 'none';
};

// Shader编辑器相关方法
const toggleShaderEditor = () => {
    if (!showShaderEditor.value && selectedSlotNames.value.length === 0) {
        massage(t('projectView.customizer.messages.selectSlotFirst'), 'error', 2000);
        return;
    }

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
            if (shaderWindowPosition.value.left === 0 && shaderWindowPosition.value.top === 0) {
                resetShaderWindowPosition();
            } else {
                syncShaderWindowPosition();
            }
            if (
                shaderEditorRef.value &&
                (savedShaderState.value.selectedPreset ||
                    savedShaderState.value.fragmentShader ||
                    savedShaderState.value.uniforms.length > 0)
            ) {
                shaderEditorRef.value.restoreState(savedShaderState.value);
            }
        });
    }
    showShaderEditor.value = !showShaderEditor.value;
};

// 应用Shader到Spine角色
const handleApplyShader = (shaderData: any) => {
    if (selectedSlotNames.value.length === 0) {
        return;
    }

    try {
        selectedSlotNames.value.forEach((slotName) => {
            const slotData = slotOptions.value.find((slot) => slot.name === slotName);
            if (slotData) {
                slotData.shader = {
                    name: shaderData.name,
                    fragmentShader: shaderData.fragmentShader,
                    uniforms: JSON.parse(JSON.stringify(shaderData.uniforms || {})),
                };
                setSlotCustomization(slotName, { shader: slotData.shader });
            }
        });

        applySlotCustomizationBatch(selectedSlotNames.value);
        showShaderEditor.value = false;
    } catch (error) {
        console.error('应用Shader失败:', error);
    }
};

// 重置Shader效果
const handleResetShader = () => {
    if (selectedSlotNames.value.length === 0) {
        return;
    }

    selectedSlotNames.value.forEach((slotName) => {
        const slotData = slotOptions.value.find((slot) => slot.name === slotName);
        if (slotData) {
            slotData.shader = null;
            setSlotCustomization(slotName, { shader: null });
        }
    });

    applySlotCustomizationBatch(selectedSlotNames.value);
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

/* 普通分辨率设备 */
.project-tab-image {
    position: absolute;
    z-index: 9999;
    right: 0;
    width: 300px;
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
    display: flex;
}

.project-content-view:hover .dialogue-ui-trigger,
.dialogue-ui-trigger.panel-open {
    display: flex;
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

.dialogue-ui-trigger {
    position: absolute;
    bottom: 40px;
    left: 8px;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 24px;
    height: 24px;
    font-size: 18px;
    line-height: 1;
    background: transparent;
    border: none;
    color: inherit;
    opacity: .5;
    cursor: pointer;
    transition: all .3s ease-in-out;
    z-index: 120;
    text-indent: 1px;
}

.dialogue-ui-trigger:hover,
.dialogue-ui-trigger.panel-open {
    opacity: 1;
    transform: scale(1.1);
}

.full-screen {
    position: absolute;
    bottom: 10px;
    left: 8px;
    width: 24px;
    height: 24px;
    font-size: 18px;
    display: none;
    align-items: center;
    justify-content: center;
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
    content: attr(data-editing-label);
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
    min-width: 220px;
    background: rgba(0, 0, 0, 0.78);
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    display: flex;
    align-items: center;
    gap: 10px;
}

.animation-selector label {
    color: rgba(255, 255, 255, 0.86);
    font-size: 13px;
    white-space: nowrap;
}

.skin-selector {
    position: absolute;
    top: 70px;
    right: 10px;
    z-index: 10;
    min-width: 220px;
    background: rgba(0, 0, 0, 0.78);
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    display: flex;
    align-items: center;
    gap: 10px;
}

.skin-selector label {
    color: rgba(255, 255, 255, 0.86);
    font-size: 13px;
    white-space: nowrap;
}

.character-type-selector {
    position: absolute;
    top: 130px;
    right: 10px;
    z-index: 10;
    min-width: 220px;
    background: rgba(0, 0, 0, 0.78);
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
    display: flex;
    align-items: center;
    gap: 10px;
}

.character-type-selector label {
    color: rgba(255, 255, 255, 0.86);
    font-size: 13px;
    white-space: nowrap;
}

.slot-batch-panel {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    width: min(300px, calc(100vw - 32px));
    max-height: calc(100% - 20px);
    overflow-y: auto;
    padding: 14px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.84);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
}

.slot-batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.slot-batch-title {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
}

.slot-batch-subtitle {
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.56);
    font-size: 12px;
    line-height: 1.45;
}

.slot-selection-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
}

.slot-selection-chip {
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 11px;
}

.slot-batch-control {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    color: #fff;
}

.slot-batch-control label {
    min-width: 56px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
}

.slot-batch-control input[type="range"] {
    flex: 1;
    accent-color: #4caf50;
}

.slot-batch-control input[type="checkbox"] {
    accent-color: #4caf50;
}

.slot-batch-value {
    min-width: 40px;
    text-align: right;
    color: rgba(255, 255, 255, 0.58);
    font-size: 12px;
}

.slot-batch-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.slot-panel-button {
    appearance: none;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.slot-panel-button:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.slot-panel-button-primary {
    background: rgba(76, 175, 80, 0.22);
    border-color: rgba(76, 175, 80, 0.38);
}

.slot-panel-button-primary:hover {
    background: rgba(76, 175, 80, 0.32);
    border-color: rgba(76, 175, 80, 0.48);
}

.slot-panel-button-danger {
    background: rgba(244, 67, 54, 0.18);
    border-color: rgba(244, 67, 54, 0.32);
}

.slot-panel-button-danger:hover {
    background: rgba(244, 67, 54, 0.28);
    border-color: rgba(244, 67, 54, 0.44);
}

.slot-panel-button-ghost {
    background: rgba(255, 255, 255, 0.04);
}

.slot-panel-button-compact {
    flex-shrink: 0;
    white-space: nowrap;
}

.slot-save-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
}

.slot-save-section label,
.slot-custom-list-title {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
}

.slot-name-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    outline: none;
    transition: border-color 0.2s ease, background-color 0.2s ease;
}

.slot-name-input::placeholder {
    color: rgba(255, 255, 255, 0.34);
}

.slot-name-input:focus {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
}

.slot-custom-list {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.slot-custom-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px;
    margin-top: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 12px;
}

.slot-custom-delete {
    border: 1px solid rgba(244, 67, 54, 0.1);
    border-radius: 6px;
    background: rgba(244, 67, 54, 0.08);
    color: #ff9d95;
    padding: 4px 8px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.slot-custom-delete:hover {
    background: rgba(244, 67, 54, 0.16);
    border-color: rgba(244, 67, 54, 0.24);
}

.bulk-select-dialog {
    width: min(460px, 92vw);
    padding: 0 16px 16px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32);
}

.bulk-select-helper {
    margin-top: 10px;
    color: rgba(255, 255, 255, 0.56);
    font-size: 12px;
    line-height: 1.45;
}

.bulk-select-results {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
    max-height: 168px;
    overflow-y: auto;
    padding-right: 2px;
}

.slot-batch-panel::-webkit-scrollbar,
.bulk-select-results::-webkit-scrollbar,
.shader-floating-body::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.slot-batch-panel::-webkit-scrollbar-track,
.bulk-select-results::-webkit-scrollbar-track,
.shader-floating-body::-webkit-scrollbar-track {
    background: transparent;
}

.slot-batch-panel::-webkit-scrollbar-thumb,
.bulk-select-results::-webkit-scrollbar-thumb,
.shader-floating-body::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
}

.slot-batch-panel::-webkit-scrollbar-thumb:hover,
.bulk-select-results::-webkit-scrollbar-thumb:hover,
.shader-floating-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.28);
}

.bulk-select-result {
    appearance: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.bulk-select-result:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.22);
    transform: translateY(-1px);
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

.shader-floating-window {
    position: absolute;
    z-index: 18;
    width: 392px;
    height: min(560px, calc(100% - 210px));
    min-width: 320px;
    min-height: 320px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    resize: both;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32);
}

.shader-floating-window.dragging {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.shader-floating-header,
.shader-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
}

.shader-floating-header {
    cursor: move;
}

.shader-floating-title-group {
    min-width: 0;
    flex: 1;
}

.shader-floating-title-group h3,
.shader-editor-header h3 {
    color: #fff;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
}

.shader-floating-subtitle {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
}

.shader-floating-count,
.shader-floating-chip {
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.66);
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
}

.shader-floating-count {
    color: #fff;
}

.shader-floating-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.shader-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 12, 18, 0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background-color 0.2s, border-color 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.18);
}

/* Shader 编辑器动画 */
.shader-overlay-enter-active,
.shader-overlay-leave-active,
.shader-floating-enter-active,
.shader-floating-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
}

.shader-overlay-enter-from,
.shader-overlay-leave-to,
.shader-floating-enter-from,
.shader-floating-leave-to {
    opacity: 0;
}

.shader-floating-enter-from,
.shader-floating-leave-to {
    transform: translateY(12px) scale(0.98);
}

.shader-floating-enter-to,
.shader-floating-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
}

@media (max-width: 1180px) {
    .shader-floating-window {
        width: min(392px, calc(100% - 20px));
        height: min(520px, calc(100% - 220px));
    }
}
</style>
