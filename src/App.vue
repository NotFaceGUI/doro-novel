<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { DoroApp, type Project } from './types/app';
import WelcomeGuide from './components/WelcomeGuide.vue';
import AppHeader from './components/AppHeader.vue';
import ProjectView from './views/ProjectView.vue';
import InputActionItemType from './components/common/InputActionItemType.vue';
import UpdateDialog from './components/UpdateDialog.vue';
import { useSearchDialogStore } from './stores/search-dialog-store';
import { useProjectStore } from './stores/project-store';
import { useUpdater } from './composables/useUpdater';
import { openProject } from './script/common/common-action-item';
import { APP_VERSION } from './script/var';
import { invoke } from '@tauri-apps/api/core';

const searchStore = useSearchDialogStore();
const projectStore = useProjectStore();

// 初始化更新功能
const updater = useUpdater();

const app = computed<DoroApp>(() => ({
  name: 'Doro Novel',
  version: APP_VERSION,
}));

onMounted(async () => {
  // 初始化项目状态
  projectStore.initializeProjectState();
  window.addEventListener('keydown', handleSpacePress);

  // 检查启动参数中是否有项目文件
  try {
    const startupFilePath = await invoke<string | null>('get_startup_file_path');
    if (startupFilePath) {
      console.log('检测到启动参数中的项目文件:', startupFilePath);
      await openProject(startupFilePath);
      return;
    }
  } catch (error) {
    console.error('检查启动参数失败:', error);
  }

  if (projectStore.isOpenProject && projectStore.currentProjectSavePath) {
    console.log('default 检测到当前打开项目:', projectStore.currentProjectSavePath);
    await openProject(projectStore.currentProjectSavePath);
  }
});

