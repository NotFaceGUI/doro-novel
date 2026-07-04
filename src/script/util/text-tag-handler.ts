/**
 * 文本标签处理器
 * 定义和执行不同类型的文本标签功能
 */

import CanvasManager from '../render/canvas-manager';
import { TextTag } from './text-parser';

// 标签处理器接口
export interface TagHandler {
    name: string;
    wait: boolean;
    execute(attributes: string, context: TagExecutionContext): Promise<void>;
}

// 标签执行上下文
export interface TagExecutionContext {
    textElement?: any;      // 文本元素引用
    currentText?: string;   // 当前显示的文本
    position?: number;      // 当前位置
    [key: string]: any;     // 其他上下文数据
}

/**
 * 文本标签处理器管理类
 */
export class TextTagHandlerManager {
    private static handlers: Map<string, TagHandler> = new Map();

    /**
     * 注册标签处理器
     */
    static registerHandler(handler: TagHandler): void {
        TextTagHandlerManager.handlers.set(handler.name, handler);
    }

    /**
     * 执行标签（异步）
     */
    static async executeTag(tag: TextTag, context: TagExecutionContext): Promise<void> {
        const handler = TextTagHandlerManager.handlers.get(tag.name);
        if (handler) {
            try {
                if (handler.wait) {
                    await handler.execute(tag.attributes, context);
                } else {
                    handler.execute(tag.attributes, context);
                }
            } catch (error) {
                console.error(`执行标签 ${tag.name} 时出错:`, error);
            }
        } else {
            console.warn(`未找到标签处理器: ${tag.name}`);
        }
    }

    /**
     * 获取所有已注册的标签处理器
     */
    static getRegisteredHandlers(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * 检查标签是否已注册
     */
    static hasHandler(tagName: string): boolean {
        return this.handlers.has(tagName);
    }
}

// 预定义的标签处理器

/**
 * 震动标签处理器
 * 用法: <shake:强度,持续时间/>
 * 示例: <shake:轻微/>, <shake:强烈,2s/>
 */
export const ShakeTagHandler: TagHandler = {
    name: 'shake',
    wait: false,
    async execute(attributes: string, _context: TagExecutionContext): Promise<void> {
        // 导入UIRender类来检查摄像机状态
        const { UIRender } = await import('../render/ui-render');

        // 等待摄像机停止移动
        while (UIRender.isCameraMoving) {
            await new Promise(resolve => setTimeout(resolve, 50)); // 每50ms检查一次
        }

        const params = parseTagAttributes(attributes);

        // 支持按key指定或按顺序指定震动的3个数值
        let intensity: number;
        let duration: number;
        let frequency: number;

        // 如果有key，优先使用key方式
        if (params.has('intensity') ||
            params.has('duration') ||
            params.has('frequency')) {
            intensity = parseFloat(params.get('intensity') || '0.3');
            duration = parseFloat(params.get('duration') || '1');
            frequency = parseFloat(params.get('frequency') || '0.3');
        } else {
            // 按顺序解析：强度,持续时间,频率
            const values = attributes.split(',').map(v => v.trim()).filter(v => v);
            intensity = parseFloat(values[0]) || 0.3;
            duration = parseFloat(values[1]) || 1;
            frequency = parseFloat(values[2]) || 0.3;
        }

        console.log(`执行震动效果: 强度=${intensity}, 持续时间=${duration}, 频率=${frequency}`);

        // 实现震动效果 - 不阻塞，立即返回
        const viewport = CanvasManager.getInstance().viewport;
        const originalCenter = { x: viewport.center.x, y: viewport.center.y };

        // 震动实现 - 异步执行，不阻塞对话
        const startTime = Date.now();
        const shake = () => {
            const elapsed = (Date.now() - startTime) / 1000; // 转换为秒

            if (elapsed < duration) {
                // 计算震动偏移
                const shakeX = (Math.random() - 0.5) * intensity * Math.sin(elapsed * frequency * Math.PI * 2);
                const shakeY = (Math.random() - 0.5) * intensity * Math.sin(elapsed * frequency * Math.PI * 2);

                // 应用震动偏移
                viewport.moveCenter(originalCenter.x + shakeX, originalCenter.y + shakeY);

                // 继续震动
                requestAnimationFrame(shake);
            } else {
                // 震动结束，还原位置
                viewport.moveCenter(originalCenter.x, originalCenter.y);
            }
        };

        // 开始震动 - 不等待完成，立即返回
        shake();

        // 立即返回，不阻塞对话
        return Promise.resolve();
    }
};

/**
 * 颜色标签处理器
 * 用法: <color:颜色值/>
 * 示例: <color:red/>, <color:#FF0000/>
 */
export const ColorTagHandler: TagHandler = {
    name: 'color',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const color = attributes.trim() || 'white';

        console.log(`设置文本颜色: ${color}`);

        // TODO: 实现具体的颜色设置逻辑
        if (context.textElement) {
            // 例如: context.textElement.tint = parseColor(color);
        }
    }
};

