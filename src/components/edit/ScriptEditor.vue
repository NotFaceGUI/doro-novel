<template>
  <div class="script-editor">
    <div class="editor-container">
      <!-- 行号区域 -->
      <div class="line-numbers" ref="lineNumbersRef">
        <div 
          v-for="lineNumber in lineCount" 
          :key="lineNumber" 
          class="line-number"
        >
          {{ lineNumber }}
        </div>
      </div>
      
      <!-- 文本编辑区域 -->
      <textarea
        ref="textareaRef"
        v-model="content"
        class="script-textarea"
        :placeholder="placeholder"
        @scroll="syncScroll"
        @input="updateLineCount"
        @keydown="handleKeydown"
        spellcheck="false"
      ></textarea>
    </div>
    
    <!-- 底部状态栏 -->
    <div class="status-bar">
      <span class="status-info">行: {{ currentLine }} | 列: {{ currentColumn }} | 字符数: {{ content.length }}</span>
      <div class="actions">
        <!-- <button @click="copyAll" class="action-btn">复制全部</button>
        <button @click="clearAll" class="action-btn">清空</button> -->
      </div>
    </div> 
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: `在这里编写剧情脚本...

示例格式:
[场景] 教室 - 下午
背景: classroom_afternoon.jpg

[角色登场]
小明: 站在讲台前，表情紧张
小红: 坐在第一排，专心听讲

[对话]
小明: "今天我要给大家介绍一个有趣的项目..."
小红: "听起来很有意思呢！"

[音效]
铃声: school_bell.wav

[转场]
淡出到黑屏，持续2秒

[备注]
这里可以记录一些创作思路和想法
`
});

const emit = defineEmits<Emits>();

const textareaRef = ref<HTMLTextAreaElement>();
const lineNumbersRef = ref<HTMLDivElement>();

const content = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
});

const lineCount = ref(1);
const currentLine = ref(1);
const currentColumn = ref(1);

// 计算行数
const updateLineCount = () => {
  const lines = content.value.split('\n');
  lineCount.value = Math.max(lines.length, 1);
  
  // 更新当前光标位置
  if (textareaRef.value) {
    const textarea = textareaRef.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    currentLine.value = lines.length;
    currentColumn.value = lines[lines.length - 1].length + 1;
  }
};

// 同步滚动
const syncScroll = () => {
  if (textareaRef.value && lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = textareaRef.value.scrollTop;
  }
  updateLineCount();
};

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Tab键插入缩进
  if (event.key === 'Tab') {
    event.preventDefault();
    const textarea = textareaRef.value!;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = content.value.substring(0, start) + '  ' + content.value.substring(end);
    content.value = newValue;
    
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
  }
  
  // Ctrl+A 全选
  if (event.ctrlKey && event.key === 'a') {
    event.preventDefault();
    textareaRef.value?.select();
  }
};

// 复制全部内容
const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(content.value);
    // 这里可以添加提示消息
  } catch (err) {
    // 降级方案
    textareaRef.value?.select();
    document.execCommand('copy');
  }
};

// 清空内容
const clearAll = () => {
  if (confirm('确定要清空所有内容吗？')) {
    content.value = '';
    textareaRef.value?.focus();
  }
};

// 监听内容变化
watch(content, () => {
  nextTick(() => {
    updateLineCount();
  });
}, { immediate: true });

onMounted(() => {
  updateLineCount();
});
</script>

<style scoped>
.script-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-color, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  overflow: hidden;
}

.editor-container {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.line-numbers {
  background: var(--line-number-bg, #252526);
  color: var(--line-number-color, #858585);
  padding: 12px 8px;
  font-size: 14px;
  line-height: 1.5;
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--border-color, #333);
  overflow: hidden;
  min-width: 50px;
  box-sizing: border-box;
}

.line-number {
  height: 21px; /* 与textarea行高保持一致 */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.script-textarea {
  flex: 1;
  background: transparent;
  color: var(--text-color, #d4d4d4);
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
  tab-size: 2;
}

.script-textarea::placeholder {
  color: var(--placeholder-color, #6a6a6a);
  opacity: 1;
}

.script-textarea::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.script-textarea::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #1e1e1e);
}

.script-textarea::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #424242);
  border-radius: 6px;
}

.script-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #4f4f4f);
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--status-bar-bg, #252526);
  border-top: 1px solid var(--border-color, #333);
  font-size: 12px;
  color: var(--status-text-color, #cccccc);
}


.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--button-bg, #0e639c);
  color: var(--button-text, #ffffff);
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: var(--button-hover-bg, #1177bb);
}

.action-btn:active {
  background: var(--button-active-bg, #0d5a94);
}

/* 使用项目主题配色 */
.script-editor {
  --bg-color: var(--secondary-bg);
  --border-color: var(--main-border-color);
  --line-number-bg: var(--high-bg);
  --line-number-color: var(--sec-text-color);
  --text-color: var(--text-color);
  --placeholder-color: var(--placeholder-color);
  --scrollbar-track: var(--primary-bg);
  --scrollbar-thumb: var(--high-hover-bg);
  --scrollbar-thumb-hover: var(--border-color);
  --status-bar-bg: var(--high-bg);
  --status-text-color: var(--sec-text-color);
  --button-bg: var(--button-bg);
  --button-text: var(--text-color);
  --button-hover-bg: var(--button-hover-bg);
  --button-active-bg: var(--button-bg);
}
</style>