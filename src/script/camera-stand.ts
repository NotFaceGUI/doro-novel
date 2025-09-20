// 预制机位

import { Viewport } from "pixi-viewport";
import CanvasManager from "./render/canvas-manager";
import { Spine } from "pixi-spine";
import { Raw } from 'vue';
import { DEFAULT_RESOLUTION } from "./var";
import { setModification } from "./util/common";
import { Modification, PropertyPath } from "./common/snapshot";

// 存储 spine 实例的初始高度
const spineHeightCache = new Map<string, number>();

// 获取或设置 spine 的初始高度
function getSpineHeight(spine: Spine, characterName: string | undefined): number {
    console.log("名称：", characterName)
    if (!characterName) {
        return spine.height;
    }
    if (!spineHeightCache.has(characterName)) {
        spineHeightCache.set(characterName, spine.height);
        console.log("缓存 spine 高度", spine.height);
    }
    return spineHeightCache.get(characterName) || spine.height;
}

// 机位类型枚举
export enum CameraStandType {
    Large = 'large',
    Medium = 'medium',
    Small = 'small'
}

// 机位预设配置
export const CameraStandPresets = {
    [CameraStandType.Large]: {
        zoom: 1,
        centerY: 640 * DEFAULT_RESOLUTION,
        description: '大机位 - 全景视角'
    },
    [CameraStandType.Medium]: {
        zoom: 1.5,
        centerY: 500 * DEFAULT_RESOLUTION,
        description: '中机位 - 半身视角'
    },
    [CameraStandType.Small]: {
        zoom: 2.5,
        centerY: 350 * DEFAULT_RESOLUTION,
        description: '小机位 - 特写视角'
    }
};

// 缓动函数枚举
export enum EasingFunction {
    Linear = 'linear',

    EaseInSine = 'easeInSine',
    EaseOutSine = 'easeOutSine',
    EaseInOutSine = 'easeInOutSine',

    EaseInQuad = 'easeInQuad',
    EaseOutQuad = 'easeOutQuad',
    EaseInOutQuad = 'easeInOutQuad',

    EaseInCubic = 'easeInCubic',
    EaseOutCubic = 'easeOutCubic',
    EaseInOutCubic = 'easeInOutCubic',

    EaseInQuart = 'easeInQuart',
    EaseOutQuart = 'easeOutQuart',
    EaseInOutQuart = 'easeInOutQuart',

    EaseInQuint = 'easeInQuint',
    EaseOutQuint = 'easeOutQuint',
    EaseInOutQuint = 'easeInOutQuint',

    EaseInExpo = 'easeInExpo',
    EaseOutExpo = 'easeOutExpo',
    EaseInOutExpo = 'easeInOutExpo',

    EaseInCirc = 'easeInCirc',
    EaseOutCirc = 'easeOutCirc',
    EaseInOutCirc = 'easeInOutCirc',

    EaseInBack = 'easeInBack',
    EaseOutBack = 'easeOutBack',
    EaseInOutBack = 'easeInOutBack',

    EaseInElastic = 'easeInElastic',
    EaseOutElastic = 'easeOutElastic',
    EaseInOutElastic = 'easeInOutElastic',

    EaseInBounce = 'easeInBounce',
    EaseOutBounce = 'easeOutBounce',
    EaseInOutBounce = 'easeInOutBounce'
}

// 缓动函数类型
export type EasingType = keyof typeof EasingFunction;

// 缓动函数显示名称映射
export const EasingFunctionLabels: Record<EasingFunction, string> = {
    [EasingFunction.Linear]: 'linear',

    [EasingFunction.EaseInSine]: 'easeInSine',
    [EasingFunction.EaseOutSine]: 'easeOutSine',
    [EasingFunction.EaseInOutSine]: 'easeInOutSine',

    [EasingFunction.EaseInQuad]: 'easeInQuad',
    [EasingFunction.EaseOutQuad]: 'easeOutQuad',
    [EasingFunction.EaseInOutQuad]: 'easeInOutQuad',

    [EasingFunction.EaseInCubic]: 'easeInCubic',
    [EasingFunction.EaseOutCubic]: 'easeOutCubic',
    [EasingFunction.EaseInOutCubic]: 'easeInOutCubic',

    [EasingFunction.EaseInQuart]: 'easeInQuart',
    [EasingFunction.EaseOutQuart]: 'easeOutQuart',
    [EasingFunction.EaseInOutQuart]: 'easeInOutQuart',

    [EasingFunction.EaseInQuint]: 'easeInQuint',
    [EasingFunction.EaseOutQuint]: 'easeOutQuint',
    [EasingFunction.EaseInOutQuint]: 'easeInOutQuint',

    [EasingFunction.EaseInExpo]: 'easeInExpo',
    [EasingFunction.EaseOutExpo]: 'easeOutExpo',
    [EasingFunction.EaseInOutExpo]: 'easeInOutExpo',

    [EasingFunction.EaseInCirc]: 'easeInCirc',
    [EasingFunction.EaseOutCirc]: 'easeOutCirc',
    [EasingFunction.EaseInOutCirc]: 'easeInOutCirc',

    [EasingFunction.EaseInBack]: 'easeInBack',
    [EasingFunction.EaseOutBack]: 'easeOutBack',
    [EasingFunction.EaseInOutBack]: 'easeInOutBack',

    [EasingFunction.EaseInElastic]: 'easeInElastic',
    [EasingFunction.EaseOutElastic]: 'easeOutElastic',
    [EasingFunction.EaseInOutElastic]: 'easeInOutElastic',

    [EasingFunction.EaseInBounce]: 'easeInBounce',
    [EasingFunction.EaseOutBounce]: 'easeOutBounce',
    [EasingFunction.EaseInOutBounce]: 'easeInOutBounce'
};

