import * as PIXI from 'pixi.js';
import massage from '../common/massage';
import { resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Viewport } from "pixi-viewport";
import { initViewportAction } from './viewport';

class CanvasManager {
    private static instance: CanvasManager | null = null;
    private app: PIXI.Application;
    private viewport: Viewport;

    private senceLayer: PIXI.Container;
    private spineLayer: PIXI.Container;
    private mouseLayer: PIXI.Container;
    private iconLayer: PIXI.Container;
    private maskLayer: PIXI.Container;

    private widthOffset: number = 20;

    // 视差因子 默认为1
    public defaultBackground: PIXI.Sprite;

    private constructor() {
        const container = document.getElementById("canvas") as HTMLDivElement;
        const info = document.getElementById("canvas-info") as HTMLDivElement;
        this.defaultBackground = new PIXI.Sprite(PIXI.Texture.WHITE);

        if (!container) {
            massage("找不到Canvas", "error", 2000);
        }
        this.app = new PIXI.Application({
            width: 720 + this.widthOffset,
            height: 1280,
            backgroundColor: 0x222234, // 默认黑色背景
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true
        });
        container.appendChild(this.app.view as HTMLCanvasElement);

        this.viewport = new Viewport({
            screenWidth: 720 + this.widthOffset,
            screenHeight: 1280,
            worldWidth: 2048,
            worldHeight: 2048,
            events: this.app.renderer.events,
        });

        initViewportAction(this.viewport);

        this.setMouseEffectAnimation();

        this.senceLayer = new PIXI.Container();
        this.spineLayer = new PIXI.Container();
        this.maskLayer = new PIXI.Container();
        this.mouseLayer = new PIXI.Container();
        this.iconLayer = new PIXI.Container();

        this.setDefaultBackgroundLayer();

        this.app.stage.addChild(this.viewport);
        this.app.stage.addChild(this.mouseLayer);
        this.app.stage.addChild(this.maskLayer);
        this.viewport.addChild(this.senceLayer);

        this.viewport.addChild(this.spineLayer);
        this.viewport.addChild(this.iconLayer);

        const sprite = this.mouseLayer.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        sprite.tint = 0xff0000;
        sprite.anchor.set(0.5)
        sprite.width = 20;
        sprite.height = 20;
        console.log(this.app.stage);
        sprite.position.set(this.app.view.width / 2, this.app.view.height / 2);

        let testS = PIXI.Sprite.from("img/sprite/test.png")
        testS.zIndex = 10000
        testS.y = 640
        testS.scale.set(1.5)
        this.viewport.addChild(testS);

        this.adjustScale(container, info);
        window.addEventListener("resize", () => this.adjustScale(container, info));

        this.setDefaultMaskEffect();
        this.viewport.sortableChildren = true;
        this.senceLayer.zIndex = 1;
        this.viewport.zIndex = 20;
        this.spineLayer.zIndex = 10;
        this.iconLayer.zIndex = 100;

        this.viewport.sortChildren();


        this.app.stage.sortableChildren = true;
        this.mouseLayer.zIndex = 50;
        this.maskLayer.zIndex = 100;
        this.app.stage.sortChildren();

    }




    private async setDefaultMaskEffect(): Promise<void> {
        const effectPath = await resolveResource("resources/package/shader/sceen_bar.frag");
        console.log(effectPath);

        const fileUrl = convertFileSrc(effectPath);
        const response = await fetch(fileUrl);
        const fragment = await response.text();

        const baseTexture = PIXI.Texture.WHITE;
        const sprite = new PIXI.Sprite(baseTexture);
        sprite.width = this.app.renderer.width;
        sprite.height = this.app.renderer.height;

        // 创建 filter，并传递 uniform 变量
        const filter = new PIXI.Filter(undefined, fragment, {
            iTime: 2.0,
            iResolution: [this.app.renderer.width, this.app.renderer.height],
        });

        sprite.filters = [filter]
        this.maskLayer.addChild(sprite);
    }

