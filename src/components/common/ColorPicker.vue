<template>
    <div class="color-picker" ref="colorPickerRef">
        <div class="color-display" @click="togglePicker" :style="{ backgroundColor: displayColor }">
            <!-- <span class="color-text">{{ displayColor }}</span> -->
        </div>
        
        <Teleport to="body">
            <div v-if="showPicker" class="color-picker-panel" @click.stop :style="panelStyle">
                <div class="color-picker-header">
                    <span>颜色选择器</span>
                    <button class="close-btn" @click="closePicker">×</button>
                </div>
                
                <div class="color-picker-content">
                    <!-- 主要拾色区域 -->
                    <div class="color-picker-main">
                        <!-- 饱和度亮度区域 -->
                        <div class="saturation-lightness-area" 
                             ref="saturationLightnessRef"
                             @mousedown="startSaturationLightnessDrag"
                             :style="{ backgroundColor: hueColor }">
                            <div class="saturation-overlay"></div>
                            <div class="lightness-overlay"></div>
                            <div class="sl-cursor" 
                                 :style="{ 
                                     left: saturation * 100 + '%', 
                                     top: (1 - lightness) * 100 + '%' 
                                 }"></div>
                        </div>
                        
                        <!-- 色相条 -->
                        <div class="hue-bar" 
                             ref="hueBarRef"
                             @mousedown="startHueDrag">
                            <div class="hue-cursor" 
                                 :style="{ left: (hue / 360) * 100 + '%' }"></div>
                        </div>
                        
                        <!-- 透明度条 -->
                        <div class="alpha-bar" 
                             ref="alphaBarRef"
                             @mousedown="startAlphaDrag">
                            <div class="alpha-background"></div>
                            <div class="alpha-overlay" 
                                 :style="{ background: `linear-gradient(to right, transparent, ${hslColor})` }"></div>
                            <div class="alpha-cursor" 
                                 :style="{ left: alpha * 100 + '%' }"></div>
                        </div>
                    </div>
                    
                    <!-- 预设颜色 -->
                    <!-- <div class="preset-colors">
                        <div class="preset-colors-title">预设颜色</div>
                        <div class="preset-colors-grid">
                            <div 
                                v-for="color in presetColors" 
                                :key="color"
                                class="preset-color-item"
                                :class="{ active: selectedColor === color }"
                                :style="{ backgroundColor: color }"
                                @click="selectPresetColor(color)"
                            ></div>
                        </div>
                    </div> -->
                    
                    <!-- 颜色信息和输入 -->
                    <div class="color-info">
                        <div class="color-preview" :style="{ backgroundColor: currentColor }"></div>
                        <div class="color-inputs">
                            <div class="input-group">
                                <label>HEX:</label>
                                <input 
                                    type="text" 
                                    v-model="hexInput" 
                                    @input="onHexInput"
                                    @blur="validateHexInput"
                                    class="hex-input"
                                />
                            </div>
                            <div class="rgb-inputs">
                                <div class="input-group">
                                    <label>R:</label>
                                    <input 
                                        type="number" 
                                        v-model.number="rgbInput.r" 
                                        @input="onRgbInput"
                                        min="0" 
                                        max="255"
                                        class="rgb-input"
                                    />
                                </div>
                                <div class="input-group">
                                    <label>G:</label>
                                    <input 
                                        type="number" 
                                        v-model.number="rgbInput.g" 
                                        @input="onRgbInput"
                                        min="0" 
                                        max="255"
                                        class="rgb-input"
                                    />
                                </div>
                                <div class="input-group">
                                    <label>B:</label>
                                    <input 
                                        type="number" 
                                        v-model.number="rgbInput.b" 
                                        @input="onRgbInput"
                                        min="0" 
                                        max="255"
                                        class="rgb-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 确认按钮 -->
                    <div class="color-picker-actions">
                        <button class="confirm-btn" @click="confirmColor">确认</button>
                        <button class="cancel-btn" @click="closePicker">取消</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';

interface Props {
    modelValue: number;
}

