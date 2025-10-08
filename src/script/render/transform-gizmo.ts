import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import { DEFAULT_SPINE_SCALE } from '../var';
import CanvasManager from './canvas-manager';
import { GameMode } from '../../types/app';

export enum GizmoMode {
    TRANSLATE = 'translate',
    SCALE = 'scale'
}

export class TransformGizmo extends PIXI.Container {
    private static instance: TransformGizmo | null = null;
    
    private targetSpine: Spine | null = null;
    private mode: GizmoMode = GizmoMode.TRANSLATE;

    // 控制手柄
    private xAxisHandle!: PIXI.Graphics;
    private yAxisHandle!: PIXI.Graphics;
    private centerHandle!: PIXI.Graphics;
    private scaleHandles: PIXI.Graphics[] = [];

    // 交互状态
    private isDragging = false;
    private dragStartPos = { x: 0, y: 0 };
    private dragStartSpinePos = { x: 0, y: 0 };
    private dragStartSpineScale = { x: 1, y: 1 };
    private activeHandle: string | null = null;

    // 事件处理函数引用
    private boundPointerMove: ((event: PIXI.FederatedPointerEvent) => void) | null = null;
    private boundPointerUp: (() => void) | null = null;

    // 摄像机跟随相关
    private originalCameraPosition: { x: number, y: number } | null = null;

    // 位置更新回调
    private onPositionUpdateCallback: ((x: number, y: number, scale: number) => void) | null = null;

    // 样式配置
    private readonly HANDLE_SIZE = 16 * DEFAULT_SPINE_SCALE; // 增大手柄尺寸
    private readonly AXIS_LENGTH = 80 * DEFAULT_SPINE_SCALE; // 增长轴线长度
    private readonly AXIS_WIDTH = 3 * DEFAULT_SPINE_SCALE; // 增加轴线宽度
    private readonly INTERACTION_WIDTH = 30 * DEFAULT_SPINE_SCALE; // 大幅增加交互区域宽度
    private readonly X_COLOR = 0xff3b30; // 更专业的红色
    private readonly Y_COLOR = 0x34c759; // 更专业的绿色
    private readonly CENTER_COLOR = 0x007aff; // 更专业的蓝色
    private readonly SCALE_COLOR = 0xff9500; // 更专业的橙色
    private readonly HOVER_COLOR = 0xffff00; // 悬停高亮色
    private readonly OUTLINE_COLOR = 0x000000; // 轮廓色
    private readonly OUTLINE_WIDTH = 1; // 轮廓宽度
    targetSpineHeight: number = 0;

    private constructor() {
        super();

        // 设置 TransformGizmo 的名称，用于事件识别
        this.name = 'TransformGizmo';

        this.createHandles();
        this.setupInteraction();
        this.scale.set(DEFAULT_SPINE_SCALE);
        this.visible = false;
    }

    // 单例模式获取实例
    public static getInstance(): TransformGizmo {
        if (!TransformGizmo.instance) {
            TransformGizmo.instance = new TransformGizmo();
        }
        return TransformGizmo.instance;
    }

    private createHandles() {
        // 创建X轴控制手柄（红色箭头）
        this.xAxisHandle = new PIXI.Graphics();
        this.drawArrow(this.xAxisHandle, this.X_COLOR, this.AXIS_LENGTH, 0);
        this.xAxisHandle.name = 'x-axis';
        this.addChild(this.xAxisHandle);

        // 创建Y轴控制手柄（绿色箭头）
        this.yAxisHandle = new PIXI.Graphics();
        this.drawArrow(this.yAxisHandle, this.Y_COLOR, 0, -this.AXIS_LENGTH);
        this.yAxisHandle.name = 'y-axis';
        this.addChild(this.yAxisHandle);

        // 创建中心控制手柄（专业的蓝色圆形带轮廓）
        this.centerHandle = new PIXI.Graphics();
        this.drawCenterHandle(this.centerHandle, false);
        this.centerHandle.name = 'center';
        this.centerHandle.eventMode = 'static';
        this.centerHandle.cursor = 'move';
        
        this.addChild(this.centerHandle);

        // 创建四个角的缩放控制手柄
        this.createScaleHandles();
    }

