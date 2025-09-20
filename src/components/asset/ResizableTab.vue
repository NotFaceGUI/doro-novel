<template>
  <div class="tab-content" ref="tabContent" :style="{ width: tabContentWidth + 'px' }">
    <div class="tab-title">
      <span style="opacity: 0.4">{{ title }}</span>
    </div>
    <slot></slot>
    <div class="resizer" @mousedown="initResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";

// 定义传入的属性，可设置默认宽度、最小宽度、最大宽度
const props = defineProps<{
  title: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}>();

// 如有需要可以向父组件传递当前宽度更新（例如双向绑定）
const emit = defineEmits<{
  (e: "update:width", width: number): void;
}>();

// 使用默认值
const DEFAULT_WIDTH = props.defaultWidth || 300;
const MIN_WIDTH = props.minWidth || 200;
const MAX_WIDTH = props.maxWidth || 800;

const tabContentWidth = ref<number>(DEFAULT_WIDTH);

// 记录初始位置和宽度
let startX = 0;
let startWidth = 0;

const initResize = (event: MouseEvent) => {
  startX = event.clientX;
  startWidth = tabContentWidth.value;
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
};

const resize = (event: MouseEvent) => {
  const newWidth = startWidth + (event.clientX - startX);
  tabContentWidth.value = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);

  // 可通过事件向父组件同步宽度
  emit("update:width", tabContentWidth.value);
};

const stopResize = () => {
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);

  // 发送resize时间去修改preview的视口
  window.dispatchEvent(new Event('resize'));

};

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);
});
</script>

<style scoped>
.tab-content {
  border: 1px solid transparent;
  border-right: 1px solid var(--deep-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: auto;
}


.resizer {
  width: 1px;
  cursor: ew-resize;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: var(--deep-border-color);
  transition: all 0.3s ease-in-out;
}

.resizer:active,
.resizer:hover {
  width: 5px;
  background: var(--high-hover-bg);
}

/* .tab-content:active {
  border: 1px solid #CFBD19;
} */
</style>
