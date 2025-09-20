import { EasingFunction } from "../script/camera-stand";

// 过渡类型枚举
export enum TransitionType {
    FADE = 'fade',           // 淡入淡出
    FADE_IN = 'fade_in',     // 淡入
    FADE_OUT = 'fade_out',   // 淡出
}



// 过渡配置接口
export interface TransitionConfig {
    type: TransitionType;
    duration: number;
    intensity?: number;
    easing?: EasingFunction;
    delay?: number;
}

// 过渡执行器接口
export interface TransitionExecutor {
    execute(config: TransitionConfig): Promise<void>;
    stop(): void;
    isRunning(): boolean;
}

// 过渡选项接口
export interface TransitionOption {
    value: TransitionType; // 过渡类型
    label: string; // 过渡名称
    icon: string; // 图标
    description: string; // 过渡描述
    requiresIntensity?: boolean; // 是否需要强度参数
    requiresEasing?: boolean; // 是否需要缓动函数
    requiresDelay?: boolean; // 是否需要延迟参数
    requiresDuration?: boolean; // 是否需要持续时间参数

}

// 预定义的过渡选项
export const TRANSITION_OPTIONS: TransitionOption[] = [
    {
        value: TransitionType.FADE,
        label: '淡入淡出',
        icon: '🌅',
        description: '渐变透明度过渡效果',
        requiresIntensity: false,
        requiresEasing: false,
        requiresDelay: false,
        requiresDuration: true
    },
    {
        value: TransitionType.FADE_IN,
        label: '淡入',
        icon: '🌄',
        description: '从透明渐变到不透明',
        requiresIntensity: false,
        requiresEasing: false,
        requiresDelay: false,
        requiresDuration: true
    },
    {
        value: TransitionType.FADE_OUT,
        label: '淡出',
        icon: '🌆',
        description: '从不透明渐变到透明',
        requiresIntensity: false,
        requiresEasing: false,
        requiresDelay: false,
        requiresDuration: true
    },
];