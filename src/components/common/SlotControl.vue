<template>
  <div class="slot-control" :class="{ 'expanded': isExpanded }">
    <div class="slot-control-header" @click="toggleExpanded">
      <div class="header-main">
        <span class="header-title">{{ t('slotControl.title') }}</span>
        <span class="header-count">{{ filteredSlots.length }}/{{ slots.length }}</span>
      </div>
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
      <div class="slot-search">
        <input
          v-model="searchKeyword"
          class="slot-search-input"
          type="text"
          :placeholder="t('projectView.customizer.bulkSelectPlaceholder')"
        />
      </div>

      <div class="slot-list">
        <div v-if="filteredSlots.length === 0 && searchKeyword.trim()" class="slot-empty">
          {{ t('projectView.customizer.messages.noSlotMatched', { keyword: searchKeyword.trim() }) }}
        </div>
        <div 
          v-for="slot in filteredSlots" 
          :key="slot.name"
          class="slot-item"
          :class="{ 'disabled': !slot.visible, 'highlighted': slot.name === (hoveredSlot ?? props.activeHoveredSlot ?? null), 'selected': props.selectedSlots?.includes(slot.name) }"
          @mouseenter="handleSlotHover(slot.name)"
          @mouseleave="handleSlotLeave()"
          @click="selectSlot(slot.name, $event)"
        >
          <label class="slot-label">
            <input 
              type="checkbox" 
              :checked="slot.visible"
              @click.stop
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
              @click.stop
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
          {{ t('slotControl.showAll') }}
        </button>
        <button @click="hideAllSlots" class="control-btn hide-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ t('slotControl.hideAll') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface SlotData {
  name: string;
  visible: boolean;
  alpha: number;
  tint?: number;
}

interface Props {
  slots: SlotData[];
  activeHoveredSlot?: string | null;
  selectedSlots?: string[];
}

interface Emits {
  (e: 'toggle-slot', slotName: string, visible: boolean): void;
  (e: 'update-alpha', slotName: string, alpha: number): void;
  (e: 'show-all'): void;
  (e: 'hide-all'): void;
  (e: 'slot-hover', slotName: string): void;
  (e: 'slot-leave'): void;
  (e: 'select-slot', slotName: string, append: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const isExpanded = ref(false);
const hoveredSlot = ref<string | null>(null);
const searchKeyword = ref('');

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const handleSlotHover = (slotName: string) => {
  hoveredSlot.value = slotName;
  emit('slot-hover', slotName);
};

const handleSlotLeave = () => {
  hoveredSlot.value = null;
  emit('slot-leave');
};

const toggleSlot = (slotName: string, visible: boolean) => {
  emit('toggle-slot', slotName, visible);
};

const updateSlotAlpha = (slotName: string, alpha: number) => {
  emit('update-alpha', slotName, alpha);
};

const selectSlot = (slotName: string, event: MouseEvent) => {
  emit('select-slot', slotName, !!(event.ctrlKey || event.metaKey || event.shiftKey));
};

const showAllSlots = () => {
  emit('show-all');
};

const hideAllSlots = () => {
  emit('hide-all');
};

function formatSlotName(name: string) {
  // 移除常见的前缀和后缀
  let formatted = name.replace(/^(slot_|bone_|attachment_)/, '');
  
  // 将下划线替换为空格，并首字母大写
  formatted = formatted.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // 如果名称太长，截断并添加省略号
  if (formatted.length > 15) {
    formatted = formatted.substring(0, 12) + '...';
  }
  
  return formatted || name; // 如果格式化后为空，返回原名称
}

const filteredSlots = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return props.slots;
  }

  return props.slots.filter((slot) => {
    const rawName = slot.name.toLowerCase();
    const displayName = formatSlotName(slot.name).toLowerCase();
    return rawName.includes(keyword) || displayName.includes(keyword);
  });
});
</script>