/**
 * 淡入淡出标签处理器
 * 用法: <fade:方向,持续时间/>
 * 示例: <fade:in/>, <fade:out,2s/>
 */
export const FadeTagHandler: TagHandler = {
    name: 'fade',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const params = parseTagAttributes(attributes);
        const direction = params.get('') || params.get('direction') || 'in';
        const duration = params.get('duration') || params.get('持续时间') || '1s';

        console.log(`执行淡化效果: 方向=${direction}, 持续时间=${duration}`);

        // TODO: 实现具体的淡化效果
        if (context.textElement) {
            // 例如: context.textElement.fade(direction, duration);
        }
    }
};

/**
 * 缩放标签处理器
 * 用法: <scale:倍数,持续时间/>
 * 示例: <scale:1.2/>, <scale:0.8,1s/>
 */
export const ScaleTagHandler: TagHandler = {
    name: 'scale',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const params = parseTagAttributes(attributes);
        const scale = parseFloat(params.get('') || params.get('scale') || '1.0');
        const duration = params.get('duration') || params.get('持续时间') || '0.5s';

        console.log(`执行缩放效果: 倍数=${scale}, 持续时间=${duration}`);

        // TODO: 实现具体的缩放效果
        if (context.textElement) {
            // 例如: context.textElement.scaleTo(scale, duration);
        }
    }
};

/**
 * 旋转标签处理器
 * 用法: <rotate:角度,持续时间/>
 * 示例: <rotate:90/>, <rotate:180,2s/>
 */
export const RotateTagHandler: TagHandler = {
    name: 'rotate',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const params = parseTagAttributes(attributes);
        const angle = parseFloat(params.get('') || params.get('angle') || '0');
        const duration = params.get('duration') || params.get('持续时间') || '1s';

        console.log(`执行旋转效果: 角度=${angle}度, 持续时间=${duration}`);

        // TODO: 实现具体的旋转效果
        if (context.textElement) {
            // 例如: context.textElement.rotateTo(angle, duration);
        }
    }
};

/**
 * 声音标签处理器
 * 用法: <sound:音频文件/>
 * 示例: <sound:click.wav/>, <sound:bgm.mp3/>
 */
export const SoundTagHandler: TagHandler = {
    name: 'sound',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const soundFile = attributes.trim();

        console.log(`播放声音: ${soundFile}`);

        // TODO: 实现具体的声音播放逻辑
        // 例如: AudioManager.play(soundFile);
    }
};

/**
 * 暂停标签处理器
 * 用法: <pause:时间/>
 * 示例: <pause:1s/>, <pause:500ms/>
 */
export const PauseTagHandler: TagHandler = {
    name: 'pause',
    wait: false,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const duration = attributes.trim() || '1s';

        console.log(`暂停文本显示: ${duration}`);

        // TODO: 实现具体的暂停逻辑
        // 例如: TextRenderer.pause(parseDuration(duration));
    }
};

/**
 * 等待标签处理器
 * 用法: <wait:时间/>
 * 示例: <wait:100/>, <wait:1000/>
 */
export const WaitTagHandler: TagHandler = {
    name: 'wait',
    wait: true,
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
        const waitTime = parseInt(attributes.trim()) || 100; // 默认100ms

        console.log(`等待 ${waitTime}ms`);

        // 返回Promise来阻塞对话指定时间
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, waitTime);
        });
    }
};

/**
 * 动画标签处理器
 * 在对话过程中控制场景中任意角色的 Spine 动画，可控制循环与非循环、延迟播放、承接上一个同角色动画。
 * 非循环动画播放完毕后会自动恢复该角色在标签触发前的循环动画（无则恢复 idle）。
 *
 * 用法(位置参数): <anim:角色名,动画名,循环,延迟ms/>
 * 用法(键值参数): <anim:char:角色名,animation:动画名,loop:false,delay:500,queue:true,prev:idle/>
 * 示例:
 *   <anim:红冬,idle/>                       -> 让红冬循环播放 idle
 *   <anim:红冬,attack,false/>                -> 让红冬播放一次 attack 后恢复
 *   <anim:红冬,attack,false,500/>            -> 延迟500ms后播放一次 attack
 *   <anim:红冬,attack2,false,queue:true/>    -> 等上一个同角色 anim 动画播完后再播 attack2
 *   <anim:char:c030,animation:delight,loop:false/>  -> c030 播放一次 delight 后恢复
 *   <anim:char:c030,animation:delight,loop:false,prev:idle/> -> 播完后恢复到指定 idle
 *   <anim:char:红冬,animation:attack,loop:false,delay:500,queue:true/>
 *
 * 参数说明:
 *   loop  : 省略或非 "false" 均视为循环播放。非循环动画播完恢复基础动画(idle)。
 *   delay : 延迟播放的毫秒数，默认 0。
 *   queue : true 时承接上一个同角色的 anim 标签动画播放完毕后再播放(仅对上一个非循环动画有效)。
 *   prev  : 指定非循环动画播放完毕后恢复到的动画名，覆盖默认的"标签触发前的当前动画"。
 *
 * 角色匹配: 依次用 显示名(别名/翻译) / characterName / characterId 匹配场景角色。
 */
