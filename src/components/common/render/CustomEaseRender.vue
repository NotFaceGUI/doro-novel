<template>
    <div class="ease-editor">
        <div class="ease-toolbar">
            <div class="toolbar-group">
                <span class="toolbar-label">预设</span>
                <button
                    v-for="preset in CURVE_PRESETS"
                    :key="preset.label"
                    type="button"
                    class="toolbar-chip"
                    @click="applyPreset(preset.points)"
                >
                    {{ preset.label }}
                </button>
            </div>

            <div class="toolbar-group toolbar-actions">
                <button type="button" class="toolbar-btn" @click="resetCurve">重置</button>
            </div>
        </div>

        <div class="ease-meta">
            <span>P1 ({{ displayPoint(model[1]) }})</span>
            <span>P2 ({{ displayPoint(model[2]) }})</span>
        </div>

        <div class="ease-stage">
            <div
                ref="curveContainer"
                class="ease-curve"
                :class="{ 'is-dragging': draggingIndex !== null }"
                @mousedown="handleTrackMouseDown($event, false)"
            >
                <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" class="curve-svg">
                    <defs>
                        <pattern id="ease-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                        </pattern>
                    </defs>

                    <rect :width="width" :height="height" fill="url(#ease-grid)" rx="12" />

                    <line
                        v-for="marker in axisMarkers"
                        :key="`inline-x-${marker}`"
                        :x1="marker * width"
                        y1="0"
                        :x2="marker * width"
                        :y2="height"
                        class="axis-line"
                    />
                    <line
                        v-for="marker in axisMarkers"
                        :key="`inline-y-${marker}`"
                        x1="0"
                        :y1="marker * height"
                        :x2="width"
                        :y2="marker * height"
                        class="axis-line"
                    />
                    <line
                        v-for="value in yReferenceLines"
                        :key="`inline-ref-${value}`"
                        x1="0"
                        :y1="toSvgY(value, false)"
                        :x2="width"
                        :y2="toSvgY(value, false)"
                        class="reference-line"
                    />

                    <line
                        :x1="model[0].x * width"
                        :y1="toSvgY(model[0].y, false)"
                        :x2="model[1].x * width"
                        :y2="toSvgY(model[1].y, false)"
                        class="handle-line"
                    />
                    <line
                        :x1="model[2].x * width"
                        :y1="toSvgY(model[2].y, false)"
                        :x2="model[3].x * width"
                        :y2="toSvgY(model[3].y, false)"
                        class="handle-line"
                    />

                    <path :d="buildCurvePath(false)" class="curve-path" />
                    <path :d="buildPreviewPath(false)" class="preview-path" />

                    <template v-for="(point, index) in model" :key="`inline-${index}`">
                        <circle
                            v-if="index !== 0 && index !== model.length - 1"
                            :cx="point.x * width"
                            :cy="toSvgY(point.y, false)"
                            r="15"
                            class="control-hit-area"
                            @mousedown.stop.prevent="startDrag(index, $event, false)"
                        />
                        <circle
                            :cx="point.x * width"
                            :cy="toSvgY(point.y, false)"
                            :r="index === 0 || index === model.length - 1 ? 5 : 7"
                            :class="[
                                'control-point',
                                index === 0 || index === model.length - 1 ? 'point-anchor' : 'point-handle',
                                draggingIndex === index && !isExpandedDragging ? 'is-dragging' : ''
                            ]"
                            @mousedown.stop.prevent="startDrag(index, $event, false)"
                        />
                    </template>

                    <text x="8" y="14" class="axis-label">y {{ formatAxisValue(EDIT_VIEW_MAX_Y) }}</text>
                    <text x="8" :y="height - 8" class="axis-label">y {{ formatAxisValue(EDIT_VIEW_MIN_Y) }}</text>
                    <text
                        v-for="value in yReferenceLines"
                        :key="`inline-label-${value}`"
                        x="8"
                        :y="Math.max(14, Math.min(height - 10, toSvgY(value, false) - 6))"
                        class="reference-label"
                    >
                        {{ value }}
                    </text>
                    <text x="8" :y="height - 24" class="axis-label">x 0</text>
                    <text :x="width - 8" :y="height - 8" text-anchor="end" class="axis-label">x 1</text>
                </svg>
            </div>

            <button
                type="button"
                class="expand-btn"
                @click.stop.prevent="openExpandedEditor"
                @mousedown.stop
                title="放大编辑"
            >
                ⤢
            </button>
        </div>

        <teleport to="body">
            <div v-if="isExpanded" class="ease-modal" @click.self="closeExpandedEditor">
                <div class="ease-modal-panel">
                    <div class="ease-modal-head">
                        <div class="ease-modal-title">曲线精细编辑</div>
                        <button type="button" class="ease-modal-close" @click="closeExpandedEditor">✕</button>
                    </div>

                    <div class="ease-modal-meta">
                        <span>P1 ({{ displayPoint(model[1]) }})</span>
                        <span>P2 ({{ displayPoint(model[2]) }})</span>
                    </div>

                    <div
                        ref="expandedCurveContainer"
                        class="ease-curve ease-curve-expanded"
                        :class="{ 'is-dragging': isExpandedDragging }"
                        @mousedown="handleTrackMouseDown($event, true)"
                    >
                        <svg :viewBox="`0 0 ${expandedWidth} ${expandedHeight}`" preserveAspectRatio="none" class="curve-svg">
                            <defs>
                                <pattern id="ease-grid-expanded" width="48" height="48" patternUnits="userSpaceOnUse">
                                    <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
                                </pattern>
                            </defs>

                            <rect :width="expandedWidth" :height="expandedHeight" fill="url(#ease-grid-expanded)" rx="16" />

                            <line
                                v-for="marker in axisMarkers"
                                :key="`expanded-x-${marker}`"
                                :x1="marker * expandedWidth"
                                y1="0"
                                :x2="marker * expandedWidth"
                                :y2="expandedHeight"
                                class="axis-line"
                            />
                            <line
                                v-for="marker in axisMarkers"
                                :key="`expanded-y-${marker}`"
                                x1="0"
                                :y1="marker * expandedHeight"
                                :x2="expandedWidth"
                                :y2="marker * expandedHeight"
                                class="axis-line"
                            />
                            <line
                                v-for="value in yReferenceLines"
                                :key="`expanded-ref-${value}`"
                                x1="0"
                                :y1="toSvgY(value, true)"
                                :x2="expandedWidth"
                                :y2="toSvgY(value, true)"
                                class="reference-line"
                            />

                            <line
                                :x1="model[0].x * expandedWidth"
                                :y1="toSvgY(model[0].y, true)"
                                :x2="model[1].x * expandedWidth"
                                :y2="toSvgY(model[1].y, true)"
                                class="handle-line"
                            />
                            <line
                                :x1="model[2].x * expandedWidth"
                                :y1="toSvgY(model[2].y, true)"
                                :x2="model[3].x * expandedWidth"
                                :y2="toSvgY(model[3].y, true)"
                                class="handle-line"
                            />

                            <path :d="buildCurvePath(true)" class="curve-path" />
                            <path :d="buildPreviewPath(true)" class="preview-path" />

                            <template v-for="(point, index) in model" :key="`expanded-${index}`">
                                <circle
                                    v-if="index !== 0 && index !== model.length - 1"
                                    :cx="point.x * expandedWidth"
                                    :cy="toSvgY(point.y, true)"
                                    r="20"
                                    class="control-hit-area"
                                    @mousedown.stop.prevent="startDrag(index, $event, true)"
                                />
                                <circle
                                    :cx="point.x * expandedWidth"
                                    :cy="toSvgY(point.y, true)"
                                    :r="index === 0 || index === model.length - 1 ? 7 : 10"
                                    :class="[
                                        'control-point',
                                        index === 0 || index === model.length - 1 ? 'point-anchor' : 'point-handle',
                                        draggingIndex === index && isExpandedDragging ? 'is-dragging' : ''
                                    ]"
                                    @mousedown.stop.prevent="startDrag(index, $event, true)"
                                />
                            </template>

                            <text x="12" y="20" class="axis-label axis-label-large">y {{ formatAxisValue(EDIT_VIEW_MAX_Y) }}</text>
                            <text x="12" :y="expandedHeight - 12" class="axis-label axis-label-large">y {{ formatAxisValue(EDIT_VIEW_MIN_Y) }}</text>
                            <text
                                v-for="value in yReferenceLines"
                                :key="`expanded-label-${value}`"
                                x="12"
                                :y="Math.max(20, Math.min(expandedHeight - 14, toSvgY(value, true) - 8))"
                                class="reference-label axis-label-large"
                            >
                                {{ value }}
                            </text>
                            <text x="12" :y="expandedHeight - 32" class="axis-label axis-label-large">x 0</text>
                            <text :x="expandedWidth - 12" :y="expandedHeight - 12" text-anchor="end" class="axis-label axis-label-large">x 1</text>
                        </svg>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ControlPoint } from '../../../types/app';
