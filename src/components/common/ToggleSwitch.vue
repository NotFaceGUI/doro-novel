<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    modelValue: boolean;
    disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    console.log("触发");
    if (!props.disabled) {
        emit('update:modelValue', !props.modelValue);
    }
};

const switchClasses = computed(() => {
    return props.modelValue ? 'on' : 'off';
});

const circleClasses = computed(() => {
    return props.modelValue ? 'move-right' : 'move-left';
});
</script>

<template>
    <div class="switch-container" @click.stop="toggle">
        <div :class="['switch', switchClasses]">
            <div :class="['circle', circleClasses]"></div>
        </div>
    </div>
</template>

<style scoped>
.switch-container {
    display: inline-flex;
    width: 50px;
    /* 缩小容器宽度 */
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.switch {
    position: relative;
    width: 50px;
    height: 25px;
    background-color: var(--secondary-bg);
    border: 1px solid var(--high-hover-bg);
    border-radius: 13px;
    transition: all 0.3s;
}

.switch.on {
    border: 1px solid rgba(150, 150, 150, 0.15);
    background-color: var(--high-hover-bg);
}

.circle {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: var(--primary-bg);
    border-radius: 50%;
    transition: left 0.3s;
}

.circle.move-right {
    left: 26px;
}

.circle.move-left {
    left: 2px;
}

.switch.disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
</style>
