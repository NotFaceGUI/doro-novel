<template>
    <div class="filter-slider">
        <div class="slider-header">
            <label>{{ label }}</label>
            <span class="value-display">{{ displayValue }}</span>
        </div>
        <div class="slider-container">
            <input 
                type="range" 
                :min="min" 
                :max="max" 
                :step="step"
                :value="modelValue"
                @input="handleInput"
                @change="handleChange"
                class="slider"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    label: string;
    modelValue: number;
    min: number;
    max: number;
    step: number;
    precision?: number;
}

const props = withDefaults(defineProps<Props>(), {
    precision: 2
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
    'change': [value: number];
}>();

const displayValue = computed(() => {
    return props.modelValue.toFixed(props.precision);
});

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    emit('update:modelValue', value);
};

const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    emit('change', value);
};
</script>

<style scoped>
.filter-slider {
    margin-bottom: 5px;
}

.slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.slider-header label {
    font-size: 12px;
    color: var(--text-color);
    font-weight: 500;
}

.value-display {
    font-size: 11px;
    color: var(--text-color-secondary);
    background: var(--secondary-bg);
    padding: 2px 6px;
    border-radius: 3px;
    min-width: 40px;
    text-align: center;
}

.slider-container {
    position: relative;
}

.slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--secondary-bg);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--primary-bg);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: 2px solid var(--primary-bg);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-track {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--secondary-bg);
    border: none;
}
</style>