    private drawArrow(graphics: PIXI.Graphics, color: number, endX: number, endY: number) {
        graphics.clear();

        // 计算轴线方向和长度
        const length = Math.sqrt(endX * endX + endY * endY);
        const angle = Math.atan2(endY, endX);
        
        // 绘制简单的轴线
        graphics.lineStyle(this.AXIS_WIDTH, color, 1);
        graphics.moveTo(0, 0);
        graphics.lineTo(endX, endY);

        // 绘制简单的箭头头部
        const arrowSize = 10 * DEFAULT_SPINE_SCALE;
        const arrowWidth = 6 * DEFAULT_SPINE_SCALE;

        graphics.beginFill(color, 1);
        graphics.moveTo(endX, endY);
        graphics.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        graphics.lineTo(
            endX - arrowWidth * Math.cos(angle),
            endY - arrowWidth * Math.sin(angle)
        );
        graphics.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        graphics.lineTo(endX, endY);
        graphics.endFill();

        // 创建大的透明交互区域覆盖整个轴线
        graphics.beginFill(0x000000, 0); // 完全透明
        
        // 扩大交互宽度
        const interactionWidth = 40 * DEFAULT_SPINE_SCALE; // 更大的交互宽度
        const halfWidth = interactionWidth / 2;
        
        // 计算垂直于轴线的方向
        const perpAngle = angle + Math.PI / 2;
        const cosPerp = Math.cos(perpAngle);
        const sinPerp = Math.sin(perpAngle);
        
        // 绘制覆盖整个轴线的大矩形交互区域
        // graphics.moveTo(-halfWidth * cosPerp, -halfWidth * sinPerp);
        // graphics.lineTo(halfWidth * cosPerp, halfWidth * sinPerp);
        // graphics.lineTo(
        //     endX + halfWidth * cosPerp,
        //     endY + halfWidth * sinPerp
        // );
        // graphics.lineTo(
        //     endX - halfWidth * cosPerp,
        //     endY - halfWidth * sinPerp
        // );
        // graphics.lineTo(-halfWidth * cosPerp, -halfWidth * sinPerp);
        // graphics.endFill();

        // 设置交互属性
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';
    }

    private createScaleHandles() {
        const positions = [
            { x: -1, y: -1 }, // 左上
            { x: 1, y: -1 },  // 右上
            { x: 1, y: 1 },   // 右下
            { x: -1, y: 1 }   // 左下
        ];

        positions.forEach((pos, index) => {
            const handle = new PIXI.Graphics();
            this.drawScaleHandle(handle, false);
            handle.name = `scale-${index}`;
            handle.visible = false; // 默认隐藏缩放手柄
            handle.eventMode = 'static';
            handle.cursor = index % 2 === 0 ? 'nw-resize' : 'ne-resize';

            this.scaleHandles.push(handle);
            this.addChild(handle);
        });
    }

    private drawScaleHandle(graphics: PIXI.Graphics, isHover: boolean) {
        graphics.clear();
        
        const color = isHover ? this.HOVER_COLOR : this.SCALE_COLOR;
        const size = this.HANDLE_SIZE;
        
        // 外轮廓
        graphics.beginFill(this.OUTLINE_COLOR, 1);
        graphics.drawRect(-size/2 - this.OUTLINE_WIDTH, -size/2 - this.OUTLINE_WIDTH, 
                         size + 2*this.OUTLINE_WIDTH, size + 2*this.OUTLINE_WIDTH);
        graphics.endFill();
        
        // 内填充
        graphics.beginFill(color, 0.9);
        graphics.drawRect(-size/2, -size/2, size, size);
        graphics.endFill();
        
        // 内部对角线标记
        graphics.lineStyle(2, 0xffffff, 0.8);
        const markSize = size * 0.3;
        graphics.moveTo(-markSize, -markSize);
        graphics.lineTo(markSize, markSize);
        graphics.moveTo(-markSize, markSize);
        graphics.lineTo(markSize, -markSize);
        
        // 交互区域
        graphics.beginFill(0x000000, 0);
        graphics.drawRect(-size/2 - 4, -size/2 - 4, size + 8, size + 8);
        graphics.endFill();
    }

    private drawCenterHandle(graphics: PIXI.Graphics, isHover: boolean) {
        graphics.clear();
        
        const color = isHover ? this.HOVER_COLOR : this.CENTER_COLOR;
        const size = this.HANDLE_SIZE;
        
        // 外轮廓
        graphics.beginFill(this.OUTLINE_COLOR, 1);
        graphics.drawCircle(0, 0, size + this.OUTLINE_WIDTH);
        graphics.endFill();
        
        // 内填充
        graphics.beginFill(color, 0.9);
        graphics.drawCircle(0, 0, size);
        graphics.endFill();
        
        // 内部十字标记
        graphics.lineStyle(2, 0xffffff, 0.8);
        const crossSize = size * 0.5;
        graphics.moveTo(-crossSize, 0);
        graphics.lineTo(crossSize, 0);
        graphics.moveTo(0, -crossSize);
        graphics.lineTo(0, crossSize);
        
        // 交互区域
        graphics.beginFill(0x000000, 0);
        graphics.drawCircle(0, 0, size + 4);
        graphics.endFill();
    }