    /**
     * 设置默认的背景
     */
    private setDefaultBackgroundLayer(): void {
        PIXI.Assets.load("img/sprite/Volcano_04.png").then(() => {
            this.defaultBackground = PIXI.Sprite.from("img/sprite/Volcano_04.png");
            // 设置背景图铺满整个应用
            const scaleFactor = this.app.renderer.height / this.defaultBackground.texture.height;
            this.defaultBackground.scale.set(scaleFactor);
            // this.defaultBackground.anchor.set(0.5);
            // this.defaultBackground.x = this.viewport.worldWidth / 2;
            // this.defaultBackground.y = this.viewport.worldHeight / 2;
            this.senceLayer.addChild(this.defaultBackground);
            // 获取变换后的边界
            const bounds = this.defaultBackground.getBounds();
            console.log(bounds);

            this.viewport.worldHeight = this.defaultBackground.height;
            this.viewport.worldWidth = this.defaultBackground.width;

            /* .clampZoom({
                            maxScale: 1,
                            maxWidth: this.defaultBackground.getBounds().width * this.viewport.scale.x ,
                            maxHeight: this.defaultBackground.getBounds().height * this.viewport.scale.y ,
                        }).clamp({
                            left: bounds.x ,
                            top: 0,
                            right: this.app.view.width - bounds.x * this.viewport.scale.x ,
                            bottom: bounds.y + bounds.height,
                        }) */


        }).catch((error) => {
            console.error("加载背景失败:", error);
        });
    }



    private setMouseEffectAnimation(): void {
        const mouseTextures: PIXI.Texture<PIXI.Resource>[] = [];

        PIXI.Assets.load("img/sprite/mouse-click.json").then(() => {

            for (let i = 0; i < 8; i++) {
                const texture = PIXI.Texture.from(`mouse-click-${i}.png`);

                mouseTextures.push(texture);
            }
            // 确保舞台支持交互
            this.app.stage.eventMode = 'passive';
            this.app.stage.hitArea = this.app.screen; // 定义整个屏幕为点击区域
            // this.viewport.drag({
            //     wheel: false
            // }).wheel({
            // })
            // 监听鼠标点击（pointerdown）事件
            this.viewport.eventMode = 'static'
            this.viewport.hitArea = this.app.screen;
            this.viewport.on('pointerdown', (event) => {
                console.log("点击");
                if (event.button != 0) {
                    return;
                }
                // 获取点击的全局坐标
                const pos = event.global;
                const mouse = new PIXI.AnimatedSprite(mouseTextures);
                mouse.anchor.set(0.5);
                mouse.x = pos.x;
                mouse.y = pos.y;
                mouse.scale.set(1);

                mouse.eventMode = 'none'

                // 设置动画只播放一次，并调整播放速度（可根据需要调整）
                mouse.loop = false;
                mouse.animationSpeed = 0.5;
                mouse.play()

                // 动画播放完毕后，从舞台移除并销毁动画精灵
                mouse.onComplete = () => {
                    this.app.stage.removeChild(mouse);
                    mouse.destroy();
                };

                mouse.zIndex = 40;
                // 将动画添加到舞台中
                this.app.stage.addChild(mouse);

            });

        })
    }


    private adjustScale(container: HTMLDivElement, info: HTMLDivElement): void {

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

        info.innerText = `Canvas Info:\n` +
            `Displayed Width: ${newWidth.toFixed(2)}\n` +
            `Displayed Height: ${newHeight.toFixed(2)}\n` +
            `ScaleX: ${scaleX.toFixed(2)}\n` +
            `ScaleY: ${scaleY.toFixed(2)}\n` +
            `Original Width: ${this.app.renderer.width}\n` +
            `Original Height: ${this.app.renderer.height}\n` +
            `Target Ratio: ${(newWidth / newHeight)}\n` +
            `Original Ratio: ${targetRatio}`;
    }

    public static getInstance(): CanvasManager {
        if (!CanvasManager.instance) {
            CanvasManager.instance = new CanvasManager();
        }
        return CanvasManager.instance;
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
}

export default CanvasManager;