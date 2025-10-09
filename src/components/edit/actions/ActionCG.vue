<template>
    <div class="action-item-main">
        <ActionItemHead content="🖼️ CG图像" :title="title" :id="id"></ActionItemHead>
        <div class="action-item-content">
            <div class="action-title">
                阻塞执行
                <ToggleSwitch v-model="actionItem.wait!"></ToggleSwitch>
            </div>

            <div class="action-title">
                CG操作模式：
            </div>

            <Dropdown v-model="selectedOption" @update:modelValue="onSelectModel" :options="CGOperaMode"
                :disabled="false" />

            <ActionBottomLine></ActionBottomLine>

            <template v-if="CGOperaMode[selectedOption].value === 'show'">
                <div class="action-title">
                    选择CG图像
                </div>
                <div class="select-cg">
                    <img v-if="selectedCGKey" :src="cgList[selectedCGKey]" width="50%" alt="" />
                    <img v-else src="/img/sprite/CommanderRoom.png" width="50%" alt="" />

                    <div class="cg-tool">
                        {{ selectedCGName }}
                        <div class="tool-edit">
                            <div @click.stop="selectCG" title="切换CG">🖌</div>
                        </div>
                    </div>
                </div>

                <!-- <div class="action-title">
                    层级设置
                </div> -->
                <div>
                    <FilterSlider 
                        label="Z-Index" 
                        :min="0" 
                        :max="200" 
                        :step="1" 
                        :modelValue="zIndexValue" 
                        @update:modelValue="handleZIndexChange"
                    />
                </div>

                <!-- <div class="action-title">
                    透明度设置
                </div> -->
                <div>
                    <FilterSlider 
                        label="透明度" 
                        :min="0" 
                        :max="1" 
                        :step="0.01" 
                        :modelValue="alphaValue" 
                        @update:modelValue="handleAlphaChange"
                    />
                </div>

                <!-- 滤镜效果设置 -->
                <div class="action-title">
                    滤镜效果
                    <ToggleSwitch v-model="enableFilters"></ToggleSwitch>
                </div>
                
                <template v-if="enableFilters">
                    <!-- 当前应用的滤镜 -->
                    <div v-if="activeFilters.length > 0" class="filters-section">
                        <div class="filters-header">
                            <span>当前滤镜</span>
                        </div>
                        <div v-for="(filter, index) in activeFilters" :key="filter.id" class="filter-item">
                            <div class="filter-header">
                                <span>{{ filterConfigs[filter.type].label }}</span>
                                <button @click="removeFilter(index)" class="remove-filter-btn">×</button>
                            </div>
                            <FilterSlider 
                                :label="filterConfigs[filter.type].label"
                                :min="filterConfigs[filter.type].min"
                                :max="filterConfigs[filter.type].max"
                                :step="filterConfigs[filter.type].step"
                                :modelValue="filter.value"
                                @update:modelValue="(value) => handleFilterChange(index, value)"
                            />
                        </div>
                    </div>

                    <!-- 添加滤镜 -->
                    <div class="add-filter-section">
                        <button @click="showFilterSelector = true" class="add-filter-btn">
                            + 添加滤镜
                        </button>
                    </div>

                    <!-- 滤镜选择器 -->
                    <div v-if="showFilterSelector" class="filter-selector">
                        <div class="filter-selector-header">
                            <span>选择滤镜类型</span>
                            <button @click="showFilterSelector = false" class="close-selector-btn">×</button>
                        </div>
                        <div class="filter-options">
                            <button 
                                v-for="filterType in availableFilters" 
                                :key="filterType"
                                @click="selectFilter(filterType)"
                                class="filter-option-btn"
                            >
                                {{ filterConfigs[filterType].label }}
                            </button>
                        </div>
                    </div>
                </template>
            </template>

            <template v-else-if="CGOperaMode[selectedOption].value === 'hide'">
                <div class="operation-info">
                    隐藏当前显示的CG图像
                </div>
                
                <!-- 隐藏时的淡出设置 -->
                <div class="action-title">
                    淡出效果
                    <ToggleSwitch v-model="enableHideFadeOut"></ToggleSwitch>
                </div>
                
                <template v-if="enableHideFadeOut">
                    <div>
                        <FilterSlider 
                            label="淡出时长 (秒)" 
                            :min="0.1" 
                            :max="10" 
                            :step="0.1" 
                            :modelValue="hideFadeOutDuration" 
                            @update:modelValue="(value) => hideFadeOutDuration = value"
                        />
                    </div>
                </template>
            </template>

            <template v-else>
                <div class="operation-info">
                    无内容
                </div>
            </template>

            <ActionBottomLine></ActionBottomLine>

            <!-- 预览控制 -->
            <div class="action-title">
                预览控制
                <div class="preview-controls">
                    <button @click="previewCG" class="preview-btn" :disabled="!canPreview">
                        {{ isCGActive ? '👁️' : '🖼️' }}
                    </button>
                    <button @click="previewHide" class="preview-btn">
                        🚫
                    </button>
                    <button @click="clearAllFilters" class="preview-btn" title="清除所有滤镜">
                        🔄
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
import { ActionItems, DropdownOption } from '../../../types/app';
import FilterSlider from '../../common/FilterSlider.vue';
import ToggleSwitch from '../../common/ToggleSwitch.vue';
import ActionBottomLine from '../../common/ActionBottomLine.vue';
import ResourceManager from '../../../script/resource-manager';
import { setModification } from '../../../script/util/common';
import CanvasManager from '../../../script/render/canvas-manager';
import { selectImageType } from '../../../script/common/search-action';
import { ResType } from '../../../script/var';
import { Texture } from 'pixi.js';

