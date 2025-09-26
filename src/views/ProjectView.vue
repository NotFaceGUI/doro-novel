<template>
    <div class="project-content">
        <LeftBar @render-file="handleRenderType"></LeftBar>
        <div ref="projectView" class="project-content-view"
            :class="{ 'active-bg': activeTab === 'canvas', 'project-view-full-screen': isFullScreen }" >

            <div class="project-tab" v-if="!isFullScreen">
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'canvas' }" @click="activeTab = 'canvas'">
                    Canvas</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'preview' }" @click="activeTab = 'preview'">
                    Preview</div>
                <div class="tab-card" :class="{ 'tab-active': activeTab === 'script' }" @click="activeTab = 'script'">
                    Script</div>
            </div>

            <div class="project-canvas" :class="{'edit-mode': actionStore.isEditMode, 'editing': actionStore.isEditMode}" id="canvas" v-show="activeTab == 'canvas'">
                <div id="canvas-info">

                </div>
            </div>

            <div class="project-preview" v-show="activeTab == 'preview'">
                <img ref="imgRef" src="" alt="" srcset="" v-show="showImage">
                <video ref="videoRef" src="" v-show="showVideo" autoplay controls loop muted></video>
                <span v-show="showText">不支持该文件的预览</span>
                <div id="preview-canvas" v-show="showCanvas"></div>
            </div>

            <div class="project-script" v-show="activeTab == 'script'">
                <ScriptEditor 
                    v-model="scriptContent"
                    placeholder="在这里编写剧情脚本..."
                />
            </div>

            <div class="full-screen" v-if="activeTab != 'script'" :style="'opacity:' + (isFullScreen ? 0.2 : 0.8)" @click="fullScreen">
                🔲
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import LeftBar from '../components/LeftBar.vue';
import ScriptEditor from '../components/edit/ScriptEditor.vue';
import { ResType } from '../script/var';
import { createPixiApp, IApp, load } from '../script/render/preview-canvas';
import { Spine } from 'pixi-spine';
import CanvasManager from '../script/render/canvas-manager';
import { useActionStore } from '../stores/action-store';


const imgRef = ref<HTMLImageElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const projectView = ref<HTMLDivElement | null>(null)

const showImage = ref<boolean>(false);
const showVideo = ref<boolean>(false);
const showText = ref<boolean>(false);
const showCanvas = ref<boolean>(false);

const previewAPP = ref<IApp>()

const previewSpine = ref<Spine>();

let _last_url = '';

// 当前激活的 Tab ('canvas' | 'preview' | 'script')
const activeTab = ref<'canvas' | 'preview' | 'script'>('canvas');
const actionStore = useActionStore();

// Script 相关的响应式数据
const scriptContent = ref<string>('');

const handleRenderType = (data: { url: string, type: ResType }) => {
    console.log("点击");
    if (_last_url == data.url) {
        console.log("两者的url相同");
        showImage.value = false;
        showVideo.value = false;
        showText.value = false;
        _last_url = '';
        activeTab.value = 'canvas';
        return;
    }

    activeTab.value = 'preview';
    switch (data.type) {
        case ResType.Image:
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = data.url;
                videoRef.value.pause();
                videoRef.value.src = '';
                showCanvas.value = false;
                showImage.value = true;
                showVideo.value = false;
                showText.value = false;
            }
            _last_url = data.url;
            break;
        case ResType.Video:
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = '';
                videoRef.value.src = data.url;
                showCanvas.value = false;
                showImage.value = false;
                showVideo.value = true;
                showText.value = false;
            }
            _last_url = data.url;
            break;
        case ResType.Spine:
            console.log("渲染Spine");
            if (imgRef.value && videoRef.value) {
                imgRef.value.src = '';
                videoRef.value.src = data.url;
                showImage.value = false;
                showVideo.value = false;
                showText.value = false;
                showCanvas.value = true;
            }

            if (previewAPP.value) {
                // 如果有已经有load当再次加载时应当销毁Spine
                if (previewSpine.value) {
                    previewSpine.value.destroy();
                }
                load(previewAPP.value.application, data.url).then((spine) => {
                    previewSpine.value = spine
                });
            }
            break;
        case ResType.Audio:
        case ResType.Package:
        case ResType.Document:
        default:
            console.log("不支持预览这种类型的文件");
            _last_url = data.url;
            showImage.value = false;
            showVideo.value = false;
            showText.value = true;
            break;
    }
}

const isFullScreen = ref(false);

// Canvas 全屏预览
const fullScreen = () => {
    if (projectView.value) {
        isFullScreen.value = !isFullScreen.value
    }
    nextTick(() => {
        window.dispatchEvent(new Event('resize'));
    })
}