<style scoped>
.slot-control {
  position: absolute;
  top: 10px;
  right: 270px;
  z-index: 10;
  width: min(240px, calc(100vw - 32px));
  min-width: 200px;
  max-width: 280px;
  background: var(--floating-panel-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 10px;
  transition: all 0.3s ease;
  border: 1px solid var(--floating-panel-border);
  box-shadow: var(--floating-panel-shadow);
}

.slot-control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--floating-panel-divider);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  color: var(--floating-panel-text);
  font-size: 14px;
  font-weight: 600;
}

.header-count {
  color: var(--floating-panel-muted-text);
  font-size: 11px;
  line-height: 1;
}

.expand-icon {
  color: var(--floating-panel-muted-text);
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.slot-control-content {
  max-height: 80vh;
  overflow-y: auto;
}

.slot-search {
  padding: 10px 12px 0;
}

.slot-search-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--floating-panel-input-border);
  border-radius: 6px;
  background: var(--floating-panel-input-bg);
  color: var(--floating-panel-text);
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.slot-search-input::placeholder {
  color: var(--floating-panel-muted-text);
}

.slot-search-input:focus {
  border-color: var(--floating-panel-input-border-focus);
  background: var(--floating-panel-input-bg-focus);
  box-shadow: 0 0 0 1px var(--floating-panel-divider);
}

.slot-list {
  padding: 10px 12px 12px;
}

.slot-empty {
  padding: 12px;
  border: 1px dashed var(--floating-panel-divider);
  border-radius: 8px;
  background: var(--floating-panel-subtle-bg);
  color: var(--floating-panel-muted-text);
  font-size: 12px;
  text-align: center;
}

.slot-item {
  margin-bottom: 8px;
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--floating-panel-subtle-bg);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.slot-item:hover {
  background: var(--floating-panel-subtle-hover-bg);
}

.slot-item.disabled {
  opacity: 0.62;
}

.slot-item.highlighted {
  background: var(--floating-panel-success-bg);
  border: 1px solid var(--floating-panel-success-border);
}

.slot-item.selected {
  background: var(--floating-panel-accent-bg);
  border: 1px solid var(--floating-panel-accent-border);
}

.slot-item.selected.highlighted {
  background: var(--floating-panel-accent-bg);
  border-color: var(--accent-color);
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
  border: 1px solid var(--floating-panel-input-border-focus);
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  background: var(--floating-panel-input-bg);
}

.slot-checkbox:checked + .checkbox-custom {
  background: var(--accent-color);
  border-color: var(--accent-color);
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
  color: var(--floating-panel-text);
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
  background: var(--floating-panel-divider);
  border-radius: 2px;
  outline: none;
  accent-color: var(--accent-color);
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
}

.opacity-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.opacity-value {
  color: var(--floating-panel-muted-text);
  font-size: 11px;
  min-width: 35px;
  text-align: right;
}

.control-buttons {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--floating-panel-divider);
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  color: var(--floating-panel-text);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.show-all {
  background: var(--floating-panel-accent-bg);
  border-color: var(--floating-panel-accent-border);
}

.show-all:hover {
  background: var(--floating-panel-subtle-hover-bg);
  transform: translateY(-1px);
}

.hide-all {
  background: var(--floating-panel-danger-bg);
  border-color: var(--floating-panel-danger-border);
  color: var(--floating-panel-danger-text);
}

.hide-all:hover {
  background: var(--floating-panel-subtle-hover-bg);
  transform: translateY(-1px);
}

/* 滚动条样式 */
.slot-control-content::-webkit-scrollbar {
  width: 6px;
}

.slot-control-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.slot-control-content::-webkit-scrollbar-thumb {
  background: var(--floating-panel-scrollbar);
  border-radius: 3px;
}

.slot-control-content::-webkit-scrollbar-thumb:hover {
  background: var(--floating-panel-scrollbar-hover);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .slot-control {
    top: 170px;
    right: 5px;
    width: min(220px, calc(100vw - 10px));
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
</style>
