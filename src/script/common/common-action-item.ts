import { Viewport } from 'pixi-viewport';
import { useActionStore } from '../../stores/action-store';
import { Actions, GameMode, InputOption, LoadRes, Project } from '../../types/app';
import CanvasManager from '../render/canvas-manager';
import { setModification } from '../util/common';
import { Modification, PropertyPath } from './snapshot';
import { Ref } from 'vue';
import ResourceManager from '../resource-manager';
import { Spine } from 'pixi-spine';
import { ResType } from '../var';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { useProjectStore } from '../../stores/project-store';

export function useCommonState(actionTitle: string, actionId: number) {
    const action = useActionStore();
    const actionIndex = action.getAction(actionTitle).as.findIndex((item) => item.id === actionId);
    const actionItem = action.getAction(actionTitle).as[actionIndex]!;
    
    // 只在wait属性未定义时才设置默认值，避免覆盖反序列化的值
    if (actionItem.wait === undefined) {
        actionItem.wait = true;
    }


    return { action, actionItem };
}

export function handleSceneState(canvasManager: CanvasManager, props: { id: number; title: string }) {
    const action = useActionStore();
    const actionIndex = action.getAction(props.title).as.findIndex((item) => item.id === props.id);
    // 检查当前游戏模式并应用相应的操作
    if (canvasManager.getMode() === GameMode.PREVIEW || canvasManager.getMode() === GameMode.SCENE || canvasManager.getMode() === GameMode.PLAY)  {
        // 应用上一个场景快照
        action.applyPreviewSnapshot(actionIndex, props.title);
    } else {
        // 在播放模式下增量更新预览快照
        // 获取当前动作的修改
        const actionObj = action.getAction(props.title);
        const actionItem = actionObj.as[actionIndex];
        console.log("actrion", actionItem);

        if (actionItem && actionItem.modification) {
            console.log(`播放模式下增量更新快照: ${props.title} - ${actionIndex} ${JSON.stringify(actionItem.modification)}`);
            console.log("预览快照", action.previewSnapshot);
            // 遍历当前动作的所有修改，应用到预览快照
            actionItem.modification.forEach((modification) => {
                // 调用 setPreviewSnapshot 方法应用修改
                action.setPreviewSnapshot(modification);
            });

            console.log("预览快照2", action.previewSnapshot);

        }
    }
}

export function updateCameraView(viewport: Viewport, cameraValues: Ref<InputOption[]>, modification: Map<PropertyPath, Modification>): void {
    const newX = Math.round(viewport.center.x * 10) / 10;
    const newY = Math.round(viewport.center.y * 10) / 10;
    viewport.moveCenter(newX, newY);
    cameraValues.value[0].value = newX;
    cameraValues.value[1].value = newY;

    console.log(`缩放触发：${viewport.scale}`);

    cameraValues.value[0].value = newX;
    cameraValues.value[1].value = newY;
    cameraValues.value[2].value = viewport.scale.x;


    setModification(modification, 'camera.x', newX);
    setModification(modification, 'camera.y', newY);
    setModification(modification, 'camera.zoom', viewport.scale.x);
}

export function updateCameraViewOnlyPos(viewport: Viewport, cameraValues: Ref<InputOption[]>, modification: Map<PropertyPath, Modification>): void {
    const newX = Math.round(viewport.center.x * 10) / 10;
    const newY = Math.round(viewport.center.y * 10) / 10;
    viewport.moveCenter(newX, newY);
    cameraValues.value[0].value = newX;
    cameraValues.value[1].value = newY;
    setModification(modification, 'camera.x', newX);
    setModification(modification, 'camera.y', newY);
}

// 打开项目
export async function openProject(filePath: string) {
    try {
        let selected: string | null = null;

        if (filePath) {
            selected = filePath;
        } 

        if (!selected) {
            return;
        }
        console.log("selected:", selected);
        const projectData = await readTextFile(selected as string);
        const project: Project = JSON.parse(projectData);
        console.log("project:", project);
        project.savePath = selected;

        const projectStore = useProjectStore();
        const actionStore = useActionStore();

        // 使用项目store打开项目
        projectStore.openProject(project);
        await new Promise(resolve => setTimeout(resolve, 100));

        // 加载项目数据到各个store
        if (project.projectData) {
            // 加载actionStore数据
            if (project.projectData.actionStore) {
                const actionData = project.projectData.actionStore;

                // 恢复基本数据
                actionStore.isEditMode = actionData.isEditMode;

                console.log("loadResMap:", actionStore.loadResMap);

                // 重新加载所有资源，不能直接赋值loadResMap
                if (actionData.loadResMap) {
                    for (const [path, loadRes] of Object.entries(actionData.loadResMap as Record<string, LoadRes>)) {
                        try {
                            await actionStore.addLoadResAsync(loadRes);
                            console.log(`loadResMap 成功加载资源: ${path}`);
                        } catch (error) {
                            console.error(`loadResMap 加载资源失败: ${path}`, error);
                        }
                    }
                }

                console.log("loadResMap:", actionData.loadResMap, actionStore.loadResMap);

                // 反序列化actionMap，恢复Map对象
                const deserializedActionMap: Record<string, Actions> = {};
                Object.entries(actionData.actionMap as Record<string, any>).forEach(([key, actions]) => {
                    deserializedActionMap[key] = {
                        title: actions.title,
                        as: actions.as.map((actionItem: any) => ({
                            ...actionItem,
                            // 将数组格式转换回Map对象
                            modification: actionItem.modification ?
                                new Map(actionItem.modification) : undefined
                        }))
                    };
                });

                actionStore.actionMap = deserializedActionMap;
                actionStore.gameMode = actionData.gameMode;
                actionStore.realTimePreview = actionData.RealTimePreview;
                actionStore.isPlaying = actionData.isPlaying;
                actionStore.currentSelectActionTitle = actionData.currentSelectActionTitle;
                actionStore.currentSelectActionItemId = actionData.currentSelectActionItemId;

                // 恢复previewSnapshot
                if (actionData.previewSnapshot) {
                    actionStore.previewSnapshot.camera = actionData.previewSnapshot.camera;
                    actionStore.previewSnapshot.characters = new Map(Object.entries(actionData.previewSnapshot.characters));
                    actionStore.previewSnapshot.background = actionData.previewSnapshot.background;
                    actionStore.previewSnapshot.sound = {
                        bgm: actionData.previewSnapshot.sound.bgm,
                        sfx: [...actionData.previewSnapshot.sound.sfx]
                    };
                }

                // 恢复maxCharacter，重新加载spine对象并添加到场景中
                if (actionData.maxCharacter) {
                    actionStore.maxCharacter = [];

                    const canvasManager = CanvasManager.getInstance();

                    for (const charData of actionData.maxCharacter) {
                        // 使用ResourceManager重新加载spine
                        const spine = ResourceManager.getResource<Spine>(charData.spineResourceKey, ResType.Spine) as Spine;

                        console.log("加载角色Spine: ", charData.spineResourceKey, spine);

                        // 构建角色信息对象
                        const characterInfo = {
                            character: charData.character,
                            x: charData.x,
                            y: charData.y,
                            scale: charData.scale,
                            isInitShow: charData.isInitShow,
                        };

                        // 调用addCharacterSpine方法将角色添加到场景中
                        canvasManager.addCharacterSpine(charData.spineResourceKey, characterInfo);
                    }
                }
            }
        }

        console.log('项目加载成功:', project.projectName);

    } catch (error) {
        console.error('打开项目失败:', error);
        alert('打开项目失败，请检查文件格式是否正确');
    }
};