<template>
  <div class="slot-control" :class="{ 'expanded': isExpanded }">
    <div class="slot-control-header" @click="toggleExpanded">
      <span class="header-title">部位控制</span>
      <svg 
        class="expand-icon" 
        :class="{ 'rotated': isExpanded }"
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none"
      >
        <path 
          d="M4 6L8 10L12 6" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        />
      </svg>
    </div>
    
    <div class="slot-control-content" v-if="isExpanded">
      <div class="slot-list">
        <div 
          v-for="slot in slots" 
          :key="slot.name"
          class="slot-item"
          :class="{ 'disabled': !slot.visible }"
        >
          <label class="slot-label">
            <input 
              type="checkbox" 
              :checked="slot.visible"
              @change="toggleSlot(slot.name, ($event.target as HTMLInputElement)?.checked ?? false)"
              class="slot-checkbox"
            />
            <span class="checkbox-custom"></span>
            <span class="slot-name">{{ formatSlotName(slot.name) }}</span>
          </label>
          
          <!-- 透明度控制 -->
          <div class="opacity-control" v-if="slot.visible">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              :value="slot.alpha"
              @input="updateSlotAlpha(slot.name, parseFloat(($event.target as HTMLInputElement)?.value ?? '0'))"
              class="opacity-slider"
            />
            <span class="opacity-value">{{ Math.round(slot.alpha * 100) }}%</span>
          </div>
        </div>
      </div>
      
      <div class="control-buttons">
        <button @click="showAllSlots" class="control-btn show-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          全部显示
        </button>
        <button @click="hideAllSlots" class="control-btn hide-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
          </svg>
          全部隐藏
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface SlotData {
  name: string;
  visible: boolean;
  alpha: number;
}

interface Props {
  slots: SlotData[];
}

interface Emits {
  (e: 'toggle-slot', slotName: string, visible: boolean): void;
  (e: 'update-alpha', slotName: string, alpha: number): void;
  (e: 'show-all'): void;
  (e: 'hide-all'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isExpanded = ref(false);

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const toggleSlot = (slotName: string, visible: boolean) => {
  emit('toggle-slot', slotName, visible);
};

const updateSlotAlpha = (slotName: string, alpha: number) => {
  emit('update-alpha', slotName, alpha);
};

const showAllSlots = () => {
  emit('show-all');
};

const hideAllSlots = () => {
  emit('hide-all');
};

// 格式化插槽名称，让其更易读
const formatSlotName = (name: string) => {
  // 移除常见的前缀和后缀
  let formatted = name.replace(/^(slot_|bone_|attachment_)/, '');
  
  // 将下划线替换为空格，并首字母大写
  formatted = formatted.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // 如果名称太长，截断并添加省略号
  if (formatted.length > 15) {
    formatted = formatted.substring(0, 12) + '...';
  }
  
  return formatted || name; // 如果格式化后为空，返回原名称
};
</script>

<style scoped>
.slot-control {
  position: absolute;
  top: 130px;
  right: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 200px;
  max-width: 280px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.slot-control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.expand-icon {
  color: #ccc;
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.slot-control-content {
  max-height: 400px;
  overflow-y: auto;
}

.slot-list {
  padding: 8px;
}

.slot-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.slot-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.slot-item.disabled {
  opacity: 0.6;
}

.slot-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 6px;
}

.slot-checkbox {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #666;
  border-radius: 3px;
  margin-right: 8px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.slot-checkbox:checked + .checkbox-custom {
  background: #4CAF50;
  border-color: #4CAF50;
}

.slot-checkbox:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.slot-name {
  color: white;
  font-size: 13px;
  flex: 1;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.opacity-slider {
  flex: 1;
  height: 4px;
  background: #333;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
}

.opacity-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #4CAF50;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.opacity-value {
  color: #ccc;
  font-size: 11px;
  min-width: 35px;
  text-align: right;
}

.control-buttons {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-all {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.show-all:hover {
  background: rgba(76, 175, 80, 0.3);
}

.hide-all {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.hide-all:hover {
  background: rgba(244, 67, 54, 0.3);
}

/* 滚动条样式 */
.slot-control-content::-webkit-scrollbar {
  width: 6px;
}

.slot-control-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.slot-control-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.slot-control-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .slot-control {
    top: 110px;
    right: 5px;
    min-width: 180px;
    max-width: 220px;
  }
  
  .slot-control-header {
    padding: 10px 12px;
  }
  
  .header-title {
    font-size: 13px;
  }
  
  .slot-name {
    font-size: 12px;
  }
}

* {
  transition: all 0.3s ease;
}
</style>