import {
    CONTROL_POINT_Y_MAX,
    CONTROL_POINT_Y_MIN,
    createDurationBezierEasing,
    CURVE_PRESETS,
    DEFAULT_CUBIC_BEZIER_POINTS,
    evaluateCubicBezier,
    normalizeControlPoints
} from '../../../utils/cubic-bezier';

const emit = defineEmits<{
    (e: 'update:modelValue', value: ControlPoint[]): void;
    (e: 'update:callback', callback: (t: number, b: number, c: number, d: number) => number): void;
}>();

const props = defineProps<{
    modelValue: ControlPoint[];
}>();

const curveContainer = ref<HTMLDivElement | null>(null);
const expandedCurveContainer = ref<HTMLDivElement | null>(null);
const model = ref<ControlPoint[]>(normalizeControlPoints(props.modelValue));
const draggingIndex = ref<number | null>(null);
const isExpandedDragging = ref(false);
const isExpanded = ref(false);
const width = 360;
const height = 220;
const expandedWidth = 860;
const expandedHeight = 560;
const axisMarkers = [0.25, 0.5, 0.75];
const EDIT_VIEW_MIN_Y = CONTROL_POINT_Y_MIN;
const EDIT_VIEW_MAX_Y = CONTROL_POINT_Y_MAX;
const DRAG_CURSOR_CLASS = 'ease-editor-dragging-cursor';

