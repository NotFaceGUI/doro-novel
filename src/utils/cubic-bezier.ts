import type { ControlPoint } from '../types/app';

const NEWTON_ITERATIONS = 8;
const SUBDIVISION_ITERATIONS = 12;
const SUBDIVISION_EPSILON = 1e-7;
const SAMPLE_EPSILON = 1e-6;
const CONTROL_POINT_OVERSHOOT = 1.5;
export const CONTROL_POINT_Y_MIN = -CONTROL_POINT_OVERSHOOT;
export const CONTROL_POINT_Y_MAX = 1 + CONTROL_POINT_OVERSHOOT;

export const DEFAULT_CUBIC_BEZIER_POINTS: ControlPoint[] = [
    { x: 0, y: 0 },
    { x: 0.42, y: 0 },
    { x: 0.58, y: 1 },
    { x: 1, y: 1 }
];

export const CURVE_PRESETS: Array<{ label: string; points: ControlPoint[] }> = [
    {
        label: '直线',
        points: [
            { x: 0, y: 0 },
            { x: 0.25, y: 0.25 },
            { x: 0.75, y: 0.75 },
            { x: 1, y: 1 }
        ]
    },
    {
        label: '缓入',
        points: [
            { x: 0, y: 0 },
            { x: 0.42, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: 1 }
        ]
    },
    {
        label: '缓出',
        points: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0.58, y: 1 },
            { x: 1, y: 1 }
        ]
    },
    {
        label: '缓入缓出',
        points: [
            { x: 0, y: 0 },
            { x: 0.42, y: 0 },
            { x: 0.58, y: 1 },
            { x: 1, y: 1 }
        ]
    },
    {
        label: '超冲',
        points: [
            { x: 0, y: 0 },
            { x: 0.34, y: 1.56 },
            { x: 0.64, y: 1 },
            { x: 1, y: 1 }
        ]
    },
    {
        label: '回弹',
        points: [
            { x: 0, y: 0 },
            { x: 0.3, y: -0.55 },
            { x: 0.58, y: 1.45 },
            { x: 1, y: 1 }
        ]
    }
];

function clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
}

function clampUnit(value: number): number {
    return clamp(value, 0, 1);
}

function clampControlPointY(value: number): number {
    return clamp(value, CONTROL_POINT_Y_MIN, CONTROL_POINT_Y_MAX);
}

function sanitizePoint(point: ControlPoint | undefined, fallback: ControlPoint): ControlPoint {
    return {
        x: clampUnit(typeof point?.x === 'number' ? point.x : fallback.x),
        y: clampControlPointY(typeof point?.y === 'number' ? point.y : fallback.y)
    };
}

export function normalizeControlPoints(points?: ControlPoint[]): ControlPoint[] {
    const fallback = DEFAULT_CUBIC_BEZIER_POINTS;

    if (!Array.isArray(points) || points.length < 4) {
        return fallback.map((point) => ({ ...point }));
    }

    const p1 = sanitizePoint(points[1], fallback[1]);
    const p2 = sanitizePoint(points[2], fallback[2]);

    return [
        { x: 0, y: 0 },
        p1,
        p2,
        { x: 1, y: 1 }
    ];
}

export function cloneControlPoints(points?: ControlPoint[]): ControlPoint[] {
    return normalizeControlPoints(points).map((point) => ({ ...point }));
}

function calcBezier(t: number, a1: number, a2: number): number {
    const c = 3 * a1;
    const b = 3 * (a2 - a1) - c;
    const a = 1 - c - b;
    return ((a * t + b) * t + c) * t;
}

function getSlope(t: number, a1: number, a2: number): number {
    const c = 3 * a1;
    const b = 3 * (a2 - a1) - c;
    const a = 1 - c - b;
    return 3 * a * t * t + 2 * b * t + c;
}

function solveTForX(x: number, points: ControlPoint[]): number {
    const x1 = points[1].x;
    const x2 = points[2].x;
    let t = clamp(x);

    for (let i = 0; i < NEWTON_ITERATIONS; i += 1) {
        const slope = getSlope(t, x1, x2);
        if (Math.abs(slope) < SAMPLE_EPSILON) {
            break;
        }

        const currentX = calcBezier(t, x1, x2) - x;
        if (Math.abs(currentX) < SAMPLE_EPSILON) {
            return t;
        }

        t -= currentX / slope;
    }

    let lower = 0;
    let upper = 1;
    t = clamp(x);

    for (let i = 0; i < SUBDIVISION_ITERATIONS; i += 1) {
        const currentX = calcBezier(t, x1, x2) - x;
        if (Math.abs(currentX) < SUBDIVISION_EPSILON) {
            return t;
        }

        if (currentX > 0) {
            upper = t;
        } else {
            lower = t;
        }

        t = (upper + lower) / 2;
    }

    return t;
}

export function evaluateCubicBezier(points: ControlPoint[], progress: number): number {
    const normalized = normalizeControlPoints(points);
    const x = clamp(progress);

    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const t = solveTForX(x, normalized);
    return calcBezier(t, normalized[1].y, normalized[2].y);
}

export function createProgressBezierEasing(points: ControlPoint[]): (progress: number) => number {
    const normalized = cloneControlPoints(points);
    return (progress: number) => evaluateCubicBezier(normalized, progress);
}

export function createDurationBezierEasing(points: ControlPoint[]): (t: number, b: number, c: number, d: number) => number {
    const easing = createProgressBezierEasing(points);

    return (t: number, b: number, c: number, d: number) => {
        if (d <= 0) {
            return b + c;
        }

        const progress = clamp(t / d);
        return b + easing(progress) * c;
    };
}
