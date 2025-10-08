<template>
    <div class="tooltip-container" @mouseenter="showTooltip" @mouseleave="hideTooltip">
        <div>
            🔍
        </div>
        <div v-if="visible" class="tooltip" :style="tooltipStyle">
            <div v-if="text">
                {{ text }}
            </div>
            <slot v-else></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// 定义 Props 类型
interface TooltipProps {
    text?: string,
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const props = defineProps<TooltipProps>();

const visible = ref(false);

const showTooltip = () => {
    visible.value = true
};
const hideTooltip = () => {
    visible.value = false
};

import { CSSProperties } from 'vue';

const tooltipStyle = computed<CSSProperties>(() => {
    const distance = 8; // 调整 Tooltip 与目标元素的间距
    const baseStyle: CSSProperties = {
        padding: '6px 12px',
        whiteSpace: 'nowrap', // 让 Tooltip 不换行
        maxWidth: '300px', // 限制最大宽度，避免过长
        width: 'max-content', // 让内容撑开
        textAlign: 'center',
    };

    switch (props.position) {
        case 'top':
            return { 
                ...baseStyle,
                bottom: `calc(100% + ${distance}px)`, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                transformOrigin: 'bottom center',
                position: 'absolute' // 确保 position 类型正确
            };
        case 'bottom':
            return { 
                ...baseStyle,
                top: `calc(100% + ${distance}px)`, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                transformOrigin: 'top center',
                position: 'absolute'
            };
        case 'left':
            return { 
                ...baseStyle,
                right: `calc(100% + ${distance}px)`,  // 向左偏移
                top: '50%', 
                transform: 'translateY(-50%)', 
                transformOrigin: 'center right',  // 从右边扩展
                position: 'absolute',
                width: 'auto',  // 调整宽度自动伸展
            };
        case 'right':
            return { 
                ...baseStyle,
                left: `calc(100% + ${distance}px)`,  // 向右偏移
                top: '50%', 
                transform: 'translateY(-50%)', 
                transformOrigin: 'center left',  // 从左边扩展
                position: 'absolute',
                width: 'auto',  // 调整宽度自动伸展
            };
        default:
            return { 
                ...baseStyle,
                bottom: `calc(100% + ${distance}px)`, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                transformOrigin: 'bottom center',
                position: 'absolute'
            }; // 默认顶部
    }
});

</script>

<style scoped>
.tooltip-container {
    position: relative;
    display: inline-block;
}

.tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
}
</style>