let removeDragListeners: (() => void) | null = null;
let lastDragEndAt = 0;
let dragFrameId: number | null = null;

const yReferenceLines = computed(() => {
    return [1, 0];
});

function getSize(expanded: boolean) {
    return expanded
        ? { width: expandedWidth, height: expandedHeight }
        : { width, height };
}

function toSvgY(value: number, expanded: boolean): number {
    const { height: currentHeight } = getSize(expanded);
    const range = Math.max(EDIT_VIEW_MAX_Y - EDIT_VIEW_MIN_Y, 0.001);
    return ((EDIT_VIEW_MAX_Y - value) / range) * currentHeight;
}

function copyPoints(points: ControlPoint[]): ControlPoint[] {
    return points.map((point) => ({ ...point }));
}

function buildCurvePath(expanded: boolean): string {
    const { width: currentWidth } = getSize(expanded);
    const segments: string[] = [];

    for (let i = 0; i <= 100; i += 1) {
        const progress = i / 100;
        const x = progress * currentWidth;
        const y = toSvgY(evaluateCubicBezier(model.value, progress), expanded);
        segments.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }

    return segments.join(' ');
}

function buildPreviewPath(expanded: boolean): string {
    const { width: currentWidth } = getSize(expanded);
    const samples: string[] = [];

    for (let i = 0; i <= 24; i += 1) {
        const progress = i / 24;
        const x = progress * currentWidth;
        const y = toSvgY(evaluateCubicBezier(model.value, progress), expanded);
        samples.push(`${x},${y}`);
    }

    return `M ${samples.join(' L ')}`;
}

function clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
}

function displayPoint(point: ControlPoint): string {
    return `${point.x.toFixed(2)}, ${point.y.toFixed(2)}`;
}

function formatAxisValue(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
}

function syncModel(points: ControlPoint[], emitChange = true) {
    const next = copyPoints(points);
    model.value = next;

    if (emitChange) {
        emit('update:modelValue', copyPoints(next));
    }

    emit('update:callback', createDurationBezierEasing(next));
}

function commitModel() {
    emit('update:modelValue', copyPoints(model.value));
    emit('update:callback', createDurationBezierEasing(model.value));
}

