<template>
  <div class="control-hint" :class="{ 'show': visible }">
    <div class="hint-item">
      <div class="key-group">
        <div class="key">W</div>
        <div class="key">A</div>
        <div class="key">S</div>
        <div class="key">D</div>
      </div>
      <span class="hint-text">移动视角</span>
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
      <span class="hint-text">滚轮缩放</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  autoHide?: boolean;
  hideDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoHide: true,
  hideDelay: 3000
});

const visible = ref(true);
let hideTimer: number | null = null;

const startHideTimer = () => {
  if (props.autoHide) {
    hideTimer = setTimeout(() => {
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
  
  // 监听键盘和鼠标事件，重新显示提示
  const handleInteraction = () => {
    showHint();
  };
  
  window.addEventListener('keydown', handleInteraction);
  window.addEventListener('wheel', handleInteraction);
});

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  
  window.removeEventListener('keydown', () => {});
  window.removeEventListener('wheel', () => {});
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

.key-group {
  display: flex;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(145deg, #4a4a4a, #2a2a2a);
  border: 1px solid #666;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: keyPulse 2s ease-in-out infinite;
}

.key:nth-child(1) { animation-delay: 0s; }
.key:nth-child(2) { animation-delay: 0.2s; }
.key:nth-child(3) { animation-delay: 0.4s; }
.key:nth-child(4) { animation-delay: 0.6s; }

@keyframes keyPulse {
  0%, 80%, 100% {
    transform: scale(1);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  10% {
    transform: scale(0.95);
    box-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
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
  
  .key {
    width: 24px;
    height: 24px;
    font-size: 10px;
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