onMounted(() => {
    // 初始化CanvasManager
    CanvasManager.getInstance();
    if (projectView.value) {
        console.log("proView-width", projectView.value.offsetHeight);
        previewAPP.value = createPixiApp(projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        handelResizeCanvasToPreview();
    }

    // 监听窗口大小变化，动态更新 Pixi 应用大小
    window.addEventListener('resize', handelResizeCanvasToPreview);
})

watch(() => actionStore.isEditMode, () => {
    handelResizeCanvasToPreview();
})

const handelResizeCanvasToPreview = () => {
    if (projectView.value) {
        const app = previewAPP.value?.application;
        previewAPP.value?.application.renderer.resize(projectView.value.offsetWidth, projectView.value.offsetHeight - 5);
        if (previewSpine.value && app) {
            previewSpine.value.x = app.view.width / 2;
            const lastSacle = previewSpine.value.scale.x;

            previewSpine.value.y = app.view.height * 0.95;

            // 设置缩放比例
            previewSpine.value.scale.set((app.view.height / (previewSpine.value.height / lastSacle / 0.90)));
            console.log(previewSpine.value.scale);
        }
    }
}

onUnmounted(() => {
    window.removeEventListener('resize', handelResizeCanvasToPreview)
});
</script>

<style scoped lang="css">
.project-content {
    width: 100%;
    height: calc(100% - 41px);
    background: linear-gradient(135deg, var(--primary-bg), var(--secondary-bg));
    display: flex;
    flex: 1;
}

.project-content-view {
    display: flex;
    width: 100%;
    overflow: hidden;
    position: relative;
    flex: 1;
    flex-direction: column;
}

.active-bg {
    background-color: black;
}

.project-content-view:hover {
    overflow: hidden;
}

.project-content-view img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.project-content-view video {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.project-content-view:hover::-webkit-scrollbar-thumb {
    background-color: var(--deep-border-color);

}


.project-content-view::-webkit-scrollbar {
    background-color: transparent;
    width: 8px;
    height: 8px;
}

.project-content-view::-webkit-scrollbar-track {
    background: transparent;
}

.project-content-view::-webkit-scrollbar-thumb {
    border-radius: 10px;
    border: 2px solid transparent;
}

.project-content-view::-webkit-scrollbar-thumb:hover {
    background-color: var(--high-hover-bg);
}


.project-canvas,
.project-preview,
.project-script {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    transition: all .3s ease-in-out;
    border: 0 solid transparent;
}


@keyframes popIn {
    0% {
        opacity: 0;
        transform: translate(-50%, 15px) scale(0.85);
    }

    100% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }
}

@keyframes popOut {
    0% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }

    100% {
        opacity: 0;
        transform: translate(-50%, 10px) scale(0.95);
    }
}

.project-tab {
    position: absolute;
    z-index: 9999;
    top: 15px;
    left: 50%;
    transform: translate(-50%, 15px) scale(0.85);
    display: flex;
    justify-content: center;
    background-color: var(--deep-border-color);
    border-radius: 20px;
    padding: 5px;
    transition: all 0.3s ease-in-out;
    opacity: 0;
    pointer-events: none;
}

.project-content-view:hover .project-tab,
.project-content-view .project-tab.show-during-play {
    animation: popIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    pointer-events: auto;
}

.project-content-view:not(:hover) .project-tab:not(.show-during-play) {
    animation: popOut 0.25s cubic-bezier(0.4, 0.03, 0.7, 0.2) forwards;
}


.project-content-view:hover .full-screen {
    display: block;
}


.tab-active {
    transition: all .3s ease-in-out;
    background-color: var(--high-hover-bg);

}

.tab-card {
    font-size: 14px;
    padding: 6px 10px;
    border-radius: 15px;
    margin: 2px 5px;
    transition: all .3s ease-in-out;
}

#canvas-info {
    position: absolute;
    font-size: 14px;
    left: 10px;
    top: 10px;
    opacity: .4;
}

.full-screen {
    position: absolute;
    bottom: 10px;
    left: 10px;

    font-size: 18px;
    display: none;

    opacity: .5;

    transition: all .3s ease-in-out;
}

.full-screen:hover {
    opacity: 1;
    transform: scale(1.1);
}

.project-view-full-screen {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
}

.project-canvas {
    position: relative;
}

.project-canvas::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 3px solid var(--error-color);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity .3s ease-in-out;
}

.project-canvas::after {
    content: '正在编辑';
    position: absolute;
    bottom: 8px;
    right: 12px;
    background: var(--error-color);
    color: #fff;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease-in-out;
}

.edit-mode::after {
    opacity: 1;
    transform: translateY(0);
    animation: blink 1.5s infinite 0.4s;
}

.edit-mode::before {
    opacity: 1;
}

/* 闪烁效果 */
@keyframes blink {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}
</style>