    private setupInteraction() {
        this.eventMode = 'static';

        // 为所有子元素设置交互
        this.children.forEach(child => {
            child.eventMode = 'static';
            child.cursor = 'pointer';

            // 先移除可能存在的事件监听器，避免重复绑定
            child.off('pointerdown');

            // 只在子元素上监听 pointerdown 事件
            child.on('pointerdown', this.onPointerDown.bind(this));
        });
    }

    private onPointerDown(event: PIXI.FederatedPointerEvent) {
        if (!this.targetSpine) return;

        // 如果已经在拖拽中，先清理之前的事件监听器
        if (this.isDragging) {
            this.onPointerUp();
        }

        this.isDragging = true;
        this.activeHandle = (event.target as PIXI.DisplayObject).name;

        // 简化处理，不进行视觉状态更新

        // 记录摄像机原始位置
        const canvasManager = CanvasManager.getInstance();
        const viewport = canvasManager.viewport;

        this.originalCameraPosition = {
            x: viewport.center.x,
            y: viewport.center.y
        };

        // 使用PIXI的全局坐标而不是DOM事件坐标
        const globalPos = event.global;
        this.dragStartPos = { x: globalPos.x, y: globalPos.y };
        this.dragStartSpinePos = { x: this.targetSpine.x, y: this.targetSpine.y };
        this.dragStartSpineScale = { x: this.targetSpine.scale.x, y: this.targetSpine.scale.y };

        // 保存绑定的函数引用，以便后续移除
        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);

        // 在应用级别监听全局事件，确保鼠标移出后仍能继续拖拽
        const app = CanvasManager.getInstance().getApp();
        if (app && app.stage) {
            app.stage.eventMode = 'static';
            app.stage.on('pointermove', this.boundPointerMove);
            app.stage.on('pointerup', this.boundPointerUp);
            app.stage.on('pointerupoutside', this.boundPointerUp);
        }

        // 阻止事件冒泡，防止触发其他点击事件
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    private onPointerMove(event: PIXI.FederatedPointerEvent) {
        if (!this.isDragging || !this.targetSpine || !this.activeHandle) return;

        // 使用PIXI事件的全局坐标
        const currentGlobalPos = event.global;
        const deltaX = currentGlobalPos.x - this.dragStartPos.x;
        const deltaY = currentGlobalPos.y - this.dragStartPos.y;

        // 简化坐标转换 - 直接使用增量
        switch (this.activeHandle) {
            case 'x-axis':
                this.targetSpine.x = this.dragStartSpinePos.x + deltaX;
                break;

            case 'y-axis':
                this.targetSpine.y = this.dragStartSpinePos.y + deltaY;
                break;

            case 'center':
                this.targetSpine.x = this.dragStartSpinePos.x + deltaX;
                this.targetSpine.y = this.dragStartSpinePos.y + deltaY;
                break;

            default:
                if (this.activeHandle.startsWith('scale-')) {
                    this.handleScaleDrag(deltaX, deltaY);
                }
                break;
        }

        // 拖拽时不更新gizmo位置，避免频繁重绘
        this.updatePosition(); // 移除这行以减少重绘
    }

    private handleScaleDrag(deltaX: number, deltaY: number) {
        if (!this.targetSpine) return;

        // 计算缩放因子（基于鼠标移动距离）
        const scaleFactor = 1 + (deltaX + deltaY) * 0.005; // 降低缩放敏感度
        const newScale = Math.max(0.1, Math.min(5.0, this.dragStartSpineScale.x * scaleFactor)); // 限制缩放范围

        this.targetSpine.scale.set(newScale);

        // 缩放时更新缩放手柄位置
        this.updateScaleHandles();
    }
    private updateCameraFollow() {
        if (!this.targetSpine || !this.originalCameraPosition) return;

        const canvasManager = CanvasManager.getInstance();
        const viewport = canvasManager.viewport;

        // 计算角色相对于拖拽开始位置的偏移量
        const spineOffsetX = this.targetSpine.x - this.dragStartSpinePos.x;
        const spineOffsetY = this.targetSpine.y - this.dragStartSpinePos.y;

        // 将世界坐标偏移转换为摄像机移动
        // 摄像机需要反向移动来跟随角色
        const newCenterX = this.originalCameraPosition.x + spineOffsetX;
        const newCenterY = this.originalCameraPosition.y + spineOffsetY;

        // 直接同步移动摄像机
        viewport.moveCenter(newCenterX, newCenterY);

        viewport.emit('moved');
        viewport.emit('zoomed');
    }

