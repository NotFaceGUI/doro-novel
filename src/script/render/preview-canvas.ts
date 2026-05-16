import { Spine } from 'pixi-spine';
import { applyAnimationConfig, DEFAULT_ANIMATION_CONFIG } from './animation-config';
import * as PIXI from 'pixi.js';
import { ResType } from '../var';
import { CharacterUrls } from '../../types/app';
// import { ease } from 'pixi-ease'

export type ContainerDictionary = Record<string, PIXI.Container>;

export interface IApp {
    application: PIXI.Application
    uiContainer: ContainerDictionary
}

export interface SpineInteractionOptions {
    onSlotHover?: (slotName: string) => void;
    onSlotLeave?: () => void;
    onSlotSelect?: (slotName: string, append: boolean) => void;
}

export function createPixiApp(width: number | undefined, height: number | undefined): IApp {
    const container = document.getElementById("preview-canvas") as HTMLElement;
    PIXI.Assets.setPreferences({
        preferCreateImageBitmap: false,
        preferWorkers: false
    });

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // 限制最大为2倍

    const app = new PIXI.Application({
        width: width || 800,
        height: height || 600,
        backgroundAlpha: 0,
        resolution: pixelRatio,
        autoDensity: true,
    });

    container.appendChild(app.view as unknown as Node);

    return {
        application: app,
        uiContainer: {}
    }
}

export function resizePreviewApp(app: PIXI.Application, width: number, height: number) {
    app.renderer.resize(Math.max(1, width), Math.max(1, height));
}

export function layoutPreviewSpine(animation: Spine, app: PIXI.Application) {
    animation.update(0);

    const bounds = animation.getLocalBounds();
    if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0) {
        return;
    }

    const fitWidth = app.screen.width * 0.78;
    const fitHeight = app.screen.height * 0.84;
    const scale = Math.min(fitWidth / bounds.width, fitHeight / bounds.height);

    if (!Number.isFinite(scale) || scale <= 0) {
        return;
    }

    animation.scale.set(scale);
    animation.position.set(
        app.screen.width / 2 - (bounds.x + bounds.width / 2) * scale,
        app.screen.height / 2 - (bounds.y + bounds.height / 2) * scale,
    );
}



// 角色资源管理接口
interface CharacterAssets {
    main: Spine;
    aim?: Spine;
    cover?: Spine;
}

