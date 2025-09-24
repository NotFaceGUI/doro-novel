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
    async execute(attributes: string, context: TagExecutionContext): Promise<void> {
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

// 导出便捷函数
export const executeTextTag = TextTagHandlerManager.executeTag;
export const registerTagHandler = TextTagHandlerManager.registerHandler;
export const hasTagHandler = TextTagHandlerManager.hasHandler;