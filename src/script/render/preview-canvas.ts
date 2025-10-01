import { Spine } from 'pixi-spine';
import { applyAnimationConfig, DEFAULT_ANIMATION_CONFIG } from './animation-config';
import * as PIXI from 'pixi.js';
import { ResType } from '../var';
import { CharacterUrls } from '../../types/app';
import { ref } from 'vue';
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



// 角色资源管理接口
interface CharacterAssets {
    main: Spine;
    aim?: Spine;
    cover?: Spine;
}

// 加载单个Spine文件的辅助函数
async function loadSingleSpine(app: PIXI.Application, url: string): Promise<Spine> {
    const resource = await PIXI.Assets.load(url);
    const animation = new Spine(resource.spineData);
    
    // 强制设置默认皮肤
    if (!animation.skeleton.skin && resource.spineData.skins.length > 1) {
        resource.spineData.skins.forEach((skin: { name: string; }) => {
            console.log(skin.name);
        });
        animation.skeleton.setSkinByName(resource.spineData.skins[1].name);
    }
    
    console.log("Spine 版本：", resource.spineData.version);
    
    animation.visible = true;
    animation.alpha = 1;
    
    return animation;
}

// 加载角色的所有资源（main, aim, cover）
async function loadCharacterAssets(app: PIXI.Application, data: { url: string, type: ResType, characterUrls?: CharacterUrls }): Promise<CharacterAssets> {
    console.log("加载角色资源: ", data.characterUrls);
    
    // 加载主体动画
    const mainAnimation = await loadSingleSpine(app, data.url);
    
    const assets: CharacterAssets = {
        main: mainAnimation
    };
    
    // 如果有 characterUrls，尝试加载 aim 和 cover
    if (data.characterUrls) {
        // 尝试加载 aim 文件
        if (data.characterUrls.aim) {
            try {
                assets.aim = await loadSingleSpine(app, data.characterUrls.aim);
                console.log("成功加载 aim 资源");
            } catch (error) {
                console.warn("无法加载 aim 资源:", error);
            }
        }
        
        // 尝试加载 cover 文件
        if (data.characterUrls.cover) {
            try {
                assets.cover = await loadSingleSpine(app, data.characterUrls.cover);
                console.log("成功加载 cover 资源");
            } catch (error) {
                console.warn("无法加载 cover 资源:", error);
            }
        }
    }
    
    return assets;
}


export function load(app: PIXI.Application, data: { url: string, type: ResType, characterUrls?: CharacterUrls }): Promise<Spine | CharacterAssets | undefined> {
    console.log("加载Spine动画: ", data.url);
    
    // 如果有 characterUrls，使用新的加载逻辑
    if (data.characterUrls) {
        return loadCharacterAssets(app, data).then((assets) => {
            const mainAnimation = assets.main;
            
            // 设置主动画的位置和缩放
            app.stage.addChild(mainAnimation);
            mainAnimation.x = app.view.width / 2;
            const lastScale = mainAnimation.scale.x;
            mainAnimation.y = app.view.height * 0.93;
            mainAnimation.scale.set((app.view.height / (mainAnimation.height / lastScale / 0.90)));
            
            console.log(mainAnimation.state.data.skeletonData.animations);
            console.log(mainAnimation.skeleton);
            
            // 使用配置化的动画设置
            applyAnimationConfig(mainAnimation, DEFAULT_ANIMATION_CONFIG, false);
            
            // 添加鼠标交互功能
            // const cleanup = setupSpineInteraction(mainAnimation, app);
            
            // 将清理函数存储到主动画对象上
            // (mainAnimation as any).interactionCleanup = cleanup;
            
            // 返回完整的角色资源对象，而不是只返回主动画
            return assets;
        }).catch((error) => {
            console.log("角色加载错误: ", error);
            return undefined;
        });
    }
    
    // 原有的单文件加载逻辑
    return new Promise((resolve, reject) => {
        PIXI.Assets.load(data.url).then((resource) => {
            const animation = new Spine(resource.spineData);
            // 强制设置默认皮肤
            if (!animation.skeleton.skin && resource.spineData.skins.length > 1) {
                resource.spineData.skins.forEach((skin: { name: string; }) => {
                    console.log(skin.name);
                })

                animation.skeleton.setSkinByName(resource.spineData.skins[1].name);
            }


            console.log("Spine 版本：", resource.spineData.version);




            animation.visible = true;
            animation.alpha = 1;
            app.stage.addChild(animation);

            animation.x = app.view.width / 2;
            const lastSacle = animation.scale.x;

            animation.y = app.view.height * 0.93;

            // 设置缩放比例
            animation.scale.set((app.view.height / (animation.height / lastSacle / 0.90)));

            console.log(animation.state.data.skeletonData.animations);
            console.log(animation.skeleton);

            // 使用配置化的动画设置
            applyAnimationConfig(animation, DEFAULT_ANIMATION_CONFIG, false);

            // 添加鼠标交互功能
            const cleanup = setupSpineInteraction(animation, app);
            
            // 将清理函数存储到动画对象上
            (animation as any).interactionCleanup = cleanup;

            // 加载完成，返回动画对象
            resolve(animation);
        }).catch((error) => {
            console.log("捕获错误: ", error);
            reject(error);  // 加载失败，返回错误
        });
    });
}

