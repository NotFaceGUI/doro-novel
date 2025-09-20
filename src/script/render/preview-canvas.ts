import { Spine } from 'pixi-spine';
import * as PIXI from 'pixi.js';
// import { ease } from 'pixi-ease'

export type ContainerDictionary = Record<string, PIXI.Container>;

export interface IApp {
    application: PIXI.Application
    uiContainer: ContainerDictionary
}

export function createPixiApp(width: number | undefined, height: number | undefined): IApp {
    const container = document.getElementById("preview-canvas") as HTMLElement;
    PIXI.Assets.setPreferences({
        preferCreateImageBitmap: false,
        preferWorkers: false
    });
    
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // 限制最大为2倍
    
    const app = new PIXI.Application({
        width: (width || 800) * pixelRatio,
        height: (height || 600) * pixelRatio,
        backgroundAlpha: 0,
        resolution: pixelRatio,
        autoDensity: true, // 手动控制
    });
    
    // 调整stage的缩放以匹配逻辑尺寸
    app.stage.scale.set(1 / pixelRatio);
    
    container.appendChild(app.view as unknown as Node);
    
    return {
        application: app,
        uiContainer: {}
    }
}



export function load(app: PIXI.Application, url: string): Promise<Spine | undefined> {
    console.log(url);
    return new Promise((resolve, reject) => {
        PIXI.Assets.load(url).then((resource) => {
            const animation = new Spine(resource.spineData);
            console.log("Spine 版本：", resource.spineData.version);
            app.stage.addChild(animation);

            animation.x = app.view.width / 2;
            const lastSacle = animation.scale.x;

            animation.y = app.view.height * 0.93;

            // 设置缩放比例
            animation.scale.set((app.view.height / (animation.height / lastSacle / 0.90)));

            console.log(animation.state.data.skeletonData.animations);
            console.log(animation.skeleton);

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
}