import { Modification, PropertyPath } from "../common/snapshot";

export function setModification(
    modificationMap: Map<PropertyPath, Modification>,
    path: PropertyPath,
    value: any,
    action?: 'add' | 'remove'
) {
    // 如果 key 已经存在，修改它的值
    if (modificationMap.has(path)) {
        // 如果值相同就不修改
        if (modificationMap.get(path)!.value != value) {
            modificationMap.get(path)!.value = value;
        }
        if (action) {
            modificationMap.get(path)!.action = action;
        }
    } else {
        // 否则，创建新的 Modification 并添加到 Map
        modificationMap.set(path, { path, value, action });
    }
}