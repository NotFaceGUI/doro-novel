<script setup lang="ts">
import { ref } from "vue";
import { type Project } from "../types/app";
import { open } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, copyFile, exists, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { path } from "@tauri-apps/api";
import { resolveResource } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

const showCreateWindow = ref(false);
const step = ref(1)
const wEmit = defineEmits(['create'])

const projectData = ref<Project>({
    projectName: "",
    savePath: "",
    createdAt: new Date(),
    updatedAt: new Date(),
});

path.resourceDir().then(res => {
    projectData.value.savePath = res
});

const openDocs = () => {
    window.open("https://your-docs-url.com", "_blank");
};

const createProject = () => {
    console.log("创建新项目");
    showCreateWindow.value = true;
};

const createOneProject = () => {
    // 检测数据是否完整
    if (!projectData.value.projectName || !projectData.value.savePath) {
        alert("请填写完整的项目信息");
        return;
    }
    showCreateWindow.value = false;
    step.value = 1;
    saveJson().then(() => {
        console.log("项目保存成功");
        // 触发创建事件
        wEmit('create', projectData.value);
    }).catch((error) => {
        console.error("项目保存失败", error);
        alert("项目保存失败，请重试");
    });
};

const saveJson = async () => {
    try {
        const resourcePath = await resolveResource(`project/${projectData.value.projectName}.doro`);
        
        // 检查project目录是否存在，如果不存在则创建
        const projectDirPath = await resolveResource('project');
        const projectDirExists = await exists(projectDirPath);
        
        if (!projectDirExists) {
            await mkdir('project', { baseDir: BaseDirectory.Resource });
        }

        await writeTextFile(resourcePath, JSON.stringify(projectData.value));

    } catch (error) {
        console.error("Error:", error);
    }
};

const openProject = () => {
    console.log("打开已有项目");
};

const closeGuide = () => {
    showCreateWindow.value = false;
    step.value = 1;
};

const nextStep = async () => {
    step.value += 1;
    if (step.value == 2) {
        projectData.value.savePath = await resolveResource(`project/${projectData.value.projectName}.doro`);;
    }
};

const prevStep = () => {
    step.value -= 1;
};

const url = ref('')

async function selectPath() {
    const selected = await open({
        filters: [{
            name: 'Image',
            extensions: ['png', 'jpeg']
        }],
        multiple: false
    });
    if (selected) {
        url.value = convertFileSrc(selected);

        copyFile(selected, 'project/img.jpg', {
            toPathBaseDir: BaseDirectory.Resource
        })
    }
}

</script>

<template>
    <div class="welcome">
        <Transition name="slide-up" mode="out-in">
            <div v-if="!showCreateWindow" class="welcome-container">
                <div>
                    <h1>🎉 欢迎使用 Doro Novel</h1>
                    <p>开始你的视觉小说创作之旅！</p>

                    <div class="buttons">
                        <button @click="createProject">🎬 创建全新项目</button>
                        <button @click="openProject">📂 打开已有项目</button>
                        <button @click="openDocs">📖 查看官方文档</button>
                    </div>

                    <button class="close-btn" @click="closeGuide">✖ 关闭</button>
                </div>

            </div>
            <div v-else class="create-window">
                <Transition name="fade" mode="out-in">
                    <div v-if="step === 1" key="step1">
                        <h1>🎫 创建新项目</h1>
                        <p>请输入一个项目名称</p>

                        <div class="form-group">
                            <label for="project-name">项目名称</label>
                            <input v-model="projectData.projectName" type="text" id="project-name" placeholder="输入项目名称">
                        </div>

                        <div class="buttons">
                            <button @click="nextStep">下一步</button>
                            <button @click="closeGuide">返&nbsp;&nbsp;&nbsp;回</button>
                        </div>
                        <button class="close-btn" @click="closeGuide">✖ 关闭</button>
                    </div>
                    <div v-else-if="step === 2" key="step2">
                        <h1>📂 选择项目路径</h1>
                        <p>选择项目保存路径</p>

                        <div class="form-group">
                            <label for="project-path">项目路径</label>
                            <div class="input-wrapper">
                                <input disabled v-model="projectData.savePath" type="text" id="project-path"
                                    placeholder="选择项目路径" @click="selectPath">
                            </div>

                        </div>

                        <div class="buttons">
                            <button @click="nextStep">下一步</button>
                            <button @click="prevStep">上一步</button>
                        </div>
                        <button class="close-btn" @click="closeGuide">✖ 关闭</button>

                    </div>
                    <div v-else-if="step === 3" key="step3" style="width: 100%;">
                        <h1>确认信息</h1>
                        <p>请确认项目信息</p>

                        <div class="form-group" :class="{ 'error': !projectData.projectName }">
                            <label :style="{ color: !projectData.projectName ? 'red' : 'inherit' }">项目名称: {{
                                projectData.projectName || '未填写' }}</label>
                        </div>
                        <div class="form-group" :class="{ 'error': !projectData.savePath }">
                            <label :style="{ color: !projectData.savePath ? 'red' : 'inherit' }">项目路径: {{
                                projectData.savePath || '未填写' }}</label>
                        </div>

                        <div class="buttons">
                            <button @click="prevStep">上一步</button>
                            <button @click="createOneProject">创&nbsp;&nbsp;&nbsp;建</button>
                        </div>
                        <button class="close-btn" @click="closeGuide">✖ 关闭</button>

                    </div>
                </Transition>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.welcome {
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.welcome-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--overlay-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.welcome-container {
    position: absolute;
    background: linear-gradient(135deg, var(--primary-bg), var(--secondary-bg));
    padding: 20px;
    border-radius: 12px;
    width: 400px;
    text-align: center;
    color: var(--text-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s;
}

.welcome-container.shifted {
    transform: translateX(-220px);
}

.create-window {
    position: absolute;
    background: linear-gradient(135deg, var(--primary-bg), var(--secondary-bg));
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    color: var(--text-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    width: 340px;
    height: 380px;
    transition: all .3s;
    display: flex;
    justify-content: center;
    align-items: center;
}

h1 {
    margin-bottom: 10px;
}

p {
    opacity: 0.8;
    margin-bottom: 20px;
}

.buttons button {
    display: block;
    width: 100%;
    margin: 10px 0;
    padding: 10px;
    background: var(--button-bg);
    border: none;
    color: var(--text-color);
    font-size: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.buttons button:hover {
    background: var(--button-hover-bg);
}

.close-btn {
    margin-top: 10px;
    background: transparent;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    font-size: 14px;
    opacity: 0.6;
}

.close-btn:hover {
    opacity: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.1s ease-in;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
    opacity: 1;
    transition: all 0.1s ease-in;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(15px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(-15px);
}

input[type="text"] {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-color);
    font-size: 16px;
    transition: border-color 0.3s;
}

input[type="text"]::placeholder {
    color: var(--placeholder-color);
}

input[type="text"]:focus {
    border-color: var(--button-bg);
    outline: none;
}

.input-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
}

.form-group {
    width: 100%;
}
</style>