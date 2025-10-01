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
                {{ formatI18nKey(t(char.characterName), char.characterName) }} <span
                    style="font-size: 10px;color: #888;" v-if="char.characterName.startsWith('c')">{{
                        t(char.characterName) }}</span>
            </div>
        </li>
    </ul>

</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { CharacterType, CharacterUrls, dirs, DragType } from '../../types/app';
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
            // 对角色进行排序：游戏角色（c+数字）优先，然后按名称排序
            characters.value = res.sort((a, b) => {
                // 使用正则表达式匹配游戏角色 (c + 数字)
                const gameCharacterRegex = /^c\d+/;
                const aIsGameChar = gameCharacterRegex.test(a.characterName);
                const bIsGameChar = gameCharacterRegex.test(b.characterName);

                // 优先显示游戏角色
                if (aIsGameChar && !bIsGameChar) return -1;
                if (!aIsGameChar && bIsGameChar) return 1;

                // 然后按名称排序
                return a.characterName.localeCompare(b.characterName);
            });
        })
    }
});

// 如果名称以 c 开头（角色标识），则按中文冒号或英文冒号分割，取第一段作为 i18n 键
const formatI18nKey = (name: string, key: string) => {
    if (!name) return '';
    return key.startsWith('c') ? name.split(/[:：]/)[0] : name;
}


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

    // 构建文件数据对象，包含主要的 skel 文件信息
    const fileData = {
        name: char.characterName,
        isDirectory: false,
        isFile: true,
        isSymlink: false
    };

    // 构建角色资源 URLs 对象
    const characterUrls: CharacterUrls = {
        main: path,
        aim: undefined,
        cover: undefined
    };

    // 如果角色有 aimSkel，添加到 URLs 中
    if (char.path?.aimSkel) {
        const aimPath = ASSET_CHARACTER + char.path.name + "/aim/" + char.path.aimSkel;
        characterUrls.aim = aimPath;
    }

    // 如果角色有 coverSkel，添加到 URLs 中
    if (char.path?.coverSkel) {
        const coverPath = ASSET_CHARACTER + char.path.name + "/cover/" + char.path.coverSkel;
        characterUrls.cover = coverPath;
    }

    ;

    // 调用 lookFile 处理主要的 skel 文件
    lookFile(path, fileData, characterUrls);
}

const lookFile = async (filePath: string, fileData: DirEntry, characterUrls: CharacterUrls = {
    main: ''
}) => {
    const allPath = await resolveResource(filePath);
    // console.log(filePath);
    const resUrl = convertFileSrc(allPath);
    if (characterUrls) {
        const { aim, cover } = characterUrls || {};

        if (aim) {
            characterUrls.aim = convertFileSrc(await resolveResource(aim));
            console.log("加载角色Aim: ", characterUrls.aim, aim);
        }
        if (cover) {
            characterUrls.cover = convertFileSrc(await resolveResource(cover));
            console.log("加载角色Cover: ", characterUrls.cover, cover);
        }
    }

    // 向父组件抛出事件
    emit('look-file', { url: resUrl, type: props.type, file: fileData, characterUrls: characterUrls });
}

// 抛出事件让最外层处理
const throwEvent = (data: { url: string, type: ResType, file: DirEntry, characterUrls: CharacterUrls | undefined }) => {
    emit('look-file', { url: data.url, type: data.type, file: data.file, characterUrls: data.characterUrls });
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