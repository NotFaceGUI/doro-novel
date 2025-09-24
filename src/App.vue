<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { DoroApp, type Project } from './types/app';
import WelcomeGuide from './components/WelcomeGuide.vue';
import AppHeader from './components/AppHeader.vue';
import { LOCAL_OPEN_KEY } from './script/var';
import ProjectView from './views/ProjectView.vue';
import AssetManager from './script/asset-manager';
import InputActionItemType from './components/common/InputActionItemType.vue';
import UpdateDialog from './components/UpdateDialog.vue';
import { useSearchDialogStore } from './stores/search-dialog-store';
import { useUpdater } from './composables/useUpdater';

// 是否打开项目，用于判断显示引导界面还是项目界面
const isOpenProject = ref(false);
const searchStore = useSearchDialogStore();

// 初始化更新功能
const updater = useUpdater();

const app = ref<DoroApp>({
  name: 'Doro Novel',
  version: 'ver 0.3.7',
});

onMounted(() => {
  const _open = localStorage.getItem(LOCAL_OPEN_KEY);
  if (_open) {
    isOpenProject.value = true;
  } else {
    isOpenProject.value = false;
  }
  window.addEventListener('keydown', handleSpacePress);
});

// 处理创建成功的事件
const onCreateProject = (res: Project) => {
  console.log('Project created:', res);
  localStorage.setItem(LOCAL_OPEN_KEY, res.projectName);
  isOpenProject.value = true;
  // 初始化AssetManager
  AssetManager.getInstance();
};

const handleSpacePress = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
    }
};

// 更新相关事件处理
const handleUpdateStarted = () => {
  console.log('更新开始');
};

const handleUpdateCompleted = () => {
  console.log('更新完成');
};

const handleUpdateError = (error: string) => {
  console.error('更新失败:', error);
  // 可以在这里显示错误提示
};

onUnmounted(() => {
    window.removeEventListener('keydown', handleSpacePress);
    // 清理更新功能
    updater.cleanup();
});
</script>

<template>
  <AppHeader :app="app" />
  <template v-if="!isOpenProject">
    <main class="app-container">
      <WelcomeGuide @create="onCreateProject"></WelcomeGuide>
    </main>
    <div class="app-background">
    </div>
  </template>
  <template v-else>
    <ProjectView></ProjectView>
  </template>
  
  <!-- 全局搜索框 -->
  <InputActionItemType 
    :visible="searchStore.visible"
    :mode="searchStore.mode"
    :type="searchStore.type"
    :fileName="searchStore.fileName"
    @select="searchStore.handleSelect"
    @close="searchStore.handleClose"
  />
  
  <!-- 更新对话框 -->
  <UpdateDialog
    :updateInfo="updater.updateInfo.value"
    :showDialog="updater.showUpdateDialog.value"
    @close="updater.hideUpdate"
    @updateStarted="handleUpdateStarted"
    @updateCompleted="handleUpdateCompleted"
    @updateError="handleUpdateError"
  />
</template>

<style scoped></style>

<style>
:root {
  --primary-bg: #1e1e2e;
  --secondary-sec-bg: #13131a;
  --secondary-bg: #2a2a3d;
  --high-bg: #242436;
  --high-hover-bg: #36364d;
  --overlay-bg: rgba(0, 0, 0, 0.7);
  --text-color: white;
  --button-bg: #ff9900d3;
  --button-hover-bg: #e68a00cc;
  --border-color: #ccc;
  --input-bg: #2a2a3d;
  --placeholder-color: #888;
  --main-border-color: #242436;
  --deep-border-color: #1a1a2b;
  --sec-text-color: #CCCAC2;
  --error-color: #99392e;
  --info-color: #20436b;
  --success-color: #155c33;

  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.light-theme {
  --primary-bg: #f8f9fa;
  --secondary-bg: #e9ecef;
  --high-bg: #dee2e6;
  --high-hover-bg: #ced4da;
  --overlay-bg: rgba(255, 255, 255, 0.7);
  --text-color: #212529;
  --button-bg: #007bff;
  --button-hover-bg: #0056b3;
  --border-color: #adb5bd;
  --input-bg: #ffffff;
  --placeholder-color: #6c757d;
  --main-border-color: #ced4da;
  --deep-border-color: #adb5bd;
  --sec-text-color: #495057;
  --error-color: #dc3545;
  --info-color: #17a2b8;
  --success-color: #28a745;

  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}


* {
  padding: 0;
  margin: 0;
  user-select: none;
  box-sizing: border-box;
  color: var(--sec-text-color);
}

.app-background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-image: url('./assets/image/doro.gif');
  background-position: center;
  background-repeat: repeat;
  z-index: -1;
  background-size: 80%;
  animation: backgroundSizeChange 20s infinite ease-in-out;
}

@keyframes backgroundSizeChange {
  0% {
    background-size: 80%;
  }

  50% {
    background-size: 10%;
  }

  100% {
    background-size: 80%;
  }
}

#app {
  position: relative;
  box-sizing: border-box;
  border: 2px solid var(--main-border-color);
  border-radius: var(--border-radius);
  /* background-color: white; */
  width: 100dvw;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-screen {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol !important;
  background-color: #242436;
  color: wheat;
}

.app-container {
  margin: 5px;
  max-height: 100%;
  height: calc(100% - 45px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}
</style>