export const AnimTagHandler: TagHandler = {
    name: 'anim',
    wait: false,
    async execute(attributes: string, _context: TagExecutionContext): Promise<void> {
        const { useActionStore } = await import('../../stores/action-store');
        const { getCharacterDisplayName } = await import('../../utils/character-name');
        const { getCharacterId } = await import('../../utils/character');

        const actionStore = useActionStore();

        // 解析参数：兼容位置参数与键值参数混合
        // 键值键白名单（避免把角色名/动画名中的冒号误判为键值）
        const KV_KEYS = ['char', 'animation', 'loop', 'delay', 'queue', 'prev'];
        const parts = attributes.split(',').map(v => v.trim()).filter(v => v);
        const kvMap = new Map<string, string>();
        const positional: string[] = [];

        for (const part of parts) {
            const colonIdx = part.indexOf(':');
            const key = colonIdx !== -1 ? part.substring(0, colonIdx).trim() : '';
            if (key && KV_KEYS.includes(key)) {
                kvMap.set(key, part.substring(colonIdx + 1).trim());
            } else {
                positional.push(part);
            }
        }

        const charName = (kvMap.get('char') || positional[0] || '').trim();
        const animationName = (kvMap.get('animation') || positional[1] || '').trim();
        const loop = (kvMap.get('loop') || positional[2] || 'true').toLowerCase() !== 'false';
        const delayMs = parseInt(kvMap.get('delay') || positional[3] || '0') || 0;
        const queue = (kvMap.get('queue') || 'false').toLowerCase() === 'true';
        const prevAnim = (kvMap.get('prev') || '').trim();

        if (!charName || !animationName) {
            console.warn('[anim标签] 缺少角色名或动画名');
            return;
        }

        // 在场景角色中查找匹配的角色
        const targetCharacter = actionStore.maxCharacter.find(char => {
            const displayName = getCharacterDisplayName(char.character);
            const id = getCharacterId(char.character);
            return displayName === charName ||
                char.character.characterName === charName ||
                id === charName;
        });

        if (!targetCharacter?.spine?.state) {
            console.warn(`[anim标签] 未在场景中找到角色: ${charName}`);
            return;
        }

        const spine = targetCharacter.spine;
        const characterId = getCharacterId(targetCharacter.character);

        // 检查动画是否存在
        if (!spine.state.data.skeletonData.findAnimation(animationName)) {
            console.warn(`[anim标签] 角色 ${charName} 没有动画: ${animationName}`);
            return;
        }

        // 与对话系统对齐：首次操作该角色时，为其所有动画对预设全局 mix（参考 animation-config.ts:192-202）
        // 这样无论从哪个动画切到哪个动画都有平滑过渡
        const ANIM_MIX_DURATION = 0.2;
        if (!animMixInitialized.has(characterId)) {
            const animations = spine.state.data.skeletonData.animations;
            animations.forEach((anim: any) => {
                animations.forEach((targetAnim: any) => {
                    if (anim !== targetAnim && spine.state.data.setMix) {
                        spine.state.data.setMix(anim.name, targetAnim.name, ANIM_MIX_DURATION);
                    }
                });
            });
            animMixInitialized.add(characterId);
        }

        // 实际播放动画的逻辑（与对话系统 ui-render.ts:932-957 同轨道同方式切换）
        const playAnim = () => {
            // 获取当前轨道0的动画（实时读取，不依赖过时记录）
            const currentTrack = spine.state.tracks?.[0] as any;
            const currentAnimation = currentTrack?.animation;
            const currentAnimationName = currentAnimation?.name;

            // 与对话系统一致：当前已经在播放该动画则不重复触发
            if (currentAnimationName === animationName) {
                return;
            }

            if (loop) {
                // 循环播放：直接在轨道0设置（与对话系统 ui-render.ts:948 一致）
                spine.state.setAnimation(0, animationName, true);
                console.log(`[anim标签] 角色 ${charName} 循环播放动画: ${animationName}`);
            } else {
                // 非循环播放：播放一次后用 addAnimation 排队恢复
                // 恢复目标优先级：prev 指定 > 标签触发前的当前动画 > idle
                let baseAnim: string | undefined;
                if (prevAnim) {
                    // 用户指定了恢复动画，校验是否存在
                    if (spine.state.data.skeletonData.findAnimation(prevAnim)) {
                        baseAnim = prevAnim;
                    } else {
                        console.warn(`[anim标签] 角色 ${charName} 的 prev 动画不存在: ${prevAnim}，回退到当前动画`);
                    }
                }
                if (!baseAnim) {
                    baseAnim = currentAnimationName;
                }
                if (!baseAnim && spine.state.hasAnimation('idle')) {
                    baseAnim = 'idle';
                }

                // 播放一次目标动画（与对话系统 ui-render.ts:950 一致）
                spine.state.setAnimation(0, animationName, false);

                if (baseAnim) {
                    // 用 addAnimation 排队恢复：Spine 在非循环动画结束后自动切回
                    // 关键：若期间对话系统在轨道0设了新动画，会自动清除这个排队——正好不打扰后续状态
                    spine.state.addAnimation(0, baseAnim, true, 0);
                    console.log(`[anim标签] 角色 ${charName} 播放一次动画: ${animationName}，结束后恢复 ${baseAnim}`);
                } else {
                    console.warn(`[anim标签] 角色 ${charName} 播放一次动画: ${animationName}，无基础动画可恢复且无 idle`);
                }
            }
        };

        // 异步执行：queue 等待上一个同角色 anim 动画完成 -> delay 延迟 -> 播放
        // wait:false 时 handler 不阻塞对话文字显示，内部异步逻辑自行运转
        const runAnimation = async (): Promise<void> => {
            // 1. queue: 承接上一个同角色 anim 动画播放完毕
            if (queue) {
                const prevPromise = animChainPromise.get(characterId);
                if (prevPromise) {
                    await prevPromise;
                }
            }

            // 2. delay: 延迟播放
            if (delayMs > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, delayMs));
            }

            // 3. 播放动画
            playAnim();

            // 4. 非循环动画：等动画播完才算结束（用于下一个 queue 承接）
            if (!loop) {
                const duration = spine.state.data.skeletonData.findAnimation(animationName)?.duration || 1;
                await new Promise<void>(resolve => setTimeout(resolve, duration * 1000));
            }
        };

        // 启动并记录 chain promise（供下一个 queue:true 承接）
        const chainPromise = runAnimation();
        if (!loop) {
            // 非循环动画记录完成 promise，下一个同角色 queue 会等待它
            animChainPromise.set(characterId, chainPromise);
        } else {
            // 循环动画没有"播放完毕"概念，清除 chain（下一个 queue 不必等待）
            animChainPromise.delete(characterId);
        }
    }
};

