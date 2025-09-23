<template>
    <div ref="timeRef" class="time-line" id="target" @dragover.prevent @drop="handleDrop">
        <Action @hover="handleTitle" :title="initAction">
            <ActionItem title="Init Load Action" :type="ActionItemtype.LOAD"
                v-for="(item, _path) in actionStore.loadResMap" :key="item.name" :load="item" />
        </Action>
        <div class="canvas-mode" style="opacity: 1;padding-right: 5px;">
            <span style="opacity: .3;display: flex;align-items: center;">当前画布模式为：{{ actionStore.gameMode }}</span>
            <!-- <div>播放</div> -->
            <button class="play-button" @click="handlePlay">
                <span class="play-icon">▶</span> 播放 <span class="shortcut-hint">[CTRL + 空格]</span>
            </button>
        </div>
        <Action @hover="handleTitle" v-for="(item, title) in actionStore.actionMap" @click="selectAction(title)"
            :class="{ 'active-action': title == actionStore.currentSelectActionTitle }" :data="item.as"
            :title="item.title" :key="title">
        </Action>
    </div>

    <div class="time-line-tool-bar">
        <div style="overflow: hidden;">
            <div style="line-height: 30px;white-space: nowrap;">实时预览</div>
            <ToggleSwitch v-model="actionStore.realTimePreview"></ToggleSwitch>
            <div style="font-size: 14px;opacity: .5;white-space: nowrap;text-overflow: ellipsis;overflow: hidden;">⚠
                即时内容无法预览</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import showMessage from '../../script/common/massage';
import { ActionItemtype, CharacterType, DragType, GameMode, dirs } from '../../types/app';
import Action from './Action.vue';
import ActionItem from './ActionItem.vue';
import { ASSET_CHARACTER, ResType } from '../../script/var';
import { selectResType } from '../../script/common/search-action';
import { useActionStore } from '../../stores/action-store';
import ToggleSwitch from '../common/ToggleSwitch.vue';
import CanvasManager from '../../script/render/canvas-manager';

const initAction = ref("Init Load Action")

const actionStore = useActionStore();


const selectHoverActionTitle = ref(initAction.value);
const timeRef = ref<HTMLDivElement | null>(null)

const selectAction = (key: string) => {
    actionStore.currentSelectActionTitle = key;
    let canvasManager = CanvasManager.getInstance();

    // 切换Action后 选择的ActionItem也会被清空
    actionStore.currentSelectActionItemId = -1;
    if (actionStore.realTimePreview) {
        canvasManager.setMode(GameMode.PREVIEW);
    } else {
        canvasManager.setMode();
        // canvasManager.initMask.alpha = 1;
    }
}

const handleTitle = (title: string) => {
    selectHoverActionTitle.value = title
}

const handlePlay = async () => {
    // showMessage("开始播放", "success", 1500);
    console.log("开始播放");
    
    // 取消一些内容的显示如切换 
    await actionStore.runAllActions();
    // showMessage("播放借宿", "success", 1500);
    console.log("播放结束");
};

const handleDrop = async (event: DragEvent) => {
    event.preventDefault(); // 确保数据可以被接受
    const data = event.dataTransfer?.getData("type"); // 获取拖放的数据

    // 在这里只能接受 Action类型的数据拖拽过来
    if (data === DragType.ACTION) {
        console.log("拖拽成功！");
    } else if (data === DragType.ASSEST) {
        console.log("time line");
        const assetData = event.dataTransfer?.getData("asset_data"); // 获取拖放的数据
        let name = ''
        // 如果目标不是time line的话就需要打开查询action窗口

        if (assetData) {
            const file: { e: dirs | CharacterType, type: ResType } = JSON.parse(assetData);
            let result = false;
            if (file.type == ResType.Spine) {
                const char = file.e as CharacterType

                await handleSearchAction(event, file.type, char.characterName)
                result = actionStore.addLoadRes({
                    name: char.characterName,
                    path: ASSET_CHARACTER + char.path?.name + "/" + char.path?.skel,
                    type: file.type
                })
                name = char.characterName;
            } else {
                const dirs = file.e as dirs

                await handleSearchAction(event, file.type, dirs.data.name)
                result = actionStore.addLoadRes({
                    name: dirs.data.name,
                    path: dirs.path,
                    type: file.type
                })
                name = dirs.data.name;
            }


            if (!result) {
                if (event.target === timeRef.value || selectHoverActionTitle.value === initAction.value) {
                    showMessage(`${name}：已存在`, "error", 2000);

                }
            } else {
                showMessage(`预加载: ${name} `, "success", 2000);

            }
        }

    }
    else {
        showMessage(`无法处理：${data} `, "error", 2000);
    }

}

// 抽离出的方法
const handleSearchAction = async (event: DragEvent, fileType: ResType, name: string) => {

    if (event.target !== timeRef.value) {
        try {
            console.log(event);
            console.log("Hover:", selectHoverActionTitle.value);
            if (initAction.value === selectHoverActionTitle.value) {
                return;
            }
            const res = await selectResType(fileType, name);
            console.log("选择的类型：", res);

            if (selectHoverActionTitle.value && selectHoverActionTitle.value !== initAction.value) {
                actionStore.getAction(selectHoverActionTitle.value).as.push({
                    type: res,
                    id: new Date().getTime(),
                })
            }

        } catch {
        }

    }
}

const createAction = () => {
    actionStore.addAction({
        title: "Default",
        as: []
    })

    // for (let i = 0; i < 2; i++) {
    //     actionStore.addAction({
    //         title: "Action Test " + i,
    //         as: []
    //     })
    // }
}

// 处理键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl + 空格作为播放快捷键
    if (event.code === 'Space' && event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault(); // 防止滚动或其他默认行为
        handlePlay();
    }
};

onMounted(() => {
    createAction();
    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
    // 移除键盘事件监听器
    window.removeEventListener('keydown', handleKeyDown);
});

</script>

<style lang="css" scoped>
.time-line {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    box-sizing: border-box;
    /* 使内边距和边框计算在总宽度内 */
}

.time-action {
    margin: 5px 10px;
    margin-right: 4px;
    border: 2px solid rgb(59, 54, 41);
    border-radius: 5px;
    padding: 6px;
    transition: border .1s ease;
}

.text-test {
    width: 100%;
    text-align: center;
}

.time-line:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);
}

.time-line::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.time-line::-webkit-scrollbar-track {
    background: transparent;
}

.time-line::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.time-line::-webkit-scrollbar-thumb:hover {
    background-color: var(--high-hover-bg);
}

.active-action {
    border: 2px solid var(--button-bg);

}

.time-line-tool-bar {
    padding: 5px 10px;
    display: flex;
    align-items: center;
    justify-content: left;
    width: 100%;
}

.time-line-tool-bar>div {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.canvas-mode {
    font-size: 14px;
    opacity: .3;
    padding-left: 10px;

    display: flex;
    justify-content: space-between;
    padding-right: 10px;

}

.play-button {
    background-color: #4CAF50;
    /* 绿色 */
    border: none;
    color: white;
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    opacity: 1 !important;
    display: flex;
    align-items: center;
    gap: 5px;
}

.play-button:hover {
    background-color: #45a049;
}

.play-icon {
    font-size: 12px;
}

.shortcut-hint {
    font-size: 12px;
    opacity: 0.8;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 1px 4px;
    border-radius: 3px;
    margin-left: 2px;
}
</style>