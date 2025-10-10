import { Spine } from 'pixi-spine';
import * as PIXI from 'pixi.js';
import massage from '../common/massage';
import { resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Viewport } from "pixi-viewport";
import { initViewportAction } from './viewport';
import { UIRender } from './ui-render';
import { loadShader } from './tmep-loader';
import { GameMode, CharacterType, sceneCharacter } from '../../types/app';
import { Action, registerPixiJSActionsMixin } from 'pixijs-actions';
import { useActionStore } from '../../stores/action-store';
import { AdvancedBloomFilter, BloomFilter, OutlineFilter } from 'pixi-filters';
import ResourceManager from '../resource-manager';
import { DEFAULT_RESOLUTION, DEFAULT_SPINE_SCALE, ResType } from '../var';
import { markRaw } from 'vue';
import { useViewportStore } from '../../stores/viewport-store';
import { set } from 'lodash';

interface Layer {
    container: PIXI.Container,
    viewport: boolean,
    sortLayer: number,
    parallaxFactor: number // 视差因子
}

interface SpriteWithUpdate extends PIXI.Sprite {
    updatePosition: () => void;
}

let lastViewportState: { zoom: any; x: any; y: any; };

class CanvasManager {
    public viewport: Viewport;
    public worldCenter: PIXI.Point;

    // Canvas的模式 预览 | 场景 | 播放
    private mode: GameMode = GameMode.PLAY;

    public initMask: PIXI.Graphics;
    public transitionMask: PIXI.Graphics;

    public inSceneCharacterMap: Spine[] = [];

    // Spine 选择回调函数集合
    private spineClickCallbacks: Map<number, (spine: Spine, characterInfo: sceneCharacter) => void> = new Map();

    // 当前应用描边效果的 Spine 对象
    private currentOutlinedSpine: Spine | null = null;

    // CG管理相关属性
    private currentCG: PIXI.Sprite | null = null;
    private lastCGPath: string = '';

    public setMode(mode: GameMode = GameMode.PLAY, record: boolean = true) {
        console.log("切换模式为：", mode);
        const action = useActionStore();
        if (action.gameMode == mode) {
            return
        }
        action.gameMode = mode;
        // 如果切换的模式为这些就需要移除viewport的的插件
        if (mode === GameMode.PREVIEW || mode === GameMode.PLAY) {
            this.viewport.plugins.remove('drag');
            this.viewport.plugins.remove('wheel');
            this.viewport.plugins.remove('clampZoom');
            if (record) {
                if (lastViewportState) {
                    this.viewport.setZoom(lastViewportState.zoom);
                    this.viewport.moveCenter(lastViewportState.x, lastViewportState.y);
                    this.viewport.emit('moved')
                }
            }


            action.isEditMode = false;
        } else {
            if (record) {
                lastViewportState = {
                    x: this.viewport.center.x,
                    y: this.viewport.center.y,
                    zoom: this.viewport.scale.x,
                }
            }

            this.viewport.drag({
                wheel: false,
            }).wheel({
                smooth: 20,
            }).clampZoom({
                minScale: 1,
                maxScale: 3,
            })

            if (record) {
                const viewportState = useViewportStore().getViewportState();
                this.viewport.setZoom(1);
                this.viewport.moveCenter(viewportState.x, viewportState.y);
                this.viewport.emit('moved')
            }


            action.isEditMode = true;
        }
        this.mode = mode;

    }

    public getMode(): GameMode {
        return this.mode;
    }


    private static instance: CanvasManager | null = null;
    private app: PIXI.Application;

    public layers: Record<string, Layer> = {};
    private widthOffset: number = 230;

    public defaultBackground: PIXI.Sprite;
    public uiRender: UIRender;

    public action;

    // 摄像机指示器
    public cameraIndicatorsStart!: PIXI.Graphics;
    public cameraIndicatorsEnd!: PIXI.Graphics;

    private drawCameraIndicator(graphics: PIXI.Graphics) {
        graphics.clear();

        // 设置线条样式
        graphics.lineStyle(2, 0x00ff00, 1); // 绿色边框
        graphics.beginFill(0x000000, 0.7);  // 黑色机身，半透明

        // 绘制机身矩形
        const bodyWidth = 20;
        const bodyHeight = 12;
        graphics.drawRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);

        // 绘制镜头（圆形）
        graphics.beginFill(0xffffff, 1); // 白色镜头
        const lensRadius = 4;
        graphics.drawCircle(bodyWidth / 2 + lensRadius / 2, 0, lensRadius);

        // 绘制闪光灯（小矩形在机身上方）
        graphics.beginFill(0xffd700, 1); // 黄色
        graphics.drawRect(-bodyWidth / 2 + 2, -bodyHeight / 2 - 4, 6, 4);