// 处理创建成功的事件
const onCreateProject = (res: Project) => {
  console.log('Project created:', res);
  projectStore.openProject(res);

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
  <template v-if="!projectStore.isOpenProject">
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
  <InputActionItemType :visible="searchStore.visible" :mode="searchStore.mode" :type="searchStore.type"
    :fileName="searchStore.fileName" @select="searchStore.handleSelect" @close="searchStore.handleClose" />

  <!-- 更新对话框 -->
  <UpdateDialog :updateInfo="updater.updateInfo.value" :showDialog="updater.showUpdateDialog.value"
    @close="updater.hideUpdate" @updateStarted="handleUpdateStarted" @updateCompleted="handleUpdateCompleted"
    @updateError="handleUpdateError" />
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

  /* 新增按钮相关颜色变量 */
  --accent-color: #ff9900;
  --accent-hover-color: #e68a00;
  --danger-color: #dc3545;
  --danger-hover-color: #c82333;

  --floating-panel-bg: rgba(12, 14, 20, 0.84);
  --floating-panel-bg-strong: rgba(10, 12, 18, 0.9);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.04);
  --floating-panel-border: rgba(255, 255, 255, 0.1);
  --floating-panel-divider: rgba(255, 255, 255, 0.08);
  --floating-panel-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
  --floating-panel-shadow-drag: 0 20px 40px rgba(0, 0, 0, 0.3);
  --floating-panel-overlay: rgba(10, 12, 18, 0.6);
  --floating-panel-text: var(--text-color);
  --floating-panel-muted-text: var(--sec-text-color);
  --floating-panel-soft-text: rgba(255, 255, 255, 0.86);
  --floating-panel-input-bg: var(--input-bg);
  --floating-panel-input-bg-focus: var(--high-bg);
  --floating-panel-input-border: var(--main-border-color);
  --floating-panel-input-border-focus: var(--high-hover-bg);
  --floating-panel-chip-bg: var(--high-bg);
  --floating-panel-chip-border: var(--main-border-color);
  --floating-panel-chip-text: var(--text-color);
  --floating-panel-subtle-bg: rgba(255, 255, 255, 0.05);
  --floating-panel-subtle-hover-bg: rgba(255, 255, 255, 0.08);
  --floating-panel-scrollbar: rgba(255, 255, 255, 0.16);
  --floating-panel-scrollbar-hover: rgba(255, 255, 255, 0.28);
  --floating-panel-accent-bg: rgba(255, 153, 0, 0.18);
  --floating-panel-accent-border: rgba(255, 153, 0, 0.36);
  --floating-panel-success-bg: rgba(21, 92, 51, 0.28);
  --floating-panel-success-border: rgba(21, 92, 51, 0.44);
  --floating-panel-danger-bg: rgba(220, 53, 69, 0.18);
  --floating-panel-danger-border: rgba(220, 53, 69, 0.32);
  --floating-panel-danger-text: #ff9d95;
  --ui-disabled-bg: #404555;
  --ui-disabled-border: #5c6275;
  --ui-disabled-text: rgba(255, 255, 255, 0.84);
  --ui-disabled-placeholder: rgba(255, 255, 255, 0.46);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  --floating-panel-close-bg: rgba(220, 53, 69, 0.16);
  --floating-panel-close-border: rgba(220, 53, 69, 0.32);
  --floating-panel-close-text: #ffd7dc;
  --floating-panel-close-hover-bg: rgba(220, 53, 69, 0.28);
  --floating-panel-close-hover-border: rgba(220, 53, 69, 0.46);
  --floating-panel-close-hover-text: #ffffff;
  --floating-panel-close-shadow: 0 6px 14px rgba(220, 53, 69, 0.14);

  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.light-theme {
  --primary-bg: #f8f9fa;
  --secondary-sec-bg: #dde2e7;
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
  --floating-panel-bg: rgba(248, 249, 250, 0.94);
  --floating-panel-bg-strong: rgba(255, 255, 255, 0.98);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.68);
  --floating-panel-border: rgba(173, 181, 189, 0.5);
  --floating-panel-divider: rgba(173, 181, 189, 0.34);
  --floating-panel-shadow: 0 16px 32px rgba(90, 98, 106, 0.18);
  --floating-panel-shadow-drag: 0 20px 40px rgba(90, 98, 106, 0.24);
  --floating-panel-overlay: rgba(222, 226, 230, 0.58);
  --floating-panel-soft-text: rgba(33, 37, 41, 0.88);
  --floating-panel-subtle-bg: rgba(173, 181, 189, 0.14);
  --floating-panel-subtle-hover-bg: rgba(173, 181, 189, 0.24);
  --floating-panel-scrollbar: rgba(173, 181, 189, 0.52);
  --floating-panel-scrollbar-hover: rgba(108, 117, 125, 0.56);
  --floating-panel-accent-bg: rgba(0, 123, 255, 0.14);
  --floating-panel-accent-border: rgba(0, 123, 255, 0.28);
  --floating-panel-success-bg: rgba(40, 167, 69, 0.14);
  --floating-panel-success-border: rgba(40, 167, 69, 0.28);
  --floating-panel-danger-bg: rgba(220, 53, 69, 0.12);
  --floating-panel-danger-border: rgba(220, 53, 69, 0.24);
  --floating-panel-danger-text: #b23a48;
  --ui-disabled-bg: #d7dde4;
  --ui-disabled-border: #b4bfca;
  --ui-disabled-text: rgba(33, 37, 41, 0.7);
  --ui-disabled-placeholder: rgba(73, 80, 87, 0.5);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.36);
  --floating-panel-close-bg: rgba(220, 53, 69, 0.12);
  --floating-panel-close-border: rgba(220, 53, 69, 0.24);
  --floating-panel-close-text: #b23a48;
  --floating-panel-close-hover-bg: rgba(220, 53, 69, 0.2);
  --floating-panel-close-hover-border: rgba(220, 53, 69, 0.36);
  --floating-panel-close-hover-text: #8f2d39;
  --floating-panel-close-shadow: 0 6px 14px rgba(220, 53, 69, 0.12);

  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.theme-sakura {
  --primary-bg: #fff6fa;
  --secondary-sec-bg: #fce3ec;
  --secondary-bg: #fdeef4;
  --high-bg: #f9dde7;
  --high-hover-bg: #f4cad8;
  --overlay-bg: rgba(255, 244, 248, 0.82);
  --text-color: #4f3341;
  --button-bg: #e889ac;
  --button-hover-bg: #d97398;
  --border-color: #e7bfd0;
  --input-bg: #fffafc;
  --placeholder-color: #b17a92;
  --main-border-color: #efcfdb;
  --deep-border-color: #e0b6c7;
  --sec-text-color: #775261;
  --error-color: #cc5c76;
  --info-color: #b069b7;
  --success-color: #589a7a;
  --accent-color: #e889ac;
  --accent-hover-color: #d97398;
  --danger-color: #d45c7c;
  --danger-hover-color: #bb4f6c;
  --floating-panel-bg: rgba(255, 246, 250, 0.95);
  --floating-panel-bg-strong: rgba(255, 251, 253, 0.98);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.64);
  --floating-panel-border: rgba(224, 182, 199, 0.54);
  --floating-panel-divider: rgba(224, 182, 199, 0.36);
  --floating-panel-shadow: 0 16px 32px rgba(176, 105, 140, 0.14);
  --floating-panel-shadow-drag: 0 20px 40px rgba(176, 105, 140, 0.2);
  --floating-panel-overlay: rgba(244, 202, 216, 0.42);
  --floating-panel-soft-text: rgba(79, 51, 65, 0.9);
  --floating-panel-subtle-bg: rgba(232, 137, 172, 0.12);
  --floating-panel-subtle-hover-bg: rgba(232, 137, 172, 0.2);
  --floating-panel-scrollbar: rgba(224, 182, 199, 0.62);
  --floating-panel-scrollbar-hover: rgba(177, 122, 146, 0.54);
  --floating-panel-accent-bg: rgba(232, 137, 172, 0.16);
  --floating-panel-accent-border: rgba(232, 137, 172, 0.3);
  --floating-panel-success-bg: rgba(88, 154, 122, 0.16);
  --floating-panel-success-border: rgba(88, 154, 122, 0.3);
  --floating-panel-danger-bg: rgba(212, 92, 124, 0.14);
  --floating-panel-danger-border: rgba(212, 92, 124, 0.28);
  --floating-panel-danger-text: #b54c70;
  --ui-disabled-bg: #eed7e1;
  --ui-disabled-border: #d7b4c5;
  --ui-disabled-text: rgba(79, 51, 65, 0.7);
  --ui-disabled-placeholder: rgba(119, 82, 97, 0.5);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
  --floating-panel-close-bg: rgba(212, 92, 124, 0.12);
  --floating-panel-close-border: rgba(212, 92, 124, 0.28);
  --floating-panel-close-text: #b54c70;
  --floating-panel-close-hover-bg: rgba(212, 92, 124, 0.22);
  --floating-panel-close-hover-border: rgba(212, 92, 124, 0.4);
  --floating-panel-close-hover-text: #8f3657;
  --floating-panel-close-shadow: 0 6px 14px rgba(212, 92, 124, 0.14);
  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.theme-mint {
  --primary-bg: #f4fffb;
  --secondary-sec-bg: #daf1e8;
  --secondary-bg: #e8f8f1;
  --high-bg: #d7efe5;
  --high-hover-bg: #c4e5d8;
  --overlay-bg: rgba(243, 255, 250, 0.82);
  --text-color: #20443c;
  --button-bg: #45b79a;
  --button-hover-bg: #389d84;
  --border-color: #a7d3c4;
  --input-bg: #fbfffd;
  --placeholder-color: #6f9e91;
  --main-border-color: #cce7dc;
  --deep-border-color: #afd5c7;
  --sec-text-color: #3f6d62;
  --error-color: #c95c5c;
  --info-color: #327c8f;
  --success-color: #2f8f63;
  --accent-color: #45b79a;
  --accent-hover-color: #389d84;
  --danger-color: #cf6d6d;
  --danger-hover-color: #b75d5d;
  --floating-panel-bg: rgba(244, 255, 251, 0.95);
  --floating-panel-bg-strong: rgba(251, 255, 253, 0.98);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.62);
  --floating-panel-border: rgba(175, 213, 199, 0.56);
  --floating-panel-divider: rgba(175, 213, 199, 0.36);
  --floating-panel-shadow: 0 16px 32px rgba(69, 183, 154, 0.12);
  --floating-panel-shadow-drag: 0 20px 40px rgba(69, 183, 154, 0.18);
  --floating-panel-overlay: rgba(196, 229, 216, 0.44);
  --floating-panel-soft-text: rgba(32, 68, 60, 0.9);
  --floating-panel-subtle-bg: rgba(69, 183, 154, 0.1);
  --floating-panel-subtle-hover-bg: rgba(69, 183, 154, 0.18);
  --floating-panel-scrollbar: rgba(175, 213, 199, 0.64);
  --floating-panel-scrollbar-hover: rgba(111, 158, 145, 0.54);
  --floating-panel-accent-bg: rgba(69, 183, 154, 0.16);
  --floating-panel-accent-border: rgba(69, 183, 154, 0.3);
  --floating-panel-success-bg: rgba(47, 143, 99, 0.16);
  --floating-panel-success-border: rgba(47, 143, 99, 0.3);
  --floating-panel-danger-bg: rgba(201, 92, 92, 0.14);
  --floating-panel-danger-border: rgba(201, 92, 92, 0.28);
  --floating-panel-danger-text: #ac5454;
  --ui-disabled-bg: #d2e3dc;
  --ui-disabled-border: #abc8bc;
  --ui-disabled-text: rgba(32, 68, 60, 0.7);
  --ui-disabled-placeholder: rgba(63, 109, 98, 0.48);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
  --floating-panel-close-bg: rgba(201, 92, 92, 0.12);
  --floating-panel-close-border: rgba(201, 92, 92, 0.28);
  --floating-panel-close-text: #a14d4d;
  --floating-panel-close-hover-bg: rgba(201, 92, 92, 0.22);
  --floating-panel-close-hover-border: rgba(201, 92, 92, 0.4);
  --floating-panel-close-hover-text: #813d3d;
  --floating-panel-close-shadow: 0 6px 14px rgba(201, 92, 92, 0.12);
  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.theme-ocean {
  --primary-bg: #0f1d2b;
  --secondary-sec-bg: #0b141f;
  --secondary-bg: #162739;
  --high-bg: #1a3044;
  --high-hover-bg: #22405a;
  --overlay-bg: rgba(6, 15, 24, 0.72);
  --text-color: #f1f6fb;
  --button-bg: #2c9ecf;
  --button-hover-bg: #2487b1;
  --border-color: #44627a;
  --input-bg: #152536;
  --placeholder-color: #7990a6;
  --main-border-color: #1e3448;
  --deep-border-color: #102030;
  --sec-text-color: #c0d0de;
  --error-color: #bb5f66;
  --info-color: #3e7fa9;
  --success-color: #2f7d66;
  --accent-color: #3bb4e6;
  --accent-hover-color: #279ac9;
  --danger-color: #c75b65;
  --danger-hover-color: #af4e57;
  --floating-panel-bg: rgba(15, 29, 43, 0.92);
  --floating-panel-bg-strong: rgba(11, 20, 31, 0.96);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.05);
  --floating-panel-border: rgba(68, 98, 122, 0.54);
  --floating-panel-divider: rgba(68, 98, 122, 0.34);
  --floating-panel-shadow: 0 16px 32px rgba(4, 12, 20, 0.34);
  --floating-panel-shadow-drag: 0 20px 40px rgba(4, 12, 20, 0.42);
  --floating-panel-overlay: rgba(11, 20, 31, 0.58);
  --floating-panel-soft-text: rgba(241, 246, 251, 0.9);
  --floating-panel-subtle-bg: rgba(59, 180, 230, 0.1);
  --floating-panel-subtle-hover-bg: rgba(59, 180, 230, 0.16);
  --floating-panel-scrollbar: rgba(68, 98, 122, 0.7);
  --floating-panel-scrollbar-hover: rgba(121, 144, 166, 0.56);
  --floating-panel-accent-bg: rgba(59, 180, 230, 0.16);
  --floating-panel-accent-border: rgba(59, 180, 230, 0.3);
  --floating-panel-success-bg: rgba(47, 125, 102, 0.18);
  --floating-panel-success-border: rgba(47, 125, 102, 0.3);
  --floating-panel-danger-bg: rgba(199, 91, 101, 0.16);
  --floating-panel-danger-border: rgba(199, 91, 101, 0.28);
  --floating-panel-danger-text: #ffb0b6;
  --ui-disabled-bg: #2e3e50;
  --ui-disabled-border: #49647b;
  --ui-disabled-text: rgba(241, 246, 251, 0.82);
  --ui-disabled-placeholder: rgba(192, 208, 222, 0.52);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  --floating-panel-close-bg: rgba(199, 91, 101, 0.16);
  --floating-panel-close-border: rgba(199, 91, 101, 0.32);
  --floating-panel-close-text: #ffc8ce;
  --floating-panel-close-hover-bg: rgba(199, 91, 101, 0.3);
  --floating-panel-close-hover-border: rgba(199, 91, 101, 0.46);
  --floating-panel-close-hover-text: #ffffff;
  --floating-panel-close-shadow: 0 6px 14px rgba(199, 91, 101, 0.16);
  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

