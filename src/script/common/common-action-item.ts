import { Viewport } from 'pixi-viewport';
import { useActionStore } from '../../stores/action-store';
import { GameMode, InputOption } from '../../types/app';
import CanvasManager from '../render/canvas-manager';
import { setModification } from '../util/common';
import { Modification, PropertyPath } from './snapshot';
import { Ref } from 'vue';

export function useCommonState(actionTitle: string, actionId: number) {
    const action = useActionStore();
    const actionItem = action.getAction(actionTitle).as[actionId]!;
    actionItem.wait = true;

    return { action, actionItem };
}

export function handleSceneState(canvasManager: CanvasManager, props: { id: number; title: string }) {
    const action = useActionStore();
    // 检查当前游戏模式并应用相应的操作
    if (canvasManager.getMode() === GameMode.PREVIEW || canvasManager.getMode() === GameMode.SCENE || canvasManager.getMode() === GameMode.PLAY)  {
        // 应用上一个场景快照
        action.applyPreviewSnapshot(props.id, props.title);
    } else {
        // 在播放模式下增量更新预览快照
        // 获取当前动作的修改
        const actionObj = action.getAction(props.title);
        const actionItem = actionObj.as[props.id];
        console.log("actrion", actionItem);

        if (actionItem && actionItem.modification) {
            console.log(`播放模式下增量更新快照: ${props.title} - ${props.id} ${JSON.stringify(actionItem.modification)}`);
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