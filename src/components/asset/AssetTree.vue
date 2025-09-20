<template>
    <ul v-if="type != ResType.Spine">
        <!-- 遍历文件列表 -->
        <li v-for="file in files" :key="file.time">
            <!-- 判断是文件夹还是文件 -->
            <div @click="toggle(file)" class="el no-wrap" :draggable="file.data.isFile ? true : false"
                @dragstart="handleDragStart($event, file)">
                <span v-if="file.data.isDirectory">📁</span>
                <span v-else>
                    <span v-if="/\.(mp3|wav|ogg)$/i.test(file.data.name)">🔊</span>
                    <span v-else-if="/\.(mp4|mkv|avi|mov)$/i.test(file.data.name)">🎥</span>
                    <span v-else-if="/\.(png|jpe?g|gif|svg)$/i.test(file.data.name)">🖼️</span>
                    <span v-else>📄</span>
                </span>
                {{ file.data.name }}
            </div>

            <!-- 如果是目录，则递归渲染其子项 -->
            <AssetTree @look-file="throwEvent" :type="type" v-if="file.data.isDirectory && expanded[file.path]"
                :files="file.childrenDirs || []" />
        </li>
    </ul>
    <ul v-else>
        <li v-for="char in characters" :key="char.characterName">
            <div @click="toggleSpine(char)" class="el no-wrap" draggable="true"
                @dragstart="handleDragStart($event, char)">
                {{ t(char.characterName) }}
            </div>
        </li>
    </ul>

</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { CharacterType, dirs, DragType } from '../../types/app';
import { ASSET_CHARACTER, ResType } from '../../script/var';
import { resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { DirEntry } from '@tauri-apps/plugin-fs';
import AssetManager from '../../script/asset-manager';

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 父组件传递的文件数据
const props = defineProps<{
    type: ResType;
    files: dirs[];
}>();

const characters = ref<CharacterType[]>([]);

onMounted(async () => {
    if (props.type == ResType.Spine) {
        AssetManager.getInstance().getResConfig().then(res => {
            characters.value = res;
        })
    }
});

const handleDragStart = (event: DragEvent, file: dirs | CharacterType) => {
    event.stopPropagation();
    // 设置拖拽数据
    event.dataTransfer?.setData('type', DragType.ASSEST);

    event.dataTransfer?.setData('asset_data', JSON.stringify({ e: file, type: props.type }));
}


const emit = defineEmits(['look-file'])


// 用于控制每个文件夹是否展开
const expanded = ref<{ [key: string]: boolean }>({});

// 从 localStorage 加载展开状态
const loadExpandedState = () => {
    const savedState = localStorage.getItem('audioExpandedState');
    if (savedState) {
        expanded.value = JSON.parse(savedState);
    }
};


// 保存展开状态到 localStorage
const saveExpandedState = () => {
    localStorage.setItem('audioExpandedState', JSON.stringify(expanded.value));
};

// 切换文件夹的展开/收起状态
const toggle = (file: dirs) => {
    expanded.value[file.path] = !expanded.value[file.path];
    // 如果是文件就预览
    if (file.data.isFile) {
        lookFile(file.path, file.data)
    }
};

const toggleSpine = async (char: CharacterType) => {
    const path = ASSET_CHARACTER + char.path?.name + "/" + char.path?.skel;
    lookFile(path, {
        name: char.characterName,
        isDirectory: false,
        isFile: true,
        isSymlink: false
    })
}

const lookFile = async (filePath: string, fileData: DirEntry) => {
    const allPath = await resolveResource(filePath);
    // console.log(filePath);
    const resUrl = convertFileSrc(allPath);

    // 向父组件抛出事件
    emit('look-file', { url: resUrl, type: props.type, file: fileData });
}

// 抛出事件让最外层处理
const throwEvent = (data: { url: string, type: ResType, file: DirEntry }) => {
    emit('look-file', { url: data.url, type: data.type, file: data.file });
}

// 在组件挂载时加载展开状态
loadExpandedState();

// 在组件销毁时保存展开状态
watch(() => expanded.value, saveExpandedState, { deep: true });


</script>

<style scoped lang="css">
ul {
    width: 100%;
    list-style-type: none;
}

li {
    width: 100%;
    padding-left: 20px;

}

li span {
    opacity: 1 !important;
}

div {
    cursor: pointer;
}

span {
    margin-right: 4px;
}

.no-wrap {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}


.el {
    width: 100%;
    padding: 3px 0;
    transition: all .06s linear;

}

li:hover {
    background-color: var(--high-bg);
}

.el:hover {
    background-color: var(--high-hover-bg);
    border-radius: 5px;
    padding-left: 5px;

}
</style>