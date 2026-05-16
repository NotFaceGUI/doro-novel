<template>
    <div class="project-menu">
        <ul>
            <li @click.stop="toggleDropdown(0)">{{ t('menu.project') }}
                <ul v-show="dropdowns[0]" class="dropdown" @click.stop>
                    <li @click.stop="saveProject">{{ t('menu.saveProject') }}<span class="keyword">Ctrl + S</span></li>
                    <hr />
                    <li @click.stop="openProject()">{{ t('menu.openProject') }}<span class="keyword">Ctrl + O</span></li>
                    <li @click.stop="closeProject()">{{ t('menu.closeProject') }}<span class="keyword">Ctrl + Shift + Z</span></li>
                    <li @click.stop="openProjectFolder">{{ t('menu.openProjectFolder') }}<span class="keyword">Ctrl + Shift + O</span></li>
                    <hr />
                    <li>{{ t('menu.clearCache') }}<span class="keyword">Ctrl + Shift + C</span></li>
                </ul>
            </li>
            <li @click.stop="toggleDropdown(1)">{{ t('menu.edit') }}
                <ul v-show="dropdowns[1]" class="dropdown" @click.stop>
                    <li>{{ t('menu.undo') }}<span class="keyword">Ctrl + Z</span></li>
                    <li>{{ t('menu.redo') }}<span class="keyword">Ctrl + Y</span></li>
                    <hr />
                    <li>{{ t('menu.cut') }}<span class="keyword">Ctrl + X</span></li>
                    <li>{{ t('menu.copy') }}<span class="keyword">Ctrl + C</span></li>
                    <li>{{ t('menu.paste') }}<span class="keyword">Ctrl + V</span></li>
                    <hr />
                    <li>{{ t('menu.find') }}<span class="keyword">Ctrl + F</span></li>
                    <li>{{ t('menu.replace') }}<span class="keyword">Ctrl + H</span></li>
                    <hr />
                    <li @click.stop="openResourceFolder">{{ t('menu.openResourceFolder') }}</li>
                    <li>{{ t('menu.importResource') }}<span class="keyword">Shift + Space</span></li>
                </ul>
            </li>
            <li @click.stop="toggleDropdown(2)">{{ t('menu.help') }}
                <ul v-show="dropdowns[2]" class="dropdown" @click.stop>
                    <li>{{ t('menu.viewHelp') }}</li>
                    <li>{{ t('menu.onlineDocs') }}</li>
                    <li>{{ t('menu.faq') }}</li>
                    <li @click.stop="showWatermarkDialog">{{ t('menu.watermarkSettings') }}</li>
                    <li @click.stop="executeUpdateSpine">{{ t('menu.updateResources') }}<span class="keyword">Ctrl + U</span></li>
                    <li @click.stop="showAboutDialog">{{ t('menu.about') }}</li>
                </ul>
            </li>
            <li @click.stop="toggleDropdown(3)">{{ t('language.menu') }}
                <ul v-show="dropdowns[3]" class="dropdown dropdown-right" @click.stop>
                    <li
                        v-for="locale in localeOptions"
                        :key="locale.value"
                        @click.stop="changeLocale(locale.value)"
                        :class="{ selected: currentLocale === locale.value }"
                    >
                        {{ locale.label }}
                        <span class="keyword">{{ currentLocale === locale.value ? '●' : '' }}</span>
                    </li>
                </ul>
            </li>
        </ul>

        <!-- 关于我们弹窗 -->
        <AboutDialog :showDialog="isAboutDialogVisible" @close="closeAboutDialog" />
        <WatermarkDialog :showDialog="isWatermarkDialogVisible" @close="closeWatermarkDialog" />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActionStore } from '../stores/action-store';
import { useCharacterConfigStore } from '../stores/character-config-store';
import { useBranchStore } from '../stores/branch-store';
import { useProjectStore } from '../stores/project-store';
import { Actions, LoadRes, type Project } from '../types/app';
import { LOCAL_OPEN_KEY, ResType } from '../script/var';
import { resolveResource } from '@tauri-apps/api/path';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Spine } from 'pixi-spine';
import ResourceManager from '../script/resource-manager';
import CanvasManager from '../script/render/canvas-manager';
import AboutDialog from './AboutDialog.vue';
import WatermarkDialog from './WatermarkDialog.vue';
import { PowerShellService } from '../script/powershell-service';
import massage from '../script/common/massage';
import { getCurrentLocale, setLocale } from '../locales/i18n';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../utils/i18n-loader';
import { getCharacterId, getCharacterResourceKey } from '../utils/character';

