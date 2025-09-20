<template>
    <div class="ease-curve" ref="curveContainer">
        <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" class="curve-svg">
            <!-- 坐标轴 -->
            <line x1="0" y1="0" :x2="width" :y2="0" stroke="#242436" stroke-width="2" />
            <line x1="0" y1="0" :x2="0" :y2="height" stroke="#242436" stroke-width="2" />

            <!-- 标签 -->
            <text x="0" y="0" fill="#242436" font-size="12" text-anchor="middle" dy="-15">0,1</text>
            <text :x="width" y="0" fill="#242436" font-size="12" text-anchor="middle" dy="-15">1,1</text>
            <text x="0" :y="height" fill="#13131a" font-size="12" text-anchor="middle" dy="20">0,0</text>

            <!-- 曲线 -->
            <path :d="curvePath" fill="none" stroke="#e74c3c" stroke-width="3" stroke-linecap="round"
                stroke-linejoin="round" />

            <!-- 控制点 -->
            <template v-for="(point, index) in points" :key="index">
                <circle v-if="index !== 0 && index !== points.length - 1" :cx="point.x * width"
                    :cy="(1 - point.y) * height" r="8" fill="#2ecc71" class="control-point"
                    @mousedown="startDrag(index, $event)" />
            </template>
        </svg>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ControlPoint } from '../../../types/app';

const emit = defineEmits<{
  (e: 'update:callback', callback: (t: number, b: number, c: number, d: number) => number): void;
}>();

const props = defineProps<{
    modelValue: ControlPoint[];
}>();

const points = ref<ControlPoint[]>([...props.modelValue]);

const draggingIndex = ref<number | null>(null);
const dragStart = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const curveContainer = ref<HTMLDivElement | null>(null);
const width = ref(500);
const height = ref(200);

// 曲线 path
const curvePath = computed(() => {
    const points: string[] = [];
    for (let i = 0; i <= 100; i++) {
        const x = i / 100;
        const y = getInterpolatedY(x);
        points.push(`${x * width.value},${(1 - y) * height.value}`);
    }
    return `M${points.join(' L')}`;
});

// 贝塞尔曲线插值（Y）
function getInterpolatedY(x: number): number {
    const [p0, p1, p2, p3] = points.value;
    const t = x;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t ** 2;
    const d = t ** 3;
    return a * p0.y + b * p1.y + c * p2.y + d * p3.y;
}

function bezierEase(t: number, b: number, c: number, d: number): number {
  const progress = t / d;
  const y = getInterpolatedY(progress);
  return b + y * c;
}

// 调整 SVG 尺寸
const updateSvgSize = () => {
    if (curveContainer.value) {
        width.value = curveContainer.value.offsetWidth;
        height.value = curveContainer.value.offsetHeight;
    }
};

// 计算 viewBox
const viewBox = computed(() => {
    const minX = Math.min(...points.value.map(p => p.x));
    const maxX = Math.max(...points.value.map(p => p.x));
    const minY = Math.min(...points.value.map(p => p.y));
    const maxY = Math.max(...points.value.map(p => p.y));
    const padding = 0.1;
    const xRange = maxX - minX;
    const yRange = maxY - minY;
    const viewBoxWidth = (xRange + padding * 2) * width.value;
    const viewBoxHeight = (yRange + padding * 2) * height.value;
    const viewBoxX = (minX - padding) * width.value;
    const viewBoxY = (1 - maxY - padding) * height.value;
    return `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
});

// 拖动控制点
function startDrag(index: number, event: MouseEvent) {
    if (index === 0 || index === points.value.length - 1) return;

    draggingIndex.value = index;
    dragStart.value = { x: event.clientX, y: event.clientY };
    event.preventDefault();

    const svgRect = (event.target as SVGElement).closest('svg')!.getBoundingClientRect();

    const optimizeMouseMove = (e: MouseEvent) => {
        const dx = (e.clientX - dragStart.value.x) / svgRect.width;
        const dy = (e.clientY - dragStart.value.y) / svgRect.height;

        let newX = points.value[index].x + dx;
        newX = Math.min(Math.max(newX, 0), 1);

        const newY = points.value[index].y - dy;
        points.value[index] = { x: newX, y: newY };

        dragStart.value = { x: e.clientX, y: e.clientY };
    };

    const mouseMoveHandler = (e: MouseEvent) => {
        requestAnimationFrame(() => optimizeMouseMove(e));
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
}

// 监听更新
watch(points.value, () => {
    emit('update:callback', bezierEase);
}, {
    deep: true,
    immediate: true
});

onMounted(() => {
    updateSvgSize();
    window.addEventListener('resize', updateSvgSize);
});
</script>

<style scoped>
.ease-curve {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    aspect-ratio: 1;
    box-sizing: border-box;
    overflow: hidden;
}

.curve-svg {
    width: 100%;
    height: 100%;
    cursor: pointer;
    background-color: var(--secondary-bg);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.control-point {
    cursor: pointer;
}

text {
    font-family: 'Arial', sans-serif;
    fill: #7f8c8d;
}
</style>
