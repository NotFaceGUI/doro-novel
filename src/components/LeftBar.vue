<template>
    <div class="bar-content">
        <div class="bar-font-icon ">🎬
        </div>
        <div class="top-bottom"></div>
        <div class="bar-font-icon" :class="{ active: selectedTab === 'Character & Story' }"
            @click="selectTab('Character & Story')">🕵️‍♂️
        </div>
        <div class="bar-font-icon" :class="{ active: selectedTab === 'Image' }" @click="selectTab('Image')">🖼
        </div>
        <div class="bar-font-icon" :class="{ active: selectedTab === 'Video' }" @click="selectTab('Video')">📺
        </div>
        <div class="bar-font-icon" :class="{ active: selectedTab === 'Sound' }" @click="selectTab('Sound')">🎶
        </div>
        <div class="bar-font-icon" :class="{ active: selectedTab === 'Package' }" @click="selectTab('Package')">📦
        </div>
    </div>
    <div class="tab-content" ref="tabContent" :style="{ width: tabContentWidth + 'px' }">
        <div class="tab-title">
            <span style="opacity: .4;">
                {{ selectedTab }}
            </span>
            <div class="icon-work">
                <!-- <span>
                    +
                </span>
                <span>
                    🗂
                </span> -->
                <span class="re-load" @click="reload">
                    ↻
                </span>
                <span class="re-set">
                    ⤷
                </span>
            </div>
        </div>
        <div class="tab-info" v-show="selectedTab === 'Character & Story'" style="">
            <AssetTree @look-file="handleResUrl" :type="ResType.Spine" :files="[]"></AssetTree>
        </div>
        <div class="tab-info" v-show="selectedTab === 'Sound'" style="">
            <AssetTree @look-file="handleResUrl" :type="ResType.Audio" :files="audioFiles"
                :key="audioFiles[0]?.time || Date.now()"></AssetTree>
        </div>
        <div class="look-audio" v-show="selectedTab === 'Sound'">
            <audio ref="audioPlayer" class="audio-player" controls controlslist="nodownload">
                <source type="audio/mp3" />
                Your browser does not support the audio element.
            </audio>
        </div>

        <div class="tab-info" v-show="selectedTab === 'Image'">
            <AssetTree @look-file="handleResUrl" :type="ResType.Image" :files="imageFiles"
                :key="imageFiles[0]?.time || Date.now()"></AssetTree>
        </div>

        <div class="tab-info" v-show="selectedTab === 'Video'">
            <AssetTree @look-file="handleResUrl" :type="ResType.Video" :files="videoFiles"
                :key="videoFiles[0]?.time || Date.now()"></AssetTree>
        </div>
        <div class="resizer" @mousedown="initResize"></div>
    </div>

    <ResizableTab title="🎬 Time Line"  :min-width="300" :default-width="400">
        <TimeLine></TimeLine>
    </ResizableTab>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ASSET_AUDIO, /* DEFAULT_WIDTH ,*/ MAX_WIDTH, MIN_WIDTH, ResType } from '../script/var';
import AssetManager from '../script/asset-manager';
import { dirs } from '../types/app';
import AssetTree from './asset/AssetTree.vue';
import { BaseDirectory, DirEntry, watch, WatchEvent, WatchEventKind } from '@tauri-apps/plugin-fs';
import ResizableTab from './asset/ResizableTab.vue';
import { invoke } from '@tauri-apps/api/core';
import TimeLine from './edit/TimeLine.vue';

const selectedTab = ref(''); // 默认选中的选项卡

const audioFiles = ref<dirs[]>([])
const imageFiles = ref<dirs[]>([])
const videoFiles = ref<dirs[]>([])

onMounted(() => {
    selectTab("Character & Story");
})

const audioPlayer = ref<HTMLAudioElement | null>(null);

const leftEmit = defineEmits(['render-file'])

const reload = () => {
    switch (selectedTab.value) {
        case "Sound":
            assetManager.getAudioFiles().then(value => {
                audioFiles.value = value;
            })
            break;
        case 'Image':
            assetManager.getImageFiles().then(value => {
                imageFiles.value = value;
            })
            break;
        case 'Video':
            assetManager.getVideoFiles().then(value => {
                videoFiles.value = value;
            })
            break;
        default:
            break;
    }
}

