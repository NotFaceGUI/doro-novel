<template>
    <div class="action-input-content">
        <div v-for="(item, index) in values" class="input-wrapper">
            <label :for="item.label" class="dynamic-input-label">{{ item.label }} : </label>
            <input :class="{ disable: item.disabled }" @blur="handleBlur(index)" @input="handleChange(index)"
                :disabled="item.disabled" :max="max" :min="min" :step="step ?? 0.1" :key="index" v-model="item.value"
                :type="item.type" :id="item.label" autocomplete="off" autocorrect="off" autocapitalize="off" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { InputOption } from "../../types/app";

const props = defineProps<{
    columns: number;
    modelValue: InputOption[];
    onBlur?: Function;
    onChange?: Function;
    max?: number;
    min?: number;
    step?: number;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: InputOption[]): void;
}>();

const values = ref<InputOption[]>([...props.modelValue]);

const handleBlur = (index: number) => {
    // 确保 props.onBlur 存在才调用，避免报错
    if (props.onBlur) {
        props.onBlur(index);
    }
};

const handleChange = (index: number) => {
    if (props.onChange) {
        props.onChange(index);
    }
}

watch(
    () => props.columns,
    (newColumns) => {
        if (newColumns > values.value.length) {
            values.value.push(...new Array(newColumns - values.value.length).fill(""));
        } else if (newColumns < values.value.length) {
            values.value.splice(newColumns);
        }
        emit("update:modelValue", values.value);
    },
    { immediate: true }
);

watch(values, (newValues) => {
    emit("update:modelValue", newValues);
});
</script>

<style scoped>
.action-input-content {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.dynamic-input-label {
    margin-right: 10px;
    vertical-align: middle;
    white-space: nowrap;
}

.input-wrapper {
    display: flex;
    flex: 1;
    max-width: 100%;
    justify-content: space-between;
    align-items: center;
}

input {
    all: unset;
    flex: 1;
    width: 100%;
    min-width: 100px;
    padding: 5px;
    border: 1px solid var(--placeholder-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
    transition: border-color 0.3s;
}

input::placeholder {
    color: var(--placeholder-color);
}

input:focus {
    border-color: var(--button-bg);
    outline: none;
}

.disable {
    background-color: #36364D;
    cursor: not-allowed;
    border: 1px solid #ddd;
    opacity: 0.6;
}
</style>