// CG操作模式
const selectedOption = ref(0);
const CGOperaMode = ref<DropdownOption[]>([
    { label: "显示CG (Show)", value: "show" },
    { label: "隐藏CG (Hide)", value: "hide" }
]);

// CG选择相关
const selectedCGOption = ref(0);
const cgList = ref<Record<string, string>>({});
const isCGActive = ref(false);

// CG属性设置
const zIndexValue = ref(100);
const alphaValue = ref(1.0);

// 淡出效果设置
const enableHideFadeOut = ref(false);
const hideFadeOutDuration = ref(2.0);

// 滤镜系统
const enableFilters = ref(false);
const showFilterSelector = ref(false);

// 滤镜类型定义
type FilterType = 'blur' | 'brightness' | 'contrast' | 'saturation';

interface FilterItem {
    id: string;
    type: FilterType;
    value: number;
}

// 滤镜配置
const filterConfigs: Record<FilterType, {
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
}> = {
    blur: { label: '模糊', min: 0, max: 20, step: 0.1, default: 0 },
    brightness: { label: '亮度', min: 0, max: 3, step: 0.01, default: 1 },
    contrast: { label: '对比度', min: 0, max: 3, step: 0.01, default: 1 },
    saturation: { label: '饱和度', min: 0, max: 3, step: 0.01, default: 1 }
};

// 当前应用的滤镜
const activeFilters = ref<FilterItem[]>([]);

// 可用的滤镜类型（排除已添加的）
const availableFilters = computed(() => {
    const usedTypes = activeFilters.value.map(f => f.type);
    return (Object.keys(filterConfigs) as FilterType[]).filter(type => !usedTypes.includes(type));
});

const props = defineProps<{
    title: string,
    id: number,
}>();

const { action, actionItem } = useCommonState(props.title, props.id);
let modification: Map<PropertyPath, Modification>;