const selectTab = (tab: string) => {
    if (selectedTab.value == tab) {
        selectedTab.value = "";
        tabContentWidth.value = 0;
        return;
    }
    if (tabContentWidth.value == 0) {
        tabContentWidth.value = MIN_WIDTH;
    }
    selectedTab.value = tab;

    switch (selectedTab.value) {
        case "Character & Story":
            break;
        case 'Image':
            if (imageFiles.value.length == 0) {
                assetManager.getImageFiles().then(value => {
                    imageFiles.value = value;
                })
            }
            break;
        case 'Video':
            if (videoFiles.value.length == 0) {
                assetManager.getVideoFiles().then(value => {
                    videoFiles.value = value;
                })
            }
            break;
        case 'Sound':
            if (audioFiles.value.length == 0) {
                assetManager.getAudioFiles().then(value => {
                    audioFiles.value = value;
                })
            }
            break;
        case 'Package':
            break;

        default:
            break;
    }
};



// #region Tab 控制宽度大小的实现
const tabContentWidth = ref(MIN_WIDTH);
let startX = 0;
let startWidth = 0;

const initResize = (event: MouseEvent) => {
    startX = event.clientX;
    startWidth = tabContentWidth.value;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
};

const resize = (event: MouseEvent) => {
    const newWidth = startWidth + (event.clientX - startX);

    tabContentWidth.value = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);

    if (selectedTab.value == '') {
        selectedTab.value = 'Resource'
    }
};

const stopResize = () => {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
};
// #endregion Resize 逻辑

// #region 资源管理逻辑
const assetManager = AssetManager.getInstance();

const handleResUrl = (data: { url: string, type: ResType, file: DirEntry }) => {
    console.log("父组件：", data.url);

    // 如果 data.type 没有明确设置，则根据文件扩展名自动检测类型
    let detectedType: ResType = data.type;
    if (detectedType == ResType.Spine) {
        leftEmit('render-file', { url: data.url, type: detectedType });
        return;
    }

    if (/\.(mp3|wav|ogg)$/i.test(data.file.name)) {
        detectedType = ResType.Audio;
    } else if (/\.(mp4|mkv|avi|mov)$/i.test(data.file.name)) {
        detectedType = ResType.Video;
    } else if (/\.(png|jpe?g|gif|svg)$/i.test(data.file.name)) {
        detectedType = ResType.Image;
    } else {
        detectedType = ResType.Document;
    }

    // 根据检测的类型执行对应的逻辑
    switch (detectedType) {
        case ResType.Audio:
            if (audioPlayer.value) {
                if (audioPlayer.value.src !== data.url) {
                    audioPlayer.value.src = data.url;
                    audioPlayer.value.play();
                } else {
                    if (!audioPlayer.value.paused) {
                        audioPlayer.value.pause();
                    } else {
                        audioPlayer.value.play();
                    }
                }
            }
            break;
        // 其他类型可以在这里添加相应逻辑
        case ResType.Image:
        case ResType.Video:
        case ResType.Document:
            leftEmit('render-file', { url: data.url, type: detectedType });
            break;
        default:
            break;
    }
}

// #endregion

// 处理文件改变 
// TODO: 增量更新不全局更新
const handleFileChange = async (file: WatchEvent) => {
    const path = file.paths[0];
    const attr = file.attrs
    const type: WatchEventKind = file.type;

    console.log("Change Paths:", path);
    console.log("Change Attrs:", attr);
    console.log("Change types:", type);

    if (type === "any") {
        console.log("处理任意类型的事件");
    } else if (type === "other") {
        console.log("处理其他类型的事件");
    } else if (typeof type === "object") {
        if ("access" in type) {
            console.log("处理访问事件:", type.access);
        } else if ("create" in type) {
            console.log("处理创建事件:", type.create);
            try {
                const result = await invoke("check_path_is_file", { path });
                console.log(result);
            } catch (error) {
                console.error("调用失败:", error);
            }
        } else if ("modify" in type) {
            console.log("处理修改事件:", type.modify);
        } else if ("remove" in type) {
            console.log("处理删除事件:", type.remove);
        } else {
            console.log("未知的对象事件类型");
        }
    } else {
        console.log("无效的事件类型");
    }
}