    private onPointerUp(event?: PIXI.FederatedPointerEvent) {
        // 拖拽结束时恢复所有手柄的正常状态
        this.updateHandleVisualState(this.activeHandle, false);
        
        this.isDragging = false;
        this.activeHandle = null;

        const app = CanvasManager.getInstance().getApp();

        if (app && app.stage && this.boundPointerMove && this.boundPointerUp) {
            app.stage.off('pointermove', this.boundPointerMove);
            app.stage.off('pointerup', this.boundPointerUp);
            app.stage.off('pointerupoutside', this.boundPointerUp);
        }

        this.boundPointerMove = null;
        this.boundPointerUp = null;

        // 重置摄像机到原始位置
        if (this.originalCameraPosition) {
            const canvasManager = CanvasManager.getInstance();
            const viewport = canvasManager.viewport;
            viewport.moveCenter(this.originalCameraPosition.x, this.originalCameraPosition.y);
            this.originalCameraPosition = null;
        }

        // 拖拽结束后通知外部组件位置已更新
        if (this.onPositionUpdateCallback && this.targetSpine) {
            this.onPositionUpdateCallback(this.targetSpine.x, this.targetSpine.y, this.targetSpine.scale.x);
        }

        // 拖拽结束后才更新gizmo位置，减少拖拽过程中的重绘
        this.updatePosition();

        // ✅ 恢复交互
        if (app && app.stage) {
            app.stage.eventMode = 'auto';
        }
    }

    // 移除复杂的视觉状态变化，简化交互
    private updateHandleVisualState(handleName: string | null, isDragging: boolean) {
        // 简化处理，不进行复杂的视觉反馈
    }

    public setTarget(spine: Spine | null) {
        // 如果之前有目标，先从其父容器中移除
        if (this.targetSpine && this.parent) {
            this.parent.removeChild(this);

        }

        this.targetSpine = spine;
        this.targetSpineHeight = spine?.height || 0;

        if (spine) {
            // 将gizmo添加到spine的父容器中，这样它们共享同一个坐标系
            if (spine.parent) {
                spine.parent.addChild(this);
            }
            this.visible = true;
            this.updatePosition();
            this.updateScaleHandles();
        } else {
            this.visible = false;
        }
    }

    // 添加便于使用的方法别名
    public attachToSpine(spine: Spine) {
        this.setTarget(spine);
    }

    public detachFromSpine() {
        this.setTarget(null);
    }

    public setMode(mode: GizmoMode) {
        this.mode = mode;

        // 根据模式显示/隐藏不同的控制手柄
        const showTranslate = mode === GizmoMode.TRANSLATE;
        const showScale = mode === GizmoMode.SCALE;

        this.xAxisHandle.visible = showTranslate;
        this.yAxisHandle.visible = showTranslate;
        this.centerHandle.visible = showTranslate;

        this.scaleHandles.forEach(handle => {
            handle.visible = showScale;
        });

        if (showScale) {
            this.updateScaleHandles();
        }
    }

    private updatePosition() {
        if (!this.targetSpine) return;

        // gizmo应该跟随Spine的位置，使用相同的坐标
        this.x = this.targetSpine.x;
        this.y = this.targetSpine.y - this.targetSpineHeight / this.targetSpine.scale.y;
    }

    private updateScaleHandles() {
        if (!this.targetSpine) return;

        // 获取Spine的边界框
        const bounds = this.targetSpine.getBounds();
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;

        // 更新四个角的缩放手柄位置
        const positions = [
            { x: -halfWidth, y: -halfHeight }, // 左上
            { x: halfWidth, y: -halfHeight },  // 右上
            { x: halfWidth, y: halfHeight },   // 右下
            { x: -halfWidth, y: halfHeight }   // 左下
        ];

        this.scaleHandles.forEach((handle, index) => {
            handle.x = positions[index].x;
            handle.y = positions[index].y;
        });
    }

    // 设置位置更新回调
    public setOnPositionUpdateCallback(callback: (x: number, y: number, scale: number) => void) {
        this.onPositionUpdateCallback = callback;
    }

    // 移除位置更新回调
    public removeOnPositionUpdateCallback() {
        this.onPositionUpdateCallback = null;
    }

    public destroy() {
        // 确保清理全局事件监听器
        if (this.isDragging) {
            this.onPointerUp();
        }

        // 清理回调
        this.onPositionUpdateCallback = null;

        // 清理事件监听
        super.destroy();
    }
}