interface Emits {
    (e: 'update:modelValue', value: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 组件引用
const colorPickerRef = ref<HTMLElement>();
const saturationLightnessRef = ref<HTMLElement>();
const hueBarRef = ref<HTMLElement>();
const alphaBarRef = ref<HTMLElement>();

// 状态
const showPicker = ref(false);
const panelStyle = ref({});

// HSV 颜色值
const hue = ref(0);
const saturation = ref(1);
const lightness = ref(0.5);
const alpha = ref(1);

// 输入框值
const hexInput = ref('#ff0000');
const rgbInput = ref({ r: 255, g: 0, b: 0 });
const selectedColor = ref('#ff0000');

// 拖拽状态
const isDragging = ref(false);
const dragType = ref<'sl' | 'hue' | 'alpha' | null>(null);

// 预设颜色
const presetColors = [
    '#faaaaa', '#3399ff', '#ff6b6b', '#4ecdc4', 
    '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd',
    '#f39c12', '#e74c3c', '#9b59b6', '#2ecc71',
    '#34495e', '#95a5a6', '#ecf0f1', '#ffffff'
];

// 计算属性
const hueColor = computed(() => {
    return `hsl(${hue.value}, 100%, 50%)`;
});

const hslColor = computed(() => {
    return `hsl(${hue.value}, ${saturation.value * 100}%, ${lightness.value * 100}%)`;
});

const currentColor = computed(() => {
    const rgb = hslToRgb(hue.value, saturation.value, lightness.value);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.value})`;
});

const displayColor = computed(() => {
    return numberToHex(props.modelValue);
});

// HSL 到 RGB 转换
function hslToRgb(h: number, s: number, l: number) {
    h = h / 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1/6) {
        r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
        r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
        r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
        r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
        r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
        r = c; g = 0; b = x;
    }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

// RGB 到 HSL 转换
function rgbToHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = diff === 0 ? 0 : diff / (1 - Math.abs(max + min - 1));
    const l = (max + min) / 2;
    
    if (diff !== 0) {
        if (max === r) {
            h = ((g - b) / diff) % 6;
        } else if (max === g) {
            h = (b - r) / diff + 2;
        } else {
            h = (r - g) / diff + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }
    
    return { h, s, l };
}

// 数字转十六进制
function numberToHex(num: number): string {
    return '#' + num.toString(16).padStart(6, '0');
}

// 十六进制转数字
function hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
}

// 十六进制转RGB
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// RGB转十六进制
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// 更新所有颜色值
function updateAllValues() {
    const rgb = hslToRgb(hue.value, saturation.value, lightness.value);
    rgbInput.value = rgb;
    hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b);
    selectedColor.value = hexInput.value;
}

// 从RGB更新HSL
function updateFromRgb(r: number, g: number, b: number) {
    const hsl = rgbToHsl(r, g, b);
    hue.value = hsl.h;
    saturation.value = hsl.s;
    lightness.value = hsl.l;
    updateAllValues();
}

// 切换拾色器显示
function togglePicker() {
    showPicker.value = !showPicker.value;
    if (showPicker.value) {
        nextTick(() => {
            updatePanelPosition();
            window.addEventListener('scroll', updatePanelPosition, true);
            window.addEventListener('resize', updatePanelPosition);
        });
    } else {
        removePositionListeners();
    }
}

// 关闭拾色器
function closePicker() {
    showPicker.value = false;
    removePositionListeners();
}

// 移除位置监听器
function removePositionListeners() {
    window.removeEventListener('scroll', updatePanelPosition, true);
    window.removeEventListener('resize', updatePanelPosition);
}

// 更新面板位置
function updatePanelPosition() {
    if (!colorPickerRef.value) return;
    
    const rect = colorPickerRef.value.getBoundingClientRect();
    
    // 动态计算面板宽度
    const getPanelWidth = () => {
        const baseWidth = 320;
        const viewportWidth = window.innerWidth;
        const maxWidth = Math.min(baseWidth, viewportWidth - 40);
        return Math.max(280, maxWidth); // 最小宽度280px
    };
    
    const panelWidth = getPanelWidth();
    
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 2;
    
    // 检查右边界
    if (left + panelWidth > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - panelWidth - 10;
    }
    
    // 检查左边界
    if (left < window.scrollX + 10) {
        left = window.scrollX + 10;
    }
    
    // 先设置基本位置和宽度，让面板渲染以获取实际高度
    panelStyle.value = {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(panelWidth, rect.width)}px`,
        zIndex: 1000
    };
    