onMounted(async () => {
    document.addEventListener('mouseup', stopResize);
    // 监听资源文件，如果发生变化就变更
    // TODO: 
    await watch(
        [ASSET_AUDIO],
        (_event) => {
            // selectTab(selectedTab.value);
            handleFileChange(_event)
        },
        {
            baseDir: BaseDirectory.Resource,
            recursive: true,
        }
    )
});

onBeforeUnmount(() => {
    document.removeEventListener('mouseup', stopResize);
});
</script>

<style lang="css">
.bar-content {
    width: 50px;
    background-color: var(--high-bg);
    border-right: 1px solid var(--deep-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 20px;
}

.bar-font-icon {
    width: 100%;
    height: 50px;
    line-height: 45px;
    display: flex;
    justify-content: center;
    border: 0 solid rgb(207, 189, 25);
    transition: all .2s ease-in-out;
}

.bar-font-icon:hover {
    background-color: var(--high-hover-bg);
}

.active {
    border-left: 8px solid rgb(207, 189, 25);
    background-color: var(--high-hover-bg);
}

.tab-content {
    border: 1px solid transparent;
    border-right: 1px solid var(--deep-border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

.tab-info,
.tab-title {
    margin: 5px 0;
    padding: 0 10px;
    width: 100%;
    text-align: left;
    font-size: 14px;
    /* opacity: 0.4; */
}

.tab-info>ul>li {
    padding-left: 0px;
}

.tab-info>ul>li {
    padding: 0 10px;
}

.tab-info {
    padding: 0;
    height: 100%;
    overflow: auto;
    flex: 1;
}

.tab-info:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);

}


.tab-info::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.tab-info::-webkit-scrollbar-track {
    background: transparent;
}

.tab-info::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.tab-info::-webkit-scrollbar-thumb:hover {
    background-color: var(--high-hover-bg);
}

.resizer {
    width: 1px;
    cursor: ew-resize;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: var(--deep-border-color);
    transition: all 0.3s ease-in-out;
}

.resizer:active,
.resizer:hover {
    width: 5px;
    background: var(--high-hover-bg);
}

.look-audio {
    position: sticky;
    bottom: 0;
    width: 100%;
    background-color: var(--high-hover-bg);
    z-index: 10;
    transition: height 0.3s ease;
    overflow: hidden;
    display: flex;
}

audio {
    height: 25px;
    width: 222%;
    color: white;
    outline: none;
    border-radius: 0;
    border: 0px;
    background-color: var(--high-hover-bg);
}

audio::-webkit-media-controls-enclosure {
    background-color: unset;
}

/* 确保所有控件的文字和图标为白色 */
audio::-webkit-media-controls-play-button,
audio::-webkit-media-controls-mute-button,
audio::-webkit-media-controls-timeline,
audio::-webkit-media-controls-current-time-display,
audio::-webkit-media-controls-time-remaining-display,
audio::-webkit-media-controls-volume-slider,
audio::-webkit-media-controls-volume-slider-container,
audio::-webkit-media-controls-seek-back-button,
audio::-webkit-media-controls-seek-forward-button,
audio::-webkit-media-controls-fullscreen-button,
audio::-webkit-media-controls-rewind-button,
audio::-webkit-media-controls-return-to-realtime-button,
audio::-webkit-media-controls-toggle-closed-captions-button {
    color: white;
}

.top-bottom {
    width: 100%;
    padding-bottom: 5px;
    margin-bottom: 5px;
    border-bottom: 2px solid var(--high-hover-bg);
}

.re-load:hover {
    opacity: 1;
}

.tab-title {
    display: flex;
    justify-content: space-between;
}

.icon-work {
    display: flex;
    justify-content: center;
}

.icon-work span {
    margin: 0 4px;
    transition: all .3s ease-in-out;
    color: #605F67;
    font-size: 15px;
}

.icon-work span:hover {
    color: unset;

}

.re-set {
    line-height: 25px;
}
</style>