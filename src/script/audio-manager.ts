// 全局音频管理器
import { Sound, filters } from '@pixi/sound';
import ResourceManager from './resource-manager';
import { ResType } from './var';

/**
 * 音频淡入淡出选项
 */
export interface FadeOptions {
    duration: number; // 淡入淡出持续时间（秒）
    from?: number;    // 起始音量
    to?: number;      // 目标音量
}

/**
 * 音频过滤器选项
 */
export interface FilterOptions {
    stereoSeparation?: number; // 立体声分离 (-1 到 1)
    distortion?: number;       // 失真效果 (0 到 1)
    reverb?: {                 // 混响效果
        seconds?: number;      // 混响时间 (默认 3)
        decay?: number;        // 衰减 (默认 2)
    };
    telephone?: boolean;       // 电话效果
    equalizer?: number[];      // 均衡器 (10个频段)
}

/**
 * 全局音频管理器
 * 用于统一管理背景音乐和音效
 */
class AudioManager {
    private static instance: AudioManager;
    public currentBgm: Sound | null = null;
    private bgmVolume: number = 1.0;
    private bgmLoop: boolean = true;
    public currentBgmKey: string = '';
    private fadeTimer: number | null = null;
    private currentFilters: FilterOptions = {};

    private constructor() {
        // 私有构造函数，确保单例
    }

    /**
     * 获取AudioManager实例
     */
    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * 播放背景音乐（带淡入淡出和过滤器支持）
     * @param key 音频资源键名
     * @param volume 音量 (0-1)
     * @param loop 是否循环播放
     * @param fadeIn 淡入选项
     * @param filterOptions 过滤器选项
     */
    public playBgm(
        key: string, 
        volume: number = 1.0, 
        loop: boolean = true,
        fadeIn?: FadeOptions,
        filterOptions?: FilterOptions
    ): void {
        // 如果当前已经在播放相同的BGM，检查是否需要重新播放
        if (this.currentBgmKey === key && this.currentBgm) {
            // 如果有淡入效果，需要重新播放以应用淡入
            if (fadeIn) {
                console.log(`重新播放BGM以应用淡入效果: ${key}`);
                // 停止当前播放并重新开始
                this.stopBgm();
            } else {
                // 没有淡入效果时，只更新属性
                this.currentBgm.volume = volume;
                this.currentBgm.loop = loop;
                this.bgmVolume = volume;
                this.bgmLoop = loop;
                
                // 应用过滤器
                if (filterOptions) {
                    this.applyFilters(filterOptions);
                }else {
                    // 清除旧的过滤器
                    this.currentBgm.filters = [];
                }
                console.log(`更新BGM属性: ${key}, 音量: ${volume}, 循环: ${loop}`);
                return;
            }
        }

        // 停止当前播放的BGM
        this.stopBgm();

        // 获取并播放新的BGM
        const sound = ResourceManager.getResource<Sound>(key, ResType.Audio);
        if (sound) {
            // 设置初始音量（如果有淡入效果，从0开始）
            const initialVolume = fadeIn ? (fadeIn.from ?? 0) : volume;
            sound.volume = initialVolume;
            sound.loop = loop;
            
            // 应用过滤器
            if (filterOptions) {
                this.applyFilters(filterOptions, sound);
            }
            
            sound.play();
            
            this.currentBgm = sound;
            this.currentBgmKey = key;
            this.bgmVolume = volume;
            this.bgmLoop = loop;
            
            // 执行淡入效果
            if (fadeIn) {
                this.fadeIn(fadeIn.to ?? volume, fadeIn.duration);
            }
            
            console.log(`播放背景音乐: ${key}, 音量: ${volume}, 循环: ${loop}`);
        } else {
            console.error(`无法加载背景音乐: ${key}`);
        }
    }

    /**
     * 停止背景音乐（带淡出效果）
     * @param fadeOut 淡出选项
     */
    public stopBgm(fadeOut?: FadeOptions): void {
        console.log("停止背景音乐，组件ID:", this.currentBgm);
        if (this.currentBgm) {
            if (fadeOut) {
                // 执行淡出后停止
                this.fadeOut(fadeOut.to ?? 0, fadeOut.duration, () => {
                    if (this.currentBgm) {
                        this.currentBgm.stop();
                        this.currentBgm = null;
                        this.currentBgmKey = '';
                        console.log('淡出停止背景音乐');
                    }
                });
            } else {
                // 直接停止
                this.currentBgm.stop();
                this.currentBgm = null;
                this.currentBgmKey = '';
                console.log('停止背景音乐');
                // 只有在直接停止时才清除定时器
                this.clearFadeTimer();
            }
        }
    }

    /**
     * 暂停背景音乐
     */
    public pauseBgm(): void {
        if (this.currentBgm) {
            this.currentBgm.pause();
            console.log('暂停背景音乐');
        }
    }

    /**
     * 恢复播放背景音乐
     */
    public resumeBgm(): void {
        if (this.currentBgm) {
            this.currentBgm.resume();
            console.log('恢复背景音乐');
        }
    }

    /**
     * 获取当前播放的BGM
     */
    public getCurrentBgm(): Sound | null {
        return this.currentBgm;
    }

    /**
     * 获取当前BGM的键名
     */
    public getCurrentBgmKey(): string {
        return this.currentBgmKey;
    }

    /**
     * 设置BGM音量
     */
    public setBgmVolume(volume: number): void {
        this.bgmVolume = volume;
        if (this.currentBgm) {
            this.currentBgm.volume = volume;
        }
    }

    /**
     * 获取BGM音量
     */
    public getBgmVolume(): number {
        return this.bgmVolume;
    }

    /**
     * 设置BGM循环状态
     */
    public setBgmLoop(loop: boolean): void {
        this.bgmLoop = loop;
        if (this.currentBgm) {
            this.currentBgm.loop = loop;
        }
    }

