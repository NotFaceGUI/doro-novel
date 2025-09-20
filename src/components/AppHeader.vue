<template>
    <header data-tauri-drag-region class="app-header">
        <div data-tauri-drag-region class="app-header-img">
            <img data-tauri-drag-region src="../assets/Icon.jpg" alt="Doro Novel" width="20" height="20">
            <ProjectMenu></ProjectMenu>
        </div>
        <div data-tauri-drag-region class="app-header-content">
            {{ app.name }}
            <span data-tauri-drag-region class="app-version">
                {{ app.version }}
            </span>
        </div>
        <div data-tauri-drag-region class="app-header-buttons">
            <button @click="minimizeWindow">─</button>
            <button @click="maximizeWindow">▢</button>
            <button @click="closeWindow">╳</button>
        </div>
    </header>
</template>

<script setup lang="ts">
import { DoroApp } from '../types/app';

defineProps<{
    app: DoroApp;
}>();

import { getCurrentWindow } from "@tauri-apps/api/window";
import ProjectMenu from './ProjectMenu.vue';
const window = getCurrentWindow();
const minimizeWindow = () => {
    window.minimize();
};

const maximizeWindow = async () => {
    window.toggleMaximize()
};

const closeWindow = () => {
    window.close();
};
</script>

<style scoped>
.app-header {
    background-color: var(--high-bg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 35px;
    border-bottom: 1px solid var(--deep-border-color);
}
.app-header-content,
.app-header span {
    color: var(--text-color);
}

.app-header-content {
    position: absolute;
    width: 100%;
    text-align: center;
    line-height: 40px;
}

.app-version {
    font-size: 14px;
    margin: 0 5px;
}

.app-header-img {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 5px;
}

.app-header-buttons {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
}

.app-header-buttons button {
    font-family: "sourcehansans";
}

button {
    background-color: transparent;
    border: none;
    color: white;
    font-size: 14px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    line-height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 5px;
    border-radius: 50%;
}

button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

button:active {
    background-color: rgba(255, 255, 255, 0.4);
}
</style>