const { t } = useI18n();
const dropdowns = reactive([false, false, false, false]);
const currentLocale = ref<SupportedLocale>(getCurrentLocale());
const localeOptions = computed(() => SUPPORTED_LOCALES.map((value) => ({
    value,
    label: t(`language.${value.replace('-', '')}`),
})));

// 关于我们弹窗状态
const isAboutDialogVisible = ref(false);
const isWatermarkDialogVisible = ref(false);

// 初始化stores
const actionStore = useActionStore();
const characterConfigStore = useCharacterConfigStore();
const branchStore = useBranchStore();
const projectStore = useProjectStore();

const closeAllDropdowns = () => {
    dropdowns[0] = false;
    dropdowns[1] = false;
    dropdowns[2] = false;
    dropdowns[3] = false;
};

const toggleDropdown = (menuIndex: number) => {
    dropdowns[menuIndex] = !dropdowns[menuIndex];

    for (let i = 0; i < dropdowns.length; i++) {
        if (i == menuIndex) continue;
        dropdowns[i] = false;
    }
};

// 收集所有store数据
const collectStoresData = () => {
    // 安全地序列化previewSnapshot，避免循环引用
    const safePreviewSnapshot = {
        camera: {
            x: actionStore.previewSnapshot.camera.x,
            y: actionStore.previewSnapshot.camera.y,
            zoom: actionStore.previewSnapshot.camera.zoom
        },
        characters: Object.fromEntries(actionStore.previewSnapshot.characters),
        background: {
            image: actionStore.previewSnapshot.background.image,
            parallax: actionStore.previewSnapshot.background.parallax
        },
        sound: {
            bgm: actionStore.previewSnapshot.sound.bgm,
            sfx: [...actionStore.previewSnapshot.sound.sfx]
        }
    };

    // 安全地序列化maxCharacter，去除spine属性，记录resourceKey
    const safeMaxCharacter = actionStore.maxCharacter.map(char => ({
        character: char.character,
        characterKey: char.characterKey || getCharacterId(char.character),
        x: char.x,
        y: char.y,
        scale: char.scale,
        selectAnimation: char.selectAnimation,
        animationOption: char.animationOption,
        isInitShow: char.isInitShow,
        // 记录spine的资源key，使用正确的路径格式
        spineResourceKey: char.spineResourceKey || getCharacterResourceKey(char.character)
    }));

    // 序列化actionMap，处理其中的Map对象
    const serializedActionMap: Record<string, any> = {};
    Object.entries(actionStore.actionMap).forEach(([key, actions]) => {
        serializedActionMap[key] = {
            title: actions.title,
            as: actions.as.map(actionItem => ({
                ...actionItem,
                actionData: actionItem.serialize ? actionItem.serialize() : actionItem,
                // 将Map对象转换为数组格式进行序列化
                modification: actionItem.modification ?
                    Array.from(actionItem.modification.entries()) : undefined
            }))
        };
    });

    return {
        actionStore: {
            isEditMode: actionStore.isEditMode,
            loadResMap: actionStore.loadResMap,
            actionMap: serializedActionMap,
            gameMode: actionStore.gameMode,
            RealTimePreview: actionStore.realTimePreview,
            isPlaying: actionStore.isPlaying,
            maxCharacter: safeMaxCharacter,
            currentSelectActionTitle: actionStore.currentSelectActionTitle,
            currentSelectActionItemId: actionStore.currentSelectActionItemId,
            previewSnapshot: safePreviewSnapshot
        },
        characterConfigStore: {
            characterConfigs: Object.fromEntries(characterConfigStore.characterConfigs)
        },
        branchStore: {
            userTags: Array.from(branchStore.userTags),
            branchHistory: branchStore.branchHistory
        }
    };
};

// 保存项目
const saveProject = async () => {
    try {
        // 获取当前项目名称
        const projectName = localStorage.getItem(LOCAL_OPEN_KEY);
        if (!projectName) {
            massage(t('menu.messages.currentProjectNotFound'), 'error', 2000);
            return;
        }

        // 获取项目文件路径
        const projectPath = await resolveResource(`project/${projectName}.doro`);

        // 读取现有项目文件
        let existingProject: Project;
        try {
            const existingContent = await readTextFile(projectPath);
            existingProject = JSON.parse(existingContent);
        } catch (error) {
            console.error('读取项目文件失败:', error);
            massage(t('menu.messages.readProjectFailed'), 'error', 2000);
            return;
        }

        // 收集当前所有store数据
        const storesData = collectStoresData();

        // 更新项目数据
        const updatedProject: Project = {
            ...existingProject,
            updatedAt: new Date(),
            projectData: storesData
        };

        // 保存到文件
        await writeTextFile(projectPath, JSON.stringify(updatedProject, null, 2));

        console.log('项目保存成功');
        massage(t('menu.messages.projectSaved'), 'success', 2000);

        closeAllDropdowns();

    } catch (error) {
        console.error('保存项目失败:', error);
        massage(t('menu.messages.projectSaveFailed'), 'error', 2000);
    }
};