// 存储每个角色上一个非循环 anim 标签动画的完成 Promise（用于 queue 承接）
const animChainPromise = new Map<string, Promise<void>>();
// 记录哪些角色已预设过全局动画 mix（与对话系统 animation-config.ts 全局 mix 对齐）
const animMixInitialized = new Set<string>();

/**
 * 解析标签属性
 * 将 "key1:value1,key2:value2" 格式的字符串解析为 Map
 */
function parseTagAttributes(attributes: string): Map<string, string> {
    const result = new Map<string, string>();

    if (!attributes.trim()) {
        return result;
    }

    // 分割属性
    const pairs = attributes.split(',');

    for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');

        if (colonIndex === -1) {
            // 没有冒号，整个作为默认值
            result.set('', pair.trim());
        } else {
            // 有冒号，分割键值对
            const key = pair.substring(0, colonIndex).trim();
            const value = pair.substring(colonIndex + 1).trim();
            result.set(key, value);
        }
    }

    return result;
}

// 自动注册所有预定义的标签处理器
TextTagHandlerManager.registerHandler(ShakeTagHandler);
TextTagHandlerManager.registerHandler(ColorTagHandler);
TextTagHandlerManager.registerHandler(FadeTagHandler);
TextTagHandlerManager.registerHandler(ScaleTagHandler);
TextTagHandlerManager.registerHandler(RotateTagHandler);
TextTagHandlerManager.registerHandler(SoundTagHandler);
TextTagHandlerManager.registerHandler(PauseTagHandler);
TextTagHandlerManager.registerHandler(WaitTagHandler);
TextTagHandlerManager.registerHandler(AnimTagHandler);

// 导出便捷函数
export const executeTextTag = TextTagHandlerManager.executeTag;
export const registerTagHandler = TextTagHandlerManager.registerHandler;
export const hasTagHandler = TextTagHandlerManager.hasHandler;