// 获取可用的CG图像
const availableCGs = computed(() => {
    const cgKeys = Object.keys(cgList.value).filter(key => {
        const url = cgList.value[key];
        return url && (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp'));
    });

    const cgOptions = cgKeys.map((key) => ({
        label: key,
        value: key
    }));

    if (cgOptions.length === 0) {
        return [{ label: '无可用CG图像', value: '' }];
    }

    return cgOptions;
});

// 更新CG列表
const updateCGList = () => {
    cgList.value = {...ResourceManager.allResUrl};
};

const canPreview = computed(() => {
    return CGOperaMode.value[selectedOption.value].value === 'show' &&
        availableCGs.value.length > 0 &&
        selectedCGOption.value < availableCGs.value.length &&
        availableCGs.value[selectedCGOption.value].value !== '';
});

const selectedCGKey = computed(() => {
    if (availableCGs.value.length > 0 &&
        selectedCGOption.value < availableCGs.value.length &&
        availableCGs.value[selectedCGOption.value].value !== '') {
        return availableCGs.value[selectedCGOption.value].value;
    }
    return '';
});

// 获取CG文件名（不包含路径）
const selectedCGName = computed(() => {
    if (selectedCGKey.value) {
        // 从路径中提取文件名
        const pathParts = selectedCGKey.value.split(/[\\\/]/);
        return pathParts[pathParts.length - 1];
    }
    return '未选择CG';
});

// 滤镜管理方法
const addFilter = (type: FilterType) => {
    const newFilter: FilterItem = {
        id: `${type}_${Date.now()}`,
        type,
        value: filterConfigs[type].default
    };
    activeFilters.value.push(newFilter);
    showFilterSelector.value = false;
    updateCG();
};

const selectFilter = (type: FilterType) => {
    addFilter(type);
};

const removeFilter = (index: number) => {
    activeFilters.value.splice(index, 1);
    updateCG();
};

const handleFilterChange = (index: number, value: number) => {
    activeFilters.value[index].value = value;
    updateCG();
};

const handleZIndexChange = (value: number) => {
    zIndexValue.value = value;
    updateCG();
};

const handleAlphaChange = (value: number) => {
    alphaValue.value = value;
    updateCG();
};

// 更新CG显示
const updateCG = () => {
    if (!isCGActive.value || !selectedCGKey.value) return;

    const canvasManager = CanvasManager.getInstance();
    const filtersArray = activeFilters.value.map(filter => ({
        type: filter.type,
        value: filter.value
    }));

    canvasManager.setCG(selectedCGKey.value, zIndexValue.value, alphaValue.value, filtersArray);
};

// 主要的action执行函数
const targetAction = () => {
    const mode = CGOperaMode.value[selectedOption.value].value;
    const canvasManager = CanvasManager.getInstance();
    
    if (mode === 'show') {
        if (selectedCGKey.value) {
            isCGActive.value = true;
            updateCG();
        }
    } else if (mode === 'hide') {
        isCGActive.value = false;
        canvasManager.removeCG();
    }
};

// 预览功能
const previewCG = () => {
    if (!canPreview.value) return;
    
    if (isCGActive.value) {
        // 隐藏预览
        const canvasManager = CanvasManager.getInstance();
        canvasManager.removeCG();
        isCGActive.value = false;
    } else {
        // 显示预览
        isCGActive.value = true;
        updateCG();
    }
};

const previewHide = () => {
    const canvasManager = CanvasManager.getInstance();
    canvasManager.removeCG();
    isCGActive.value = false;
};

const clearAllFilters = () => {
    activeFilters.value = [];
    updateCG();
};

// 序列化方法
const serialization = () => {
    return {
        cg: {
            operationMode: CGOperaMode.value[selectedOption.value].value,
            selectedCG: selectedCGKey.value,
            zIndex: zIndexValue.value,
            alpha: alphaValue.value,
            hideFadeOut: {
                enabled: enableHideFadeOut.value,
                duration: hideFadeOutDuration.value
            },
            filters: {
                enabled: enableFilters.value,
                activeFilters: activeFilters.value
            }
        }
    };
};

// 反序列化方法
const deserialization = (actionItem: ActionItems) => {
    const actionData = actionItem.actionData;
    if (!actionData || !actionData.cg) {
        return;
    }

    const cgData = actionData.cg;

    // 恢复操作模式
    const modeIndex = CGOperaMode.value.findIndex(mode => mode.value === cgData.operationMode);
    if (modeIndex !== -1) {
        selectedOption.value = modeIndex;
    }

    // 恢复选中的CG
    if (cgData.selectedCG) {
        const cgIndex = availableCGs.value.findIndex(cg => cg.value === cgData.selectedCG);
        if (cgIndex !== -1) {
            selectedCGOption.value = cgIndex;
        }
    }

    // 恢复CG属性
    if (cgData.zIndex !== undefined) {
        zIndexValue.value = cgData.zIndex;
    }
    if (cgData.alpha !== undefined) {
        alphaValue.value = cgData.alpha;
    }

    // 恢复淡出设置
    if (cgData.hideFadeOut) {
        enableHideFadeOut.value = cgData.hideFadeOut.enabled;
        hideFadeOutDuration.value = cgData.hideFadeOut.duration;
    }

    // 恢复滤镜设置
    if (cgData.filters) {
        enableFilters.value = cgData.filters.enabled;
        if (cgData.filters.activeFilters) {
            activeFilters.value = cgData.filters.activeFilters;
        }
    }

    // 如果是显示模式且有CG，则激活CG
    if (cgData.operationMode === 'show' && cgData.selectedCG) {
        isCGActive.value = true;
    }
};

const selectCG = () => {
    selectImageType().then(res => {
        console.log("选择的CG图片：", res.path);

        if (res.path == selectedCGKey.value) {
            return;
        }

        const texture = ResourceManager.getResource<Texture>(res.path, ResType.Image);

        if (!texture) {
            console.warn("加载的纹理对象不存在");
            return;
        }

        // 更新选中的CG
        const cgIndex = availableCGs.value.findIndex(cg => cg.value === res.path);
        if (cgIndex !== -1) {
            selectedCGOption.value = cgIndex;
        } else {
            // 如果选择的CG不在列表中，更新CG列表
            updateCGList();
            const newCgIndex = availableCGs.value.findIndex(cg => cg.value === res.path);
            if (newCgIndex !== -1) {
                selectedCGOption.value = newCgIndex;
            }
        }

        // 如果当前是显示模式，更新CG显示
        if (CGOperaMode.value[selectedOption.value].value === 'show') {
            updateCG();
        }
    });
};

const onSelectModel = () => {
    // 切换模式时隐藏预览
    previewHide();
};

const onSelectCG = () => {
    // 切换CG时隐藏预览
    previewHide();
};

// 定时器引用
let cgListTimer: number | null = null;

onMounted(() => {
    // 注册action回调
    actionItem.action = targetAction;

    // 设置序列化和反序列化方法
    actionItem.serialize = serialization;

    // 初始化CG列表
    updateCGList();

    // 定时更新CG列表
    cgListTimer = window.setInterval(updateCGList, 1000);

    // 反序列化现有数据
    if (actionItem.actionData) {
        deserialization(actionItem.actionData);
    }

    // 如果是显示模式且CG处于激活状态，则更新显示
    if (isCGActive.value) {
        updateCG();
    }
});

onUnmounted(() => {
    // 清理定时器
    if (cgListTimer !== null) {
        clearInterval(cgListTimer);
        cgListTimer = null;
    }
    
    // 清理CG显示
    previewHide();
});
</script>

<style scoped>




.operation-info {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background: var(--secondary-bg);
    border-radius: var(--border-radius);
    color: var(--sec-text-color);
    font-style: italic;
}

.preview-controls {
    display: flex;
    gap: 8px;
}

.preview-btn {
    background: var(--button-bg);
    color: var(--text-color);
    border: none;
    border-radius: var(--border-radius);
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
}

.preview-btn:hover:not(:disabled) {
    background: var(--button-hover-bg);
}

.preview-btn:disabled {
    background: var(--secondary-bg);
    color: var(--placeholder-color);
    cursor: not-allowed;
}

.filters-section {
    background: var(--secondary-bg);
    border-radius: var(--border-radius);
    padding: 12px;
    margin: 10px 0;
}

.filters-header {
    font-weight: bold;
    margin-bottom: 10px;
    color: var(--text-color);
}

.filter-item {
    background-color: var(--high-hover-bg);
    border-radius: var(--border-radius);
    padding: 10px;
    margin-bottom: 8px;
    /* border: 1px solid var(--deep-border-color); */
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.remove-filter-btn {
    background: var(--danger-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: background-color 0.2s;
}

.remove-filter-btn:hover {
    background: var(--danger-hover-color);
}

.add-filter-section {
    margin: 10px 0;
}

.add-filter-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    width: 100%;
}

.add-filter-btn:hover {
    background: var(--accent-hover-color);
}

.filter-selector {
    background: var(--secondary-bg);
    border: 1px solid var(--main-border-color);
    border-radius: var(--border-radius);
    padding: 12px;
    margin: 10px 0;
}

.filter-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-weight: bold;
    color: var(--text-color);
}

.close-selector-btn {
    background: var(--danger-color);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: background-color 0.2s;
}

.close-selector-btn:hover {
    background: var(--danger-hover-color);
}

.filter-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
}

.filter-option-btn {
    background: var(--secondary-bg);
    color: var(--text-color);
    border: 1px solid var(--deep-border-color);
    border-radius: var(--border-radius);
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.filter-option-btn:hover {
    background: var(--high-hover-bg);
    border-color: var(--accent-color);
}

.select-cg {
    position: relative;
    border-radius: 5px;
    display: flex;

    padding: 5px 0;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: var(--secondary-bg);
}

.select-cg:hover .cg-tool {
    opacity: 1;
    transform: translateY(0px);
}

.select-cg img {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.cg-tool {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
    opacity: 0;
    position: absolute;
    bottom: 0;
    height: 30px;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(30px);

    backdrop-filter: blur(5px);
    transition: all .1s ease-in-out;
}
</style>