    // 在下一个tick中检查高度并调整位置
    nextTick(() => {
        const panel = document.querySelector('.color-picker-panel') as HTMLElement;
        if (panel) {
            const panelHeight = panel.offsetHeight;
            
            // 检查下边界，如果超出则调整到上方
            if (top + panelHeight > window.innerHeight + window.scrollY) {
                const newTop = rect.top + window.scrollY - panelHeight - 2;
                // 检查上边界
                const finalTop = Math.max(newTop, window.scrollY + 10);
                
                panelStyle.value = {
                    ...panelStyle.value,
                    top: `${finalTop}px`
                };
            }
        }
    });
}

// 饱和度亮度拖拽
function startSaturationLightnessDrag(event: MouseEvent) {
    isDragging.value = true;
    dragType.value = 'sl';
    updateSaturationLightness(event);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function updateSaturationLightness(event: MouseEvent) {
    if (!saturationLightnessRef.value) return;
    
    const rect = saturationLightnessRef.value.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    
    saturation.value = x;
    lightness.value = 1 - y;
    updateAllValues();
}

// 色相拖拽
function startHueDrag(event: MouseEvent) {
    isDragging.value = true;
    dragType.value = 'hue';
    updateHue(event);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function updateHue(event: MouseEvent) {
    if (!hueBarRef.value) return;
    
    const rect = hueBarRef.value.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    
    hue.value = x * 360;
    updateAllValues();
}

// 透明度拖拽
function startAlphaDrag(event: MouseEvent) {
    isDragging.value = true;
    dragType.value = 'alpha';
    updateAlpha(event);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function updateAlpha(event: MouseEvent) {
    if (!alphaBarRef.value) return;
    
    const rect = alphaBarRef.value.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    
    alpha.value = x;
}

// 鼠标移动处理
function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value) return;
    
    switch (dragType.value) {
        case 'sl':
            updateSaturationLightness(event);
            break;
        case 'hue':
            updateHue(event);
            break;
        case 'alpha':
            updateAlpha(event);
            break;
    }
}

// 鼠标释放处理
function handleMouseUp() {
    isDragging.value = false;
    dragType.value = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

// 选择预设颜色
function selectPresetColor(color: string) {
    const rgb = hexToRgb(color);
    updateFromRgb(rgb.r, rgb.g, rgb.b);
}

// 处理十六进制输入
function onHexInput() {
    const hex = hexInput.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const rgb = hexToRgb(hex);
        updateFromRgb(rgb.r, rgb.g, rgb.b);
    }
}

// 验证十六进制输入
function validateHexInput() {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
        hexInput.value = selectedColor.value;
    }
}

// 处理RGB输入
function onRgbInput() {
    const { r, g, b } = rgbInput.value;
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        updateFromRgb(r, g, b);
    }
}

// 确认颜色选择
function confirmColor() {
    const rgb = hslToRgb(hue.value, saturation.value, lightness.value);
    const colorNumber = hexToNumber(rgbToHex(rgb.r, rgb.g, rgb.b));
    emit('update:modelValue', colorNumber);
    closePicker();
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.color-picker') && !target.closest('.color-picker-panel')) {
        closePicker();
    }
}

// 监听props变化
watch(() => props.modelValue, (newValue) => {
    const hex = numberToHex(newValue);
    const rgb = hexToRgb(hex);
    updateFromRgb(rgb.r, rgb.g, rgb.b);
}, { immediate: true });

// 监听显示状态
watch(showPicker, (show) => {
    if (show) {
        document.addEventListener('click', handleClickOutside);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }
});