// 获取所有缓动函数选项（用于下拉框）
export function getEasingFunctionOptions() {
    return Object.values(EasingFunction).map(value => ({
        label: EasingFunctionLabels[value],
        value: value
    }));
}

export interface CameraOptions {
    modification?: Map<PropertyPath, Modification>;
    characterName?: string,
    camera?: Viewport;
    enableAnimation?: boolean;
    duration?: number;
    zoom?: number;
    centerX?: number;
    centerY?: number;
    ease?: EasingFunction;
    spine?: Raw<Spine>
    xOffSet?: number;
    yOffSet?: number;
}

function changeCameraEvent(camera: Viewport, options: CameraOptions) {
    const currentZoom = camera.scale.x;

    setModification(options.modification!, 'camera.x', camera.center.x);
    setModification(options.modification!, 'camera.y', camera.center.y);
    setModification(options.modification!, 'camera.zoom', currentZoom);

    camera.emit('moved');
    camera.emit('zoomed');
};

// 通用机位设置函数
export function setCamera(options: CameraOptions = {}) {
    console.log("设置摄像机", options)
    const {
        camera = CanvasManager.getInstance().viewport,
        enableAnimation = false,
        duration = 500,
        zoom = 1,
        centerX = camera.center.x,
        centerY = 640,
        ease = EasingFunction.Linear
    } = options;

    if (enableAnimation) {
        // 使用动画的操作
        camera.animate({
            time: duration,
            position: { x: centerX + (options.xOffSet || 0), y: centerY + (options.yOffSet || 0) },
            scale: zoom,
            ease: ease,
            callbackOnComplete: () => {
                changeCameraEvent(camera, options);
            }
        });
    } else {
        // 不走动画的操作
        camera.setZoom(zoom);
        camera.moveCenter(centerX + (options.xOffSet || 0), centerY + (options.yOffSet || 0));
        changeCameraEvent(camera, options);
    }


}

// 大机位(全景视角)
export function setCameraLarge(options: Omit<CameraOptions, 'zoom' | 'centerY'> = {}) {
    const preset = CameraStandPresets[CameraStandType.Large];
    setCamera({
        ...options,
        zoom: preset.zoom,
        centerY: preset.centerY
    });
}

// 中机位(半身视角)
export function setCameraMedium(options: Omit<CameraOptions, 'zoom' | 'centerY'> = {}) {
    const preset = CameraStandPresets[CameraStandType.Medium];

    if (options.spine) {
        // 如果有spine数据，设置摄像机位置为spine的中心位置
        const spine = options.spine as Spine;
        if (spine && spine.skeleton) {
            // 使用缓存的 spine 高度
            const spineHeight = getSpineHeight(spine, options.characterName);
            console.log("使用缓存的 spine 高度", spineHeight, "原始高度", spine.height);
            preset.centerY = Math.round(spine.y - spineHeight * 0.75);
        } else {
            console.warn("无效的Spine数据");
        }
    }


    setCamera({
        ...options,
        zoom: preset.zoom,
        centerY: preset.centerY
    });
}

// 小机位 (特写镜头)
export function setCameraSmall(options: Omit<CameraOptions, 'zoom' | 'centerY'> = {}) {
    const preset = CameraStandPresets[CameraStandType.Small];
    if (options.spine) {
        // 如果有spine数据，设置摄像机位置为spine的中心位置
        const spine = options.spine as Spine;
        if (spine && spine.skeleton) {
            // 使用缓存的 spine 高度
            const spineHeight = getSpineHeight(spine, options.characterName);

            console.log("使用缓存的 spine 高度(小机位)", spineHeight, "原始高度", spine.height);
            preset.centerY = Math.round(spine.y - spineHeight * 0.75);
            console.log("小机位的一些属性:", spine.y, spineHeight, preset.centerY)

        } else {
            console.warn("无效的Spine数据");
        }
    }

    setCamera({
        ...options,
        zoom: preset.zoom,
        centerY: preset.centerY
    });
}

// 根据机位类型设置摄像机
export function setCameraByType(type: CameraStandType, options: Omit<CameraOptions, 'zoom' | 'centerY'> = {}) {
    switch (type) {
        case CameraStandType.Large:
            setCameraLarge(options);
            break;
        case CameraStandType.Medium:
            setCameraMedium(options);
            break;
        case CameraStandType.Small:
            setCameraSmall(options);
            break;
        default:
            console.warn(`未知的机位类型: ${type}`);
            setCameraLarge(options); // 默认使用大机位
    }
}

// 获取机位预设信息
export function getCameraStandInfo(type: CameraStandType) {
    return CameraStandPresets[type];
}

// 获取所有机位类型选项（用于下拉框）
export function getCameraStandOptions() {
    return Object.values(CameraStandType).map(type => ({
        label: `${CameraStandPresets[type].description} (${type})`,
        value: type
    }));
}