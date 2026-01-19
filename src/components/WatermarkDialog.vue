<template>
  <div v-if="showDialog" class="update-dialog-overlay" @click.self="emitClose">
    <div class="update-dialog">
      <div class="dialog-header">
        <h3>水印设置</h3>
        <button class="close-btn" @click="emitClose">×</button>
      </div>

      <div class="dialog-content">
        <div class="wm-form">
          <div class="wm-row">
            <span>启用水印</span>
            <ToggleSwitch v-model="form.enabled" />
          </div>

          <div class="wm-row">
            <span>水印文本</span>
            <input type="text" v-model="form.text" placeholder="请输入水印内容" class="wm-input" />
          </div>

          <div class="wm-row">
            <span>字体大小(px)</span>
            <input type="number" v-model.number="form.fontSize" min="10" max="120" class="wm-input" />
          </div>

          <div class="wm-row">
            <span>颜色</span>
            <!-- <ColorPicker v-model="colorNumber" /> -->
            <input type="text" v-model="form.color" placeholder="请输入颜色" class="wm-input" />
          </div>

          <div class="wm-row">
            <FilterSlider style="" label="透明度" v-model="form.opacity" :min="0" :max="1" :step="0.05" :precision="2" />
          </div>

          <div class="wm-row">
            <FilterSlider style="width: 100%;" label="倾斜角度(°)" v-model="form.angle" :min="-90" :max="90" :step="1"
              :precision="0" />
          </div>

          <div class="wm-row">
            <span>显示位置</span>
            <Dropdown v-model="placementIndex" :options="placementOptions" :disabled="false" />
          </div>

          <!-- 仅平铺模式下展示间距设置 -->
          <template v-if="form.placement === 'tiled'">
            <div class="wm-row">
              <FilterSlider style="width: 100%;" label="水平间距(px)" v-model="form.spacingX" :min="40" :max="600"
                :step="10" :precision="0" />
            </div>
            <div class="wm-row">
              <FilterSlider style="width: 100%;" label="垂直间距(px)" v-model="form.spacingY" :min="40" :max="600"
                :step="10" :precision="0" />
            </div>
          </template>

          <!-- 四角模式下的偏移设置 -->
          <template v-else>
            <div class="wm-row">
              <FilterSlider style="width: 100%;" label="水平偏移(px)" v-model="form.offsetX" :min="-200" :max="200"
                :step="5" :precision="0" />
            </div>
            <div class="wm-row">
              <FilterSlider style="width: 100%;" label="垂直偏移(px)" v-model="form.offsetY" :min="-200" :max="200"
                :step="5" :precision="0" />
            </div>
          </template>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="emitClose">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, computed } from 'vue';
import { useWatermarkStore, type WatermarkSettings } from '../stores/watermark-store';
import ToggleSwitch from './common/ToggleSwitch.vue';
import ColorPicker from './common/ColorPicker.vue';
import FilterSlider from './common/FilterSlider.vue';
import Dropdown from './common/Dropdown.vue';
import type { DropdownOption } from '../types/app';

const props = defineProps<{ showDialog: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const wm = useWatermarkStore();
wm.initialize();

const form = reactive<WatermarkSettings>({
  enabled: wm.settings.enabled,
  text: wm.settings.text,
  fontSize: wm.settings.fontSize,
  color: wm.settings.color,
  opacity: wm.settings.opacity,
  angle: wm.settings.angle,
  spacingX: wm.settings.spacingX,
  spacingY: wm.settings.spacingY,
  offsetX: wm.settings.offsetX,
  offsetY: wm.settings.offsetY,
  placement: wm.settings.placement,
});

watchEffect(() => {
  // keep form in sync when store changes externally
  form.enabled = wm.settings.enabled;
  form.text = wm.settings.text;
  form.fontSize = wm.settings.fontSize;
  form.color = wm.settings.color;
  form.opacity = wm.settings.opacity;
  form.angle = wm.settings.angle;
  form.spacingX = wm.settings.spacingX;
  form.spacingY = wm.settings.spacingY;
  form.offsetX = wm.settings.offsetX;
  form.offsetY = wm.settings.offsetY;
  form.placement = wm.settings.placement;
});

const save = () => {
  wm.update({ ...form });
  emitClose();
};

const emitClose = () => emit('close');

// 颜色在 Store 中是字符串（HEX），ColorPicker 使用数值，做双向转换
const numberToHex = (num: number): string => '#' + num.toString(16).padStart(6, '0');
const hexToNumber = (hex: string): number => parseInt(hex.replace('#', ''), 16);

const colorNumber = computed<number>({
  get() { return hexToNumber(form.color); },
  set(v: number) { form.color = numberToHex(v); }
});

// 位置选择下拉
const placementOptions: DropdownOption[] = [
  { label: '平铺（全屏）', value: 'tiled' },
  { label: '左上角', value: 'top-left' },
  { label: '右上角', value: 'top-right' },
  { label: '左下角', value: 'bottom-left' },
  { label: '右下角', value: 'bottom-right' },
];

const placementIndex = computed<number>({
  get() {
    const idx = placementOptions.findIndex(o => o.value === form.placement);
    return idx === -1 ? 0 : idx;
  },
  set(i: number) {
    const opt = placementOptions[i] || placementOptions[0];
    form.placement = opt.value as WatermarkSettings['placement'];
  }
});
</script>
<style scoped>
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.update-dialog {
  background: var(--secondary-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid var(--high-hover-bg);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.7;
}

.close-btn:hover {
  background: var(--high-hover-bg);
  opacity: 1;
}

.dialog-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--text-color);
}

.btn-primary:hover {
  background: var(--button-hover-bg);
}

.btn-secondary {
  background: var(--high-bg);
  color: var(--text-color);
  border: 1px solid var(--high-hover-bg);
}

.btn-secondary:hover {
  background: var(--high-hover-bg);
}

.wm-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.wm-row {
  display: flex;
  flex: 1;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wm-input {
  flex: 0 0 200px;
  padding: 6px 10px;
  border: 1px solid var(--high-hover-bg);
  border-radius: 6px;
  background: var(--primary-bg);
  color: var(--text-color);
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.dialog-content::-webkit-scrollbar-thumb {
  background: var(--high-hover-bg);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: var(--high-bg);
}

.filter-slider {
  width: 100%;
  background-color: var(--high-bg);
  padding: 4px;
  border-radius: 5px;
}
</style>