const resetCurrentProjectRuntime = () => {
    // 清空actionStore数据
    actionStore.currentSelectActionTitle = 'Default';
    actionStore.currentSelectActionItemId = -1;
    actionStore.actionMap = {
        "Default": {
            title: "Default",
            as: []
        }
    };

    actionStore.maxCharacter = [];

    // 正确清理loadResMap中的资源
    Object.entries(actionStore.loadResMap).forEach(([, loadRes]) => {
        ResourceManager.removeResource(loadRes.path, loadRes.type);
    });
    actionStore.loadResMap = {} as Record<string, LoadRes>;
    actionStore.isPlaying = false;
    actionStore.isEditMode = false;

    // 重置预览快照
    actionStore.previewSnapshot = {
        camera: { x: 0, y: 0, zoom: 1 },
        characters: new Map(),
        background: { image: '', parallax: 0 },
        sound: { bgm: '', sfx: [] }
    };

    CanvasManager.destroyInstance();
};

// 关闭项目
const closeProject = (options?: { updateProjectStore?: boolean; showMessage?: boolean; }) => {
    const updateProjectStore = options?.updateProjectStore ?? true;
    const showMessage = options?.showMessage ?? true;

    try {
        closeAllDropdowns();

        if (!localStorage.getItem(LOCAL_OPEN_KEY) && updateProjectStore) {
            console.log('未找到当前项目信息');
            return;
        }

        resetCurrentProjectRuntime();

        if (updateProjectStore) {
            projectStore.closeProject();
        }

        console.log('项目已关闭，所有数据已清空');
        if (showMessage) {
            massage(t('menu.messages.projectClosed'), 'success', 2000);
        }
    } catch (error) {
        console.error('关闭项目失败:', error);
        massage(t('menu.messages.projectCloseFailed'), 'error', 2000);
    }
};

// 打开项目
const openProject = async (filePath?: string) => {
    try {
        closeAllDropdowns();

        let selected: string | null = null;

        if (filePath) {
            selected = filePath;
        } else {
            const defaultPath = await resolveResource("project");
            // 打开文件选择对话框
            selected = await open({
                title: t('menu.selectProjectFile'),
                defaultPath,
                filters: [{
                    name: t('menu.projectFileFilterName'),
                    extensions: ['doro', "Doro", "DORO"]
                }],
                multiple: false
            });
        }

        if (!selected) {
            return; // 用户取消了选择
        }
        const projectData = await readTextFile(selected as string);
        const project: Project = JSON.parse(projectData);
        project.savePath = selected;


        // 先清理当前项目运行时状态，再切换到新项目，避免延迟关闭把新项目状态打回欢迎页
        closeProject({
            updateProjectStore: false,
            showMessage: false,
        });
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
                        const spineResourceKey = charData.spineResourceKey || getCharacterResourceKey(charData.character);
                        const spine = ResourceManager.getResource<Spine>(spineResourceKey, ResType.Spine) as Spine;

                        console.log("加载角色Spine: ", spineResourceKey, spine);

                        // 构建角色信息对象
                        const characterInfo = {
                            character: charData.character,
                            x: charData.x,
                            y: charData.y,
                            scale: charData.scale,
                            isInitShow: charData.isInitShow,
                        };

                        // 调用addCharacterSpine方法将角色添加到场景中
                        canvasManager.addCharacterSpine(spineResourceKey, characterInfo);
                    }
                }
            }

            // 加载characterConfigStore数据
            // if (project.projectData.characterConfigStore) {
            //     characterConfigStore.characterConfigs = new Map(Object.entries(project.projectData.characterConfigStore.characterConfigs));
            // }

            // 加载branchStore数据
            // if (project.projectData.branchStore) {
            //     branchStore.userTags = new Set(project.projectData.branchStore.userTags);
            //     branchStore.branchHistory = project.projectData.branchStore.branchHistory;
            // }
        }

        closeAllDropdowns();

        console.log('项目加载成功:', project.projectName);

    } catch (error) {
        console.error('打开项目失败:', error);
        massage(t('menu.messages.projectOpenFailed'), 'error', 2000);
    }
};

