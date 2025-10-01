/**
 * Spine动画配置
 * 用于配置Spine动画的播放设置，替代硬编码的动画逻辑
 */

export interface AnimationTrack {
    /** 动画轨道索引 */
    trackIndex: number;
    /** 动画名称 */
    animationName: string;
    /** 是否循环播放 */
    loop: boolean;
    /** 延迟时间（秒） */
    delay?: number;
    /** 是否自动播放 */
    autoPlay?: boolean;
}

/** 动画混合配置 */
export interface AnimationMixConfig {
    /** 源动画名称 */
    fromAnimation: string;
    /** 目标动画名称 */
    toAnimation: string;
    /** 混合时间（秒） */
    duration: number;
}

/** UI动画混合配置（与UI组件对应） */
export interface UIMixConfig {
    /** 源动画名称 */
    from: string;
    /** 目标动画名称 */
    to: string;
    /** 混合时间（秒） */
    duration: number;
}

export interface SpineAnimationConfig {
    /** 默认动画配置 */
    defaultAnimations: AnimationTrack[];
    /** 是否启用自动更新 */
    autoUpdate: boolean;
    /** 全局动画混合时间（秒） */
    mixDuration?: number;
    /** 具体的动画混合配置 */
    mixConfigs?: AnimationMixConfig[];
}

/** UI动画配置选项 */
export interface UIAnimationConfig {
    /** 全局混合时长 */
    mixDuration: number;
    /** 混合预设索引 */
    presetIndex: number;
    /** 自定义混合配置列表 */
    customMixConfigs: UIMixConfig[];
}

/**
 * 预定义的动画混合配置选项
 */
export const ANIMATION_MIX_PRESETS: AnimationMixConfig[] = [
    {
        fromAnimation: 'idle',
        toAnimation: 'talk_start',
        duration: 0.3
    },
    {
        fromAnimation: 'talk_start',
        toAnimation: 'idle',
        duration: 0.2
    },
    {
        fromAnimation: 'idle',
        toAnimation: 'talk_end',
        duration: 0.2
    },
    {
        fromAnimation: 'talk_end',
        toAnimation: 'idle',
        duration: 0.3
    }
];

/**
 * 默认动画配置
 */
export const DEFAULT_ANIMATION_CONFIG: SpineAnimationConfig = {
    defaultAnimations: [
        {
            trackIndex: 0,
            animationName: 'idle',
            loop: true,
            autoPlay: true
        }
    ],
    autoUpdate: true,
    mixDuration: 0.2,
    mixConfigs: ANIMATION_MIX_PRESETS
};

/**
 * 可选的额外动画配置
 * 可以根据需要启用或禁用
 */
export const OPTIONAL_ANIMATIONS: AnimationTrack[] = [
    {
        trackIndex: 1,
        animationName: 'talk_start',
        loop: true,
        delay: 0,
        autoPlay: false // 默认不自动播放，可以通过配置控制
    }
];

/**
 * 应用动画配置到Spine实例
 */
