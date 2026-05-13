import { Container, Graphics, NineSlicePlane, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { Sound } from '@pixi/sound';
import { buttonEntrySound, buttonHoverSound, buttonSelectSound, nvButtonTexture, leftDecorTexture, leftButtonTexture, daArrowTexture } from '../render/default-load';
import { AdvancedBloomFilter } from 'pixi-filters';
import { Action } from 'pixijs-actions';
import { KeyboardManager } from './keyboard-manager';
import { set } from 'lodash';

/**
 * 按钮配置选项
 */
export interface ButtonOptions {
    scaleFactor: number;
    /** 按钮文本 */
    text: string;
    /** 按钮宽度 */
    width?: number;
    /** 按钮高度 */
    height?: number;
    /** 最小宽度 */
    minWidth?: number;
    /** 文本样式 */
    textStyle?: Partial<TextStyle>;
    /** 是否根据文本自动调整按钮尺寸 */
    autoSizeToText?: boolean;
    /** 点击回调函数 */
    onClick?: () => void;
    /** 释放回调函数 */
    onRelease?: () => void;
    /** 按钮序号，默认为1 */
    orderNumber?: number;
    /** 音效控制选项 */
    soundOptions?: {
        /** 是否播放进入音效 */
        enableEntry?: boolean;
        /** 是否播放悬停音效 */
        enableHover?: boolean;
        /** 是否播放选择音效 */
        enableSelect?: boolean;
    };
    /** 自定义音效路径 */
    customSounds?: {
        entry?: string;
        hover?: string;
        select?: string;
    };
}

/**
 * 九宫格按钮组件
 * 支持自适应文本大小、音效播放和装饰图案
 */
export class ButtonComponent extends Container {
    private nine!: NineSlicePlane;
    private center!: Sprite;
    private centerColor!: Sprite;
    private colorMask!: Sprite;
    private leftDecor!: Sprite;
    private rightDecor!: Sprite;
    private label!: Text;
    private orderIcon!: Container; // 序号图标容器
    private rightArrow!: Sprite; // 右侧箭头
    private leftArrow!: Sprite; // 左侧箭头
    private keyboardManager: KeyboardManager; // 键盘管理器实例

    // 点击动画相关
    private clickAnimation!: Sprite;
    private isAnimating: boolean = false;


    private options: Required<ButtonOptions> & {
        soundOptions: {
            enableEntry: boolean;
            enableHover: boolean;
            enableSelect: boolean;
        };
    };
    private soundInstances: {
        entry?: Sound;
        hover?: Sound;
        select?: Sound;
    } = {};
    private selected: boolean = false;
    private longPressTimer: any = null;
    private longPressInterval: any = null;
    private readonly LONG_PRESS_DELAY = 500; // 长按延迟时间（毫秒）
    private readonly LONG_PRESS_INTERVAL = 100; // 长按重复间隔（毫秒）

    // 九宫格切片参数
    private static readonly SLICE_LEFT = 75;
    private static readonly SLICE_TOP = 6;
    private static readonly SLICE_RIGHT = 75;
    private static readonly SLICE_BOTTOM = 6;

    // 装饰图案高度
    private static readonly DECOR_HEIGHT = 200;

    // 默认箭头大小
    private static readonly DEFAULT_ARROW_SIZE = 18;

    constructor(options: ButtonOptions) {
        super();



        // 设置默认选项
        this.options = {
            scaleFactor: options.scaleFactor,
            text: options.text,
            width: (options.width || 500) * options.scaleFactor,
            height: (options.height || 96) * options.scaleFactor,
            minWidth: (options.minWidth || 300) * options.scaleFactor,
            textStyle: {
                fill: '#ffffff',
                fontSize: 24 * options.scaleFactor,
                lineHeight: 35 * options.scaleFactor,
                fontWeight: 'bold',
                align: 'center',
                ...options.textStyle
            },
            autoSizeToText: options.autoSizeToText !== false,
            onClick: options.onClick || (() => { }),
            onRelease: options.onRelease || (() => { }),
            orderNumber: options.orderNumber || 1,
            soundOptions: {
                enableEntry: options.soundOptions?.enableEntry !== false, // 默认启用进入音效
                enableHover: options.soundOptions?.enableHover !== false, // 默认启用悬停音效
                enableSelect: options.soundOptions?.enableSelect !== false, // 默认启用选择音效
            },
            customSounds: options.customSounds || {}
        };

        this.initializeButton();
        this.setupEvents();

        // 初始化键盘管理器并注册按钮
        this.keyboardManager = KeyboardManager.getInstance();
        this.keyboardManager.registerButton(this.options.orderNumber, () => {
            this.onPointerDown()
            setTimeout(() => {
                this.onPointerUp()
            }, 100);
        });



        console.log("log", this.options)
        // 预加载音效并播放按钮出现音效
        if (this.options.soundOptions.enableEntry || this.options.soundOptions.enableHover || this.options.soundOptions.enableSelect) {
            this.preloadSounds().then(() => {
                if (this.options.soundOptions.enableEntry) {
                    this.playSound('entry');
                }
            });
        }
    }

    /**
     * 播放点击动画
     */
    private playClickAnimation(): void {
        if (this.isAnimating) return; // 防止重复播放动画


        this.isAnimating = true;

        const action = Action.group([
            Action.fadeOut(0.2).easeInOut(),
            Action.scaleTo(1.3 * this.options.scaleFactor, 0.25).easeInOut(),
        ]);


        this.colorMask.run(Action.group([
            Action.fadeAlphaTo(0.6, 0.2),
            Action.scaleBy(5, 7),
        ]))

        this.run(action);

        setTimeout(() => {
            this.isAnimating = false;
            this.destroy();
        }, 300);
    }

    /**
     * 创建点击动画元素
     */
    private createClickAnimation(): void {
        // 创建一个圆形图形作为动画元素
        const graphics = new Graphics();
        graphics.beginFill(0x09BDF6); // 设置颜色为 #09BDF6
        graphics.drawCircle(0, 0, 30 * this.options.scaleFactor); // 创建圆形
        graphics.endFill();

        // 创建纹理并生成精灵
        this.clickAnimation = new Sprite(Texture.WHITE);

        // 设置初始属性
        this.clickAnimation.anchor.set(0.5);
        this.clickAnimation.x = this.options.width / 2;
        this.clickAnimation.y = this.options.height / 2;
        this.clickAnimation.alpha = 0; // 初始透明
        this.clickAnimation.scale.set(0); // 初始缩放为0

        // 创建并应用AdvancedBloomFilter
        const bloomFilter = new AdvancedBloomFilter({
            threshold: 0.9,
            quality: 10,
            pixelSize: 1,
            resolution: 4
        });
        this.clickAnimation.filters = [bloomFilter];

        this.addChild(this.clickAnimation);
    }

    /**
     * 初始化按钮组件
     */
    private async initializeButton(): Promise<void> {
        try {
            // 加载纹理资源
            const buttonTexture = await nvButtonTexture();
            const decorTexture = await leftDecorTexture();

            this.createNineSlice(buttonTexture);
            this.createCenterMasks();
            this.createDecorations(decorTexture);
            this.createClickAnimation();
            this.createText();
            await this.createOrderIcon(); // 创建序号图标
            if (this.options.autoSizeToText) {
                this.adjustSizeToText();
            }

            // 在所有组件创建完成后设置pivot，确保width和height已正确计算
            this.pivot.set(this.options.width / 2, this.options.height / 2 + 20);

            this.colorMask = new Sprite(Texture.WHITE);
            this.colorMask.width = this.options.width;
            this.colorMask.height = this.options.height;
            this.colorMask.x = this.options.width / 2;
            this.colorMask.y = this.options.height / 2;

            this.colorMask.tint = 0x00aeff;
            this.colorMask.alpha = 0;

            this.colorMask.anchor.set(0.5);

            this.alpha = 0;
            this.addChild(this.colorMask);
            await this.createRightLeftArrow(); // 创建右侧箭头

            const action = Action.group([
                Action.fadeIn(0.3).easeInOut(),
                Action.moveByY(-50, 0.25).easeInOut(),
            ]);
            this.run(action);

        } catch (error) {
            console.error('按钮初始化失败:', error);
            this.createFallbackButton();
        }
    }

    /**
     * 创建九宫格背景
     */
    private createNineSlice(texture: Texture): void {
        this.nine = new NineSlicePlane(
            texture,
            ButtonComponent.SLICE_LEFT,
            ButtonComponent.SLICE_TOP,
            ButtonComponent.SLICE_RIGHT,
            ButtonComponent.SLICE_BOTTOM
        );
        this.nine.width = this.options.width;
        this.nine.height = this.options.height;
        this.addChild(this.nine);
    }

    /**
     * 创建中心遮罩区域
     */
    private createCenterMasks(): void {
        // 基础中心区域
        this.center = new Sprite(Texture.WHITE);
        this.center.width = this.options.width - 12;
        this.center.height = this.options.height - ButtonComponent.SLICE_TOP - ButtonComponent.SLICE_BOTTOM;
        this.center.x = 6;
        this.center.y = ButtonComponent.SLICE_TOP;
        this.center.tint = 0x00aeff;
        this.center.alpha = 1;
        this.addChild(this.center);


        // 颜色变化层
        this.centerColor = new Sprite(Texture.WHITE);
        this.centerColor.width = this.center.width + 2 * this.options.scaleFactor;
        this.centerColor.height = this.center.height + 2 * this.options.scaleFactor;
        this.centerColor.x = this.center.x * this.options.scaleFactor - 0.5;
        this.centerColor.y = this.center.y * this.options.scaleFactor - 0.5;
        this.centerColor.tint = 0x00aeff;
        this.centerColor.alpha = 0;
        this.addChild(this.centerColor);

    }

    /**
     * 创建装饰图案
     */
    private createDecorations(texture: Texture): void {
        // 创建高级发光滤镜
        const glowFilter = new AdvancedBloomFilter({
            threshold: 0.9,       // 设置颜色需要多亮才能影响 Bloom（0.9 适合天蓝色发光）
            quality: 10,          // 模糊质量（10 是一个高质量设置，适合更好的视觉效果）
            pixelSize: 1,         // 像素大小（1 是常规的设置，适用于大多数场景）
            resolution: 4         // 分辨率（设置为 4 提供较高的分辨率，适用于大多数应用）
        });

        // 左侧装饰
        this.leftDecor = new Sprite(texture);
        this.leftDecor.height = ButtonComponent.DECOR_HEIGHT * this.options.scaleFactor;
        this.leftDecor.scale.x = this.leftDecor.scale.y;
        this.leftDecor.scale.y = this.leftDecor.scale.y;
        this.leftDecor.y = this.center.y + (this.center.height - ButtonComponent.DECOR_HEIGHT * this.options.scaleFactor) / 2;
        this.leftDecor.x = 6;
        this.leftDecor.tint = 0x78e4ff; // 天蓝色调
        this.leftDecor.filters = [glowFilter]; // 添加高级发光效果
        this.leftDecor.mask = this.center;
        this.addChild(this.leftDecor);



        // 右侧装饰（水平翻转）
        this.rightDecor = new Sprite(texture);
        this.rightDecor.height = ButtonComponent.DECOR_HEIGHT * this.options.scaleFactor;
        this.rightDecor.scale.x = -Math.abs(this.leftDecor.scale.y);
        this.rightDecor.scale.y = Math.abs(this.leftDecor.scale.y);
        this.rightDecor.y = this.leftDecor.y;
        this.rightDecor.x = this.options.width - 6;
        this.rightDecor.tint = 0x78e4ff; // 天蓝色调
        this.rightDecor.filters = [glowFilter]; // 添加高级发光效果
        this.rightDecor.mask = this.center;
        this.addChild(this.rightDecor);
    }

    /**
     * 创建序号图标
     */
    private async createOrderIcon(): Promise<void> {
        try {
            const orderTexture = await leftButtonTexture();

            // 创建序号图标容器
            this.orderIcon = new Container();

            // 创建背景图标
            const iconBackground = new Sprite(orderTexture);
            iconBackground.anchor.set(0.5);

            // 缩放图标以适应按钮高度
            const iconSize = this.options.height * 0.4; // 图标大小为按钮高度的60%
            iconBackground.width = iconSize;
            iconBackground.height = iconSize;

            this.orderIcon.addChild(iconBackground);

            // 创建序号文本
            const orderText = new Text(this.options.orderNumber.toString(), {
                fill: '#ffffff',
                fontSize: iconSize * 0.6, // 文字大小为图标大小的60%
                fontWeight: 'bold',
                align: 'center'
            });
            orderText.anchor.set(0.5);
            this.orderIcon.addChild(orderText);

            // 定位序号图标到按钮左侧垂直居中，超出容器一半宽度
            this.orderIcon.x = -iconSize / 2; // 超出按钮左边缘图标一半宽度
            this.orderIcon.y = this.options.height / 2; // 垂直居中

            this.addChild(this.orderIcon);

        } catch (error) {
            console.error('序号图标创建失败:', error);
        }
    }

    /**
     * 创建右侧箭头
     */
    private async createRightLeftArrow(): Promise<void> {
        try {
            const arrowTexture = await daArrowTexture();

            // 创建右侧箭头
            this.rightArrow = new Sprite(arrowTexture);
            this.rightArrow.anchor.set(0.5);

            // 缩放箭头以适应按钮高度
            const arrowSize = ButtonComponent.DEFAULT_ARROW_SIZE * this.options.scaleFactor; // 箭头大小为按钮高度的40%
            this.rightArrow.width = arrowSize;
            this.rightArrow.height = arrowSize;

            // 定位箭头到按钮右侧垂直居中
            this.rightArrow.x = this.options.width - arrowSize * 1.5 * this.options.scaleFactor; // 超出按钮右边缘箭头一半宽度
            this.rightArrow.y = this.options.height / 2; // 垂直居中

            // 创建左侧箭头
            this.leftArrow = new Sprite(arrowTexture);
            this.leftArrow.anchor.set(0.5);

            // 缩放箭头以适应按钮高度
            this.leftArrow.width = arrowSize;
            this.leftArrow.height = arrowSize;

            // 定位箭头到按钮左侧垂直居中
            this.leftArrow.x = arrowSize * 1.5 * this.options.scaleFactor; // 超出按钮左边缘箭头一半宽度
            this.leftArrow.y = this.options.height / 2; // 垂直居中

            this.leftArrow.scale.x = -Math.abs(this.leftArrow.scale.x); // 水平翻转
            this.leftArrow.scale.y = Math.abs(this.leftArrow.scale.y); // 垂直保持不变

            this.leftArrow.alpha = 0;
            this.rightArrow.alpha = 0.9;
            
            this.addChild(this.leftArrow)
            this.addChild(this.rightArrow);
        } catch (error) {
            console.error('右侧箭头创建失败:', error);
        }
    }

    private createText(): void {
        this.label = new Text(this.options.text, this.getTextStyleOptions());
        this.label.anchor.set(0.5);
        this.label.x = this.options.width / 2;
        this.label.y = this.options.height / 2;
        this.addChild(this.label);
    }

    private getTextStyleOptions(): Partial<TextStyle> {
        const style: Partial<TextStyle> = {
            ...this.options.textStyle,
        };

        if (!this.options.autoSizeToText) {
            style.wordWrap = true;
            style.wordWrapWidth = Math.max(60, this.options.width - 100);
            style.breakWords = true;
        }

        return style;
    }

    /**
     * 根据文本内容调整按钮大小
     */
    private adjustSizeToText(): void {
        const textWidth = this.label.width;
        const textHeight = this.label.height;
        const padding = 100; // 文本两侧的内边距
        const verticalPadding = 40; // 文本上下的内边距

        const requiredWidth = textWidth + padding;
        const requiredHeight = textHeight + verticalPadding;

        // 确保按钮宽度不小于最小宽度
        const newWidth = Math.max(requiredWidth, this.options.minWidth * this.options.scaleFactor);

        // 确保按钮高度能够容纳文本
        const newHeight = Math.max(requiredHeight, this.options.height);

        let sizeChanged = false;

        if (newWidth !== this.options.width) {
            this.options.width = newWidth;
            sizeChanged = true;
        }

        if (newHeight !== this.options.height) {
            this.options.height = newHeight;
            sizeChanged = true;
        }

        if (sizeChanged) {
            this.updateSize();
        }
    }

    /**
     * 更新按钮尺寸
     */
    private updateSize(): void {
        // 更新九宫格
        this.nine.width = this.options.width;
        this.nine.height = this.options.height;

        // 更新中心区域
        this.center.width = this.options.width - 12 * this.options.scaleFactor;
        this.center.height = this.options.height - (ButtonComponent.SLICE_TOP * this.options.scaleFactor) - (ButtonComponent.SLICE_BOTTOM * this.options.scaleFactor);
        this.centerColor.width = this.center.width;
        this.centerColor.height = this.center.height;
        this.centerColor.x = this.center.x * this.options.scaleFactor - 0.5;
        this.centerColor.y = this.center.y * this.options.scaleFactor - 0.5;

        if (this.colorMask) {
            this.colorMask.width = this.options.width;
            this.colorMask.height = this.options.height;
            this.colorMask.x = this.options.width / 2;
            this.colorMask.y = this.options.height / 2;
        }

        // 更新装饰位置
        this.rightDecor.x = this.options.width - 6 * this.options.scaleFactor;
        this.leftDecor.y = this.center.y + (this.center.height - ButtonComponent.DECOR_HEIGHT * this.options.scaleFactor) / 2;
        this.rightDecor.y = this.leftDecor.y;

        // 更新文本位置
        this.label.x = this.options.width / 2;
        this.label.y = this.options.height / 2;

        // 更新序号图标位置
        if (this.orderIcon) {
            this.orderIcon.x = 0;
            this.orderIcon.y = this.options.height / 2;
        }

        // 更新右侧箭头位置
        if (this.rightArrow) {
            const arrowSize = ButtonComponent.DEFAULT_ARROW_SIZE * this.options.scaleFactor;
            // 定位箭头到按钮右侧垂直居中
            this.rightArrow.x = this.options.width - arrowSize * 1.5 * this.options.scaleFactor; // 超出按钮右边缘箭头一半宽度
            this.rightArrow.y = this.options.height / 2; // 垂直居中
        }

        // 更新左侧箭头位置
        if (this.leftArrow) {
            const arrowSize = ButtonComponent.DEFAULT_ARROW_SIZE * this.options.scaleFactor;
            // 定位箭头到按钮左侧垂直居中
            this.leftArrow.x = -arrowSize * 1.5 * this.options.scaleFactor; // 超出按钮左边缘箭头一半宽度
            this.leftArrow.y = this.options.height / 2; // 垂直居中
        }

    }

    /**
     * 创建备用按钮（当纹理加载失败时）
     */
    private createFallbackButton(): void {
        // 创建简单的矩形背景
        const graphics = new Graphics();
        graphics.beginFill(0x4a90e2);
        graphics.drawRoundedRect(0, 0, this.options.width, this.options.height, 10);
        graphics.endFill();
        this.addChild(graphics);

        // 创建文本
        this.createText();

        // 在fallback情况下也设置pivot
        this.pivot.set(this.width / 2, this.height / 2);
    }

    /**
     * 设置事件监听
     */
    private setupEvents(): void {
        this.eventMode = 'static';
        this.cursor = 'pointer';

        setTimeout(() => {
            this.on('pointerdown', this.onPointerDown.bind(this));
            this.on('pointerup', this.onPointerUp.bind(this));
            this.on('pointerupoutside', this.onPointerUpOutside.bind(this));
            this.on('pointerover', this.onPointerOver.bind(this));
            this.on('pointerout', this.onPointerOut.bind(this));
        }, 200);
    }

    /**
     * 鼠标按下事件
     */
    private onPointerDown(): void {
        this.selected = true;
        if (this.centerColor) {
            this.centerColor.alpha = 1;
            this.centerColor.tint = 0x09BDF6;
        }

        if (this.leftArrow) {
            this.leftArrow.alpha = 1;
            this.rightArrow.alpha = 1;
        }

        if (this.options.soundOptions.enableSelect) {
            this.playSound('select');
        }

        // 立即触发一次点击事件
        this.executeClick();

        // 设置长按计时器
        this.longPressTimer = setTimeout(() => {
            // 开始长按重复触发
            this.longPressInterval = setInterval(() => {
                if (this.selected) {
                    this.executeClick();
                }
            }, this.LONG_PRESS_INTERVAL);
        }, this.LONG_PRESS_DELAY);

        // 按下缩放动画
        this.run(Action.scaleTo(this.options.scaleFactor * 0.95, 0.1));
    }

    /**
     * 鼠标释放事件
     */
    private onPointerUp(): void {
        this.clearLongPressTimers();
        this.playClickAnimation();
        this.deselect();

        // 调用释放回调
        this.options.onRelease();
    }

    /**
     * 鼠标在外部释放事件
     */
    private onPointerUpOutside(): void {
        this.clearLongPressTimers();
        this.deselect();
    }

    /**
     * 鼠标悬停事件
     */
    private onPointerOver(): void {
        if (this.options.soundOptions.enableHover && !this.selected) {
            this.playSound('hover');
        }
    }

    /**
     * 鼠标离开事件
     */
    private onPointerOut(): void {
        // 可以在这里添加悬停离开的效果
    }

    /**
     * 取消选中状态
     */
    public deselect(): void {
        this.selected = false;
    }

    /**
     * 清除长按计时器
     */
    private clearLongPressTimers(): void {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (this.longPressInterval) {
            clearInterval(this.longPressInterval);
            this.longPressInterval = null;
        }
    }

    /**
     * 执行点击操作
     */
    private executeClick(): void {
        // 执行点击回调
        this.options.onClick();
    }

    /**
     * 预加载音效
     */
    private async preloadSounds(): Promise<void> {
        const needsAnySound = this.options.soundOptions.enableEntry ||
            this.options.soundOptions.enableHover ||
            this.options.soundOptions.enableSelect;

        if (!needsAnySound) return;

        try {
            // 使用预加载的音频对象
            this.soundInstances.entry = await buttonEntrySound();
            this.soundInstances.hover = await buttonHoverSound();
            this.soundInstances.select = await buttonSelectSound();

            console.log('按钮音效预加载完成');
        } catch (error) {
            console.warn('按钮音效预加载失败:', error);
        }
    }

    /**
     * 播放音效
     */
    private playSound(type: 'entry' | 'hover' | 'select'): void {
        try {
            // 检查对应类型的音效是否启用
            const soundEnabled = {
                'entry': this.options.soundOptions.enableEntry,
                'hover': this.options.soundOptions.enableHover,
                'select': this.options.soundOptions.enableSelect
            };

            if (!soundEnabled[type]) return;

            const sound = this.soundInstances[type];
            if (sound) {
                sound.volume = 0.5; // 设置音量
                sound.play();
            }
        } catch (error) {
            console.warn(`音效播放失败: ${type}`, error);
        }
    }

    /**
     * 更新按钮文本
     */
    public setText(text: string): void {
        this.options.text = text;
        if (this.label) {
            this.label.text = text;
            this.adjustSizeToText();
        }
    }

    /**
     * 更新按钮文本样式
     */
    public updateTextStyle(style: Partial<TextStyle>): void {
        this.options.textStyle = {
            ...this.options.textStyle,
            ...style,
        };

        if (!this.label) {
            return;
        }

        this.label.style = new TextStyle(this.getTextStyleOptions());

        this.label.x = this.options.width / 2;
        this.label.y = this.options.height / 2;
    }

    /**
     * 获取按钮文本
     */
    public getText(): string {
        return this.options.text;
    }

    /**
     * 设置按钮是否可用
     */
    public setEnabled(enabled: boolean): void {
        this.eventMode = enabled ? 'static' : 'none';
        this.alpha = enabled ? 1 : 0.5;
        this.cursor = enabled ? 'pointer' : 'default';
    }

    /**
     * 销毁按钮组件
     */
    public destroy(): void {
        console.log('按钮组件销毁', this.name);
        // 注销键盘事件
        if (this.keyboardManager) {
            this.keyboardManager.unregisterButton(this.options.orderNumber);
        }

        // 停止并销毁音效
        Object.values(this.soundInstances).forEach(sound => {
            if (sound) {
                sound.stop();
                sound.destroy();
            }
        });
        this.soundInstances = {};

        // 清理事件监听
        this.removeAllListeners();

        // 销毁子组件
        super.destroy({
            children: true,
            texture: false, // 保留纹理，可能被其他组件使用
            baseTexture: false
        });

    }
}
