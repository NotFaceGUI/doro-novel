<template>
    <div class="dropdown-container" :class="{ disabled }">
        <div ref="dropdown" class="dropdown" @click.stop="toggleDropdown">
            <div class="selected-option" :class="{ placeholder: !selectedOption }">
                {{ selectedOption?.label ?? emptyLabel }}
            </div>
            <div class="arrow" :class="{ 'arrow-open': isDropdownVisible }">▶</div>
        </div>
        <teleport to="body">
            <transition name="dropdown-options">
                <div v-if="isDropdownVisible" class="dropdown-options" :style="dropdownOptionsStyle">
                    <div v-for="(option, index) in options" :key="index" class="dropdown-option"
                        @click="selectOption(index)">
                        {{ option.label }}
                    </div>
                </div>
            </transition>

        </teleport>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { DropdownOption } from "../../types/app";

const props = defineProps<{
    modelValue: number,
    options: DropdownOption[],
    disabled: boolean
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
}>();

const isDropdownVisible = ref(false);
const dropdown = ref<HTMLDivElement>();
const dropdownOptionsStyle = ref({});
const emptyLabel = "暂无选项";

const selectedOption = computed(() => {
    if (!Array.isArray(props.options) || props.options.length === 0) {
        return null;
    }

    if (props.modelValue < 0 || props.modelValue >= props.options.length) {
        return null;
    }

    return props.options[props.modelValue] ?? null;
});

const updateDropdownPosition = () => {
    const el = dropdown.value;
    if (el) {
        const rect = el.getBoundingClientRect();
        dropdownOptionsStyle.value = {
            top: `${rect.bottom + window.scrollY + 2}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`
        };
    }
};

const toggleDropdown = () => {
    if (props.disabled || props.options.length === 0) return;
    isDropdownVisible.value = !isDropdownVisible.value;
    if (isDropdownVisible.value) {
        updateDropdownPosition();
        window.addEventListener("scroll", updateDropdownPosition, true);
        window.addEventListener("resize", updateDropdownPosition);
    } else {
        removeListeners();
    }
};

const selectOption = (index: number) => {
    emit("update:modelValue", index);
    isDropdownVisible.value = false;
    removeListeners();
};

const closeDropdown = () => {
    isDropdownVisible.value = false;
    removeListeners();
};

const removeListeners = () => {
    window.removeEventListener("scroll", updateDropdownPosition, true);
    window.removeEventListener("resize", updateDropdownPosition);
};

onMounted(() => {
    document.addEventListener("click", closeDropdown, true);
});

onUnmounted(() => {
    document.removeEventListener("click", closeDropdown, true);
    removeListeners();
});
</script>

<style scoped>
.dropdown-container {
    display: inline-flex;
    width: 150px;
    position: relative;
    cursor: pointer;
    flex-direction: column;
}

.dropdown {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    background-color: var(--floating-panel-input-bg, var(--secondary-bg));
    border: 1px solid var(--floating-panel-input-border, var(--high-hover-bg));
    border-radius: 5px;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    cursor: pointer;
}

.selected-option {
    font-size: 14px;
    color: var(--floating-panel-text, var(--text-color));
}

.selected-option.placeholder {
    color: var(--floating-panel-muted-text, var(--sec-text-color));
}

.arrow {
    font-size: 11px;
    line-height: 1;
    color: var(--floating-panel-text, var(--text-color));
    opacity: 0.65;
    width: 16px;
    height: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: rotate(0deg);
    transform-origin: center;
    transition: transform 0.06s linear, color 0.2s ease, opacity 0.2s ease;
}

.arrow-open {
    transform: rotate(90deg);
}

.dropdown-options {
    position: absolute;
    background-color: var(--floating-panel-bg-strong, var(--secondary-bg));
    border: 1px solid var(--floating-panel-border, var(--high-hover-bg));
    border-radius: 5px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 9999;
    box-shadow: var(--floating-panel-shadow, 0 2px 8px rgba(0, 0, 0, 0.2));

}

.dropdown-option {
    font-size: 14px;
    padding: 5px 10px;
    cursor: pointer;
    color: var(--floating-panel-text, var(--text-color));
    transition: background-color 0.2s ease;
}

/* transition 动画 */
.dropdown-options-enter-active,
.dropdown-options-leave-active {
    transition: all 0.2s ease;
}

.dropdown-options-enter-from,
.dropdown-options-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.dropdown-option:hover {
    background-color: var(--floating-panel-subtle-hover-bg, var(--high-hover-bg));
}

.dropdown-container.disabled .dropdown {
    cursor: not-allowed;
    opacity: var(--ui-disabled-opacity, 1);
    background-color: var(--ui-disabled-bg);
    border-color: var(--ui-disabled-border);
    box-shadow: var(--ui-disabled-shadow);
}

.dropdown-container.disabled .selected-option,
.dropdown-container.disabled .arrow {
    color: var(--ui-disabled-text);
}

.dropdown-container.disabled .arrow {
    opacity: 0.85;
}

.dropdown-options:hover::-webkit-scrollbar-thumb {
    background-color: var(--floating-panel-scrollbar-hover, var(--deep-border-color));
}


.dropdown-options::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.dropdown-options::-webkit-scrollbar-track {
    background: transparent;
}

.dropdown-options::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.dropdown-options::-webkit-scrollbar-thumb:hover {
    background-color: var(--floating-panel-scrollbar-hover, var(--high-hover-bg));
}
</style>