// 组件卸载时清理事件
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    removePositionListeners();
});
</script>

<style scoped>
.color-picker {
    position: relative;
    display: inline-block;
}

.color-display {
    width: 5px;
    height: 25px;
    /* border: 1px solid var(--border-color); */
    /* border-radius: var(--border-radius); */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background-color: var(--input-bg);
    transition: all 0.2s ease-in-out;
    position: relative;
}

.color-display:hover {
    border-color: var(--button-bg);
    width: 30px;
    box-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
}

.color-display:hover::after{
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
}

.color-text {
    font-size: 10px;
    color: var(--text-color);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    font-weight: bold;
}

.color-picker-panel {
    background: var(--secondary-bg);
    border: 1px solid var(--main-border-color);
    border-radius: var(--border-radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 280px;
    max-width: 100vw;
    max-height: calc(100vh - 40px);
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.color-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid var(--main-border-color);
    background: var(--high-bg);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.color-picker-header span {
    color: var(--text-color);
    font-weight: bold;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-color);
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
}

.close-btn:hover {
    background-color: var(--high-hover-bg);
}

.color-picker-content {
    padding: 15px;
    flex: 1;
    overflow-y: auto;
}

.color-picker-main {
    margin-bottom: 15px;
}

.saturation-lightness-area {
    position: relative;
    width: 100%;
    height: 150px;
    border-radius: 4px;
    cursor: crosshair;
    margin-bottom: 10px;
    overflow: hidden;
}

.saturation-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, white, transparent);
}

.lightness-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent, black);
}

.sl-cursor {
    position: absolute;
    width: 12px;
    height: 12px;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
    pointer-events: none;
}

.hue-bar {
    position: relative;
    width: 100%;
    height: 20px;
    background: linear-gradient(to right, 
        #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, 
        #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%);
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
}

.hue-cursor {
    position: absolute;
    top: -2px;
    width: 4px;
    height: 24px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 2px;
    transform: translateX(-50%);
    pointer-events: none;
}

.alpha-bar {
    position: relative;
    width: 100%;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
}

.alpha-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        linear-gradient(45deg, #ccc 25%, transparent 25%), 
        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #ccc 75%), 
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.alpha-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.alpha-cursor {
    position: absolute;
    top: -2px;
    width: 4px;
    height: 24px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 2px;
    transform: translateX(-50%);
    pointer-events: none;
}

.preset-colors {
    margin-bottom: 15px;
}

.preset-colors-title {
    font-size: 12px;
    color: var(--text-color);
    margin-bottom: 8px;
}

.preset-colors-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
}

.preset-color-item {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
}

.preset-color-item:hover {
    transform: scale(1.1);
    border-color: var(--button-bg);
}

.preset-color-item.active {
    border-color: var(--button-bg);
    box-shadow: 0 0 5px rgba(255, 153, 0, 0.5);
}

.color-info {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.color-preview {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    flex-shrink: 0;
}

.color-inputs {
    flex: 1;
}

.input-group {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.input-group label {
    font-size: 12px;
    color: var(--text-color);
}

.hex-input {
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 6px;
    color: var(--text-color);
    font-size: 12px;
    width: 80px;
}

.rgb-inputs {
    display: flex;
    gap: 5px;
}

.rgb-input {
    background-color: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 6px;
    color: var(--text-color);
    font-size: 12px;
    width: 50px;
}

.hex-input:focus,
.rgb-input:focus {
    outline: none;
    border-color: var(--button-bg);
    background-color: var(--high-hover-bg);
}

.color-picker-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.confirm-btn,
.cancel-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white !important;
    font-size: 12px;
    transition: all 0.2s ease;
}

.confirm-btn {
    background-color: var(--button-bg);
    color: var(--text-color);
}

.confirm-btn:hover {
    background-color: var(--button-hover-bg);
}

.cancel-btn {
    background-color: var(--high-hover-bg);
    color: var(--text-color);
}

.cancel-btn:hover {
    background-color: var(--high-bg);
}
</style>