.theme-sunset {
  --primary-bg: #22171a;
  --secondary-sec-bg: #171013;
  --secondary-bg: #322126;
  --high-bg: #3b292f;
  --high-hover-bg: #4a343c;
  --overlay-bg: rgba(19, 12, 14, 0.74);
  --text-color: #fff3eb;
  --button-bg: #f08f58;
  --button-hover-bg: #db7a46;
  --border-color: #76535a;
  --input-bg: #2e1f24;
  --placeholder-color: #b58f88;
  --main-border-color: #422d33;
  --deep-border-color: #24161a;
  --sec-text-color: #e5cfc5;
  --error-color: #cf6661;
  --info-color: #8a6ad1;
  --success-color: #51946f;
  --accent-color: #f08f58;
  --accent-hover-color: #db7a46;
  --danger-color: #d86962;
  --danger-hover-color: #bc5a54;
  --floating-panel-bg: rgba(34, 23, 26, 0.94);
  --floating-panel-bg-strong: rgba(23, 16, 19, 0.97);
  --floating-panel-header-bg: rgba(255, 255, 255, 0.04);
  --floating-panel-border: rgba(118, 83, 90, 0.5);
  --floating-panel-divider: rgba(118, 83, 90, 0.34);
  --floating-panel-shadow: 0 16px 32px rgba(19, 12, 14, 0.34);
  --floating-panel-shadow-drag: 0 20px 40px rgba(19, 12, 14, 0.42);
  --floating-panel-overlay: rgba(36, 22, 26, 0.56);
  --floating-panel-soft-text: rgba(255, 243, 235, 0.9);
  --floating-panel-subtle-bg: rgba(240, 143, 88, 0.11);
  --floating-panel-subtle-hover-bg: rgba(240, 143, 88, 0.18);
  --floating-panel-scrollbar: rgba(118, 83, 90, 0.7);
  --floating-panel-scrollbar-hover: rgba(181, 143, 136, 0.56);
  --floating-panel-accent-bg: rgba(240, 143, 88, 0.16);
  --floating-panel-accent-border: rgba(240, 143, 88, 0.3);
  --floating-panel-success-bg: rgba(81, 148, 111, 0.18);
  --floating-panel-success-border: rgba(81, 148, 111, 0.3);
  --floating-panel-danger-bg: rgba(216, 105, 98, 0.16);
  --floating-panel-danger-border: rgba(216, 105, 98, 0.3);
  --floating-panel-danger-text: #ffc0ba;
  --ui-disabled-bg: #553f46;
  --ui-disabled-border: #795961;
  --ui-disabled-text: rgba(255, 243, 235, 0.82);
  --ui-disabled-placeholder: rgba(229, 207, 197, 0.52);
  --ui-disabled-opacity: 1;
  --ui-disabled-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  --floating-panel-close-bg: rgba(216, 105, 98, 0.16);
  --floating-panel-close-border: rgba(216, 105, 98, 0.32);
  --floating-panel-close-text: #ffd1cb;
  --floating-panel-close-hover-bg: rgba(216, 105, 98, 0.28);
  --floating-panel-close-hover-border: rgba(216, 105, 98, 0.44);
  --floating-panel-close-hover-text: #ffffff;
  --floating-panel-close-shadow: 0 6px 14px rgba(216, 105, 98, 0.16);
  --border-radius: 5px;
  --padding: 10px;
  --margin: 10px;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
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

/* 全屏时取消 #app 边框 */
#app.is-full-screen {
  border: none;
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
