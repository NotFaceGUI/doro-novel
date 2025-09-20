<template>
    <div class="dropdown-container" :class="{ disabled }">
        <div ref="dropdown" class="dropdown" @click.stop="toggleDropdown">
            <div class="selected-option">{{ options[modelValue].label }}</div>
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
import { ref, onMounted, onUnmounted } from "vue";
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
    if (props.disabled) return;
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
    background-color: var(--secondary-bg);
    border: 1px solid var(--high-hover-bg);
    border-radius: 5px;
    transition: background-color 0.3s;
    cursor: pointer;
}

.selected-option {
    font-size: 14px;
    color: var(--primary-text);
}

.arrow {
    font-size: 10px;
    opacity: 0.5;
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-left: 2px solid var(--primary-text);
    border-bottom: 2px solid var(--primary-text);
    transform: rotate(0deg);
    transform-origin: center;
    transition: all .06s linear;
}

.arrow-open {
    transform: rotate(90deg);
}

.dropdown-options {
    position: absolute;
    background-color: var(--secondary-bg);
    border: 1px solid var(--high-hover-bg);
    border-radius: 5px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

}

.dropdown-option {
    font-size: 14px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.3s;
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
    background-color: var(--high-hover-bg);
}

.dropdown-container.disabled .dropdown {
    cursor: not-allowed;
    opacity: 0.5;
}

.dropdown-options:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);
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
    background-color: var(--high-hover-bg);
}
</style>