export function applyAnimationConfig(
    spine: any, 
    config: SpineAnimationConfig = DEFAULT_ANIMATION_CONFIG,
    enableOptionalAnimations: boolean = false
) {
    if (!spine || !spine.state) {
        console.warn('Invalid spine instance');
        return;
    }

    // 设置自动更新
    spine.autoUpdate = config.autoUpdate;

    // 应用默认动画
    config.defaultAnimations.forEach(track => {
        if (spine.state.hasAnimation(track.animationName)) {
            if (track.autoPlay !== false) {
                spine.state.setAnimation(
                    track.trackIndex, 
                    track.animationName, 
                    track.loop
                );
            }
        } else {
            console.warn(`Animation '${track.animationName}' not found in spine data`);
        }
    });

    // 应用可选动画（如果启用）
    if (enableOptionalAnimations) {
        OPTIONAL_ANIMATIONS.forEach(track => {
            if (spine.state.hasAnimation(track.animationName)) {
                if (track.autoPlay) {
                    if (track.delay && track.delay > 0) {
                        spine.state.addAnimation(
                            track.trackIndex,
                            track.animationName,
                            track.loop,
                            track.delay
                        );
                    } else {
                        spine.state.setAnimation(
                            track.trackIndex,
                            track.animationName,
                            track.loop
                        );
                    }
                }
            } else {
                console.warn(`Optional animation '${track.animationName}' not found in spine data`);
            }
        });
    }

    // 应用具体的动画混合配置
    if (config.mixConfigs && config.mixConfigs.length > 0) {
        config.mixConfigs.forEach(mixConfig => {
            // 检查动画是否存在
            if (spine.state.hasAnimation(mixConfig.fromAnimation) && 
                spine.state.hasAnimation(mixConfig.toAnimation)) {
                spine.state.data.setMix(
                    mixConfig.fromAnimation, 
                    mixConfig.toAnimation, 
                    mixConfig.duration
                );
                console.log(`设置动画混合: ${mixConfig.fromAnimation} -> ${mixConfig.toAnimation} (${mixConfig.duration}s)`);
            } else {
                console.warn(`动画混合配置跳过: ${mixConfig.fromAnimation} -> ${mixConfig.toAnimation} (动画不存在)`);
            }
        });
    }
    // 如果没有具体的混合配置，使用全局混合时间
    else if (config.mixDuration && config.mixDuration > 0) {
        // 为所有动画设置混合时间
        const animations = spine.state.data.skeletonData.animations;
        animations.forEach((anim: any) => {
            animations.forEach((targetAnim: any) => {
                if (anim !== targetAnim) {
                    spine.state.data.setMix(anim.name, targetAnim.name, config.mixDuration);
                }
            });
        });
    }
}

/**
 * 创建自定义动画配置
 */
export function createAnimationConfig(
    defaultAnimations: AnimationTrack[],
    options: Partial<Omit<SpineAnimationConfig, 'defaultAnimations'>> = {}
): SpineAnimationConfig {
    return {
        defaultAnimations,
        autoUpdate: options.autoUpdate ?? true,
        mixDuration: options.mixDuration ?? 0.2,
        mixConfigs: options.mixConfigs ?? ANIMATION_MIX_PRESETS
    };
}

/**
 * 创建自定义混合配置
 */
export function createMixConfig(
    fromAnimation: string,
    toAnimation: string,
    duration: number
): AnimationMixConfig {
    return {
        fromAnimation,
        toAnimation,
        duration
    };
}

/**
 * 应用UI动画配置到Spine实例
 * @param spine Spine实例
 * @param uiConfig UI动画配置
 */
export function applyUIAnimationConfig(spine: any, uiConfig: UIAnimationConfig): void {
    if (!spine || !spine.state || !spine.state.data) {
        console.warn('Invalid spine instance for UI animation config');
        return;
    }

    const stateData = spine.state.data;

    // 如果是自定义混合模式且有自定义配置
    if (uiConfig.presetIndex === 3 && uiConfig.customMixConfigs.length > 0) {
        // 应用自定义混合配置
        uiConfig.customMixConfigs.forEach(mix => {
            if (spine.state.hasAnimation(mix.from) && spine.state.hasAnimation(mix.to)) {
                stateData.setMix(mix.from, mix.to, mix.duration);
                console.log(`UI设置动画混合: ${mix.from} -> ${mix.to} (${mix.duration}s)`);
            } else {
                console.warn(`UI动画混合配置跳过: ${mix.from} -> ${mix.to} (动画不存在)`);
            }
        });
    } else {
        // 应用全局混合时长到所有动画对
        const animations = stateData.skeletonData.animations;
        animations.forEach((anim: any) => {
            animations.forEach((targetAnim: any) => {
                if (anim !== targetAnim) {
                    stateData.setMix(anim.name, targetAnim.name, uiConfig.mixDuration);
                }
            });
        });
        console.log(`UI设置全局动画混合时长: ${uiConfig.mixDuration}s`);
    }
}

/**
 * 将UI混合配置转换为标准混合配置
 */
export function convertUIMixToAnimationMix(uiMix: UIMixConfig): AnimationMixConfig {
    return {
        fromAnimation: uiMix.from,
        toAnimation: uiMix.to,
        duration: uiMix.duration
    };
}