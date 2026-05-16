<template>
  <div class="control-hint" :class="{ 'show': visible }">
    <div class="hint-item">
      <div class="mouse-icon">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <rect x="4" y="3" width="20" height="30" rx="10" stroke="currentColor" stroke-width="2"/>
          <path d="M14 4V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M14 5C10.5 5 8 7.4 8 11V16H14V5Z" fill="currentColor"/>
          <path d="M4 18H1.5M26.5 18H24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3.5 15.5L1.5 18L3.5 20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24.5 15.5L26.5 18L24.5 20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="hint-text">{{ t('controlHint.moveView') }}</span>
    </div>
    
    <div class="hint-item">
      <div class="mouse-icon">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
          <!-- 鼠标外框 -->
          <rect x="2" y="4" width="20" height="26" rx="10" stroke="currentColor" stroke-width="2" fill="none"/>
          <!-- 滚轮 -->
          <rect x="10" y="8" width="4" height="8" rx="2" fill="currentColor"/>
          <!-- 滚轮动画线条 -->
          <line x1="12" y1="12" x2="12" y2="14" stroke="currentColor" stroke-width="1" class="scroll-line">
            <animate attributeName="y1" values="10;14;10" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="12;16;12" dur="1.5s" repeatCount="indefinite"/>
          </line>
        </svg>
      </div>
      <span class="hint-text">{{ t('controlHint.zoomView') }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  autoHide?: boolean;
  hideDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoHide: true,
  hideDelay: 3000
});
const { t } = useI18n();

const visible = ref(true);
let hideTimer: number | null = null;
const handleInteraction = () => {
  showHint();
};

const startHideTimer = () => {
  if (props.autoHide) {
    hideTimer = window.setTimeout(() => {
      visible.value = false;
    }, props.hideDelay);
  }
};

const showHint = () => {
  visible.value = true;
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  startHideTimer();
};

onMounted(() => {
  startHideTimer();

  window.addEventListener('mousedown', handleInteraction);
  window.addEventListener('wheel', handleInteraction);
});

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }

  window.removeEventListener('mousedown', handleInteraction);
  window.removeEventListener('wheel', handleInteraction);
});
</script>

<style scoped>
.control-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 20px;
  color: white;
  font-size: 14px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
  pointer-events: none;
  user-select: none;
}

.control-hint.show {
  opacity: 1;
  transform: translateY(0);
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.hint-item:last-child {
  margin-bottom: 0;
}

.mouse-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #ccc;
}

.mouse-icon svg {
  animation: mouseFloat 2s ease-in-out infinite;
}

@keyframes mouseFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.hint-text {
  font-weight: 500;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-hint {
    bottom: 10px;
    left: 10px;
    padding: 12px 16px;
    font-size: 12px;
  }
  
  .mouse-icon {
    width: 28px;
    height: 28px;
  }
  
  .mouse-icon svg {
    width: 20px;
    height: 28px;
  }
}
</style>