// 加载单个Spine文件的辅助函数
async function loadSingleSpine(url: string): Promise<Spine> {
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
async function loadCharacterAssets(data: { url: string, type: ResType, characterUrls?: CharacterUrls }): Promise<CharacterAssets> {
    console.log("加载角色资源: ", data.characterUrls);
    
    // 加载主体动画
    const mainAnimation = await loadSingleSpine(data.url);
    
    const assets: CharacterAssets = {
        main: mainAnimation
    };
    
    // 如果有 characterUrls，尝试加载 aim 和 cover
    if (data.characterUrls) {
        // 尝试加载 aim 文件
        if (data.characterUrls.aim) {
            try {
                assets.aim = await loadSingleSpine(data.characterUrls.aim);
                console.log("成功加载 aim 资源");
            } catch (error) {
                console.warn("无法加载 aim 资源:", error);
            }
        }
        
        // 尝试加载 cover 文件
        if (data.characterUrls.cover) {
            try {
                assets.cover = await loadSingleSpine(data.characterUrls.cover);
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
        return loadCharacterAssets(data).then((assets) => {
            const mainAnimation = assets.main;
            
            // 设置主动画的位置和缩放
            app.stage.addChild(mainAnimation);
            
            console.log(mainAnimation.state.data.skeletonData.animations);
            console.log(mainAnimation.skeleton);
            
            // 使用配置化的动画设置
            applyAnimationConfig(mainAnimation, DEFAULT_ANIMATION_CONFIG, false);
            layoutPreviewSpine(mainAnimation, app);
            
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

            console.log(animation.state.data.skeletonData.animations);
            console.log(animation.skeleton);

            // 使用配置化的动画设置
            applyAnimationConfig(animation, DEFAULT_ANIMATION_CONFIG, false);
            layoutPreviewSpine(animation, app);

            // 加载完成，返回动画对象
            resolve(animation);
        }).catch((error) => {
            console.log("捕获错误: ", error);
            reject(error);  // 加载失败，返回错误
        });
    });
}

// 设置Spine动画的交互功能
export function setupSpineInteraction(animation: Spine, app: PIXI.Application, options: SpineInteractionOptions = {}) {
    const canvas = app.view as HTMLCanvasElement;
    let isDragging = false;
    let isPointerDown = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let hoveredSlotName: string | null = null;
    let pointerDownSlotName: string | null = null;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const getViewPoint = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const updateCursor = (cursor: string) => {
        canvas.style.cursor = cursor;
    };

    const clearHoveredSlot = () => {
        if (!hoveredSlotName) {
            return;
        }

        hoveredSlotName = null;
        options.onSlotLeave?.();
    };

    const setHoveredSlot = (slotName: string | null) => {
        if (hoveredSlotName === slotName) {
            return;
        }

        if (!slotName) {
            clearHoveredSlot();
            updateCursor(isDragging ? 'grabbing' : 'grab');
            return;
        }

        hoveredSlotName = slotName;
        options.onSlotHover?.(slotName);
        updateCursor(isDragging ? 'grabbing' : 'pointer');
    };

    const pickHoveredSlot = (clientX: number, clientY: number) => {
        const point = getViewPoint(clientX, clientY);
        const globalPoint = new PIXI.Point(point.x, point.y);
        const drawOrder = animation.skeleton?.drawOrder || animation.skeleton?.slots || [];

        for (let index = drawOrder.length - 1; index >= 0; index -= 1) {
            const slot = drawOrder[index] as any;
            const target = slot.currentMesh || slot.currentSprite;
            if (!target || !target.visible || !target.renderable || (slot.color?.a ?? 1) <= 0) {
                continue;
            }

            if (typeof target.containsPoint === 'function' && target.containsPoint(globalPoint)) {
                return slot.data.name;
            }

            const bounds = target.getBounds();
            if (bounds.contains(globalPoint.x, globalPoint.y)) {
                return slot.data.name;
            }
        }

        return null;
    };

    const handleMouseDown = (event: MouseEvent) => {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        const point = getViewPoint(event.clientX, event.clientY);
        lastPointerX = point.x;
        lastPointerY = point.y;
        pointerDownX = point.x;
        pointerDownY = point.y;
        pointerDownSlotName = pickHoveredSlot(event.clientX, event.clientY);
        isPointerDown = true;
        isDragging = false;
        updateCursor(pointerDownSlotName ? 'pointer' : 'grab');
    };

    const handleWindowMouseMove = (event: MouseEvent) => {
        if (!isPointerDown) {
            return;
        }

        const point = getViewPoint(event.clientX, event.clientY);
        const moveDistance = Math.hypot(point.x - pointerDownX, point.y - pointerDownY);
        if (!isDragging && moveDistance > 4) {
            isDragging = true;
            clearHoveredSlot();
            updateCursor('grabbing');
        }

        if (!isDragging) {
            return;
        }

        animation.x += point.x - lastPointerX;
        animation.y += point.y - lastPointerY;
        lastPointerX = point.x;
        lastPointerY = point.y;
    };

    const stopDragging = (event?: MouseEvent) => {
        if (!isPointerDown) {
            return;
        }

        const append = !!(event?.ctrlKey || event?.metaKey || event?.shiftKey);
        if (!isDragging && pointerDownSlotName) {
            options.onSlotSelect?.(pointerDownSlotName, append);
        }

        isPointerDown = false;
        isDragging = false;
        pointerDownSlotName = null;
        updateCursor(hoveredSlotName ? 'pointer' : 'grab');
    };

    const handleCanvasMouseMove = (event: MouseEvent) => {
        if (isDragging) {
            return;
        }

        setHoveredSlot(pickHoveredSlot(event.clientX, event.clientY));
    };

    const handleCanvasMouseLeave = () => {
        if (isDragging) {
            return;
        }

        setHoveredSlot(null);
    };

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();

        const point = getViewPoint(event.clientX, event.clientY);
        const scaleFactor = event.deltaY > 0 ? 0.95 : 1.05;
        const currentScale = animation.scale.x;
        const newScale = currentScale * scaleFactor;

        if (newScale >= 0.1 && newScale <= 5) {
            const localX = (point.x - animation.x) / currentScale;
            const localY = (point.y - animation.y) / currentScale;

            animation.scale.set(newScale);
            animation.x = point.x - localX * newScale;
            animation.y = point.y - localY * newScale;
        }
    };

    const handleWindowBlur = () => stopDragging();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseenter', handleCanvasMouseMove);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseleave', handleCanvasMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('blur', handleWindowBlur);
    updateCursor('grab');

    // 清理函数
    return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseenter', handleCanvasMouseMove);
        canvas.removeEventListener('mousemove', handleCanvasMouseMove);
        canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
        canvas.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', stopDragging);
        window.removeEventListener('blur', handleWindowBlur);
        clearHoveredSlot();
        canvas.style.cursor = '';
    };
}