// 打开项目文件夹
const openProjectFolder = async () => {
    try {

        // 获取项目文件夹路径
        const projectPath = await resolveResource(`project/`);

        // 使用自定义的Rust命令打开文件夹
        await invoke('open_folder', { path: projectPath });

        closeAllDropdowns();

    } catch (error) {
        console.error('打开项目文件夹失败:', error);
        massage(t('menu.messages.projectFolderOpenFailed'), 'error', 2000);
    }
};

// 打开资源文件夹
const openResourceFolder = async () => {
    try {
        // 获取资源根目录路径（src-tauri/resources/）
        const resourcePath = await resolveResource('resources/');
        // 直接调用自定义 Rust 命令打开文件夹
        await invoke('open_folder', { path: resourcePath });
        // 关闭下拉菜单（编辑菜单）
        dropdowns[1] = false;
    } catch (error) {
        console.error('打开资源文件夹失败:', error);
        massage(t('menu.messages.resourceFolderOpenFailed'), 'error', 2000);
    }
};

const changeLocale = (locale: SupportedLocale) => {
    setLocale(locale);
    currentLocale.value = locale;
    closeAllDropdowns();
};

const handleClickOutside = (event: MouseEvent) => {
    const menu = document.querySelector('.project-menu');
    if (menu && !menu.contains(event.target as Node)) {
        closeAllDropdowns();
    }
};

// 显示关于我们弹窗
const showAboutDialog = () => {
    isAboutDialogVisible.value = true;
    // 关闭下拉菜单
    dropdowns[2] = false;
};

// 关闭关于我们弹窗
const closeAboutDialog = () => {
    isAboutDialogVisible.value = false;
};

// 显示水印设置弹窗
const showWatermarkDialog = () => {
    isWatermarkDialogVisible.value = true;
    // 关闭下拉菜单
    dropdowns[2] = false;
};

// 关闭水印设置弹窗
const closeWatermarkDialog = () => {
    isWatermarkDialogVisible.value = false;
};

// 执行 update_spine.ps1 脚本
const executeUpdateSpine = async () => {
    try {
        console.log('以分离(detached)方式执行 update_spine.ps1 脚本...');
        await PowerShellService.executeUpdateSpineDetached();
        massage(t('menu.messages.updateResourcesStarted'), 'success', 2000);
    } catch (error) {
        console.error('执行 update_spine.ps1 时发生错误:', error);
        massage(t('menu.messages.updateResourcesFailed', { error: String(error) }), 'error', 2000);
    }

    // 关闭下拉菜单
    dropdowns[2] = false;
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside, true);
    document.removeEventListener('keydown', handleKeyDown);
});

watch(
    () => projectStore.isOpenProject,
    () => {
        closeAllDropdowns();
    }
);

watch(
    () => getCurrentLocale(),
    (locale) => {
        currentLocale.value = locale;
    }
);

// 处理键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl + S 保存项目
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveProject();
    }
    // Ctrl + Shift + Z 关闭项目
    if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
        event.preventDefault();
        closeProject();
    }
    // Ctrl + Shift + O 打开项目文件夹
    if (event.ctrlKey && event.shiftKey && event.key === 'O') {
        event.preventDefault();
        openProjectFolder();
    }
    // Ctrl + O 打开项目
    if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        openProject();
    }
    // Ctrl + U 更新资源
    if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        executeUpdateSpine();
    }
};

</script>

<style scoped>
.project-menu {
    position: relative;
    z-index: 9999;
    margin: 0 25px;
    font-size: 14px;
}

.project-menu>ul {
    list-style-type: none;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0;
}

.project-menu>ul>li {
    position: relative;
    height: 30px;
    line-height: 30px;
    padding: 5px 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10px;
    transition: all .1s ease-in-out;
    cursor: pointer;
}

.project-menu li:hover {
    background-color: var(--high-hover-bg);
    border-radius: 5px;
}

.dropdown {
    position: absolute;
    min-width: 200px;
    top: 100%;
    left: 0;
    background-color: var(--secondary-bg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    z-index: 10000;
    opacity: .8;
    transform: translateY(-10px);
    animation: dropdownAnimation 0.2s forwards;
    list-style-type: none;
    padding: 5px 0;
}

.dropdown-right {
    left: auto;
    right: 0;
}

@keyframes dropdownAnimation {
    0% {
        opacity: .8;
        transform: translateY(-10px);
    }

    100% {
        opacity: 1;
        transform: translateY(2px);
    }
}


.dropdown li {
    padding: 0 2em;
    padding-right: 1em;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dropdown li.selected {
    background-color: var(--high-hover-bg);
}

.dropdown hr {
    border: none;
    border-top: 1px solid var(--main-border-color);
    margin: 5px 0;
}

.keyword {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    margin-left: 40px;
}
</style>