function updatePoint(index: number, x: number, y: number) {
    const next = copyPoints(model.value);

    if (index === 0) {
        next[0] = { x: 0, y: 0 };
    } else if (index === next.length - 1) {
        next[next.length - 1] = { x: 1, y: 1 };
    } else {
        next[index] = {
            x: clamp(x, 0, 1),
            y: clamp(y, CONTROL_POINT_Y_MIN, CONTROL_POINT_Y_MAX)
        };
    }

    syncModel(next, false);
}

function getRelativePoint(event: MouseEvent, expanded: boolean) {
    const container = expanded ? expandedCurveContainer.value : curveContainer.value;
    const rect = container?.getBoundingClientRect();
    if (!rect) {
        return { x: 0, y: 0 };
    }

    const x = clamp((event.clientX - rect.left) / rect.width);
    const range = Math.max(EDIT_VIEW_MAX_Y - EDIT_VIEW_MIN_Y, 0.001);
    const yRatio = (event.clientY - rect.top) / rect.height;
    const y = EDIT_VIEW_MAX_Y - yRatio * range;

    return {
        x,
        y: clamp(y, CONTROL_POINT_Y_MIN, CONTROL_POINT_Y_MAX)
    };
}

function setGlobalDragCursor(isDragging: boolean) {
    document.body.classList.toggle(DRAG_CURSOR_CLASS, isDragging);
}

function startDrag(index: number, event: MouseEvent, expanded: boolean) {
    draggingIndex.value = index;
    isExpandedDragging.value = expanded;
    setGlobalDragCursor(true);
    let pendingPoint = getRelativePoint(event, expanded);

    const handleMove = (moveEvent: MouseEvent) => {
        pendingPoint = getRelativePoint(moveEvent, expanded);

        if (dragFrameId !== null) {
            return;
        }

        dragFrameId = window.requestAnimationFrame(() => {
            dragFrameId = null;
            updatePoint(index, pendingPoint.x, pendingPoint.y);
        });
    };

    const handleUp = () => {
        if (dragFrameId !== null) {
            window.cancelAnimationFrame(dragFrameId);
            dragFrameId = null;
            updatePoint(index, pendingPoint.x, pendingPoint.y);
        }

        draggingIndex.value = null;
        isExpandedDragging.value = false;
        lastDragEndAt = Date.now();
        setGlobalDragCursor(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        removeDragListeners = null;
        commitModel();
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    removeDragListeners = () => {
        if (dragFrameId !== null) {
            window.cancelAnimationFrame(dragFrameId);
            dragFrameId = null;
        }

        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        draggingIndex.value = null;
        isExpandedDragging.value = false;
        lastDragEndAt = Date.now();
        setGlobalDragCursor(false);
        commitModel();
    };

    updatePoint(index, pendingPoint.x, pendingPoint.y);
}

function handleTrackMouseDown(event: MouseEvent, expanded: boolean) {
    if (event.target instanceof SVGCircleElement) {
        return;
    }

    const point = getRelativePoint(event, expanded);
    const { width: currentWidth } = getSize(expanded);
    const targetX = point.x * currentWidth;
    const targetY = toSvgY(point.y, expanded);
    const distances = [1, 2].map((index) => ({
        index,
        distance: Math.hypot(
            model.value[index].x * currentWidth - targetX,
            toSvgY(model.value[index].y, expanded) - targetY
        )
    }));
    distances.sort((a, b) => a.distance - b.distance);

    startDrag(distances[0].index, event, expanded);
}

function applyPreset(points: ControlPoint[]) {
    syncModel(points);
}

function resetCurve() {
    syncModel(DEFAULT_CUBIC_BEZIER_POINTS);
}

function openExpandedEditor() {
    if (draggingIndex.value !== null) {
        return;
    }

    isExpanded.value = true;
}

function closeExpandedEditor() {
    if (draggingIndex.value !== null) {
        return;
    }

    if (Date.now() - lastDragEndAt < 160) {
        return;
    }

    isExpanded.value = false;
}

watch(
    () => props.modelValue,
    (value) => {
        if (draggingIndex.value !== null) {
            return;
        }

        const normalized = normalizeControlPoints(value);
        const changed = JSON.stringify(normalized) !== JSON.stringify(model.value);
        if (changed) {
            syncModel(normalized, false);
        }
    },
    { deep: true, immediate: true }
);

onMounted(() => {
    emit('update:callback', createDurationBezierEasing(model.value));
});

onBeforeUnmount(() => {
    if (dragFrameId !== null) {
        window.cancelAnimationFrame(dragFrameId);
        dragFrameId = null;
    }

    removeDragListeners?.();
    setGlobalDragCursor(false);
});
</script>

<style scoped>
.ease-editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.ease-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.toolbar-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.toolbar-label,
.ease-meta,
.ease-modal-meta {
    color: var(--sec-text-color);
    font-size: 12px;
}

.toolbar-chip,
.toolbar-btn,
.expand-btn,
.ease-modal-close {
    border: 1px solid var(--main-border-color);
    background: var(--high-bg);
    color: var(--text-color);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.12s ease;
}

.toolbar-chip:hover,
.toolbar-btn:hover,
.expand-btn:hover,
.ease-modal-close:hover {
    background: var(--high-hover-bg);
    border-color: var(--button-bg);
}

.toolbar-actions {
    margin-left: auto;
}

.ease-meta,
.ease-modal-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    opacity: 0.8;
    flex-wrap: wrap;
}

.ease-stage {
    position: relative;
}

.ease-curve {
    width: 100%;
    min-height: 220px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    user-select: none;
    cursor: crosshair;
}

.ease-curve.is-dragging {
    cursor: grabbing;
}

.ease-curve-expanded {
    min-height: 560px;
    height: 560px;
}

.curve-svg {
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08));
    border: 1px solid var(--main-border-color);
    border-radius: 12px;
}