        graphics.endFill();
    };

    // 添加连线图形对象
    public cameraConnectionLine!: PIXI.Graphics;

    private drawCameraConnectionLine() {
        if (!this.cameraConnectionLine) {
            this.cameraConnectionLine = new PIXI.Graphics();
            this.app.stage.addChild(this.cameraConnectionLine);
        }

        this.cameraConnectionLine.clear();

        // 获取两个摄像机指示器的位置
        const startPos = this.cameraIndicatorsStart.position;
        const endPos = this.cameraIndicatorsEnd.position;

        // 设置连线样式
        this.cameraConnectionLine.lineStyle(20, 0xff6600, 0.8); // 橙色连线，半透明

        // 绘制连线
        this.cameraConnectionLine.moveTo(startPos.x, startPos.y);
        this.cameraConnectionLine.lineTo(endPos.x, endPos.y);

        // 在连线中点添加一个小圆点作为标记
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        
        this.cameraConnectionLine.beginFill(0xff6600, 1); // 橙色填充
        this.cameraConnectionLine.drawCircle(midX, midY, 3);
        this.cameraConnectionLine.endFill();
    };

    // 公共方法：更新摄像机连线
    public updateCameraConnectionLine() {
        // if (this.cameraIndicatorsStart && this.cameraIndicatorsEnd) {
        //     this.drawCameraConnectionLine();
        // }
    };

    private constructor() {
        const container = document.getElementById("canvas") as HTMLDivElement;
        const info = document.getElementById("canvas-info") as HTMLDivElement;
        this.defaultBackground = new PIXI.Sprite(PIXI.Texture.WHITE);
        if (!container) {
            massage("找不到Canvas", "error", 2000);
        }

        this.action = useActionStore()
        this.app = new PIXI.Application({
            width: (720 + this.widthOffset) * DEFAULT_RESOLUTION,
            height: 1280 * DEFAULT_RESOLUTION,
            backgroundColor: 0x222234, // 默认黑色背景
            resolution: 1, // 
            antialias: true
        });

        container.appendChild(this.app.view as HTMLCanvasElement);

        this.viewport = new Viewport({
            screenWidth: (720 + this.widthOffset) * DEFAULT_RESOLUTION,
            screenHeight: 1280 * DEFAULT_RESOLUTION,
            worldWidth: 2048 + this.widthOffset * DEFAULT_RESOLUTION,
            worldHeight: 1280 * DEFAULT_RESOLUTION,
            events: this.app.renderer.events,
        });

        this.createDefaultLayers()
        this.uiRender = new UIRender(this.layers['ui'].container, this.app);

        for (let layerName in this.layers) {
            if (this.layers[layerName].viewport) {
                this.viewport.addChild(this.layers[layerName].container)
            } else {
                this.app.stage.addChild(this.layers[layerName].container);
            }
            this.layers[layerName].container.zIndex = this.layers[layerName].sortLayer;
        }

        this.viewport.sortChildren();
        this.app.stage.sortChildren();

        // this.uiRender.addText("User Root 刷新")

        initViewportAction(this.viewport);
        this.app.stage.addChild(this.viewport);

        this.adjustScale(container, info);
        window.addEventListener("resize", () => this.adjustScale(container, info));

        this.setMouseEffectAnimation();
        this.setDefaultMaskEffect();

        this.worldCenter = new PIXI.Point(this.viewport.center.x, this.viewport.center.y);

        // for (let index = 0; index < 5; index++) {
        //     this.testLaodSpine(index);
        // }

        // 设置初始值 如果开启了实时预览就设置mode
        useActionStore().realTimePreview ? this.setMode(GameMode.PREVIEW) : this.setMode();


        // 注册 Actions 补间库
        registerPixiJSActionsMixin(PIXI.Container);
        PIXI.Ticker.shared.add(() => Action.tick(PIXI.Ticker.shared.elapsedMS));

        this.initMask = new PIXI.Graphics();
        this.initMask.beginFill(0x000000, 1);
        this.initMask.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
        this.initMask.endFill();
        this.initMask.zIndex = 9999

        this.layers['ui'].container.addChild(this.initMask);

        // 创建独立的过渡遮罩
        this.transitionMask = new PIXI.Graphics();
        this.transitionMask.beginFill(0x000000, 1);
        this.transitionMask.drawRect(0, 0, this.app.renderer.width, this.app.renderer.height);
        this.transitionMask.endFill();
        this.transitionMask.alpha = 0; // 初始透明
        this.transitionMask.zIndex = -1; // 初始在文字下面

        this.layers['ui'].container.addChild(this.transitionMask);

        // this.cameraIndicatorsStart = new PIXI.Graphics();
        // this.cameraIndicatorsEnd = new PIXI.Graphics();

        // this.drawCameraIndicator(this.cameraIndicatorsStart);
        // this.drawCameraIndicator(this.cameraIndicatorsEnd);

        // this.app.stage.addChild(this.cameraIndicatorsStart);
        // this.app.stage.addChild(this.cameraIndicatorsEnd);

        // this.cameraIndicatorsStart.position.set(this.viewport.center.x, this.viewport.center.y);
        // this.cameraIndicatorsEnd.position.set(this.viewport.center.x, this.viewport.center.y);

        // // 绘制摄像机指示器之间的连线
        // this.drawCameraConnectionLine();


        //         // 片段着色器代码
        //         const fragmentShader = `
        // precision mediump float;
        // varying vec2 vTextureCoord;
        // uniform sampler2D uSampler;
        // uniform float iTime;
        // uniform vec2 iResolution;
        // const float divisions = 28.0;

        // void main() {
        //     vec2 fragCoord = vTextureCoord * iResolution;

        //     // 修正坐标（将原点从左下角换成左上角）
        //     vec2 corrected_coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
        //     float biggest_dim = max(iResolution.x, iResolution.y);
        //     vec2 st = corrected_coord / biggest_dim;

        //     // 计算动画变量 t
        //     float t = fract(iTime) * 3.0 - 1.0;

        //     // 网格分割
        //     vec2 f_st = fract(st * divisions);
        //     vec2 i_st = floor(st * divisions);
        //     f_st -= 0.5;

        //     // 将 t 与网格单元位置结合
        //     t = (1.0 - t + (i_st.x / divisions) - (1.0 - i_st.y / divisions));

        //     // 计算遮罩
        //     float a = step(t, 1.0 - abs(f_st.x + f_st.y)) * step(t, 1.0 - abs(f_st.x - f_st.y));

        //     // 从原始纹理中采样颜色，并按遮罩调节透明度
        //     vec4 texColor = texture2D(uSampler, vTextureCoord);
        //     gl_FragColor = texColor * (1.0 - a);
        // }`;

        //         // 创建滤镜
        //         const filter = new PIXI.Filter(undefined, fragmentShader, {
        //             iTime: 0.0,
        //             iResolution: [this.app.renderer.width, this.app.renderer.height]
        //         });

        //         this.initMask.filters = [filter]
        //         setTimeout(() => {

        //         }, 200)
        //         let elapsedTime = 0;

        //         this.app.ticker.add((delta) => {
        //             elapsedTime += delta / 30;
        //             filter.uniforms.iTime = 1- (Math.sin(elapsedTime) + 1) / 2; // 平滑往返 0~1
        //         });

    }

    private createDefaultLayers() {
        this.layers['background'] = {
            container: new PIXI.Container(),
            viewport: true,
            sortLayer: -1,
            parallaxFactor: 1,
        }

        // 添加CG层级，位于背景之上，角色之下
        this.layers['cg'] = {
            container: new PIXI.Container(),
            viewport: true,
            sortLayer: 50,
            parallaxFactor: 1
        }

        this.layers['mask'] = {
            container: new PIXI.Container(),
            viewport: false,
            sortLayer: 102,
            parallaxFactor: 1
        }

        this.layers['ui'] = {
            container: new PIXI.Container(),
            viewport: false,
            sortLayer: 103,
            parallaxFactor: 1
        }

        this.layers['mouse'] = {
            container: new PIXI.Container(),
            viewport: false,
            sortLayer: 104,
            parallaxFactor: 1
        }

        this.layers['topMask'] = {
            container: new PIXI.Container(),
            viewport: false,
            sortLayer: 999,
            parallaxFactor: 1
        }

        this.app.stage.sortableChildren = true;
        this.viewport.sortableChildren = true;
    }

    public addCharacterSpine(key: string, characterInfo: { character: CharacterType, x: number, y: number, scale: number, isInitShow: boolean }) {
        // const characterURL = ResourceManager.allResUrl[key];
        // 确保资源已加载
        let spine = ResourceManager.getResource<Spine>(key, ResType.Spine) as Spine
        console.log("spine version:", spine.spineData.version);
        const info: sceneCharacter = {
            character: characterInfo.character,
            x: characterInfo.x,
            y: characterInfo.y,
            scale: characterInfo.scale,
            spine: markRaw(spine),
            selectAnimation: 0,
            animationOption: [],
            isInitShow: characterInfo.isInitShow,
        }

        // 检查场景中是否有这个角色了 > 有就clone一个新的spine出来（无法使用getResource获取了）
        //                       > 没有就正常加入角色到场景
        const existingCharacter = this.action.maxCharacter.find(
            (char) => char.character.characterName === info.character.characterName
        );

        if (existingCharacter) {
            // 如果已经存在，则克隆 Spine 对象
            spine = new Spine(existingCharacter.spine.spineData);
            spine.scale.set(existingCharacter.spine.scale.x, existingCharacter.spine.scale.y);
            spine.position.set(existingCharacter.spine.x, existingCharacter.spine.y);
            spine.zIndex = existingCharacter.spine.zIndex;

            // clone一个spine并添加到info中去
            info.spine = markRaw(spine);
        }


        spine.scale.set(/* (this.app.view.height / (spine.height / 0.9)) - 0.05 */DEFAULT_SPINE_SCALE);

        info.scale = spine.scale.x;

        this.action.maxCharacter.push(info);
        this.viewport.addChild(spine);


        // 所有spine的统一层级为10
        spine.zIndex = 10;
        spine.x = characterInfo.x
        spine.y = characterInfo.y;

        // 设置 Spine 对象的交互属性，使其可以被点击
        spine.eventMode = 'static';

        // 为 Spine 对象添加点击事件监听器
        spine.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            if (this.mode == GameMode.SCENE) {
                // 检查点击的目标是否是 TransformGizmo 的子元素
                const target = event.target as PIXI.DisplayObject;

                // 如果点击的是 TransformGizmo 相关的元素，不处理 Spine 点击
                if (target && (
                    target.name === 'x-axis' ||
                    target.name === 'y-axis' ||
                    target.name === 'center' ||
                    target.name?.startsWith('scale-') ||
                    target.parent?.name === 'TransformGizmo'
                )) {
                    return; // 不处理 Spine 点击事件
                }

                // 触发 Spine 选择事件
                this.onSpineClick(spine, info);
            }
        });

        if (info.animationOption.length == 0) {
            // 添加动画
            info.animationOption = spine.state.data.skeletonData.animations.map((item, index) => {
                if (item.name == 'idle') {
                    // 设置默认为idle
                    info.selectAnimation = index;
                }

                return {
                    value: index,
                    label: item.name,
                };
            });

        }


        // 设置混合动画，从 idle 到 tale_start
        if (spine.state.hasAnimation('idle')) {
            spine.state.setAnimation(0, 'idle', true);
            spine.autoUpdate = true;
        }

        console.log("所有动画：", spine.state.data.skeletonData.animations);

        // this.inSceneCharacterMap[key] = spine;

    }

    // @ts-ignore
    private async testLaodSpine(index: number = 0) {
        return new Promise((resolve, reject) => {
            resolveResource('resources/character/c511/c511_00.skel').then((res) => {

                PIXI.Assets.load(convertFileSrc(res)).then((resource) => {
                    const animation = new Spine(resource.spineData);
                    console.log("Spine 版本：", resource.spineData.version);
                    this.viewport.addChild(animation);

                    // 将 Spine 动画的位置设置为画布中心

                    animation.zIndex = 999;
                    // 设置缩放比例
                    animation.scale.set((this.app.view.height / (animation.height / 0.9)) - 0.05);
                    animation.x = 400 * (index + 1)/* (index + 1) * this.viewport.center.x / 3 - animation.width / 5 */;
                    animation.y = this.viewport.worldHeight + 100;


                    console.log(animation.state.data.skeletonData.animations);

                    // 设置混合动画，从 idle 到 tale_start
                    if (animation.state.hasAnimation('idle')) {
                        animation.state.setAnimation(0, 'idle', true);
                        animation.autoUpdate = true;
                    }

                    // 设置 tale_start 动画（假设你需要它播放）
                    if (animation.state.hasAnimation('talk_start')) {
                        animation.state.addAnimation(1, 'talk_start', true, 0); // 假设不循环，立即播放
                    }

                    // 加载完成，返回动画对象
                    resolve(animation);
                }).catch((error) => {
                    console.log("捕获错误: ", error);
                    reject(error);  // 加载失败，返回错误
                });
            });

        });
    }

    // private async testFun() {
    //     await PIXI.Assets.load("img/sprite/Volcano_04.png");
    //     const bunny = PIXI.Sprite.from("img/sprite/Volcano_04.png");
    //     bunny.pivot.set(bunny.width / 2, bunny.height / 2);  // 设置pivot到精灵的中心
    //     const scaleFactor = this.app.renderer.height / bunny.texture.height;
    //     bunny.scale.set(scaleFactor);
    //     bunny.position.set(this.viewport.worldWidth / 2, this.viewport.worldHeight / 2)

    //     let originalPosition = {
    //         x: this.viewport.worldWidth / 2,
    //         y: this.viewport.worldHeight / 2
    //     };

    //     let originalScale = bunny.scale.x;
    //     const updateBunnyPosition = () => {
    //         const scale = this.viewport.scale.x;
    //         const center = this.viewport.center;

    //         // 计算视口偏移量（保持正值方向一致性）
    //         const offsetX = center.x - this.viewport.worldWidth / 2;
    //         const offsetY = center.y - this.viewport.worldHeight / 2;
    //         const parallaxFactor = 0.7;

    //         // 修正后的视差公式（系数与运动方向解耦）
    //         bunny.position.set(
    //             originalPosition.x + (offsetX * parallaxFactor) / scale,
    //             originalPosition.y + (offsetY * parallaxFactor) / scale
    //         );


    //         // // 计算视差缩放（缩放变化更小）
    //         // const scaleAdjust = Math.pow(scale, parallaxFactor);
    //         // bunny.scale.set(
    //         //     originalScale / scaleAdjust,
    //         //     originalScale / scaleAdjust
    //         // );
    //         // 设定系数（0：完全独立，1：完全跟随）
    //         const coefficient = 0.1;

    //         // 计算期望的最终显示缩放
    //         const effectiveScale = (1 - coefficient) * originalScale + coefficient * originalScale * scale;
    //         // 为了抵消父对象缩放，调整 bunny.scale
    //         bunny.scale.set(effectiveScale / scale);

    //         const delta = (originalScale - effectiveScale) / 2;
    //         bunny.position.set(
    //             originalPosition.x + (offsetX * 0.5) / scale + delta,
    //             originalPosition.y + (offsetY * 0.5) / scale + delta
    //         );
    //     };
    //     this.viewport
    //         .on('moved', updateBunnyPosition)
    //         .on('zoomed', updateBunnyPosition);

    //     updateBunnyPosition();

    //     this.viewport.addChild(bunny)
    // }

    private currentBackground: SpriteWithUpdate | undefined;
    private lastBackgroundPath: string = '';
    private lastParallaxFactor: number = 0;

    // public setBackground(key: string) {
    //     // 如果存在就销毁
    //     if (this.currentBackground) {
    //         this.currentBackground.destroy()
    //     }

    //     const baseTexture = ResourceManager.getResource(key, ResType.Image) as PIXI.Texture

    // }

    /**
    * 设置背景图并应用视差效果
    * @param key 资源键或路径
    * @param parallaxFactor 视差因子(0-1)，值越小视差越小，默认0.9
    */
    public async setBackground(key: string, parallaxFactor: number = 0.9) {
        // 如果设置的背景是相同且视差因子也相同才不进行设置 不然就要重新设置
        if (this.lastBackgroundPath == key && this.lastParallaxFactor == parallaxFactor) {
            return;
        }

        this.lastBackgroundPath = key;
        this.lastParallaxFactor = parallaxFactor;

        // 如果存在就销毁旧背景
        if (this.currentBackground) {
            // 移除之前绑定的事件监听
            this.viewport.off('moved', this.currentBackground.updatePosition);
            this.viewport.off('zoomed', this.currentBackground.updatePosition);
            this.currentBackground.destroy();
        }

        // 确保资源已加载
        let texture = ResourceManager.getResource<PIXI.Texture>(key, ResType.Image)
            ?? (await PIXI.Assets.load(key), PIXI.Texture.from(key));

        // 创建新背景精灵
        const background = new PIXI.Sprite(texture) as SpriteWithUpdate;
        background.anchor.set(0.5);

        // 计算适当的缩放比例使图像填充屏幕高度并略微放大
        let scaleFactor = this.app.renderer.height / background.texture.height;
        scaleFactor += 0.1;
        background.scale.set(scaleFactor);

        // 初始位置设为视口世界中心
        const originalPosition = {
            x: this.viewport.worldWidth / 2,
            y: this.viewport.worldHeight / 2
        };
        background.position.copyFrom(originalPosition);

        // 存储初始缩放和视差参数
        const originalScale = scaleFactor;

        // 定义位置更新函数并绑定到背景对象，以便之后可以移除
        background.updatePosition = () => {
            // console.log("开始偏移");
            const scale = this.viewport.scale.x;
            const center = this.viewport.center;

            // 计算视口中心相对于原点的偏移
            const offsetX = center.x - originalPosition.x;
            const offsetY = center.y - originalPosition.y;

            // 应用视差位移
            background.position.set(
                originalPosition.x + offsetX * parallaxFactor,
                originalPosition.y + offsetY * parallaxFactor
            );

            // 应用视差缩放
            const scaleParallax = parallaxFactor;
            background.scale.set(originalScale * Math.pow(scale, -scaleParallax));
        };

        // 添加事件监听
        this.viewport
            .on('moved', background.updatePosition)
            .on('zoomed', background.updatePosition);

        // 初始更新位置
        background.updatePosition();

        // 添加到视口并保存引用
        this.viewport.addChild(background);
        this.currentBackground = background;

        return background;
    }



    /**
     * @deprecated 这个方法已废弃，请使用 `setBackground` 代替！
     */
    //@ts-ignore
    private async testFun() {
        await PIXI.Assets.load("img/sprite/CommanderRoom.png");
        const bunny = PIXI.Sprite.from("img/sprite/CommanderRoom.png");
        bunny.anchor.set(0.5); // 使用anchor简化到中心
        let scaleFactor = this.app.renderer.height / bunny.texture.height;
        scaleFactor += 0.1;
        bunny.scale.set(scaleFactor);
        console.log(bunny.height);
        // 初始位置设为视口世界中心
        const originalPosition = {
            x: this.viewport.worldWidth / 2,
            y: this.viewport.worldHeight / 2
        };
        bunny.position.copyFrom(originalPosition);

        const originalScale = scaleFactor; // 保存初始缩放

        const updateBunnyPosition = () => {
            const scale = this.viewport.scale.x;
            const center = this.viewport.center;

            // 计算视口中心相对于原点的偏移
            const offsetX = center.x - originalPosition.x;
            const offsetY = center.y - originalPosition.y;
            const parallaxFactor = 0.9;

            // 应用视差位移
            bunny.position.set(
                originalPosition.x + offsetX * parallaxFactor,
                originalPosition.y + offsetY * parallaxFactor
            );

            // 应用视差缩放，系数控制缩放幅度
            const scaleParallax = parallaxFactor; // 值越小，缩放变化越小
            bunny.scale.set(originalScale * Math.pow(scale, -scaleParallax));
        };

        this.viewport
            .on('moved', updateBunnyPosition)
            .on('zoomed', updateBunnyPosition);

        updateBunnyPosition();
        this.viewport.addChild(bunny)

        // this.viewport.filters = [new OldFilmFilter()]
    }


    private async setDefaultMaskEffect(): Promise<void> {
        const fragmentShader = await loadShader("resources/package/shader/sceen_bar.frag");

        const baseTexture = PIXI.Texture.WHITE;
        const sprite = new PIXI.Sprite(baseTexture);
        sprite.width = this.app.renderer.width;
        sprite.height = this.app.renderer.height;

        // 创建 filter，并传递 uniform 变量
        const filter = new PIXI.Filter(undefined, fragmentShader, {
            iTime: 2.0,
            iResolution: [this.app.renderer.width, this.app.renderer.height],
        });

        sprite.filters = [filter]
        this.layers['mask'].container
            .addChild(sprite);
    }

    /**
     * 设置默认的背景
     */
    // private setDefaultBackgroundLayer(): void {
    //     PIXI.Assets.load("img/sprite/Volcano_04.png").then(() => {
    //         this.defaultBackground = PIXI.Sprite.from("img/sprite/Volcano_04.png");
    //         // 设置背景图铺满整个应用
    //         const scaleFactor = this.app.renderer.height / this.defaultBackground.texture.height;
    //         this.defaultBackground.scale.set(scaleFactor);
    //         // this.defaultBackground.anchor.set(0.5);
    //         // this.defaultBackground.x = this.viewport.worldWidth / 2;
    //         // this.defaultBackground.y = this.viewport.worldHeight / 2;
    //         this.senceLayer.addChild(this.defaultBackground);
    //         // 获取变换后的边界
    //         const bounds = this.defaultBackground.getBounds();
    //         console.log(bounds);

    //         this.viewport.worldHeight = this.defaultBackground.height;
    //         this.viewport.worldWidth = this.defaultBackground.width;

    //         /* .clampZoom({
    //                         maxScale: 1,
    //                         maxWidth: this.defaultBackground.getBounds().width * this.viewport.scale.x ,
    //                         maxHeight: this.defaultBackground.getBounds().height * this.viewport.scale.y ,
    //                     }).clamp({
    //                         left: bounds.x ,
    //                         top: 0,
    //                         right: this.app.view.width - bounds.x * this.viewport.scale.x ,
    //                         bottom: bounds.y + bounds.height,
    //                     }) */


    //     }).catch((error) => {
    //         console.error("加载背景失败:", error);
    //     });
    // }

    private setMouseEffectAnimation(): void {
        const mouseTextures: PIXI.Texture<PIXI.Resource>[] = [];

        PIXI.Assets.load("img/sprite/mouse-click.json").then(() => {

            for (let i = 0; i < 8; i++) {
                const texture = PIXI.Texture.from(`mouse-click-${i}.png`);

                mouseTextures.push(texture);
            }
            // 确保舞台支持交互
            this.app.stage.eventMode = 'passive';
            // 定义整个屏幕为点击区域
            this.app.stage.hitArea = this.app.screen;

            this.viewport.eventMode = 'static'
            this.viewport.hitArea = this.app.screen;
            this.viewport.on('pointerdown', (event) => {
                // 只有点击左键才可以触发
                if (event.button != 0) {
                    return;
                }

                // 只有两个模式才可以触发ui交互
                if (this.mode !== GameMode.SCENE) {
                    this.uiRender.onUserClick();
                } else {
                    return;
                }

                // 获取点击的全局坐标
                const pos = event.global;
                const mouse = new PIXI.AnimatedSprite(mouseTextures);
                mouse.anchor.set(0.5);
                mouse.x = pos.x;
                mouse.y = pos.y;
                mouse.scale.set(DEFAULT_RESOLUTION);

                mouse.eventMode = 'none'

                // 设置动画只播放一次，并调整播放速度（可根据需要调整）
                mouse.loop = false;
                mouse.animationSpeed = 0.5;
                mouse.alpha = 0.9;
                mouse.play()

                // 创建随机数量的小正方形
                const { particles, tickers } = this.createSquareParticles(pos.x, pos.y, mouse.width / 4);

                // 动画播放完毕后，从舞台移除并销毁动画精灵
                mouse.onComplete = () => {
                    this.layers['mouse'].container.removeChild(mouse);
                    mouse.destroy();
                    particles.forEach((particle) => {
                        this.layers['mouse'].container.removeChild(particle);
                        particle.destroy();
                    });
                    tickers.forEach((ticker) => {
                        ticker.stop();
                        ticker.destroy();
                    });
                };

                mouse.zIndex = 99;
                mouse.filters = [new AdvancedBloomFilter({
                    threshold: 0.9,       // 设置颜色需要多亮才能影响 Bloom（0.5 是一个合适的默认值，平衡亮度）

                    quality: 10,          // 模糊质量（10 是一个高质量设置，适合更好的视觉效果）

                    pixelSize: 1,         // 像素大小（1 是常规的设置，适用于大多数场景）
                    resolution: 4         // 分辨率（设置为 2 提供较高的分辨率，适用于大多数应用）
                })]
                // 将动画添加到舞台中
                this.layers['mouse'].container.addChild(mouse);
            });

        })
    }

    /**
     * 创建从菱形四边发射的小正方形粒子
     * @param x 中心点x坐标
     * @param y 中心点y坐标
     * @param size 菱形大小（从中心到边的距离）
     * @param mainSprite 主动画精灵，用于同步消失
     */
    private createSquareParticles(x: number, y: number, size: number): { particles: PIXI.Graphics[]; tickers: PIXI.Ticker[]; } {
        // 最多生成5个粒子
        const particleCount = 4 + Math.floor(Math.random() * 3);


        // 存储所有创建的粒子，用于在主精灵消失时一起清理
        const particles: PIXI.Graphics[] = [];
        const tickers: PIXI.Ticker[] = [];

        for (let i = 0; i < particleCount; i++) {
            // 创建一个正方形图形
            const square = new PIXI.Graphics();

            // 随机大小（原始大小的10%-30%）
            const squareSize = size * 1.8 * (0.1 + Math.random() * 0.2);

            // 固定为半透明浅蓝色
            const blueColor = 0xADD8E6; // 浅蓝色

            // 绘制正方形
            square.beginFill(blueColor, 0.45); // 设置半透明度为0.5
            square.drawRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
            square.endFill();

            // 设置边框样式（线宽、颜色、透明度）
            square.lineStyle(1, 0xB0C4DE, .7); // 线宽2，颜色蓝色，透明度1
            square.drawRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);

            // 旋转45度（与主菱形一致）
            square.rotation = Math.PI / 4;

            // 确定发射点（从菱形的四条边随机选择一点，但不要太靠近顶点）
            const edge = Math.floor(Math.random() * 4); // 0-3表示四条边
            let startX = x;
            let startY = y;

            // 计算菱形边上的随机点（避开顶点区域）
            // 使用0.2-0.8的随机值，避免靠近顶点
            const randomPos = -0.2 + Math.random() * 0.8;

            switch (edge) {
                case 0: // 上边
                    startX = x - size * randomPos;
                    startY = y - size;
                    break;
                case 1: // 右边
                    startX = x + size;
                    startY = y - size * randomPos;
                    break;
                case 2: // 下边
                    startX = x + size * randomPos;
                    startY = y + size;
                    break;
                case 3: // 左边
                    startX = x - size;
                    startY = y + size * randomPos;
                    break;
            }

            // 设置初始位置
            square.x = startX;
            square.y = startY;

            // 计算向外扩散的方向（从中心点向外）
            const angle = Math.atan2(startY - y, startX - x);
            const speed = 0.4
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            square.filters = [new AdvancedBloomFilter({
                threshold: 0.7,       // 更低的阈值让更多颜色参与 bloom，增强发光范围
                bloomScale: 1.8,      // 稍强一点的 bloom 强度，增强光晕
                brightness: 1.3,      // 更高亮度，让方块在屏幕上更突出
                blur: 6,              // 增加模糊以提升发光扩散效果
                quality: 8,           // 保持高质量但略微降低以减轻性能压力
                pixelSize: 1,         // 保持标准像素大小
                resolution: 2         // 略低的分辨率减少性能开销，视觉上几乎无损
            }), new BloomFilter()];
            // 添加到舞台
            this.layers['mouse'].container.addChild(square);
            particles.push(square);

            // 设置动画
            let alpha = 0.4; // 初始透明度设为0.5
            const ticker = new PIXI.Ticker();
            tickers.push(ticker);

            ticker.add(() => {
                // 移动
                square.x += vx;
                square.y += vy;

                // 淡出
                // alpha -= 0.01; // 减慢淡出速度
                // square.alpha = alpha;

                // 当完全透明时移除
                if (alpha <= 0) {
                    ticker.destroy();
                    this.layers['mouse'].container.removeChild(square);
                    square.destroy();
                }
            });

            ticker.start();
        }

        return { particles, tickers };
    }

    private adjustScale(container: HTMLDivElement, _info: HTMLDivElement): void {
        const canvas = this.app.view as HTMLCanvasElement;
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;
        const targetRatio = this.app.renderer.width / this.app.renderer.height;


        let newWidth = containerHeight * targetRatio;
        let newHeight = containerHeight;

        if (newWidth > containerWidth) {
            newWidth = containerWidth;
            newHeight = containerWidth / targetRatio;
        }

        const scaleX = newWidth / this.app.renderer.width;
        const scaleY = newHeight / this.app.renderer.height;

        canvas.style.transformOrigin = "center";
        canvas.style.transform = `scale(${scaleX}, ${scaleY})`;

        // info.innerText = `Canvas Info:\n` +
        //     `Displayed Width: ${newWidth.toFixed(2)}\n` +
        //     `Displayed Height: ${newHeight.toFixed(2)}\n` +
        //     `ScaleX: ${scaleX.toFixed(2)}\n` +
        //     `ScaleY: ${scaleY.toFixed(2)}\n` +
        //     `Original Width: ${this.app.renderer.width}\n` +
        //     `Original Height: ${this.app.renderer.height}\n` +
        //     `Target Ratio: ${(newWidth / newHeight)}\n` +
        //     `Original Ratio: ${targetRatio}`;
    }

    public static getInstance(): CanvasManager {
        if (!CanvasManager.instance) {
            CanvasManager.instance = new CanvasManager();
        }
        return CanvasManager.instance;
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, {
                children: true,
                texture: true,
                baseTexture: true,
            });
        }
    }

    public static destroyInstance() {
        if (CanvasManager.instance) {
            CanvasManager.instance.destroy();
            CanvasManager.instance = null!;
        }
    }

    public setSize(width: number, height: number): void {
        this.app.renderer.resize(width, height);
        this.adjustScale(document.getElementById("canvas") as HTMLDivElement, document.getElementById("info") as HTMLDivElement);
    }

    public getApp(): PIXI.Application {
        return this.app;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.app.view as HTMLCanvasElement;
    }

    public clear(): void {
        this.app.stage.removeChildren();
    }

    /**
     * 重新初始化画布内容，清理所有内容但保持实例存在
     */
    public reinitialize(): void {
        // 清理角色
        this.inSceneCharacterMap.forEach(spine => {
            if (spine && spine.parent) {
                spine.parent.removeChild(spine);
                spine.destroy();
            }
        });
        this.inSceneCharacterMap = [];

        // 清理各层容器内容
        Object.keys(this.layers).forEach(layerName => {
            const layer = this.layers[layerName];
            if (layer && layer.container) {
                layer.container.removeChildren();
            }
        });

        // 重置背景
        if (this.defaultBackground) {
            this.defaultBackground.texture = PIXI.Texture.WHITE;
        }

        // 重置视口位置和缩放
        if (this.viewport) {
            this.viewport.moveCenter(0, 0);
            this.viewport.scale.set(1);
        }

        // 重置游戏模式
        this.setMode(GameMode.PLAY);

        // 重新创建默认层
        this.createDefaultLayers();

        // 重新添加层到舞台
        for (let layerName in this.layers) {
            if (this.layers[layerName].viewport) {
                this.viewport.addChild(this.layers[layerName].container);
            } else {
                this.app.stage.addChild(this.layers[layerName].container);
            }
            this.layers[layerName].container.zIndex = this.layers[layerName].sortLayer;
        }

        this.viewport.sortChildren();
        this.app.stage.sortChildren();

        // 重新设置遮罩
        this.setDefaultMaskEffect();

        // 重新添加遮罩到UI层
        if (this.initMask && this.layers['ui']) {
            this.layers['ui'].container.addChild(this.initMask);
        }

        if (this.transitionMask && this.layers['ui']) {
            this.layers['ui'].container.addChild(this.transitionMask);
        }

        console.log('CanvasManager 重新初始化完成');
    }

    /**
     * 设置 Spine 点击回调函数
     */
    public setSpineClickCallback(id: number, callback: (spine: Spine, characterInfo: sceneCharacter) => void) {
        this.spineClickCallbacks.set(id, callback);
    }

    /**
     * 移除 Spine 点击回调函数
     */
    public removeSpineClickCallback(id: number) {
        this.spineClickCallbacks.delete(id);
    }

    /**
     * 全局管理 Spine 描边效果
     */
    public applyOutlineToSpine(spine: Spine | undefined, apply: boolean) {
        if (!spine) return;

        // 如果要应用描边，先移除当前的描边
        if (apply && this.currentOutlinedSpine && this.currentOutlinedSpine !== spine) {
            this.removeOutlineFromSpine(this.currentOutlinedSpine);
        }

        if (apply) {
            // 应用描边效果
            const outline = new OutlineFilter(5, 0xffd700, 1); // 5px，金黄色，强度1

            // 保存原始滤镜（如果有的话）
            if (!(spine as any)._originalFilters) {
                (spine as any)._originalFilters = spine.filters ? [...spine.filters] : [];
            }

            // 应用新的滤镜数组，包含原始滤镜和描边滤镜
            spine.filters = [...(spine as any)._originalFilters, outline];
            this.currentOutlinedSpine = spine;
        } else {
            this.removeOutlineFromSpine(spine);
        }
    }

    /**
     * 移除 Spine 的描边效果
     */
    private removeOutlineFromSpine(spine: Spine) {
        if ((spine as any)._originalFilters) {
            spine.filters = (spine as any)._originalFilters;
            delete (spine as any)._originalFilters;
        } else {
            spine.filters = [];
        }

        if (this.currentOutlinedSpine === spine) {
            this.currentOutlinedSpine = null;
        }
    }

    /**
     * 处理 Spine 对象点击事件
     */
    private onSpineClick(spine: Spine, characterInfo: sceneCharacter) {
        console.log('Spine 被点击:', characterInfo.character.characterName);

        // 调用所有注册的回调函数
        this.spineClickCallbacks.forEach((callback) => {
            callback(spine, characterInfo);
        });
    }

    /**
     * 设置CG图片并应用滤镜效果
     * @param key 资源键或路径
     * @param zIndex CG的层级
     * @param alpha CG的透明度
     * @param filters 滤镜配置
     */
    public async setCG(key: string, zIndex: number = 100, alpha: number = 1.0, filters?: Array<{
        type: string;
        value: number;
    }>) {
        // 如果设置的CG是相同的就不进行重复设置
        if (this.lastCGPath === key && this.currentCG) {
            // 只更新属性
            this.currentCG.zIndex = zIndex;
            this.currentCG.alpha = alpha;
            this.applyCGFilters(this.currentCG, filters);
            return;
        }

        this.lastCGPath = key;

        // 如果存在旧CG就销毁
        if (this.currentCG) {
            this.currentCG.destroy();
            this.currentCG = null;
        }

        // 确保资源已加载
        let texture = ResourceManager.getResource<PIXI.Texture>(key, ResType.Image)
            ?? (await PIXI.Assets.load(key), PIXI.Texture.from(key));

        // 创建新CG精灵
        const cg = new PIXI.Sprite(texture);
        cg.anchor.set(0.5);

        // 计算适当的缩放比例使图像填充屏幕
        const scaleFactor = Math.max(
            this.app.renderer.width / cg.texture.width,
            this.app.renderer.height / cg.texture.height
        );
        cg.scale.set(scaleFactor);

        // 设置位置为视口世界中心
        cg.position.set(
            this.viewport.worldWidth / 2,
            this.viewport.worldHeight / 2
        );

        // 设置层级和透明度
        cg.zIndex = zIndex;
        cg.alpha = alpha;

        // 应用滤镜
        this.applyCGFilters(cg, filters);

        // 添加到CG层
        this.layers['cg'].container.addChild(cg);
        this.layers['cg'].container.sortChildren();

        this.currentCG = cg;

        return cg;
    }

    /**
     * 应用CG滤镜效果
     * @param cg CG精灵对象
     * @param filters 滤镜配置数组
     */
    private applyCGFilters(cg: PIXI.Sprite, filters?: Array<{
        type: string;
        value: number;
    }>) {
        if (!filters || filters.length === 0) {
            cg.filters = [];
            return;
        }

        const filterArray: PIXI.Filter[] = [];

        // 遍历滤镜配置
        filters.forEach(filter => {
            switch (filter.type) {
                case 'blur':
                    if (filter.value > 0) {
                        const blurFilter = new PIXI.BlurFilter();
                        blurFilter.blur = filter.value;
                        filterArray.push(blurFilter);
                    }
                    break;

                case 'brightness':
                    if (filter.value !== 1.0) {
                        const colorMatrixFilter = new PIXI.ColorMatrixFilter();
                        colorMatrixFilter.brightness(filter.value, false);
                        filterArray.push(colorMatrixFilter);
                    }
                    break;

                case 'contrast':
                    if (filter.value !== 1.0) {
                        const colorMatrixFilter = new PIXI.ColorMatrixFilter();
                        colorMatrixFilter.contrast(filter.value, false);
                        filterArray.push(colorMatrixFilter);
                    }
                    break;

                case 'saturation':
                    if (filter.value !== 1.0) {
                        const colorMatrixFilter = new PIXI.ColorMatrixFilter();
                        colorMatrixFilter.saturate(filter.value, false);
                        filterArray.push(colorMatrixFilter);
                    }
                    break;
            }
        });

        cg.filters = filterArray;
    }

    /**
     * 移除当前CG
     */
    public removeCG() {
        if (this.currentCG) {
            this.currentCG.destroy();
            this.currentCG = null;
            this.lastCGPath = '';
        }
    }
}

export default CanvasManager;


