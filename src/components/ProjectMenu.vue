<template>
    <div class="project-menu">
        <ul>
            <li @click="toggleDropdown(0)">项目(P)
                <ul v-show="dropdowns[0]" class="dropdown">
                    <li>打开项目<span class="keyword">Ctrl + O</span></li>
                    <li>关闭项目<span class="keyword">Ctrl + Shift + Z</span></li>
                    <li>打开项目文件夹<span class="keyword">Ctrl + Shift + O</span></li>
                    <hr />
                    <li>清除缓存<span class="keyword">Ctrl + Shift + C</span></li>
                </ul>
            </li>
            <li @click="toggleDropdown(1)">编辑(E)
                <ul v-show="dropdowns[1]" class="dropdown">
                    <li>撤销<span class="keyword">Ctrl + Z</span></li>
                    <li>重做<span class="keyword">Ctrl + Y</span></li>
                    <hr />
                    <li>剪切<span class="keyword">Ctrl + X</span></li>
                    <li>复制<span class="keyword">Ctrl + C</span></li>
                    <li>粘贴<span class="keyword">Ctrl + V</span></li>
                    <hr />
                    <li>查找<span class="keyword">Ctrl + F</span></li>
                    <li>替换<span class="keyword">Ctrl + H</span></li>
                    <hr />
                    <li>导入资源<span class="keyword">Shift + Space</span></li>
                </ul>
            </li>
            <li @click="toggleDropdown(2)">帮助(H)
                <ul v-show="dropdowns[2]" class="dropdown">
                    <li>查看帮助</li>
                    <li>在线文档</li>
                    <li>常见问题</li>
                    <li>关于我们</li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive } from 'vue';

const dropdowns = reactive([false, false, false]);

const toggleDropdown = (menuIndex: number) => {
    dropdowns[menuIndex] = !dropdowns[menuIndex];

    for (let i = 0; i < dropdowns.length; i++) {
        if (i == menuIndex) continue;
        dropdowns[i] = false;
    }
};

const handleClickOutside = (event: MouseEvent) => {
    const menu = document.querySelector('.project-menu');
    if (menu && !menu.contains(event.target as Node)) {
        dropdowns.forEach((_, index) => {
            dropdowns[index] = false;
        });
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
});


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