.axis-line {
    stroke: rgba(255, 255, 255, 0.08);
    stroke-width: 1;
}

.reference-line {
    stroke: rgba(255, 255, 255, 0.18);
    stroke-width: 1.25;
}

.handle-line {
    stroke: rgba(255, 255, 255, 0.24);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
}

.curve-path {
    fill: none;
    stroke: var(--button-bg);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.preview-path {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 1;
    stroke-dasharray: 3 3;
}

.control-point {
    stroke: rgba(0, 0, 0, 0.45);
    stroke-width: 2;
    transition: fill 0.12s ease, stroke 0.12s ease;
    transform-box: fill-box;
    transform-origin: center;
}

.control-hit-area {
    fill: transparent;
    pointer-events: all;
    cursor: grab;
}

.point-anchor {
    fill: rgba(255, 255, 255, 0.75);
}

.point-handle {
    fill: var(--button-bg);
    cursor: grab;
}

.point-handle:hover,
.point-handle.is-dragging {
    fill: var(--button-hover-bg);
    stroke: rgba(0, 0, 0, 0.62);
}

.axis-label,
.reference-label {
    fill: rgba(255, 255, 255, 0.6);
    font-size: 11px;
}

.axis-label-large {
    font-size: 13px;
}

.expand-btn {
    position: absolute;
    right: 10px;
    bottom: 10px;
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    backdrop-filter: blur(8px);
    background: rgba(19, 24, 35, 0.26);
    border-color: rgba(255, 255, 255, 0.12);
    opacity: 0;
    pointer-events: none;
    transform: translateY(6px);
}

.ease-stage:hover .expand-btn,
.ease-stage:focus-within .expand-btn {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
}

.expand-btn:hover {
    background: rgba(19, 24, 35, 0.42);
}

.ease-modal {
    position: fixed;
    inset: 0;
    background: rgba(7, 10, 18, 0.7);
    z-index: 2200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px;
    backdrop-filter: blur(6px);
}

.ease-modal-panel {
    width: min(980px, calc(100vw - 48px));
    max-height: calc(100vh - 48px);
    background: var(--secondary-bg);
    border: 1px solid var(--main-border-color);
    border-radius: 18px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.ease-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.ease-modal-title {
    color: var(--text-color);
    font-size: 16px;
    font-weight: 600;
}

.ease-modal-close {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>

<style>
body.ease-editor-dragging-cursor,
body.ease-editor-dragging-cursor * {
    cursor: grabbing !important;
}
</style>
