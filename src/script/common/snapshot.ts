import { cloneDeep } from "lodash";
import { useActionStore } from "../../stores/action-store";
import { Snapshot } from "../../types/app";

/**
 * 构建当前ActionItem的快照
 */
export function makeSnapshot(actionTitle: string, actionItemId: number): Snapshot {
    const action = useActionStore();
    const actionIndex = action.getAction(actionTitle).as.findIndex((item) => item.id === actionItemId);
    // 查询当前action中上一个actionitem的快照（如果有）
    if (actionIndex > 0) {
        // 等于上一个的先
        console.log(actionItemId, action.getAction(actionTitle).as[actionIndex - 1].snapshot);
        action.getAction(actionTitle).as[actionIndex].snapshot = cloneDeep(
            action.getAction(actionTitle).as[actionIndex - 1].snapshot!
        ) as Snapshot;
        return action.getAction(actionTitle).as[actionIndex - 1].snapshot!
    }
    // 如果是第一个就初始化一个快照
    const snapshot: Snapshot = {
        camera: { x: 0, y: 0, zoom: 0 },
        characters: new Map<string, {
            x: number;
            y: number;
            scale: number;
        }>(),
        background: { image: '', parallax: 0 },
        sound: { bgm: '', sfx: [] }
    };

    action.getAction(actionTitle).as[actionIndex].snapshot = snapshot;
    return snapshot;
}

// 更新快照需要更新所有快照
export function getSnapshot(actionTitle: string, actionItemId: number): Snapshot {
    const action = useActionStore();
    const actionIndex = action.getAction(actionTitle).as.findIndex((item) => item.id === actionItemId);
    return action.getAction(actionTitle).as[actionIndex].snapshot!;
}

export type PropertyPath =
    | 'camera.x'
    | 'camera.y'
    | 'camera.zoom'
    | 'background.image'
    | 'background.parallax'
    | `characters.${string}.x`
    | `characters.${string}.y`
    | `characters.${string}.scale`
    | 'sound.bgm'
    | `sound.sfx[${number}]`
    | 'none';

export interface Modification {
    path: PropertyPath;
    value: any;
    action?: 'add' | 'remove'; // 针对数组操作
}

