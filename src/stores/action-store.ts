// stores/action.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { Actions, GameMode, LoadRes, sceneCharacter, Snapshot } from '../types/app';
import { cloneDeep } from 'lodash';
import { Modification, PropertyPath } from '../script/common/snapshot';
import ResourceManager from '../script/resource-manager';
import { resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import CanvasManager from '../script/render/canvas-manager';



export const useActionStore = defineStore('action', () => {

  const isEditMode = ref<boolean>(false);

  // 使用 Record 结构存储 LoadRes
  const loadResMap = ref<Record<string, LoadRes>>({});

  // 使用 Record 结构存储 Actions
  const actionMap = ref<Record<string, Actions>>({});

  const gameMode = ref<GameMode>(GameMode.PLAY);
  const RealTimePreview = ref<boolean>(true);
  // 添加播放状态标志
  const isPlaying = ref<boolean>(false);
  const realTimePreview = computed({
    get: () => RealTimePreview.value,
    set: (value: boolean) => {
      console.log("set改变:", value);
      RealTimePreview.value = value;
      if (value) {
        CanvasManager.getInstance().setMode(GameMode.PREVIEW)
      } else {
        CanvasManager.getInstance().setMode()
      }
      currentSelectActionItemId.value = -1;
    },
  });

  // 场景当中的角色
  const maxCharacter = ref<sceneCharacter[]>([])

  // 当前选择的ActionTitle
  const currentSelectActionTitle = ref('Default');
  const currentSelectActionItemId = ref(-1);

  const initialSnapshot: Snapshot = {
    camera: {
      x: 0,
      y: 0,
      zoom: 1
    },
    characters: new Map<string, { x: number; y: number; scale: number }>(),
    background: {
      image: '',
      parallax: 0
    },
    sound: {
      bgm: '',
      sfx: []
    }
  };

  // 预览快照
  const previewSnapshot = ref<Snapshot>({
    camera: {
      x: 0,
      y: 0,
      zoom: 1
    },
    characters: new Map<string, { x: number; y: number; scale: number }>(),
    background: {
      image: '',
      parallax: 0
    },
    sound: {
      bgm: '',
      sfx: []
    }
  });

  let setLastSnapshot: boolean = true;

  // 应用上一个的场景快照 使其影响到场景（用于预览）
  function applyPreviewSnapshot(endIndex: number, actionTitle: string, startIndex: number = 0) {
    console.log(`开始：${startIndex}，结束：${endIndex}`);
    setPreviewSnapshotAll(endIndex, actionTitle, startIndex);
    console.log("应用的数据：", previewSnapshot.value);
  }

  function getCurrentModification(actionTitle: string, actionItemId: number): Map<PropertyPath, Modification> {
    // 获取 action 对象
    const action = getAction(actionTitle);
    const actionIndex = action.as.findIndex((item) => item.id === actionItemId);
    // 获取特定的 ActionItem
    const actionItem = action.as[actionIndex];

    // 如果当前 ActionItem 有 modification，直接返回
    if (actionItem.modification) {
      return actionItem.modification;
    }

    // 如果没有 modification，则创建并返回一个新的 Map
    return (actionItem.modification = new Map());
  }

  // 构造预览
  function setPreviewSnapshotAll(endIndex: number, actionTitle: string, startIndex: number = 0) {

    // 如果是第一个无论如何都是初始值
    if (endIndex == 0) {
      previewSnapshot.value = Object.assign(previewSnapshot.value, {
        camera: { ...initialSnapshot.camera },
        characters: new Map<string, { x: number; y: number; scale: number }>(),
        background: { ...initialSnapshot.background },
        sound: { ...initialSnapshot.sound },
      });
    }
    let action = getAction(actionTitle);
    for (let i = startIndex; i < endIndex; i++) {
      let modifications = action.as[i]?.modification;

      if (!modifications) continue;

      // 遍历 modification 的 key-value 对，应用修改
      modifications.forEach((modification) => {
        setPreviewSnapshot(modification);
      });
    }
    console.log("构造后的数据：", previewSnapshot.value);

  }

  /**
   * 运行所有的 Action 通过 wait 来控制是否等待
   * @returns {Promise<void>} 
   * */
  async function runAllActions() {
    CanvasManager.getInstance().initMask.alpha = 1;
    // 开始播放前端必要初始化
    initAny();
    // 设置播放状态为 true
    isPlaying.value = true;
    gameMode.value = GameMode.PLAY;
    CanvasManager.getInstance().setMode(GameMode.PLAY);
    // 遍历 actionMap 中所有 Actions
    for (const key in actionMap.value) {
      const actions = actionMap.value[key];
      if (!actions) continue;

      // 遍历当前 Actions 的每个 ActionItems
      for (const item of actions.as) {
        if (typeof item.action === 'function') {
          const result = item.action();
          console.log("当前ActionItem:", item)
          console.log("当前ActionItem的结果:", result)

          if (item.wait) {
            await Promise.resolve(result);
          } else {
            // fire-and-forget，不等待
            Promise.resolve(result);
          }
        }
      }
    }
    // 播放结束，设置播放状态为 false
    isPlaying.value = false;
  }

  function setPreviewSnapshot(modification: Modification) {
    // 如果当前 ActionItem 的修改为none 代表没修改就跳过
    if (modification.path === 'none') {
      return;
    }

    const pathParts = modification.path.split('.');
    let target: any = previewSnapshot.value;

    // 处理 characters.<id>.x/y/scale
    if (pathParts[0] === 'characters' && pathParts.length === 3) {
      const charId = pathParts[1];
      const property = pathParts[2] as 'x' | 'y' | 'scale';

      if (modification.action === 'remove') {
        // 删除整个角色
        previewSnapshot.value.characters.delete(charId);
      } else {
        if (!previewSnapshot.value.characters.has(charId)) {
          previewSnapshot.value.characters.set(charId, { x: 0, y: 0, scale: 1 });
        }
        previewSnapshot.value.characters.get(charId)![property] = modification.value;
      }
      return;
    }

    // 处理 sound.sfx[0] 这样的数组
    const arrayMatch = modification.path.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1]; // e.g., "sound.sfx"
      const index = parseInt(arrayMatch[2], 10); // e.g., 0

      let targetArray: any = previewSnapshot.value;
      for (const key of arrayKey.split('.')) {
        targetArray = targetArray[key];
      }

      if (!Array.isArray(targetArray)) return;

      if (modification.action === 'add') {
        targetArray.splice(index, 0, modification.value);
      } else if (modification.action === 'remove') {
        targetArray.splice(index, 1);
      } else {
        targetArray[index] = modification.value;
      }
      return;
    }

    // 处理普通路径
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      target = target[part];

      // 路径无效
      if (!target) return;
    }

    const lastKey = pathParts[pathParts.length - 1];

    if (modification.action === 'remove' && lastKey in target) {
      delete target[lastKey];
    } else if (target && lastKey in target) {
      target[lastKey] = modification.value;
    }

  }

  function updateSnapshot(actionTitle: string, actionItemId: number, _end?: number, _updates?: Snapshot) {
    const action = getAction(actionTitle);
    if (!action) return;

    const actionItems = action.as;

    // 更新
    // for (let i = 1; i <= end; i++) {
    //   actionItems[i].snapshot = {
    //     // 深拷贝前一个 snapshot
    //     ...cloneDeep(actionItems[i - 1].snapshot)!,
    //   };
    // }

    // ✅ 让后续 ActionItem 继承更新后的值，而不是完全重写, 只更新后面一个 然后通过监听器级联完成更新
    if (actionItemId + 1 < actionItems.length) {
      actionItems[actionItemId + 1].snapshot = {
        // 深拷贝前一个 snapshot
        ...cloneDeep(actionItems[actionItemId].snapshot)!,
      };
    }
  }


  function eqSelectActionItem(title: string, id: number) {
    return currentSelectActionTitle.value === title && currentSelectActionItemId.value == id
  }

  // 添加 LoadRes
  function addLoadRes(loadRes: LoadRes): boolean {
    if (loadResMap.value[loadRes.path]) {
      return false;
    }
    loadResMap.value[loadRes.path] = loadRes;
    resolveResource(loadRes.path).then((allPath) => {
      const resUrl = convertFileSrc(allPath);
      ResourceManager.loadResource(loadRes.path, resUrl, loadRes.type);
    })
    // console.log(filePath);
    return true;
  }

  // 异步添加资源 这个主要是为了需要同步拿到加载后的资源的
  async function addLoadResAsync(loadRes: LoadRes): Promise<boolean> {
    // 如果资源已存在，立即返回false
    if (loadResMap.value[loadRes.path]) {
      return false;
    }

    // 添加到资源映射
    loadResMap.value[loadRes.path] = loadRes;

    try {
      // 解析资源路径
      const allPath = await resolveResource(loadRes.path);
      const resUrl = convertFileSrc(allPath);

      // 加载资源并等待完成
      await ResourceManager.loadResource(loadRes.path, resUrl, loadRes.type);

      return true;
    } catch (error) {
      // 加载失败时从映射中移除
      delete loadResMap.value[loadRes.path];
      // 重新抛出错误以便调用方可以捕获
      throw error;
    }
  }

  // 开始播放前的必要初始化
  function initAny() {
    const cm = CanvasManager.getInstance()

    // 重置 Mask 的遮罩
    cm.initMask.zIndex = 9999;

    cm.transitionMask.alpha = 0;

    cm.uiRender.voiceoverTextAera.visible = false;
    cm.uiRender.normalDialog.visible = false;
    cm.uiRender.normalTextAera.visible = false;

    cm.uiRender.stage.sortChildren()
  }



  // 删除 LoadRes
  function removeLoadRes(path: string) {
    delete loadResMap.value[path];
  }

  // 获取 LoadRes
  function getLoadRes(path: string) {
    return loadResMap.value[path] ?? null;
  }

  // 添加 Action
  function addAction(action: Actions) {
    actionMap.value[action.title] = action;
  }

  // 删除 Action
  function removeAction(title: string) {
    delete actionMap.value[title];
  }

  // 获取 Action
  function getAction(title: string) {
    return actionMap.value[title] ?? null;
  }

  return {
    currentSelectActionTitle,
    currentSelectActionItemId,
    loadResMap,
    actionMap,
    previewSnapshot,
    setLastSnapshot,
    gameMode,
    realTimePreview,
    maxCharacter,
    isPlaying,
    isEditMode,
    applyPreviewSnapshot,
    setPreviewSnapshotAll,
    getCurrentModification,
    setPreviewSnapshot,
    updateSnapshot,
    eqSelectActionItem,
    addLoadRes,
    addLoadResAsync,
    removeLoadRes,
    getLoadRes,
    addAction,
    removeAction,
    getAction,
    runAllActions,
    initAny,
  };
});