    /**
     * 获取BGM循环状态
     */
    public getBgmLoop(): boolean {
        return this.bgmLoop;
    }

    /**
     * 淡入效果
     * @param targetVolume 目标音量
     * @param duration 持续时间（秒）
     */
    private fadeIn(targetVolume: number, duration: number): void {
        if (!this.currentBgm) return;
        
        this.clearFadeTimer();
        
        // 确保从0开始淡入，这样效果更明显
        const startVolume = 0;
        this.currentBgm.volume = startVolume;
        
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        console.log(`开始淡入：从 ${startVolume} 到 ${targetVolume}，持续 ${duration} 秒`);
        
        const fadeStep = () => {
            if (!this.currentBgm) {
                this.clearFadeTimer();
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            
            // 使用缓动函数让淡入更平滑
            const easedProgress = this.easeInOut(progress);
            const newVolume = startVolume + (targetVolume - startVolume) * easedProgress;
            
            this.currentBgm.volume = newVolume;
            
            if (progress >= 1) {
                this.currentBgm.volume = targetVolume;
                this.clearFadeTimer();
                console.log(`淡入完成，最终音量: ${targetVolume}`);
            } else {
                this.fadeTimer = requestAnimationFrame(fadeStep);
            }
        };
        
        this.fadeTimer = requestAnimationFrame(fadeStep);
    }

    /**
     * 淡出效果
     * @param targetVolume 目标音量
     * @param duration 持续时间（秒）
     * @param callback 完成回调
     */
    private fadeOut(targetVolume: number, duration: number, callback?: () => void): void {
        if (!this.currentBgm) return;
        
        this.clearFadeTimer();
        
        const startVolume = this.currentBgm.volume;
        const startTime = Date.now();
        const durationMs = duration * 1000;
        
        console.log(`开始淡出：从 ${startVolume} 到 ${targetVolume}，持续 ${duration} 秒`);
        
        const fadeStep = () => {
            if (!this.currentBgm) {
                this.clearFadeTimer();
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            
            // 使用缓动函数让淡出更平滑
            const easedProgress = this.easeInOut(progress);
            const newVolume = startVolume + (targetVolume - startVolume) * easedProgress;
            
            this.currentBgm.volume = newVolume;
            
            if (progress >= 1) {
                this.currentBgm.volume = targetVolume;
                this.clearFadeTimer();
                console.log(`淡出完成，最终音量: ${targetVolume}`);
                if (callback) callback();
            } else {
                this.fadeTimer = requestAnimationFrame(fadeStep);
            }
        };
        
        this.fadeTimer = requestAnimationFrame(fadeStep);
    }

    /**
     * 清除淡入淡出定时器
     */
    private clearFadeTimer(): void {
        if (this.fadeTimer !== null) {
            if (typeof this.fadeTimer === 'number' && this.fadeTimer > 0) {
                // 如果是 requestAnimationFrame 的 ID
                cancelAnimationFrame(this.fadeTimer);
            } else {
                // 如果是 setInterval 的 ID（向后兼容）
                clearInterval(this.fadeTimer);
            }
            this.fadeTimer = null;
        }
    }

    /**
     * 缓动函数 - 缓入缓出
     * @param t 进度值 (0-1)
     * @returns 缓动后的值 (0-1)
     */
    private easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * 应用音频过滤器
     * @param filterOptions 过滤器选项
     * @param sound 可选的音频对象，默认使用当前BGM
     */
    private applyFilters(filterOptions: FilterOptions, sound?: Sound): void {
        const targetSound = sound || this.currentBgm;
        if (!targetSound) return;

        // 创建过滤器数组
        const filtersArray: any[] = [];
        
        // 按照PixiJS Sound推荐的顺序添加过滤器
        
        // 1. 失真过滤器
        if (filterOptions.distortion !== undefined && filterOptions.distortion > 0) {
            const distortionFilter = new filters.DistortionFilter(filterOptions.distortion);
            filtersArray.push(distortionFilter);
        }

        // 2. 电话过滤器
        if (filterOptions.telephone) {
            const telephoneFilter = new filters.TelephoneFilter();
            filtersArray.push(telephoneFilter);
        }

        // 3. 立体声分离过滤器
        if (filterOptions.stereoSeparation !== undefined) {
            const stereoFilter = new filters.StereoFilter(filterOptions.stereoSeparation);
            filtersArray.push(stereoFilter);
        }

        // 4. 混响过滤器
        if (filterOptions.reverb) {
            const seconds = filterOptions.reverb.seconds || 3;
            const decay = filterOptions.reverb.decay || 2;
            const reverbFilter = new filters.ReverbFilter(seconds, decay);
            filtersArray.push(reverbFilter);
        }

        // 5. 均衡器过滤器
        if (filterOptions.equalizer && filterOptions.equalizer.length === 10) {
            const equalizerFilter = new filters.EqualizerFilter(
                ...filterOptions.equalizer as [number, number, number, number, number, number, number, number, number, number]
            );
            filtersArray.push(equalizerFilter);
        }

        // 直接赋值过滤器数组，而不是逐个push
        targetSound.filters = filtersArray;

        this.currentFilters = { ...filterOptions };
        console.log('应用音频过滤器:', filterOptions, '过滤器数量:', filtersArray.length);
    }

    /**
     * 获取当前过滤器设置
     */
    public getCurrentFilters(): FilterOptions {
        return { ...this.currentFilters };
    }

    /**
     * 清除所有过滤器
     */
    public clearFilters(): void {
        if (this.currentBgm) {
            this.currentBgm.filters = [];
            this.currentFilters = {};
            console.log('清除所有音频过滤器');
        }
    }
}

export default AudioManager;