// 设置Spine动画的交互功能
export function setupSpineInteraction(animation: Spine, app: PIXI.Application) {
    // WASD键盘移动相关变量
    const keys: { [key: string]: boolean } = {};
    const moveSpeed = 5; // 移动速度
    let animationFrame: number | null = null;

    // 键盘事件处理
    const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) {
            event.preventDefault();
            keys[key] = true;
            
            // 开始移动循环
            if (!animationFrame) {
                startMovement();
            }
        }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (['w', 'a', 's', 'd'].includes(key)) {
            keys[key] = false;
            
            // 如果没有按键被按下，停止移动
            if (!Object.values(keys).some(pressed => pressed)) {
                stopMovement();
            }
        }
    };

    // 移动更新函数
    const updateMovement = () => {
        let moved = false;
        
        if (keys['w']) {
            animation.y -= moveSpeed;
            moved = true;
        }
        if (keys['s']) {
            animation.y += moveSpeed;
            moved = true;
        }
        if (keys['a']) {
            animation.x -= moveSpeed;
            moved = true;
        }
        if (keys['d']) {
            animation.x += moveSpeed;
            moved = true;
        }
        
        if (moved && Object.values(keys).some(pressed => pressed)) {
            animationFrame = requestAnimationFrame(updateMovement);
        } else {
            animationFrame = null;
        }
    };

    const startMovement = () => {
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(updateMovement);
        }
    };

    const stopMovement = () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // 滚轮缩放事件 - 保留缩放功能
    const canvas = app.view as HTMLCanvasElement;
    let wheelTimeout: number | null = null;
    let pendingScale: { scale: number; mouseX: number; mouseY: number } | null = null;

    const applyScale = () => {
        if (!pendingScale) return;
        
        const { scale, mouseX, mouseY } = pendingScale;
        const currentScale = animation.scale.x;
        
        // 计算缩放前鼠标相对于动画的位置
        const localX = (mouseX - animation.x) / currentScale;
        const localY = (mouseY - animation.y) / currentScale;
        
        // 应用新的缩放
        animation.scale.set(scale);
        
        // 调整位置，使鼠标位置保持不变
        animation.x = mouseX - localX * scale;
        animation.y = mouseY - localY * scale;
        
        pendingScale = null;
        wheelTimeout = null;
    };

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        
        // 获取鼠标在画布上的位置
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
        
        // 计算缩放因子
        const scaleFactor = event.deltaY > 0 ? 0.95 : 1.05;
        const currentScale = animation.scale.x;
        const newScale = currentScale * scaleFactor;
        
        // 限制缩放范围
        if (newScale >= 0.1 && newScale <= 5) {
            pendingScale = { scale: newScale, mouseX, mouseY };
            
            // 清除之前的超时
            if (wheelTimeout) {
                clearTimeout(wheelTimeout);
            }
            
            // 延迟应用缩放，避免频繁更新
            wheelTimeout = window.setTimeout(applyScale, 10);
        }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // 清理函数
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        canvas.removeEventListener('wheel', handleWheel);
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        if (wheelTimeout) {
            clearTimeout(wheelTimeout);
        }
    };
}