<template>
    <transition name="message-transition">
        <div v-if="visible" class="message-wrapper" :style="{ top: `${top}px` }">
            <div class="message" :class="type">
                <div class="message-content">{{ message }}</div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('info');
const top = ref(50);

const showMessage = (msg: string, innerType: string = 'info', duration: number = 3000) => {
    message.value = msg;
    type.value = innerType;
    visible.value = true;

    setTimeout(() => {
        visible.value = false;
    }, duration - 500);
};

defineExpose({ showMessage });
</script>

<style scoped>
/* 外层容器负责水平居中 */
.message-wrapper {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
}

/* 消息样式 */
.message {
    padding: 10px;
    border-radius: 5px;
    color: white;
    font-size: 16px;
    background-color: var(--high-hover-bg);
    z-index: 9999;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.message-content {
    max-width: 300px;
    word-wrap: break-word;
}

.message.info {
    border: 1px solid #2d9cdb;
}

.message.success {
    border: 1px solid #27ae60;
}

.message.error {
    border: 1px solid var(--error-color);
    animation: glowPulse .3s infinite alternate;
}

/* 让辉光有轻微的脉冲变化 */
@keyframes glowPulse {
    0% {
        box-shadow: 0 0 3px var(--error-color), 0 0 4px rgba(255, 0, 0, 0.1);
    }

    100% {
        box-shadow: 0 0 6px var(--error-color), 0 0 8px rgba(255, 0, 0, 0.2);
    }
}

.message-transition-enter-active {
    animation: smoothBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.message-transition-leave-active {
    animation: smoothFadeOutUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 进入动画：柔和弹入 */
@keyframes smoothBounceIn {
    0% {
        opacity: 0;
        transform: translateX(-50%) translateY(40px) scale(0.7);
    }

    40% {
        opacity: 1;
        transform: translateX(-50%) translateY(-10px) scale(1.1);
    }

    100% {
        transform: translateX(-50%) translateY(0) scale(1);
    }
}

/* 退出动画：平滑淡出 */
@keyframes smoothFadeOutUp {
    0% {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
    }

    100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-40px) scale(0.9);
    }
}
</style>