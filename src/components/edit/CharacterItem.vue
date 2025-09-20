<template>
    <div class="character-item">
        <div class="character-control" ref="controlRef" @mousedown.prevent="startDrag">| |</div>
        <!-- {{ character.character.characterName }} -->
        <span v-if="type == 'x'">[x: {{ character.x }}]</span>
        <span v-else-if="type == 'y'">[y: {{ character.y }}]</span>
        <span v-else>[scale: {{ character.spine?.scale.x }}]</span>
    </div>
</template>

<script setup lang="ts">
import { Spine } from 'pixi-spine';
import { ref, onMounted, onUnmounted } from 'vue';
import { CharacterType } from '../../types/app';

const props = defineProps<{
    type: "x" | "y" | "scale",
    defaultOffset: number,
    character: {
        character: CharacterType,
        x: number,
        y: number,
        scale: number,
        spine?: Spine
    }
}>();

// 定义要触发的事件
const emit = defineEmits<{
    (e: 'positionChanged', leftValue: number): void
}>();

const controlRef = ref<HTMLElement | null>(null);
let isDragging = false;
let startX = 0;
let startLeft = 0;
let animationFrameId: number | null = null;

const startDrag = (event: MouseEvent) => {
    if (!controlRef.value) return;
    isDragging = true;
    startX = event.clientX;
    startLeft = controlRef.value.offsetLeft;
    document.addEventListener("mousemove", onDrag, { passive: false });
    document.addEventListener("mouseup", stopDrag);
};

const onDrag = (event: MouseEvent) => {
    event.preventDefault();
    if (!isDragging || !controlRef.value || !controlRef.value.parentElement) return;
    const deltaX = event.clientX - startX;
    let newLeft = startLeft + deltaX;
    newLeft = Math.max(0, Math.min(newLeft, controlRef.value.parentElement.clientWidth - controlRef.value.clientWidth));

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(() => {
        if (controlRef.value) {
            controlRef.value.style.left = `${newLeft}px`;

            if (controlRef.value.parentElement) {
                // 计算百分比
                const parentWidth = controlRef.value.parentElement.clientWidth - controlRef.value.clientWidth;
                const currentLeft = controlRef.value.offsetLeft;
                const percentage = parentWidth > 0 ? (currentLeft / parentWidth) * 100 : 0;

                // 触发事件，传递百分比值和可选的角色ID
                emit('positionChanged', percentage);
            }

        }
    });
};

const stopDrag = () => {
    if (isDragging && controlRef.value && controlRef.value.parentElement) {
        // 计算百分比
        const parentWidth = controlRef.value.parentElement.clientWidth - controlRef.value.clientWidth;
        const currentLeft = controlRef.value.offsetLeft;
        const percentage = parentWidth > 0 ? (currentLeft / parentWidth) * 100 : 0;

        // 触发事件，传递百分比值和可选的角色ID
        emit('positionChanged', percentage);
    }

    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
};

onMounted(() => {
    if (controlRef.value) {
        controlRef.value.style.position = "absolute";
        controlRef.value.style.left = "0px";
    }

    if (controlRef.value && controlRef.value.parentElement) {

        const parentWidth = controlRef.value.parentElement.clientWidth - controlRef.value.clientWidth;
        const defaultLeft = (props.defaultOffset / 100) * parentWidth;

        controlRef.value.style.left = `${defaultLeft}px`;
    }

});

onUnmounted(() => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
</script>

<style lang="css" scoped>
.character-item {
    position: relative;
    min-height: 30px;
    background-color: #36364d;
    display: flex;
    align-items: center;
    justify-content: center;
}


.character-control {
    display: flex;
    height: 110%;
    position: absolute;
    width: 20px;
    background-color: #1E1E2E;
    opacity: .8;
    /* transition: all .1s ease-in-out; */

    justify-content: center;
    align-items: center;

    color: rgba(255, 255, 255, 0.247);

}

.character-control:hover {
    background-color: #1E1E2E;
    opacity: .9;
}
</style>